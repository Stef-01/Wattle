"""Merge raw source files into one provider record per doctor per specialty.

Reads the newest data/raw/<source>/<date>.jsonl for every source that lists
individual doctors, normalises each record to the common shape below, resolves
duplicates (same specialty + normalised name + a shared postcode or suburb), and
writes data/providers/<specialty>.jsonl plus data/coverage.json.

Common shape (one line per doctor):
  id, specialty, name, name_key, credential_tier, tags[], languages[], telehealth,
  wait_time, taking_new_patients, locations[{name,address,suburb,state,postcode,lat,lng,phone,website}],
  sources[{source, source_url, observed_at, legal_basis, source_id}]

Every field stays attributable: `sources` carries one entry per contributing raw record.
Stdlib only. Run: python pipeline/merge.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "providers"

# Ahpra specialist registrations at 30 June 2026 (Medical Board registrant data,
# research/raw/02-medical-disciplines.md). Used only for the coverage denominator.
AHPRA_TOTALS = {"psychiatry": 5343, "paediatrics": 4469, "obstetrics-gynaecology": 2470}

SPECIALTY_ALIASES = {
    "psychiatry": "psychiatry",
    "paediatrics": "paediatrics",
    "paediatric": "paediatrics",
    "obstetrics and gynaecology": "obstetrics-gynaecology",
    "obstetrics-gynaecology": "obstetrics-gynaecology",
    "obstetrics": "obstetrics-gynaecology",
    "gynaecology": "obstetrics-gynaecology",
}

TITLES = r"^(dr|doctor|prof|professor|a/prof|assoc(iate)?\.? ?prof(essor)?\.?|clinical (assoc(iate)? )?prof(essor)?\.?|mr|mrs|ms|miss|adj\.? ?prof(essor)?\.?)\.?\s+"


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def name_key(name: str) -> str:
    s = strip_accents(name).lower().strip()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"\b(am|oam|frcpsych|franzcp|franzcog|fracp|phd|md|mbbs|bsc|ma|msc)\b", " ", s)
    s = re.sub(TITLES, "", s)
    s = re.sub(TITLES, "", s)  # "Associate Professor. Dr X"
    s = re.sub(r"[^a-z\s'-]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    parts = s.split(" ")
    if len(parts) >= 2:
        return f"{parts[0]} {parts[-1]}"  # given + family; middle names vary between sources
    return s


def newest(source_dir: Path) -> Path | None:
    files = sorted(source_dir.glob("*.jsonl"))
    return files[-1] if files else None


def read_jsonl(p: Path):
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def norm_loc(l: dict) -> dict:
    return {
        "name": l.get("name") or l.get("practice"),
        "address": l.get("address"),
        "suburb": (l.get("suburb") or "").strip().title() or None,
        "state": (l.get("state") or "").strip().upper() or None,
        "postcode": (l.get("postcode") or "").strip() or None,
        "lat": l.get("lat"),
        "lng": l.get("lng"),
        "phone": l.get("phone"),
        "website": l.get("website"),
    }


def normalise(rec: dict) -> dict | None:
    spec = SPECIALTY_ALIASES.get((rec.get("specialty") or "").strip().lower())
    if not spec or not rec.get("name"):
        return None
    tags = list(rec.get("expertise") or []) + list(rec.get("subspecialty_tags") or []) + \
        list(rec.get("services") or []) + list(rec.get("faculties") or []) + list(rec.get("age_groups") or [])
    locs = [norm_loc(l) for l in rec.get("locations") or []]
    locs = [l for l in locs if l["suburb"] or l["postcode"] or l["address"]]
    if not any(l["state"] in {"NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"} for l in locs) and locs:
        # overseas-only listings (RANZCOG lists NZ) are kept out of the Australian map
        if all((l["state"] is None) for l in locs) and rec.get("source") == "ranzcog_find":
            return None
    return {
        "specialty": spec,
        "name": rec["name"].strip(),
        "name_key": name_key(rec["name"]),
        "credential_tier": rec.get("credential_tier"),
        "tags": sorted({t for t in tags if t}),
        "languages": sorted({l for l in rec.get("languages") or [] if l and l != "English"}),
        "telehealth": rec.get("telehealth"),
        "wait_time": rec.get("wait_time"),
        "taking_new_patients": rec.get("taking_new_patients") if rec.get("taking_new_patients") is not None
        else (False if rec.get("wait_time") == "Not taking new patients" else None),
        "locations": locs,
        "sources": [{
            "source": rec.get("source"), "source_url": rec.get("source_url"),
            "observed_at": rec.get("observed_at"), "legal_basis": rec.get("legal_basis"),
            "source_id": rec.get("source_id") or rec.get("ranzcp_id"),
        }],
    }


def same_person(a: dict, b: dict) -> bool:
    a_src = {(s["source"], s["source_id"]) for s in a["sources"]}
    b_src = {(s["source"], s["source_id"]) for s in b["sources"]}
    if a_src & b_src:
        return True
    if {s["source"] for s in a["sources"]} & {s["source"] for s in b["sources"]}:
        return False  # same source, different ids: two people
    a_states = {l["state"] for l in a["locations"] if l["state"]}
    b_states = {l["state"] for l in b["locations"] if l["state"]}
    return bool(a_states & b_states) or not (a_states and b_states)


def merge_into(base: dict, other: dict) -> None:
    base["tags"] = sorted(set(base["tags"]) | set(other["tags"]))
    base["languages"] = sorted(set(base["languages"]) | set(other["languages"]))
    for k in ("telehealth", "wait_time", "taking_new_patients", "credential_tier"):
        if base.get(k) is None and other.get(k) is not None:
            base[k] = other[k]
    seen = {(l["suburb"], l["postcode"], l["address"]) for l in base["locations"]}
    for l in other["locations"]:
        key = (l["suburb"], l["postcode"], l["address"])
        if key not in seen:
            base["locations"].append(l)
            seen.add(key)
    base["sources"].extend(other["sources"])


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    by_spec: dict[str, dict[str, dict]] = defaultdict(dict)
    counts = Counter()
    for src_dir in sorted(p for p in RAW.iterdir() if p.is_dir() and not p.name.startswith("_")):
        f = newest(src_dir)
        if not f:
            continue
        for rec in read_jsonl(f):
            n = normalise(rec)
            if not n:
                continue
            counts[src_dir.name] += 1
            bucket = by_spec[n["specialty"]]
            key = n["name_key"]
            # Same name is not the same person: merge only when the records agree on a
            # state and come from different sources, or carry the same source id. Two
            # "Dr David Ward" psychiatrists (Samford QLD, St Leonards NSW) proved this.
            i = 0
            while True:
                k = key if i == 0 else f"{key}#{i}"
                if k not in bucket:
                    bucket[k] = n
                    break
                if same_person(bucket[k], n):
                    merge_into(bucket[k], n)
                    break
                i += 1
    coverage = {}
    for spec, docs in by_spec.items():
        out = OUT / f"{spec}.jsonl"
        with out.open("w", encoding="utf-8", newline="\n") as fh:
            for i, (key, d) in enumerate(sorted(docs.items())):
                d["id"] = f"{spec}:{re.sub(r'[^a-z0-9]+', '-', key)}"
                fh.write(json.dumps(d, ensure_ascii=False) + "\n")
        by_state = Counter()
        for d in docs.values():
            for st in {l["state"] for l in d["locations"] if l["state"]}:
                by_state[st] += 1
        total = AHPRA_TOTALS.get(spec)
        coverage[spec] = {
            "doctors": len(docs),
            "fellows_or_specialists": sum(d.get("credential_tier") in (None, "Fellow") for d in docs.values()),
            "ahpra_registrations_2026_06": total,
            "share_of_register": round(sum(d.get("credential_tier") in (None, "Fellow") for d in docs.values()) / total, 3) if total else None,
            "with_location": sum(bool(d["locations"]) for d in docs.values()),
            "with_phone": sum(any(l["phone"] for l in d["locations"]) for d in docs.values()),
            "with_geocode": sum(any(l["lat"] for l in d["locations"]) for d in docs.values()),
            "with_telehealth_flag": sum(d["telehealth"] is not None for d in docs.values()),
            "with_wait_or_capacity": sum((d["wait_time"] or d["taking_new_patients"] is not None) and 1 or 0 for d in docs.values()),
            "with_tags": sum(bool(d["tags"]) for d in docs.values()),
            "with_language": sum(bool(d["languages"]) for d in docs.values()),
            "multi_source": sum(len({s["source"] for s in d["sources"]}) > 1 for d in docs.values()),
            "by_state": dict(sorted(by_state.items())),
        }
        print(f"{spec}: {len(docs)} doctors from {sum(1 for d in docs.values())} merged records; "
              f"{coverage[spec]['share_of_register']} of register; by state {coverage[spec]['by_state']}")
    print("raw records used per source:", dict(counts))
    (ROOT / "data" / "coverage.json").write_text(json.dumps(coverage, indent=2), encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
