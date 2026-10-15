#!/usr/bin/env python3
"""RANZCOG "Find a Women's Health Doctor" adapter (Python 3.13, stdlib only).

Directory page (robots: Disallow / with an explicit Allow for this path):
    https://integrate.ranzcog.edu.au/find-womens-health-doctor
Linked from https://ranzcog.edu.au/womens-health/your-og-doctor/

Endpoints the Angular SPA calls (discovered from chunk 8879 + main bundle, 2026-10-15):
    GET {API}/workplace/o-and-g-types/true          -> scope-of-practice vocabulary
    GET {API}/workplace/search-o-and-g-public
        ?searchText=&sortBy=DESC&orderBy=&page=N&pageSize=M
        &filters=searchText%3D%26nearByPostcodes%3D%26state%3D%26typeName%3DAll%2BScopes
                 %26languageNames%3D%26postcode%3D%26cc%3D
    API = https://integrate.ranzcog.edu.au/api
No auth, no captcha. Empty filters return the whole directory, one row per
workplace (doctor x practice). `totalCount` is always 0; paging stops when a
page comes back short.

Credential tier is NOT a field in the API. It is inferred from the scope type
(college's own definitions on the directory page):
    Generalist * / Subspecialist *  -> Fellow (holds FRANZCOG)
    GP Obstetrician                 -> Associate (Procedural)  [college text:
                                       "Associate (Procedural or Advanced
                                       Procedural)"; the two are not separable]
Certificant and Diplomate are never surfaced by this directory.

Only facts are stored: name, tier, scope tags, practice locations, phone,
languages. No bios, no photos, no email.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "ranzcog_find"
LEGAL_BASIS = "facts from public page; robots checked 2026-10-15; opt-in directory; republication feed to be requested from the college"
DIRECTORY_URL = "https://integrate.ranzcog.edu.au/find-womens-health-doctor"
API = "https://integrate.ranzcog.edu.au/api"
SEARCH_URL = f"{API}/workplace/search-o-and-g-public"
TYPES_URL = f"{API}/workplace/o-and-g-types/true"
USER_AGENT = "Mozilla/5.0 (compatible; WattleHealthBot/0.1; +mailto:stefan.thottunkal@gmail.com)"
MIN_INTERVAL = 1.0  # seconds between requests
PAGE_SIZE = 100
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE

_last_request = 0.0


def _get_json(url: str) -> object:
    global _last_request
    wait = MIN_INTERVAL - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read()
    _last_request = time.monotonic()
    return json.loads(body)


def search_url(page: int, page_size: int) -> str:
    filters = urllib.parse.urlencode({
        "searchText": "", "nearByPostcodes": "", "state": "", "typeName": "All Scopes",
        "languageNames": "", "postcode": "", "cc": "",
    })
    q = urllib.parse.urlencode({
        "searchText": "", "sortBy": "DESC", "orderBy": "", "page": page,
        "pageSize": page_size, "filters": filters,
    })
    return f"{SEARCH_URL}?{q}"


def fetch_all_rows(page_size: int = PAGE_SIZE, max_pages: int = 500) -> list[dict]:
    rows: list[dict] = []
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        data = _get_json(search_url(page, page_size))
        batch = data.get("data") or []
        for row in batch:
            rid = row.get("id")
            if rid and rid in seen:
                continue
            if rid:
                seen.add(rid)
            rows.append(row)
        print(f"page {page}: {len(batch)} rows (total {len(rows)})", file=sys.stderr)
        if len(batch) < page_size:
            break
    return rows


def credential_tier(scope_names: list[str]) -> str | None:
    if any(s.startswith(("Generalist", "Subspecialist")) for s in scope_names):
        return "Fellow"
    if any(s == "GP Obstetrician" for s in scope_names):
        return "Associate (Procedural)"
    return None


def _clean(v: object) -> str | None:
    if v is None:
        return None
    s = " ".join(str(v).split())
    return s or None


def _split_csv(v: object) -> list[str]:
    return sorted({p.strip() for p in str(v or "").split(",") if p.strip()})


def group_rows(rows: list[dict], observed_at: str) -> list[dict]:
    """One record per doctor; one location per workplace row."""
    by_doctor: dict[str, dict] = {}
    for r in rows:
        name = _clean(r.get("fullName"))
        if not name:
            continue
        key = name.casefold()
        rec = by_doctor.get(key)
        scopes = _split_csv(r.get("workplaceScopeTypeNames"))
        if rec is None:
            rec = by_doctor[key] = {
                "source": SOURCE,
                "source_url": DIRECTORY_URL,
                "observed_at": observed_at,
                "legal_basis": LEGAL_BASIS,
                "name": name,
                "credential_tier": None,
                "specialty": "Obstetrics and Gynaecology",
                "subspecialty_tags": [],
                "locations": [],
                "telehealth": None,  # not exposed by this directory
                "profile_url": DIRECTORY_URL,  # SPA has no per-doctor page
                "languages": [],
            }
        rec["subspecialty_tags"] = sorted(set(rec["subspecialty_tags"]) | set(scopes))
        rec["languages"] = sorted(set(rec["languages"]) | set(_split_csv(r.get("languageNames"))))
        loc = {
            "practice": _clean(r.get("organizationName")),
            "address": _clean(r.get("streetAddress")),
            "suburb": _clean(r.get("city")),
            "state": _clean(r.get("state")),
            "postcode": _clean(r.get("postCode")),
            "country": _clean(r.get("country")),
            "phone": _clean(r.get("phone")),
            "website": _clean(r.get("web")),
            "workplace_id": r.get("id"),
        }
        rec["locations"].append(loc)
    out = []
    for rec in by_doctor.values():
        rec["credential_tier"] = credential_tier(rec["subspecialty_tags"])
        out.append(rec)
    out.sort(key=lambda x: x["name"].casefold())
    return out


def summarise(records: list[dict]) -> str:
    by_state: dict[str, int] = {}
    by_tier: dict[str, int] = {}
    for rec in records:
        states = {loc["state"] or "?" for loc in rec["locations"]}
        for s in states:
            by_state[s] = by_state.get(s, 0) + 1
        t = rec["credential_tier"] or "unknown"
        by_tier[t] = by_tier.get(t, 0) + 1
    lines = [f"doctors: {len(records)}  locations: {sum(len(r['locations']) for r in records)}"]
    lines.append("by state (doctor counted once per state): " + ", ".join(f"{k}={v}" for k, v in sorted(by_state.items())))
    lines.append("by tier: " + ", ".join(f"{k}={v}" for k, v in sorted(by_tier.items())))
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="fetch one page, print the summary, write nothing")
    ap.add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"), help="output file stem (YYYY-MM-DD)")
    ap.add_argument("--page-size", type=int, default=PAGE_SIZE)
    args = ap.parse_args(argv)

    observed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    try:
        types = _get_json(TYPES_URL)
        print("scope types: " + ", ".join(t["name"] for t in types), file=sys.stderr)
        rows = fetch_all_rows(args.page_size, max_pages=1 if args.dry_run else 500)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} from {e.url}: {e.read()[:300]!r}", file=sys.stderr)
        return 1
    records = group_rows(rows, observed_at)
    print(summarise(records), file=sys.stderr)
    if args.dry_run:
        print(json.dumps(records[:2], indent=1))
        return 0
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{args.date}.jsonl"
    with out.open("w", encoding="utf-8", newline="\n") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"wrote {len(records)} records -> {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
