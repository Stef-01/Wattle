"""Ramsay Health Care specialist search (www.ramsayhealth.com.au).

Endpoint: POST https://www.ramsayhealth.com.au/api/specialists/search with a
bearer token embedded in the public search page (searchAccessToken; the
token rotates, so it is read from the page at run time). Body keys are the
filter-group keys from /api/specialists/filters: vst = service type ids,
vs = state codes. Search items have no address, so each kept specialist's
public profile page is read for address/phone (embedded JSON).
robots.txt only disallows /info/.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, json_after, parse_args, record  # noqa: E402

GROUP = "ramsay"
BASE = "https://www.ramsayhealth.com.au"
SEARCH_PAGE = BASE + "/en/specialists-and-practitioners/"
LEGAL_BASIS = ("facts from public page; Ramsay Health Care robots.txt permits /api/specialists/ and "
               "/en/specialists-and-practitioners/ (only /info/ disallowed) checked 2026-10-15; no prose or images copied")


def tokens(f: Fetcher):
    page = f.text(SEARCH_PAGE)
    s = re.search(r'"searchAccessToken":"([^"]+)"', page)
    t = re.search(r'"filtersAccessToken":"([^"]+)"', page)
    if not (s and t):
        raise RuntimeError("search/filters tokens not found on search page")
    return s.group(1), t.group(1)


def service_ids(f: Fetcher, ftoken: str) -> dict:
    data = f.json(BASE + "/api/specialists/filters", body={}, headers={"Authorization": f"Bearer {ftoken}"})
    ids = {}
    for block in data.get("searchFilters", []):
        for g in block.get("filterGroups", []):
            if g.get("key") == "vst":
                for x in g.get("filters", []):
                    if classify([x["name"]]):
                        ids[x["id"]] = x["name"]
    return ids


def search(f: Fetcher, stoken: str, vst: str):
    page, items = 1, []
    while True:
        d = f.json(BASE + "/api/specialists/search", body={"vst": [vst], "page": page, "pageSize": 100},
                   headers={"Authorization": f"Bearer {stoken}"})
        items.extend(d.get("items", []))
        if not d.get("pagination", {}).get("hasNextPage"):
            return items
        page += 1


def parse_profile(page: str, url: str, item: dict):
    info = json_after(page, '"primaryInformation":', "{") or {}
    addr = info.get("address") or {}
    services = info.get("services") or item.get("services") or []
    phones = info.get("phoneNumbers") or []
    locs = []
    if addr:
        street = " ".join(x for x in (addr.get("suite"), addr.get("floor"), addr.get("streetAddress")) if x)
        locs.append(location("Consulting rooms", street, addr.get("suburb"), addr.get("state"), addr.get("postCode"), phones[0] if phones else ""))
    cards = json_after(page, '"locations":{"title":"Locations"', "{") or {}
    for c in cards.get("cards") or []:
        locs.append(location(c.get("name"), " ".join(x for x in (c.get("address1"), c.get("address2")) if x),
                             c.get("suburb"), c.get("state"), c.get("postCode"), c.get("phoneNumber")))
    if not locs:
        for h in item.get("locations") or []:
            locs.append(location(h))
    tags = list(item.get("conditionTreatments") or [])
    interests = item.get("interests") or (json_after(page, '"interestsAndBio":', "{") or {}).get("interests") or ""
    tags += [clean(t) for t in re.split(r"[,;]\s*|<br\s*/?>", interests) if clean(t)]
    tele = bool(info.get("telehealthOnlyLabel")) or any("telehealth" in (l["name"] or "").lower() for l in locs)
    name = clean(f"{info.get('title') or item.get('title', '').split(' ')[0]} {info['fullName']}") if info.get("fullName") else item["title"]
    return record(GROUP, url, LEGAL_BASIS, name, services[0] if services else "", tags + services[1:], locs,
                  tele or None, url)


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    stoken, ftoken = tokens(f)
    ids = service_ids(f, ftoken)
    print(f"[{GROUP}] service types: {ids}")
    seen, items = set(), []
    for vst in ids:
        for it in search(f, stoken, vst):
            href = it.get("viewProfileButton", {}).get("href")
            if href and href not in seen:
                seen.add(href)
                items.append(it)
        if args.dry_run and items:
            break
    print(f"[{GROUP}] {len(items)} unique specialists from search")
    cap = 3 if args.dry_run else (args.limit or len(items))
    out = []
    for i, it in enumerate(items[:cap]):
        url = BASE + it["viewProfileButton"]["href"]
        try:
            out.append(parse_profile(f.text(url), url, it))
        except Exception as e:
            print("  skip", url, e)
        if i % 100 == 0:
            print(f"  {i}/{cap}")
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
