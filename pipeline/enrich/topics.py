"""Derive inferred research topics per doctor from the OpenAlex works in the publications file.

Reads  data/enriched/publications/<date>.jsonl (latest by default, or --input)
Writes data/enriched/research_topics.json

These are INFERRED RESEARCH TOPICS: the OpenAlex topic labels that occur most often across a
doctor's most-cited works. They describe what the person has published on, as classified by
OpenAlex's topic model. They are not clinical-interest claims, not declared interests and not
evidence of clinical outcomes (writing-block.md Task 3: "Research activity must not
automatically be interpreted as better clinical outcomes"). The output field is named
`inferred_research_topics` so the distinction survives into the UI. Only doctors whose
authorship is "identifier-matched" get topics; unverified doctors never do.

Stdlib only, Python 3.13. Run: python pipeline/enrich/topics.py [--input FILE] [--top 5]
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PUB_DIR = REPO / "data" / "enriched" / "publications"
OUT = REPO / "data" / "enriched" / "research_topics.json"


def latest_publications() -> Path | None:
    files = sorted(PUB_DIR.glob("*.jsonl"))
    return files[-1] if files else None


def infer_topics(row: dict, top: int) -> list[dict]:
    """Top-N topic labels by frequency across the doctor's works; ties broken alphabetically.
    `works` carries the topic frequency, `share` the fraction of works that carry it."""
    works = row.get("works") or []
    if row.get("authorship_verified") != "identifier-matched" or not works:
        return []
    c: Counter = Counter()
    for w in works:
        for t in dict.fromkeys(w.get("topics") or []):  # each topic once per work
            c[t] += 1
    ranked = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[:top]
    return [{"topic": t, "works": n, "share": round(n / len(works), 2)} for t, n in ranked]


def build(input_path: Path, top: int) -> dict:
    doctors = {}
    rows = 0
    for line in input_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        rows += 1
        topics = infer_topics(row, top)
        if not topics:
            continue
        doctors[row["provider_id"]] = {
            "name": row.get("name"),
            "specialty": row.get("specialty"),
            "openalex_author_id": row.get("openalex_author_id"),
            "works_considered": len(row.get("works") or []),
            "inferred_research_topics": topics,
        }
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "input": str(input_path.relative_to(REPO)).replace("\\", "/"),
        "doctors_in_input": rows,
        "doctors_with_topics": len(doctors),
        "field_note": (
            "inferred_research_topics are OpenAlex topic labels counted across each doctor's most-cited "
            "works. They are inferred research topics only: not clinical interests, not declared by the "
            "doctor, and not evidence of clinical quality. Source: OpenAlex (CC0)."
        ),
        "doctors": doctors,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input", default=None, help="publications jsonl (default: latest in data/enriched/publications)")
    ap.add_argument("--top", type=int, default=5)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()
    src = Path(args.input) if args.input else latest_publications()
    if not src or not src.exists():
        print("no publications file found; run publications.py first", file=sys.stderr)
        return 1
    result = build(src, args.top)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{result['doctors_with_topics']}/{result['doctors_in_input']} doctors with inferred research topics -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
