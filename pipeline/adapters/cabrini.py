"""Cabrini Health find-a-doctor (www.cabrini.com.au, Victoria).

Endpoint: WordPress listing at /find-a-doctor/?dp=<page> (20 tiles a page,
server-rendered: name, discipline, Cabrini site, phone, profile URL). The
specialty filter is JS-populated, so all pages are walked and filtered
locally; matching profiles are read for the Consulting Rooms address.
robots.txt allows /find-a-doctor/ (only wp-admin, WC and WP Defender paths
are disallowed).
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, parse_args, record, split_au_address, strip_tags  # noqa: E402

GROUP = "cabrini"
BASE = "https://www.cabrini.com.au"
LEGAL_BASIS = ("facts from public page; Cabrini robots.txt permits /find-a-doctor/ "
               "(only wp-admin, WooCommerce upload and WP Defender paths disallowed) checked 2026-10-15; "
               "no prose or images copied")
TILE_RE = re.compile(r'<div class="fad_results_tile">(.*?)</li>', re.S)


def tiles(page: str):
    for t in TILE_RE.findall(page):
        a = re.search(r'fad_results_tile__title">\s*<h2>\s*<a href="([^"]+)">(.*?)</a>\s*</h2>\s*<p>(.*?)</p>', t, re.S)
        if not a:
            continue
        sites = [strip_tags(x) for x in re.findall(r'icon -location".*?</i>\s*<p>(.*?)</p>', t, re.S)]
        phone = re.search(r'icon -phone".*?</i>\s*([^<]+)', t, re.S)
        yield {"url": a.group(1), "name": strip_tags(a.group(2)), "specialty": strip_tags(a.group(3)),
               "sites": sites, "phone": clean(phone.group(1)) if phone else ""}


def profile_locations(page: str, phone: str):
    locs = []
    m = re.search(r"Consulting Rooms(.*?)(?:Cabrini Practice Locations|</main>|<footer)", page, re.S)
    if m:
        text = strip_tags(re.sub(r"</(?:p|div|li|h[1-6])>", "\n", m.group(1)))
        # the block alternates "<site name>" then "<address line incl. VIC 3144>"
        chunks = [c for c in re.split(r"\n+", re.sub(r"</(?:p|div|li|h[1-6])>", "\n", m.group(1))) if strip_tags(c)]
        chunks = [strip_tags(c) for c in chunks]
        chunks = [c for c in chunks if c]
        i = 0
        while i < len(chunks):
            name, addr = chunks[i], ""
            if i + 1 < len(chunks) and re.search(r"\b(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\b\s*\d{4}", chunks[i + 1]):
                addr = chunks[i + 1]
                i += 1
            if addr:
                a = split_au_address(addr)
                locs.append(location(name, a["address"], a["suburb"], a["state"], a["postcode"], phone))
            i += 1
    return locs


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    first = f.text(BASE + "/find-a-doctor/")
    pages = max([int(x) for x in re.findall(r"[?&]dp=(\d+)", first)] + [1])
    print(f"[{GROUP}] {pages} listing pages")
    found = list(tiles(first))
    for p in range(2, (2 if args.dry_run else pages) + 1):
        try:
            found += list(tiles(f.text(f"{BASE}/find-a-doctor/?dp={p}")))
        except Exception as e:
            print("  skip page", p, e)
    seen, matches = set(), []
    for t in found:
        if t["url"] in seen or not classify([t["specialty"]]):
            continue
        seen.add(t["url"])
        matches.append(t)
    print(f"[{GROUP}] {len(found)} tiles, {len(matches)} in scope")
    cap = 3 if args.dry_run else (args.limit or len(matches))
    out = []
    for t in matches[:cap]:
        locs, tags, tele = [], [], None
        try:
            page = f.text(t["url"])
            locs = profile_locations(page, t["phone"])
            ages = re.search(r"Ages Treated(.*?)</(?:div|li|tr)>", page, re.S)
            if ages:
                tags += [x for x in re.split(r",\s*", strip_tags(ages.group(1))) if x]
            tele = True if re.search(r"telehealth", page, re.I) else None
        except Exception as e:
            print("  profile failed", t["url"], e)
        if not locs:
            locs = [location(s, "", "", "VIC", "", t["phone"]) for s in t["sites"]]
        else:
            for s in t["sites"]:
                if not any(s.lower() in (l["name"] or "").lower() for l in locs):
                    locs.append(location(s, "", "", "VIC", "", t["phone"]))
        parts = [p for p in re.split(r",\s*", t["specialty"]) if p]
        out.append(record(GROUP, t["url"], LEGAL_BASIS, t["name"], parts[0], parts[1:] + tags, locs, tele, t["url"]))
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
