"""Healthscope specialist directory (specialists.healthscope.com.au).

Endpoint: no JSON API is usable -- robots.txt disallows /api/. The site is
Next.js; every profile page carries the specialist object in its RSC flight
payload, and sitemap.xml lists every /specialist/<slug> URL. We walk the
sitemap and parse each profile (allowed: "Allow: /").
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import (Fetcher, classify, clean, finish, location, next_flight_strings,  # noqa: E402
                     json_after, parse_args, record, sitemap_urls)

GROUP = "healthscope"
BASE = "https://specialists.healthscope.com.au"
LEGAL_BASIS = ("facts from public page; Healthscope robots.txt permits /specialist/ "
               "(Allow: /, Disallow: /api/) checked 2026-10-15; no prose or images copied")


def parse_profile(page: str, url: str):
    flight = next_flight_strings(page)
    sp = json_after(flight, '"specialist":{', "{")
    if not sp or not sp.get("full_name"):
        return None
    specs = [a.get("name", "") for a in sp.get("areaOfPractice") or []]
    specs += [s if isinstance(s, str) else s.get("name", "") for s in sp.get("specialties") or []]
    if not classify(specs):
        return None
    tags = list(sp.get("area_of_expertise_names") or [])
    locs = []
    for c in sp.get("consultingLocations") or []:
        addr = " ".join(x for x in (c.get("addressLine1"), c.get("addressLine2")) if x)
        locs.append(location(c.get("name"), addr, c.get("suburb"), c.get("state"), c.get("postcode"), c.get("phone") or sp.get("phone")))
    for h in sp.get("hospitals") or []:
        locs.append(location(h.get("name"), h.get("address"), h.get("suburb"), h.get("state"), "", h.get("phone")))
    telehealth = True if re.search(r"telehealth", page, re.I) else None
    return record(GROUP, url, LEGAL_BASIS, sp["full_name"], specs[0] if specs else "", tags + specs[1:], locs, telehealth, url)


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    urls = [u for u in sitemap_urls(f, BASE + "/sitemap.xml") if "/specialist/" in u]
    print(f"[{GROUP}] {len(urls)} profile urls in sitemap")
    cap = 3 if args.dry_run else (args.limit or len(urls))
    out = []
    for i, u in enumerate(urls[:cap]):
        try:
            r = parse_profile(f.text(u), u)
        except Exception as e:
            print("  skip", u, e)
            continue
        if r:
            out.append(r)
        if i % 100 == 0:
            print(f"  {i}/{cap} kept={len(out)}")
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
