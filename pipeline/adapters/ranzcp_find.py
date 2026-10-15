"""RANZCP "Find a Psychiatrist" (yourhealthinmind.org) collector.

Source: https://www.yourhealthinmind.org/find-a-psychiatrist
Endpoint (discovered 2026-10-15 from /bundles/scripts): POST
  /RANZCPWebServices/PsychProfileService.asmx/SearchProfiles
  body {"searchQuery": "<json>"}; response {"d": "<json>"} with resultTotal + results[10].
An empty query with country AU returns every Australian listing (1,299 on 2026-10-15).

Facts only. The free-text `summary` and the HTML `accreditedTier1Faculty` prose are not
stored; faculties are reduced to tags. Run: python ranzcp_find.py [--dry-run] [--limit N]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "ranzcp-find"
BASE = "https://www.yourhealthinmind.org"
ENDPOINT = BASE + "/RANZCPWebServices/PsychProfileService.asmx/SearchProfiles"
LEGAL_BASIS = (
    "facts from a public opt-in directory (terms of use 2026-10-15: copyright asserted, no "
    "clause on automated access; robots.txt allows all); listing presence is the psychiatrist's "
    "own request to appear; prose summary not copied; college feed to be requested by founder"
)
RATE_SECONDS = 1.2
PAGE_SIZE = 10
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE


def query(page: int) -> dict:
    q = {
        "country": "AU", "psychSurname": None, "locationText": None, "locationName": None,
        "state": None, "seed": 1, "latitude": None, "longitude": None, "useCurrentLocation": False,
        "onlineConsultations": False, "radius": 10, "expertiseIn": [], "servicesOffered": [],
        "experienceWith": [], "treatsAges": [], "languages": [], "selectedResultId": None,
        "page": page, "initialSearch": page == 1,
    }
    body = json.dumps({"searchQuery": json.dumps(q)}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "WattleHealth/0.1 (+https://github.com/Stef-01/Wattle-Health; data@wattletech.au)",
        "Referer": BASE + "/find-a-psychiatrist/results",
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(json.loads(r.read())["d"])


def tags(items: list[dict] | None) -> list[str]:
    return sorted({(i.get("description") or "").strip() for i in (items or []) if i.get("description")})


def faculties(html: str | None) -> list[str]:
    if not html:
        return []
    return sorted({re.sub(r"\s+", " ", t).strip() for t in re.findall(r"<p>(.*?)</p>", html) if t.strip()})


def normalise(rec: dict, observed_at: str) -> dict:
    addrs = []
    for a in rec.get("psychAddresses") or []:
        addrs.append({
            "name": (a.get("locationName") or "").strip() or None,
            "address": ", ".join(x.strip() for x in (a.get("streetAddress1"), a.get("streetAddress2"), a.get("streetAddress3")) if x and x.strip()) or None,
            "suburb": (a.get("suburb") or a.get("townCity") or "").strip() or None,
            "state": (a.get("state") or "").strip() or None,
            "postcode": (a.get("postCode") or "").strip() or None,
            "lat": a.get("latitude"), "lng": a.get("longitude"),
            "phone": (a.get("phone") or "").strip() or None,
            "fax": (a.get("fax") or "").strip() or None,
            "website": (a.get("website") or "").strip() or None,
            "seq": a.get("addressSeqNo"),
        })
    return {
        "source": SOURCE,
        "source_url": BASE + (rec.get("profileUrl") or ""),
        "observed_at": observed_at,
        "legal_basis": LEGAL_BASIS,
        "tier": "found",
        "specialty": "psychiatry",
        "source_id": rec.get("id"),
        "ranzcp_id": rec.get("ranzcP_ID"),
        "name": (rec.get("name") or "").strip(),
        "display_credentials": (rec.get("displayCredentials") or "").strip() or None,
        "faculties": faculties(rec.get("accreditedTier1Faculty")),
        "expertise": tags(rec.get("psychExpertises")),
        "services": tags(rec.get("psychServices")),
        "experience_with": tags(rec.get("psychExperiencesWith")),
        "age_groups": tags(rec.get("psychAgeGroupsTreated")),
        "languages": tags(rec.get("psychLanguages")),
        "telehealth": bool(rec.get("offersOnlineServices")),
        "in_person": bool(rec.get("offersOnPremiseServices")),
        "taking_new_patients": rec.get("takingNewPatients"),
        "wait_time": (rec.get("appointmentWaitTIme") or "").strip() or None,
        "last_updated_by_source": rec.get("lastUpdatedDate"),
        "active": rec.get("isActiveFlag") == "Y",
        "locations": addrs,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="max records (0 = all)")
    args = ap.parse_args()
    observed_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    first = query(1)
    total = int(first.get("resultTotal") or 0)
    pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    print(f"{SOURCE}: {total} listings, {pages} pages at {RATE_SECONDS}s/page ~ {pages * RATE_SECONDS / 60:.1f} min")
    if args.dry_run:
        return 0
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{observed_at[:10]}.jsonl"
    seen: set[int] = set()
    n = 0
    with out.open("w", encoding="utf-8", newline="\n") as f:
        page = 1
        results = first.get("results") or []
        while results:
            for rec in results:
                rid = rec.get("id")
                if rid in seen:
                    continue
                seen.add(rid)
                f.write(json.dumps(normalise(rec, observed_at), ensure_ascii=False) + "\n")
                n += 1
                if args.limit and n >= args.limit:
                    break
            if (args.limit and n >= args.limit) or page >= pages:
                break
            page += 1
            time.sleep(RATE_SECONDS)
            for attempt in range(3):
                try:
                    results = query(page).get("results") or []
                    break
                except Exception as e:  # noqa: BLE001
                    print(f"page {page} attempt {attempt + 1} failed: {e}", file=sys.stderr)
                    time.sleep(5 * (attempt + 1))
            else:
                results = []
            if page % 20 == 0:
                print(f"  page {page}/{pages}, {n} records")
    digest = hashlib.sha256(out.read_bytes()).hexdigest()[:12]
    print(f"wrote {n} records -> {out} (sha256 {digest}); expected {total}")
    return 0 if n == total or args.limit else 1


if __name__ == "__main__":
    sys.exit(main())
