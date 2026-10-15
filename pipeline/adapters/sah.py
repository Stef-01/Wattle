"""Sydney Adventist Hospital (the San) find-a-doctor (www.sah.org.au, NSW).

Endpoint: the find-a-doctor page loads a static JSON database,
/assets/components/fas/fas_db.json (name, profile slug, specialties, practice
suburb + phone per doctor). Matching doctors' public profile pages
(/<slug>) are read for street addresses. robots.txt is absent (HTML 404) so
nothing is disallowed.
"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, classify, clean, finish, location, parse_args, record, strip_tags  # noqa: E402

GROUP = "sah"
BASE = "https://www.sah.org.au"
LEGAL_BASIS = ("facts from public page; Sydney Adventist Hospital has no robots.txt (HTTP 404) so "
               "/assets/components/fas/fas_db.json and profile pages are unrestricted, checked 2026-10-15; "
               "no prose or images copied")


def profile_practices(page: str):
    m = re.search(r"Practices(.*?)(?:Other Languages|Profile\s*<|<footer)", page, re.S)
    if not m:
        return []
    block = re.sub(r"</(?:p|div|li|h[1-6]|br)>|<br\s*/?>", "\n", m.group(1))
    lines = [strip_tags(x) for x in block.split("\n")]
    lines = [l for l in lines if l and l != "|"]
    # Lines run: practice name, address lines..., SUBURB (upper case), then
    # "Phone:" / number / "Fax:" / number, then the next practice.
    practices, cur, label = [], None, ""
    for l in lines:
        lm = re.match(r"^(Phone|Fax):?\s*(.*)$", l, re.I)
        if lm:
            label = lm.group(1).lower()
            l = lm.group(2).strip()
            if not l:
                continue
        if re.match(r"^[\d() +\-]{8,}$", l):
            target = practices[-1] if cur is None and practices else cur
            if target is not None and label == "phone" and not target["phone"]:
                target["phone"] = l
            label = ""
            continue
        if l.isupper() and len(l) < 40:
            if cur is None:
                cur = {"name": "", "addr": [], "phone": ""}
            cur["suburb"] = l
            practices.append(cur)
            cur = None
            continue
        if cur is None:
            cur = {"name": l, "addr": [], "phone": ""}
        else:
            cur["addr"].append(l)
    if cur is not None:
        practices.append(cur)
    return [location(p["name"], ", ".join(p["addr"]), p.get("suburb", "").title(), "NSW", "", p["phone"])
            for p in practices if p["name"] or p.get("suburb")]


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    db = f.json(BASE + "/assets/components/fas/fas_db.json")
    doctors = db.get("doctors", {})
    matches = [(k, d) for k, d in doctors.items() if classify(d.get("specialties") or [])]
    print(f"[{GROUP}] {len(doctors)} doctors in db, {len(matches)} in scope")
    cap = 3 if args.dry_run else (args.limit or len(matches))
    out = []
    for _, d in matches[:cap]:
        url = f"{BASE}/{d['url']}"
        locs, tele = [], None
        try:
            page = f.text(url)
            locs = profile_practices(page)
            tele = True if re.search(r"telehealth", page, re.I) else None
        except Exception as e:
            print("  profile failed", url, e)
        if not locs:
            locs = [location("", "", (p.get("suburb") or "").title(), "NSW", "", p.get("phone")) for p in d.get("practices") or []]
        specs = [clean(s) for s in d.get("specialties") or []]
        out.append(record(GROUP, url, LEGAL_BASIS, d["name"], specs[0] if specs else "", specs[1:], locs, tele, url))
    finish(GROUP, out, f, args)


if __name__ == "__main__":
    main()
