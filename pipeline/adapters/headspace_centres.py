"""headspace centres (youth mental health, 12 to 25) -> data/raw/headspace_centres/<date>.jsonl

Parses the public "Find a centre" list page: name, address, suburb, state,
postcode, centre page URL. Facts only; no prose. One request.
"""
from __future__ import annotations

import html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, STATE_NAMES, arg, envelope, fetch_text, log, now_iso, require_legal_basis, squash, strip_tags  # noqa: E402

SOURCE = "headspace_centres"
KIND = "scrape"
CADENCE = "monthly"
URL = "https://headspace.org.au/headspace-centres/"
LEGAL_BASIS = ("Facts from a public page (RESEARCH-PLAN section 7): headspace National Youth Mental Health Foundation "
               "publishes its centre list for the public to find services; names and addresses are facts, not copyright "
               "expression (Telstra v Phone Directories); robots.txt permits /headspace-centres/; one request per run; "
               "no prose or images copied. Checked 2026-10-15.")

ITEM_RE = re.compile(
    r'<a href="(?P<href>/headspace-centres/[^"]+)"[^>]*class="AccordionWidget-body-item-link"[^>]*>\s*'
    r'<p class="AccordionWidget-body-item-heading">(?P<name>.*?)<span class="AccordionWidget-body-item-address">(?P<address>.*?)</span>',
    re.S)
STATE_RE = re.compile(r"(?P<pre>.*?)[\s,]*(?P<state>" + "|".join(re.escape(s) for s in STATE_NAMES) + r")(?:\s+(?P<postcode>\d{4}))?\s*$", re.I | re.S)


def parse(page: str) -> list[dict[str, str]]:
    out = []
    for m in ITEM_RE.finditer(page):
        name = squash(strip_tags(m.group("name")))
        address = squash(html.unescape(strip_tags(m.group("address"))))
        rec = {"name": name, "address": address, "url": "https://headspace.org.au" + m.group("href")}
        sm = STATE_RE.match(address)
        if sm:
            rec["state"] = STATE_NAMES[sm.group("state").lower()]
            rec["postcode"] = sm.group("postcode") or ""
            pre = [p.strip() for p in sm.group("pre").split(",") if p.strip()]
            rec["suburb"] = pre[-1] if pre else ""
            rec["address_line"] = ", ".join(pre[:-1]) if len(pre) > 1 else ""
        out.append(rec)
    return out


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE}: would fetch {URL} once and parse the centre list")
        return 0
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    try:
        page = fetch_text(URL, timeout=90)
        w.note_fetch(URL, bytes=len(page))
        recs = parse(page)
        if not recs:
            raise RuntimeError("no centres parsed (page layout changed?)")
        by_state: dict[str, int] = {}
        for i, rec in enumerate(recs):
            if limit and i >= limit:
                break
            w.write(envelope(SOURCE, URL, legal_basis, observed_at, **rec))
            by_state[rec.get("state", "?")] = by_state.get(rec.get("state", "?"), 0) + 1
        log(f"{SOURCE}: by state {by_state}")
        meta = w.close(by_state=by_state)
    except Exception as e:  # noqa: BLE001
        w.note_failure(URL, f"{e.__class__.__name__}: {e}")
        meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
