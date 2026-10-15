"""Medicare Mental Health Centres -> data/raw/medicare_mental_health_centres/<date>.jsonl

The public centre list page (medicarementalhealth.gov.au/centre-list) embeds
the full list as HTML-escaped JSON in a `data-centres` attribute. We decode it
and emit one record per centre: name, state, address lines, suburb, postcode,
phone and opening hours where present (all keys passed through in snake_case).

The host's WAF drops non-browser User-Agents, so this adapter uses the browser
UA (see _base.BROWSER_UA); robots.txt (which allows the page) and the 1 req/s
limit still apply. One request per run.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, arg, envelope, fetch_text, log, now_iso, require_legal_basis, snake, squash, state_code  # noqa: E402

SOURCE = "medicare_mental_health_centres"
KIND = "scrape"
CADENCE = "monthly"
URL = "https://www.medicarementalhealth.gov.au/centre-list"
LEGAL_BASIS = ("Facts from a public page (RESEARCH-PLAN section 7): Australian Government Department of Health, Disability "
               "and Ageing publishes the Medicare Mental Health Centre list for the public; Commonwealth material on "
               "health.gov.au-family sites is CC BY 4.0 unless marked otherwise; names, addresses, phones and hours are "
               "facts; one request per run; no prose copied. Checked 2026-10-15.")

ATTR_RE = re.compile(r"data-centres='([^']*)'|data-centres=\"([^\"]*)\"", re.S)
ADDR3_RE = re.compile(r"^(?P<suburb>.*?)\s+(?P<state>NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+(?P<postcode>\d{4})\s*$", re.I)


def parse(page: str) -> list[dict]:
    m = ATTR_RE.search(page)
    if not m:
        return []
    centres = json.loads(html.unescape(m.group(1) or m.group(2)))
    out = []
    for c in centres:
        rec = {snake(k): (squash(v) if isinstance(v, str) else v) for k, v in c.items()}
        rec["state"] = state_code(str(rec.get("state", ""))) or rec.get("state")
        lines = [rec.get(k, "") for k in ("addressline1", "addressline2", "addressline3") if rec.get(k)]
        rec["address"] = ", ".join(lines)
        last = lines[-1] if lines else ""
        am = ADDR3_RE.match(last)
        if am:
            rec["suburb"] = squash(am.group("suburb"))
            rec["postcode"] = am.group("postcode")
        out.append(rec)
    return out


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE}: would fetch {URL} once (browser UA) and decode the data-centres JSON")
        return 0
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    try:
        page = fetch_text(URL, browser_ua=True, timeout=180)
        w.note_fetch(URL, bytes=len(page), ua="browser")
        recs = parse(page)
        if not recs:
            raise RuntimeError("no data-centres attribute found (page layout changed?)")
        by_state: dict[str, int] = {}
        for i, rec in enumerate(recs):
            if limit and i >= limit:
                break
            w.write(envelope(SOURCE, URL, legal_basis, observed_at, **rec))
            by_state[str(rec.get("state"))] = by_state.get(str(rec.get("state")), 0) + 1
        log(f"{SOURCE}: by state {by_state}")
        meta = w.close(by_state=by_state)
    except Exception as e:  # noqa: BLE001
        w.note_failure(URL, f"{e.__class__.__name__}: {e}")
        meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
