"""Calvary Health Care per-hospital specialist directories (www.calvarycare.org.au).

Endpoint: /find-a-specialist is a 404. Each hospital has a
/hospitals/<hospital>/doctors-and-health(care)-professionals-<n> page (listed in
sitemap.xml) whose Next.js RSC payload embeds the full "specialists" array from
Contentful (title, first/last name, specialty, phone, address, suburb, state,
postcode). One request per hospital page. robots.txt: Allow: /.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, next_flight_strings, json_after, parse_args, record, sitemap_urls  # noqa: E402

GROUP = "calvary"
LEGAL_BASIS = ("facts from public page; Calvary Health Care robots.txt permits /hospitals/ (Allow: /) "
               "checked 2026-10-15; no prose or images copied")
DIR_RE = re.compile(r"https://www\.calvarycare\.org\.au/hospitals/([^/]+)/doctors-and-health(?:care)?-professionals-\d+$")


def hospital_name(slug: str) -> str:
    return " ".join(w.capitalize() if w not in ("of", "and") else w for w in slug.split("-"))


def parse_dir(page: str, url: str, hospital: str):
    flight = next_flight_strings(page)
    specialists = json_after(flight, '"specialists":[', "[") or []
    out, by_name = [], {}
    for s in specialists:
        if not isinstance(s, dict):
            continue
        spec = clean(s.get("specialty"))
        if not classify([spec]):
            continue
        name = clean(f"{s.get('title', '')} {s.get('firstName', '')} {s.get('lastName', '')}")
        loc = location(hospital, s.get("address"), s.get("suburb"), s.get("state"), s.get("postcode"), s.get("phone"))
        if name in by_name:  # Contentful lists one entry per specialty; merge
            r = by_name[name]
            if spec.lower() not in (t.lower() for t in [r["specialty"], *r["subspecialty_tags"]]):
                r["subspecialty_tags"].append(spec)
            if loc not in r["locations"]:
                r["locations"].append(loc)
            continue
        by_name[name] = record(GROUP, url, LEGAL_BASIS, name, spec, [], [loc], None, url)
        out.append(by_name[name])
    return out


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    urls = sorted({u for u in sitemap_urls(f, "https://www.calvarycare.org.au/sitemap.xml") if DIR_RE.match(u)})
    print(f"[{GROUP}] {len(urls)} hospital directory pages")
    out = []
    for u in urls[: (1 if args.dry_run else len(urls))]:
        slug = DIR_RE.match(u).group(1)
        try:
            recs = parse_dir(f.text(u), u, hospital_name(slug))
        except Exception as e:
            print("  skip", u, e)
            continue
        print(f"  {slug}: {len(recs)} in scope")
        out += recs
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
