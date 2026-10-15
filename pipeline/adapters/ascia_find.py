"""ASCIA "Locate a Specialist" (allergy.org.au) collector, paediatric listings only.

Source: https://www.allergy.org.au/patients/locate-a-specialist
Lists Full ASCIA members (allergy / clinical immunology physicians) in public and private
practice, one listing per practice location. HTML only (Joomla/ZOO "business" app, no JSON):
  * state list pages  /patients/locate-a-specialist/<state>[/<page>]   (VIC: /find-a-specialist/victoria)
    teaser = name, credentials, practice, suburb, patient-group text, public/private, item URL
  * item pages        .../item/<slug>  = Ahpra number, address lines, state, postcode, phone
On 2026-10-15 the AU lists held 443 listings; those whose patient-group text mentions
paediatrics/children are kept, grouped by name + credentials into one record with N locations.

Facts only: name, credentials, patient-group tag, practice name, address, phone. Nothing else on
the page is stored. Run: python -I pipeline/adapters/ascia_find.py [--dry-run] [--limit N]
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

SOURCE = "ascia_find"
BASE = "https://www.allergy.org.au"
USER_AGENT = "WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)"
LEGAL_BASIS = (
    "facts from a public member-locator that ASCIA publishes for patients and referrers "
    "(robots.txt 2026-10-15 allows all paths used; site copyright notice covers materials, graphics and "
    "layout, no clause on automated access); listing presence is the member's own request to appear; "
    "names, practice names, addresses, phone numbers and Ahpra numbers are facts, no prose copied"
)
RATE_SECONDS = 1.2
STATE_PATHS = {
    "ACT": "/patients/locate-a-specialist/act",
    "NSW": "/patients/locate-a-specialist/nsw",
    "NT": "/patients/locate-a-specialist/nt",
    "QLD": "/patients/locate-a-specialist/qld",
    "SA": "/patients/locate-a-specialist/sa",
    "TAS": "/patients/locate-a-specialist/tas",
    "VIC": "/find-a-specialist/victoria",
    "WA": "/patients/locate-a-specialist/wa",
}
PAED_RE = re.compile(r"paediatric|pediatric|child|adolescen|infant", re.I)
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE

_robots: urllib.robotparser.RobotFileParser | None = None


def allowed(url: str) -> bool:
    global _robots
    if _robots is None:
        _robots = urllib.robotparser.RobotFileParser()
        req = urllib.request.Request(BASE + "/robots.txt", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as r:
            _robots.parse(r.read().decode("utf-8", "replace").splitlines())
    return _robots.can_fetch(USER_AGENT, url)


def get(url: str) -> str:
    if not allowed(url):
        raise PermissionError(f"robots.txt disallows {url}")
    time.sleep(RATE_SECONDS)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            last = e
        except Exception as e:  # noqa: BLE001
            last = e
        time.sleep(5 * (attempt + 1))
    raise last


def text(s: str) -> str:
    s = html.unescape(re.sub(r"<[^>]+>", " ", s)).replace("�", "-")  # a few listings carry a cp1252 en dash
    return re.sub(r"\s+", " ", s).strip()


def parse_list(page: str) -> list[dict]:
    out = []
    for block in re.findall(r'<div class="teaser-item">(.*?)<p class="pos-links">', page, re.S):
        m = re.search(r'<h2 class="pos-title">\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
        if not m:
            continue
        creds = re.search(r'<p class="pos-subtitle">(.*?)</p>', block, re.S)
        elems = re.findall(r'<div class="element element-(textarea|text)[^"]*">(.*?)</div>', block, re.S)
        texts = [(kind, text(v)) for kind, v in elems]
        tags = [t for kind, t in texts if kind == "textarea" and t]
        plain = [t for kind, t in texts if kind == "text" and t]
        setting = plain[-1] if plain and plain[-1] in ("Public", "Private", "Public and Private") else None
        if setting:
            plain = plain[:-1]
        out.append({
            "href": m.group(1), "name": text(m.group(2)), "credentials": text(creds.group(1)) if creds else "",
            "practice": plain[0] if len(plain) > 1 else None, "suburb": plain[-1] if plain else None,
            "tags": tags, "setting": setting,
        })
    return out


PHONE_RE = re.compile(r"^(\+?\(?\d[\d\s()\-]{6,}\d)$")


def parse_item(page: str) -> dict:
    m = re.search(r'<div class="pos-address">(.*?)</div>', page, re.S)
    lines = [text(x) for x in re.findall(r"<li[^>]*>(.*?)</li>", m.group(1), re.S)] if m else []
    lines = [x for x in lines if x]
    ahpra = re.search(r"AHPRA Number\s*([A-Z]{3}\d{10})", page)
    loc = {"name": None, "address": None, "suburb": None, "state": None, "postcode": None,
           "lat": None, "lng": None, "phone": None, "website": None}
    phones = [x for x in lines if PHONE_RE.match(x)]
    lines = [x for x in lines if x not in phones and x != "Australia"]
    loc["phone"] = re.sub(r"\s+", " ", phones[0]) if phones else None
    for i, x in enumerate(lines):
        if x.upper() in STATE_PATHS:
            loc["state"] = x.upper()
            if i >= 1:
                loc["suburb"] = lines[i - 1]
            if i + 1 < len(lines) and re.fullmatch(r"\d{4}", lines[i + 1]):
                loc["postcode"] = lines[i + 1]
            head = lines[:max(i - 1, 0)]
            if head:
                loc["name"] = head[0] if len(head) > 1 else None
                loc["address"] = ", ".join(head[1:] if len(head) > 1 else head)
            break
    else:
        if lines:
            loc["name"] = lines[0]
            loc["address"] = ", ".join(lines[1:]) or None
    return {"location": loc, "ahpra": ahpra.group(1) if ahpra else None}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="max paediatric listings whose item page is fetched (0 = all)")
    ap.add_argument("--states", default="", help="comma list of states (default: all AU)")
    args = ap.parse_args()
    observed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    states = [s.strip().upper() for s in args.states.split(",") if s.strip()] or list(STATE_PATHS)

    listings: list[dict] = []
    for st in states:
        page_no, seen = 1, set()
        while True:
            url = BASE + STATE_PATHS[st] + (f"/{page_no}" if page_no > 1 else "")
            try:
                items = parse_list(get(url))
            except urllib.error.HTTPError as e:
                print(f"{st} page {page_no}: {e}", file=sys.stderr)
                break
            new = [i for i in items if i["href"] not in seen]
            if not new:
                break
            for i in new:
                seen.add(i["href"])
                i["state_list"] = st
            listings.extend(new)
            page_no += 1
        print(f"{st}: {len(seen)} listings")
    paed = [l for l in listings if any(PAED_RE.search(t) for t in l["tags"])]
    print(f"{SOURCE}: {len(listings)} AU listings, {len(paed)} paediatric; item pages ~{len(paed) * RATE_SECONDS / 60:.1f} min")
    if args.dry_run:
        for l in paed[:5]:
            print(json.dumps(l, ensure_ascii=False))
        return 0
    if args.limit:
        paed = paed[: args.limit]

    people: dict[tuple, dict] = {}
    failures = []
    for l in paed:
        url = BASE + l["href"]
        try:
            item = parse_item(get(url))
        except Exception as e:  # noqa: BLE001
            failures.append(f"{url} :: {e}")
            item = {"location": {"name": l["practice"], "address": None, "suburb": l["suburb"], "state": l["state_list"],
                                 "postcode": None, "lat": None, "lng": None, "phone": None, "website": None}, "ahpra": None}
        loc = item["location"]
        loc["state"] = loc["state"] or l["state_list"]
        loc["name"] = loc["name"] or l["practice"]
        loc["suburb"] = loc["suburb"] or l["suburb"]
        loc["setting"] = l["setting"]
        key = (re.sub(r"\s+", " ", l["name"]).lower(), l["credentials"].lower())
        rec = people.get(key)
        if rec is None:
            rec = people[key] = {
                "source": SOURCE, "source_url": url, "observed_at": observed_at, "legal_basis": LEGAL_BASIS,
                "tier": "found", "specialty": "paediatrics",
                "source_id": l["href"].rsplit("/", 1)[-1],
                "name": re.sub(r"\s+", " ", l["name"]), "display_credentials": l["credentials"] or None,
                "ahpra_number": item["ahpra"],
                "subspecialty_tags": ["Allergy / Clinical Immunology"], "patient_groups": [],
                "telehealth": None, "locations": [], "profile_url": url,
            }
        rec["ahpra_number"] = rec["ahpra_number"] or item["ahpra"]
        for t in l["tags"]:
            if t not in rec["patient_groups"]:
                rec["patient_groups"].append(t)
        rec["locations"].append(loc)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{observed_at[:10]}.jsonl"
    with out.open("w", encoding="utf-8", newline="\n") as f:
        for rec in people.values():
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    by_state: dict[str, int] = {}
    for rec in people.values():
        for st in {x["state"] for x in rec["locations"] if x["state"]}:
            by_state[st] = by_state.get(st, 0) + 1
    digest = hashlib.sha256(out.read_bytes()).hexdigest()[:12]
    print(f"wrote {len(people)} doctors ({len(paed)} listings) -> {out} (sha256 {digest}); by state {by_state}; failures {len(failures)}")
    for fl in failures:
        print("  FAIL", fl, file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
