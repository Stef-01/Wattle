"""ANZSPED "Paediatric Endocrine & Diabetes Units" (anzsped.org) collector.

Source: https://anzsped.org/about-anzsped/paediatric-endocrine-diabetes-units/
One public WordPress page listing every Australian (and NZ) paediatric endocrine unit with its
address, phone and the named head of unit / clinical lead / paediatric endocrinologists. The
society does not publish a member directory ("unable to provide contact details for specific
members"), so this is the only public ANZSPED source of names. Australian units only are kept.

Facts only: doctor name, role tag, unit name, address, phone, unit website.
Run: python -I pipeline/adapters/anzsped_units.py [--dry-run] [--limit N]
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

SOURCE = "anzsped_units"
URL = "https://anzsped.org/about-anzsped/paediatric-endocrine-diabetes-units/"
USER_AGENT = "WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)"
LEGAL_BASIS = (
    "facts from a public society page that names unit heads and paediatric endocrinologists at each "
    "Australian paediatric endocrine unit (robots.txt 2026-10-15: WordPress default, page allowed; no terms "
    "of use published on the site); names, roles, unit addresses and phone numbers are facts, no prose copied"
)
RATE_SECONDS = 1.2
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE
STATE_HEADINGS = {
    "ACT": "ACT", "NSW": "NSW", "SOUTH AUSTRALIA": "SA", "TASMANIA": "TAS", "QUEENSLAND": "QLD",
    "VICTORIA": "VIC", "WESTERN AUSTRALIA": "WA", "NORTHERN TERRITORY": "NT",
}
ROLE_RE = re.compile(
    r"(Heads? of Unit|Acting Head of Unit|Head of Diabetes|Clinical Lead|Paediatric Endocrinologists?|Endocrinologist)\s*[:\-–]?\s*(.+)",
    re.I,
)
NAME_RE = re.compile(r"((?:Dr|Prof(?:essor)?|A/Prof|Associate Professor)\.?\s+[A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,3})")
PHONE_RE = re.compile(r"(?:Tel|Ph|Phone)\s*:\s*([+\d(][\d\s()\-]{6,}\d)", re.I)
POSTCODE_RE = re.compile(r"\b(\d{4})\b")


def get(url: str) -> str:
    rp = urllib.robotparser.RobotFileParser()
    req = urllib.request.Request("https://anzsped.org/robots.txt", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        rp.parse(r.read().decode("utf-8", "replace").splitlines())
    if not rp.can_fetch(USER_AGENT, url):
        raise PermissionError(f"robots.txt disallows {url}")
    time.sleep(RATE_SECONDS)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
    # the page is UTF-8 with a few stray cp1252 curly quotes (0x92/0x93/0x94)
    raw = raw.replace(b"\x92", b"'").replace(b"\x93", b'"').replace(b"\x94", b'"')
    return raw.decode("utf-8", "replace")


def suburb_of(address: str | None, city: str | None) -> str | None:
    """Last locality chunk before the postcode: '72 King William Road, North Adelaide SA 5006' -> North Adelaide."""
    if not address:
        return city
    chunks = [c.strip() for c in address.split(",")]
    idx = next((i for i, c in enumerate(chunks) if POSTCODE_RE.search(c) and not c.lower().startswith(("po box", "locked bag"))), None)
    if idx is None:
        return city
    for i in range(idx, -1, -1):
        street = bool(re.match(r"^\d", chunks[i]))
        c = re.sub(r"\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT|Victoria|Australia)\b", " ", chunks[i])
        c = re.sub(r"\b\d{3,4}\b", " ", c)
        c = re.sub(r"\s+", " ", c).strip()
        if not c:
            continue
        return c.split(" ")[-1] if street else c
    return city


def clean(s: str) -> str:
    s = html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("�", "'")  # site serves U+FFFD for curly apostrophes
    return re.sub(r"\s+", " ", s).strip()


def parse(page: str) -> list[dict]:
    m = re.search(r"<h1.*?AUSTRALIA(.*?)NEW ZEALAND", page, re.S)
    body = m.group(1) if m else page
    state, city, units = None, None, []
    for tag, inner in re.findall(r"<(h2|h3|p)[^>]*>(.*?)</\1>", body, re.S):
        t = clean(inner)
        if tag == "h2":
            state, city = STATE_HEADINGS.get(t.upper()), None
        elif tag == "h3":
            city = t
        elif tag == "p" and state:
            lines = [clean(x) for x in re.split(r"<br\s*/?>", inner)]
            lines = [x for x in lines if x]
            if not lines:
                continue
            website = next((html.unescape(u) for u in re.findall(r'href="(https?://[^"]+)"', inner) if "mailto" not in u), None)
            names = []
            addr_lines = []
            phone = None
            for x in lines:
                r = ROLE_RE.search(x)
                pm = PHONE_RE.search(x)
                if r:
                    role = r.group(1)
                    for n in NAME_RE.findall(r.group(2)):
                        names.append((n, role))
                elif pm and phone is None:
                    phone = re.sub(r"\s+", " ", pm.group(1)).strip()
                elif re.match(r"^(Fax|Email|Postal|Website|Phone|Tel|Ph|Department email|www\.|http)", x, re.I) or "@" in x:
                    continue
                else:
                    addr_lines.append(x)
            if not names:
                units.append({"state": state, "city": city, "lines": lines, "names": [], "skipped": True})
                continue
            pc = None
            for x in reversed(addr_lines):
                pm2 = POSTCODE_RE.search(x)
                if pm2 and not x.lower().startswith(("po box", "locked bag", "private bag")):
                    pc = pm2.group(1)
                    break
            units.append({
                "state": state, "city": city, "unit": addr_lines[0] if addr_lines else None,
                "address": ", ".join(addr_lines[1:]) if len(addr_lines) > 1 else None,
                "postcode": pc, "phone": phone, "website": website, "names": names,
            })
    return units


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    observed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    units = parse(get(URL))
    records = []
    for u in units:
        if u.get("skipped"):
            continue
        for name, role in u["names"]:
            suburb = suburb_of(u["address"], u["city"])
            records.append({
                "source": SOURCE, "source_url": URL, "observed_at": observed_at, "legal_basis": LEGAL_BASIS,
                "tier": "found", "specialty": "paediatrics",
                "source_id": re.sub(r"[^a-z]+", "-", name.lower()).strip("-"),
                "name": name, "subspecialty_tags": ["Paediatric endocrinology", role],
                "locations": [{
                    "name": u["unit"], "address": u["address"], "suburb": suburb, "state": u["state"],
                    "postcode": u["postcode"], "lat": None, "lng": None, "phone": u["phone"], "website": u["website"],
                }],
                "telehealth": None, "profile_url": URL,
            })
    print(f"{SOURCE}: {len(units)} unit blocks, {len(records)} named doctors")
    if args.dry_run:
        for r in records[:5]:
            print(json.dumps(r, ensure_ascii=False))
        return 0
    if args.limit:
        records = records[: args.limit]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{observed_at[:10]}.jsonl"
    with out.open("w", encoding="utf-8", newline="\n") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    by_state: dict[str, int] = {}
    for r in records:
        by_state[r["locations"][0]["state"]] = by_state.get(r["locations"][0]["state"], 0) + 1
    print(f"wrote {len(records)} -> {out} (sha256 {hashlib.sha256(out.read_bytes()).hexdigest()[:12]}); by state {by_state}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
