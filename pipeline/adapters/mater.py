"""Mater (Queensland) our-specialists directory (www.mater.org.au). Lower priority.

Endpoint: POST https://www.mater.org.au/api/specialists/search?page=<n> with
{"Specialty":"all","Name":"","Location":"all"} returns {specialists:[{name,
specialties[], link}], hasMore}. Filtered locally; matching profile pages are
read for the Practice location block. robots.txt has only a Sitemap line.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, parse_args, record, strip_tags  # noqa: E402

GROUP = "mater"
BASE = "https://www.mater.org.au"
LEGAL_BASIS = ("facts from public page; Mater robots.txt has no Disallow rules (Sitemap only) so "
               "/api/specialists/search and /health-services/our-specialists/ are permitted, checked 2026-10-15; "
               "no prose or images copied")


def profile_locations(page: str):
    out = []
    for m in re.finditer(r"Practice location(.*?)(?:Clinical Interests|Biography|<footer)", page, re.S):
        block = re.sub(r"</(?:p|div|li|h[1-6]|span)>|<br\s*/?>", "\n", m.group(1))
        lines = [strip_tags(x) for x in block.split("\n")]
        lines = [l for l in lines if l and l not in ("Email us", "Get directions", "Learn more")]
        name, addr, suburb, state, postcode, phone = "", [], "", "", "", ""
        for i, l in enumerate(lines):
            if re.match(r"^(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)$", l):
                state = l
                suburb = lines[i - 1] if i > 0 else ""
                postcode = lines[i + 1] if i + 1 < len(lines) and re.match(r"^\d{4}$", lines[i + 1]) else ""
            elif re.match(r"^[\d() +\-]{8,}$", l) and not phone:
                phone = l
        for l in lines:
            if l in (suburb, state, postcode, phone) or re.match(r"^[\d() +\-]{8,}$", l):
                break
            if not name:
                name = l
            else:
                addr.append(l)
        out.append(location(name, ", ".join(addr), suburb, state, postcode, phone))
    return out


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    page, items = 1, []
    while True:
        d = f.json(f"{BASE}/api/specialists/search?page={page}", body={"Specialty": "all", "Name": "", "Location": "all"})
        items += d.get("specialists", [])
        if not d.get("hasMore") or (args.dry_run and page >= 2):
            break
        page += 1
    matches = [s for s in items if classify(s.get("specialties") or [])]
    print(f"[{GROUP}] {len(items)} specialists listed, {len(matches)} in scope")
    cap = 3 if args.dry_run else (args.limit or len(matches))
    out = []
    for s in matches[:cap]:
        url = BASE + s["link"]
        locs, tags, tele = [], [], None
        try:
            html_page = f.text(url)
            locs = profile_locations(html_page)
            ci = re.search(r"Clinical Interests(.*?)(?:Biography|</section>)", html_page, re.S)
            if ci:
                tags = [t for t in re.split(r"[,;]\s*", strip_tags(ci.group(1))) if 0 < len(t) < 80]
            tele = True if re.search(r"telehealth", html_page, re.I) else None
        except Exception as e:
            print("  profile failed", url, e)
        specs = [clean(x) for x in s.get("specialties") or []]
        out.append(record(GROUP, url, LEGAL_BASIS, s["name"], specs[0], specs[1:] + tags, locs or [location("Mater", "", "", "QLD")], tele, url))
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
