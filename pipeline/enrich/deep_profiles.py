"""Select the Queensland doctors with the strongest professional evidence and write
data/enriched/deep_profiles.json (plan §2: "10-15 deeply enriched profiles").

Stdlib only. Inputs:
  data/providers/*.jsonl                       merged directory records (tags, sources, rooms)
  data/enriched/publications/<latest>.jsonl    OpenAlex matches (identifier-matched works)
  data/enriched/research_topics.json           inferred OpenAlex topic labels per matched doctor
  disciplines/mvp.yaml                         closed condition vocabulary (ids + cues)

Criteria: Queensland room, identifier-matched publications >= 3 AND clinical focus tags >= 3.
Ranking inside a specialty: number of distinct sources (multi-source first), then publication
count, then tag count. The 15 are taken round-robin across the specialties that qualify, so no
single specialty fills the set. Everything written is closed vocabulary: counts, condition ids
and their yaml labels, OpenAlex topic labels. No prose from any source.

    python pipeline/enrich/deep_profiles.py            # -> data/enriched/deep_profiles.json
    python pipeline/enrich/deep_profiles.py --limit 15 --min-pubs 3 --min-tags 3
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROVIDERS = ROOT / "data" / "providers"
PUBLICATIONS = ROOT / "data" / "enriched" / "publications"
TOPICS = ROOT / "data" / "enriched" / "research_topics.json"
MVP_YAML = ROOT / "disciplines" / "mvp.yaml"
OUT = ROOT / "data" / "enriched" / "deep_profiles.json"

SPECIALTIES = ["psychiatry", "paediatrics", "obstetrics-gynaecology"]

# OpenAlex topic label (lower-cased substring) -> mvp.yaml condition id. Closed, reviewed by hand;
# a topic that names no condition maps to nothing. Oncology, surgery and obstetric-only topics
# are deliberately absent: they are not MVP patient-need categories.
TOPIC_TO_CONDITION: list[tuple[str, str]] = [
    ("endometriosis", "endometriosis"),
    ("polycystic", "pcos"),
    ("maternal mental health", "perinatal-mh"),
    ("postpartum", "perinatal-mh"),
    ("perinatal mental", "perinatal-mh"),
    ("pelvic floor", "pelvic-pain"),
    ("pelvic pain", "pelvic-pain"),
    ("menopause", "menopause"),
    ("attention deficit", "adhd"),
    ("adhd", "adhd"),
    ("major depression", "depression"),
    ("depression", "depression"),
    ("anxiety", "anxiety"),
    ("bipolar", "bipolar"),
    ("schizophrenia", "psychosis"),
    ("psychosis", "psychosis"),
    ("psychotic", "psychosis"),
    ("personality disorders", "personality"),
    ("posttraumatic", "trauma"),
    ("post-traumatic", "trauma"),
    ("child abuse and trauma", "trauma"),
    ("eating disorder", "eating-disorders"),
    ("anorexia", "eating-disorders"),
    ("obsessive-compulsive", "ocd"),
    ("obsessive compulsive", "ocd"),
    ("substance", "substance-use"),
    ("alcohol", "substance-use"),
    ("opioid", "substance-use"),
    ("autism", "autism"),
    ("sleep", "sleep"),
    ("insomnia", "sleep"),
    ("chronic pain", "chronic-pain"),
    ("pain management", "chronic-pain"),
    ("fibromyalgia", "fibromyalgia"),
    ("chronic fatigue", "chronic-fatigue"),
    ("long covid", "long-covid"),
    ("post-covid", "long-covid"),
    ("postural", "pots"),
    ("autonomic", "pots"),
    ("functional neurological", "fnd"),
    ("ehlers", "hypermobility"),
    ("hypermobility", "hypermobility"),
    ("irritable bowel", "ibs"),
]


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def load_conditions(yaml_path: Path) -> list[tuple[str, str, list[str]]]:
    """(id, label, cues) for every entry under `conditions:` in the discipline yaml.

    A deliberately small reader for the flow-sequence style the yaml uses; it is not a YAML
    parser. It stops at the next top-level key.
    """
    out: list[tuple[str, str, list[str]]] = []
    in_conditions = False
    cur_id = cur_label = None
    for raw in yaml_path.read_text(encoding="utf8").splitlines():
        line = raw.split(" #", 1)[0].rstrip() if not raw.lstrip().startswith("#") else ""
        if not line:
            continue
        if not line.startswith(" "):
            in_conditions = line.startswith("conditions:")
            continue
        if not in_conditions:
            continue
        m = re.match(r"^\s*-\s*id:\s*(\S+)", line)
        if m:
            cur_id, cur_label = m.group(1), None
            continue
        m = re.match(r"^\s*label:\s*(.+)$", line)
        if m and cur_id:
            cur_label = m.group(1).strip().strip('"').strip("'")
            continue
        m = re.match(r"^\s*cues:\s*\[(.*)\]\s*$", line)
        if m and cur_id:
            cues = [c.strip().strip('"').strip("'") for c in re.findall(r'"[^"]*"|\'[^\']*\'|[^,]+', m.group(1))]
            out.append((cur_id, cur_label or cur_id, [c for c in cues if c]))
    return out


def condition_ids_from_tags(tags: list[str], conditions: list[tuple[str, str, list[str]]]) -> list[str]:
    """Mirror of src/data/providers.ts conditionIds: cue match on word boundaries, cues < 4 chars skipped."""
    text = " ".join(f" {t.lower()} " for t in tags)
    out: list[str] = []
    for cid, _label, cues in conditions:
        for cue in cues:
            c = cue.lower()
            if len(c) < 4:
                continue
            if re.search(r"(^|[^a-z])" + re.escape(c) + r"([^a-z]|$)", text):
                out.append(cid)
                break
    return out


def condition_ids_from_topics(topics: list[str]) -> list[str]:
    out: list[str] = []
    for topic in topics:
        t = topic.lower()
        for needle, cid in TOPIC_TO_CONDITION:
            if needle in t and cid not in out:
                out.append(cid)
    return out


def latest_publications() -> Path | None:
    files = sorted(PUBLICATIONS.glob("*.jsonl"))
    return files[-1] if files else None


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, default=15)
    ap.add_argument("--min-pubs", type=int, default=3)
    ap.add_argument("--min-tags", type=int, default=3)
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args(argv)

    conditions = load_conditions(MVP_YAML)
    labels = {cid: label for cid, label, _ in conditions}
    if not conditions:
        print("no conditions read from", MVP_YAML, file=sys.stderr)
        return 1

    providers: dict[str, dict] = {}
    for sp in SPECIALTIES:
        for row in read_jsonl(PROVIDERS / f"{sp}.jsonl"):
            providers[row["id"]] = row

    pub_file = latest_publications()
    if pub_file is None:
        print("no publications file under", PUBLICATIONS, file=sys.stderr)
        return 1
    matched = {r["provider_id"]: r for r in read_jsonl(pub_file) if r.get("authorship_verified") == "identifier-matched"}
    topics_doc = json.loads(TOPICS.read_text(encoding="utf8")) if TOPICS.exists() else {"doctors": {}}
    topics_by = {k: [t["topic"] for t in v.get("inferred_research_topics", [])] for k, v in topics_doc.get("doctors", {}).items()}

    by_specialty: dict[str, list[dict]] = defaultdict(list)
    considered = 0
    for pid, pub in matched.items():
        p = providers.get(pid)
        if not p:
            continue
        if not any(loc.get("state") == "QLD" for loc in p.get("locations", [])):
            continue
        considered += 1
        works = [w for w in pub.get("works", []) if w.get("title")]
        tags = [t for t in p.get("tags", []) if t]
        if len(works) < args.min_pubs or len(tags) < args.min_tags:
            continue
        sources = sorted({s["source"] for s in p.get("sources", [])})
        topics = topics_by.get(pid) or [t for w in works for t in w.get("topics", [])]
        topic_counts = Counter(topics)
        top_topics = [t for t, _ in topic_counts.most_common(5)]
        clinical = condition_ids_from_tags(tags, conditions)
        # A one-off topic on a single work is not a research focus: the top five inferred
        # topics, plus any work-level topic that recurs across at least two works.
        work_topic_counts = Counter(t for w in works for t in w.get("topics", []))
        research = condition_ids_from_topics(top_topics + [t for t, n in work_topic_counts.items() if n >= 2])
        summary = (
            f"{len(sources)} source{'s' if len(sources) != 1 else ''}; "
            f"{len(works)} identifier-matched publication{'s' if len(works) != 1 else ''}; "
            f"{len(tags)} clinical focus tag{'s' if len(tags) != 1 else ''}"
        )
        if research:
            summary += "; research on " + ", ".join(labels.get(c, c).lower() for c in research[:3])
        by_specialty[p["specialty"]].append(
            {
                "id": pid,
                "name": p["name"],
                "specialty": p["specialty"],
                "sources": sources,
                "tag_count": len(tags),
                "publication_count": len(works),
                "openalex_author_id": pub.get("openalex_author_id"),
                "top_research_topics": top_topics,
                "clinical_interest_ids": clinical,
                "research_topic_ids": research,
                "evidence_summary": summary,
            }
        )

    for rows in by_specialty.values():
        rows.sort(key=lambda r: (-len(r["sources"]), -r["publication_count"], -r["tag_count"], r["id"]))

    # Round-robin across qualifying specialties so the set spans them.
    order = [sp for sp in SPECIALTIES if by_specialty.get(sp)]
    chosen: list[dict] = []
    cursors = {sp: 0 for sp in order}
    while len(chosen) < args.limit and any(cursors[sp] < len(by_specialty[sp]) for sp in order):
        for sp in order:
            if len(chosen) >= args.limit:
                break
            i = cursors[sp]
            if i < len(by_specialty[sp]):
                chosen.append(by_specialty[sp][i])
                cursors[sp] = i + 1

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "inputs": {"publications": str(pub_file.relative_to(ROOT)).replace("\\", "/"), "topics": "data/enriched/research_topics.json", "vocabulary": "disciplines/mvp.yaml"},
        "criteria": {"state": "QLD", "min_identifier_matched_publications": args.min_pubs, "min_clinical_tags": args.min_tags, "ranking": "distinct sources desc, publications desc, tags desc; round-robin across specialties"},
        "field_note": "clinical_interest_ids come from the directory's own focus tags matched to the closed vocabulary; research_topic_ids come from OpenAlex topic labels on identifier-matched works. Inferred signals only: not declared by the doctor and not evidence of clinical quality.",
        "qld_identifier_matched_considered": considered,
        "qualifying_by_specialty": {sp: len(rows) for sp, rows in by_specialty.items()},
        "missing_specialties": [sp for sp in SPECIALTIES if not by_specialty.get(sp)],
        "count": len(chosen),
        "doctors": chosen,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf8")

    print(f"{'#':>2}  {'id':<48} {'spec':<22} {'src':>3} {'tags':>4} {'pubs':>4}  research")
    for i, r in enumerate(chosen, 1):
        print(f"{i:>2}  {r['id']:<48} {r['specialty']:<22} {len(r['sources']):>3} {r['tag_count']:>4} {r['publication_count']:>4}  {', '.join(r['research_topic_ids']) or '-'}")
    print(f"wrote {args.out.relative_to(ROOT)} ({len(chosen)} doctors; missing specialties: {out['missing_specialties'] or 'none'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
