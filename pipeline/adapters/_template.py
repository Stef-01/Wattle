"""Adapter template. Copy to pipeline/adapters/<source>.py and fill in.

Rules (DATA-MODEL.md "Source registry", RESEARCH-PLAN.md section 7):
  * LEGAL_BASIS must be a string citing the licence, agreement, statutory list
    or public-facts case. None means the adapter refuses to run.
  * Facts only. No prose, no photos, no accounts, no Ahpra register scraping,
    no Google Places content.
  * One request per second per host; robots.txt respected (handled by _base).
  * Output: data/raw/<SOURCE>/<YYYY-MM-DD>.jsonl, every record carrying
    {source, source_url, observed_at, legal_basis} plus the source's fields.

Run:  python -I pipeline/adapters/<source>.py [--dry-run] [--limit N]
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, arg, envelope, fetch_text, log, now_iso, require_legal_basis  # noqa: E402

SOURCE = "example_source"              # directory name under data/raw/ and the `sources.id` in Supabase
KIND = "open_data"                     # register | open_data | api | licensed | scrape | declared | platform
CADENCE = "monthly"
URL = "https://example.gov.au/list.csv"
LEGAL_BASIS: str | None = None         # e.g. "CC BY 4.0: https://example.gov.au/licence (checked 2026-10-15)"

# Target fields (document them even before the parser exists):
#   name, address_line, suburb, state, postcode, phone, website, service_type


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE}: would fetch {URL} and write data/raw/{SOURCE}/<date>.jsonl (limit={limit})")
        return 0
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    try:
        text = fetch_text(URL)
        w.note_fetch(URL, bytes=len(text))
        for i, line in enumerate(text.splitlines()):
            if limit is not None and i >= limit:
                break
            w.write(envelope(SOURCE, URL, legal_basis, observed_at, raw=line))
    except Exception as e:  # noqa: BLE001
        w.note_failure(URL, str(e))
    meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
