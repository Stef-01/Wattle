"""Epworth HealthCare find-a-doctor (www.epworth.org.au, Victoria).

Endpoint: the results widget calls Sitecore Search (discover-apse2.sitecorecloud.io)
which answers 404 "domain not found" to direct requests, so it is not used.
www.epworth.org.au/sitemap.xml lists every /our-specialists/<slug> profile;
each is server-rendered with data-cec-specialities / data-cec-subspecialities /
data-cec-aoi attributes, a phone field and consulting-location cards.
robots.txt: "Disallow:" (empty) -- everything allowed.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, parse_args, record, sitemap_urls, strip_tags  # noqa: E402

GROUP = "epworth"
LEGAL_BASIS = ("facts from public page; Epworth robots.txt permits /our-specialists/ (empty Disallow) "
               "checked 2026-10-15; no prose or images copied")


def parse_profile(page: str, url: str):
    specs = [clean(s) for s in re.findall(r'data-cec-specialities="([^"]*)"', page)]
    specs = [s for s in specs if s]
    if not classify(specs):
        return None
    title = re.search(r"<title>([^<]+)", page)
    name = clean(re.split(r"\s[-|]\s", title.group(1))[0]) if title else ""
    if not name:
        return None
    tags = []
    for attr in ("data-cec-subspecialities", "data-cec-aoi"):
        for v in re.findall(attr + r'="([^"]*)"', page):
            tags += [t for t in re.split(r",\s*", clean(v)) if t]
    phone = re.search(r'class="field-phone-number">([^<]*)<', page)
    phone = clean(phone.group(1)) if phone else ""
    locs = []
    for card in re.findall(r'<h3 class="delta[^"]*">(.*?)</h3>\s*<div class="card-loc[^"]*">(.*?)</div>\s*</div>', page, re.S):
        lname = strip_tags(card[0])
        body = card[1]
        k = body.find('class="consulting-location"')
        head, tail = (body, "") if k < 0 else (body[:k], body[k:])
        lines = [strip_tags(x) for x in re.findall(r"<span>(.*?)</span>", head, re.S)]
        lines = [l for l in lines if l]
        parts = [strip_tags(x) for x in re.findall(r"<span>(.*?)</span>", tail, re.S)]
        parts = [p for p in parts if p]
        suburb, state, postcode = (parts + ["", "", ""])[:3]
        locs.append(location(lname, ", ".join(lines).rstrip(","), suburb, state, postcode, phone))
    if not locs:
        for h in re.findall(r'data-cec-locations?="([^"]*)"', page):
            locs.append(location(h, "", "", "VIC", "", phone))
    telehealth = True if re.search(r"telehealth", page, re.I) else None
    return record(GROUP, url, LEGAL_BASIS, name, specs[0], tags + specs[1:], locs, telehealth, url)


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    urls = sorted({u for u in sitemap_urls(f, "https://www.epworth.org.au/sitemap.xml") if "/our-specialists/" in u})
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
