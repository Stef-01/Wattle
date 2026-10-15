"""St John of God Health Care find-a-specialist (www.sjog.org.au).

Endpoint: the search UI is Funnelback (sjoghc-search.funnelback.squiz.cloud)
whose robots.txt disallows /s/ -- so the JSON search API is NOT used. Instead
www.sjog.org.au/sitemap.xml lists every /find-a-specialist/<A-Z>/<slug> page
and each page carries structured <meta name="fas.*"> facts (specialties,
hospitals, phone, up to five practice addresses, telehealth flag).
sjog.org.au robots.txt disallows only /_design, /_services,
/restricted-access and /site-data.json.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, parse_args, record, sitemap_urls, split_au_address, strip_tags  # noqa: E402

GROUP = "sjog"
LEGAL_BASIS = ("facts from public page; St John of God robots.txt permits /find-a-specialist/ "
               "(only /_design, /_services, /restricted-access, /site-data.json disallowed) checked 2026-10-15; "
               "no prose or images copied")
PROFILE_RE = re.compile(r"https://www\.sjog\.org\.au/find-a-specialist/[A-Z]/[^/]+/?$")


def metas(page: str) -> dict:
    out = {}
    for m in re.finditer(r'<meta name="(fas\.[^"]+)" content="([^"]*)"', page):
        out[m.group(1)] = clean(m.group(2))
    return out


def clinical_interests(page: str) -> list:
    m = re.search(r"<dt>\s*Clinical interests\s*</dt>(.*?)</dl>", page, re.S | re.I)
    if not m:
        return []
    return [strip_tags(x) for x in re.findall(r"<dd[^>]*>(.*?)</dd>", m.group(1), re.S)]


def parse_profile(page: str, url: str):
    m = metas(page)
    if not m.get("fas.full_name"):
        return None
    specs = [s for s in re.split(r"\s*\|\s*", m.get("fas.specialties_related", "")) if s]
    if not classify(specs):
        return None
    tags = clinical_interests(page)
    tags += [s for s in re.split(r"\s*\|\s*", m.get("fas.special_interests", "")) if s]
    locs = []
    pairs = [("fas.primary_practice", "fas.primary_address")] + [(f"fas.loc_{i}_practice", f"fas.loc_{i}_address") for i in range(2, 6)]
    for pk, ak in pairs:
        if m.get(ak) or m.get(pk):
            a = split_au_address(m.get(ak, ""))
            locs.append(location(m.get(pk, ""), a["address"], a["suburb"], a["state"], a["postcode"], m.get("fas.phone", "")))
    if not locs and m.get("fas.suburb_postcode"):
        a = split_au_address(m["fas.suburb_postcode"])
        locs.append(location(m.get("fas.hospitals", ""), "", a["suburb"] or m["fas.suburb_postcode"], a["state"], a["postcode"], m.get("fas.phone", "")))
    for h in [h for h in re.split(r"\s*\|\s*", m.get("fas.hospitals", "")) if h]:
        if not any(h.lower() in (l["name"] or "").lower() for l in locs):
            locs.append(location(f"St John of God {h}"))
    tele = m.get("fas.telehealth_consultations", "").lower()
    telehealth = True if tele == "true" else False if tele == "false" else None
    return record(GROUP, url, LEGAL_BASIS, m["fas.full_name"], specs[0], tags + specs[1:], locs, telehealth, url)


def main():
    args = parse_args(__doc__)
    f = Fetcher(backend="curl")  # Cloudflare answers 403 to Python's TLS client, 200 to curl
    urls = sorted({u.rstrip("/") for u in sitemap_urls(f, "https://www.sjog.org.au/sitemap.xml") if PROFILE_RE.match(u)})
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
