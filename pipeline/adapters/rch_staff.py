"""Royal Children's Hospital Melbourne (rch.org.au) department staff lists collector.

Source: public "Staff" / "Our team" pages of RCH medical departments (sitemap.xml enumerated
2026-10-15; the pages below are the paediatric-physician departments that name their consultants).
Surgical, nursing, allied-health, research-centre and psychology-heavy pages are deliberately not
collected. Each page is plain HTML (Ektron CMS); doctor names sit in <h3>/<li>/<p>/<strong>
elements with a Dr/Prof/A/Prof title and sometimes trailing post-nominals.

Facts only: name, post-nominals when shown on the same line, department tag, hospital address.
The biographical paragraphs on these pages are not read. Every record is located at RCH,
50 Flemington Road, Parkville VIC 3052 (switchboard +61 3 9345 5522).
Run: python -I pipeline/adapters/rch_staff.py [--dry-run] [--limit N]
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import time
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "rch_staff"
BASE = "https://www.rch.org.au"
USER_AGENT = "WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)"
LEGAL_BASIS = (
    "facts from the public staff pages of a Victorian public hospital (robots.txt 2026-10-15 allows these "
    "paths; site terms assert copyright in content, no clause on automated access); names of consultants "
    "a public hospital publishes for referrers are facts, biographies and portraits not copied"
)
RATE_SECONDS = 1.2
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE
LOCATION = {
    "name": "The Royal Children's Hospital Melbourne", "address": "50 Flemington Road", "suburb": "Parkville",
    "state": "VIC", "postcode": "3052", "lat": -37.7937, "lng": 144.9497, "phone": "+61 3 9345 5522",
    "website": BASE,
}
# (path, subspecialty tag)
PAGES = [
    ("/genmed/staff/Staff/", "General paediatrics"),
    ("/ccch/services/specialist-clinics/", "Developmental-behavioural paediatrics"),
    ("/endo/staff/", "Paediatric endocrinology"),
    ("/respmed/staff/", "Paediatric respiratory medicine"),
    ("/metabolic-medicine/staff/", "Metabolic medicine"),
    ("/haematology/staff/", "Paediatric haematology"),
    ("/infectious_diseases/the_team/", "Paediatric infectious diseases"),
    ("/neurology/staff/neurology_staff/", "Paediatric neurology"),
    ("/cardiology/staff/cardiology_staff/", "Paediatric cardiology"),
    ("/rheumatology/staff/the_rheumatology_team_at_the_royal_childrens_hospital/", "Paediatric rheumatology"),
    ("/nephrology/", "Paediatric nephrology"),
    ("/gastro/the-team/medical_staff/", "Paediatric gastroenterology"),
    ("/gastro/the_team/", "Paediatric gastroenterology"),
]
TITLE_RE = re.compile(r"^(Dr|Prof|Professor|A/Prof|Assoc\.? ?Prof|Associate Professor)\.?\s+", re.I)
CRED_RE = re.compile(
    r"\b(MB\s?BS|MBBS|MBChB|MB\s?BCh|BMed|BMedSci?|MD|PhD|FRACP|FRCPA|FRCPCH|MRCPCH|FRCP|FCICM|DCH|DipRACOG|BSc|BA|MPH|MPhil|MMed|DMedSc|MRCP|MRCPI|BAO|GAICD|FRANZCP|MPM|FRACGP)\b"
)
EXCLUDE_RE = re.compile(r"psych|nurse|nursing|administrat|coordinator|co-ordinator|manager|dietitian|pharmac|secretary|registrar|fellow\b|trainee|resident", re.I)
STOP_RE = re.compile(r"\s+(is|was|has|works|completed|joined|graduated|trained|undertook|leads|provides|also)\b")


def get(url: str, rp: urllib.robotparser.RobotFileParser) -> str:
    if not rp.can_fetch(USER_AGENT, url):
        raise PermissionError(f"robots.txt disallows {url}")
    time.sleep(RATE_SECONDS)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def clean(s: str) -> str:
    s = html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("\xa0", " ").replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def names_on(page: str) -> list[tuple[str, str | None, str | None]]:
    """(name, post-nominals, role) for every titled person in a heading/list/paragraph element."""
    page = re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S)
    m = re.search(r"<main[^>]*>(.*?)</main>", page, re.S) or re.search(r'<div[^>]+id="content"[^>]*>(.*)', page, re.S)
    body = m.group(1) if m else page
    body = re.sub(r"<footer.*", "", body, flags=re.S)
    out, seen = [], set()
    for tag, inner in re.findall(r"<(h[2-6]|strong|b|li|td|p)[^>]*>(.*?)</\1>", body, re.S | re.I):
        for piece in re.split(r"<br\s*/?>|\s/\s|\s&\s", inner):
            t = clean(piece)
            if not TITLE_RE.match(t) or len(t) > 110:
                continue
            t = STOP_RE.split(t)[0].strip(" ,;:-")
            role = None
            rm = re.search(r"(?:\s+[–\-]\s+|\s*[\(:]\s*)([A-Za-z][A-Za-z ,/&]+)\)?\s*$", t)
            if rm and not CRED_RE.search(rm.group(1)):
                role = rm.group(1).strip()
                t = t[: rm.start()].strip(" ,;:-")
            cm = CRED_RE.search(t)
            creds = None
            if cm:
                creds = t[cm.start():].strip(" ,")
                t = t[: cm.start()].strip(" ,")
            name = re.sub(r"\s+", " ", t).strip(" .,")
            if EXCLUDE_RE.search(name) or (creds and re.search(r"FRANZCP|Psych", creds)) or (role and EXCLUDE_RE.search(role)):
                continue
            words = TITLE_RE.sub("", name).split(" ")
            if not 2 <= len(words) <= 4 or not all(re.match(r"^[A-Z][A-Za-z'\-\.]*$", w) for w in words):
                continue
            key = TITLE_RE.sub("", name).lower()
            if key in seen:
                continue
            seen.add(key)
            out.append((name, creds, role))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="max pages fetched (0 = all)")
    args = ap.parse_args()
    observed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    rp = urllib.robotparser.RobotFileParser()
    req = urllib.request.Request(BASE + "/robots.txt", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        rp.parse(r.read().decode("utf-8", "replace").splitlines())
    people: dict[str, dict] = {}
    failures = []
    pages = PAGES[: args.limit] if args.limit else PAGES
    for path, tag in pages:
        url = BASE + path
        try:
            found = names_on(get(url, rp))
        except Exception as e:  # noqa: BLE001
            failures.append(f"{url} :: {e}")
            print(f"  {path}: {e}", file=sys.stderr)
            continue
        print(f"  {path}: {len(found)} names")
        for name, creds, role in found:
            key = TITLE_RE.sub("", name).lower()
            rec = people.get(key)
            if rec is None:
                rec = people[key] = {
                    "source": SOURCE, "source_url": url, "observed_at": observed_at, "legal_basis": LEGAL_BASIS,
                    "tier": "found", "specialty": "paediatrics", "source_id": re.sub(r"[^a-z]+", "-", key).strip("-"),
                    "name": name, "display_credentials": creds, "subspecialty_tags": [tag], "roles": [],
                    "locations": [dict(LOCATION)], "telehealth": None, "profile_url": url,
                }
            if tag not in rec["subspecialty_tags"]:
                rec["subspecialty_tags"].append(tag)
            if role and role not in rec["roles"]:
                rec["roles"].append(role)
            rec["display_credentials"] = rec["display_credentials"] or creds
    print(f"{SOURCE}: {len(people)} doctors from {len(pages)} pages, {len(failures)} failures")
    if args.dry_run:
        for r in list(people.values())[:8]:
            print(json.dumps({k: r[k] for k in ("name", "display_credentials", "subspecialty_tags", "roles")}, ensure_ascii=False))
        return 0
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{observed_at[:10]}.jsonl"
    with out.open("w", encoding="utf-8", newline="\n") as f:
        for r in people.values():
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"wrote {len(people)} -> {out} (sha256 {hashlib.sha256(out.read_bytes()).hexdigest()[:12]}); all VIC")
    for fl in failures:
        print("  FAIL", fl, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
