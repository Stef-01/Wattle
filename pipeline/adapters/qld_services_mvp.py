"""Queensland public services for the Wattle MVP categories -> data/raw/qld_services_mvp/.

Categories: persistent_pain, endometriosis_pelvic_pain, perinatal_mental_health, me_cfs,
menopause, child_development, cymhs. One record per service location: name, category,
HHS, facility, address, geocode, phone, opening hours, referral route, website.

Queensland Health has no "find a specialist" directory. What exists (checked 2026-10-15):

  1. The Squiz datastore the HHS websites render from (`services`, `service-locations`,
     `facilities`): service locations for Persistent Pain Management, Perinatal mental
     health, Child development service, Child and youth mental health (+ day programs and
     step-up/step-down), and the gynaecology / women's health clinics whose own page text
     names endometriosis, pelvic pain or menopause. Covers 14 HHSs (not Metro North or
     Gold Coast, which run their own sites).
  2. Statewide persistent pain management service locations page
     (health.qld.gov.au/clinical-practice/referrals/statewide-specialist-services/...):
     six services with address, phone and referral rule.
  3. Children's Health Queensland CYMHS statewide catchment list (CSV, March 2026): every
     Queensland suburb mapped to its community CYMHS team and phone.
  4. Hand-listed Metro North, Gold Coast, Townsville and statewide pages for services the
     datastore does not reach (endometriosis and pelvic pain clinics, Gold Coast CDS and
     CYMHS access, Redcliffe perinatal, Tess Cramond, QCPIMH).

ME/CFS: Queensland Health publishes no clinical service; its ME/CFS page lists two
charities' phone lines. Menopause: no dedicated public clinic is published; rural
women's health clinics list menopause among their topics. Both are recorded in the run
log under `not_published`.

Facts only: no service descriptions, no intake emails. Run:
  python pipeline/adapters/qld_services_mvp.py [--no-pages]
"""
from __future__ import annotations

import csv
import io
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import AdapterError, JsonlWriter, arg, log, now_iso, squash, strip_tags  # noqa: E402
from qld_common import (  # noqa: E402
    HHS_ID_TO_NAME, LEGAL_DATASTORE, LEGAL_HEALTH_QLD, address_in, datastore, decode_csv, fetch, fetch_text, hhs_from_host,
    hhs_from_name, latlng_in, phone_in, robots_quotes, section, service_url, text_of, title_of,
)

SOURCE = "qld_services_mvp"
PAIN_PAGE = "https://www.health.qld.gov.au/clinical-practice/referrals/statewide-specialist-services/persistent-pain-management/persistent-pain-clinics"
PAIN_REFERRAL = "https://www.health.qld.gov.au/clinical-practice/referrals/statewide-specialist-services/persistent-pain-management/referring-patients"
CYMHS_PAGE = "https://www.childrens.health.qld.gov.au/for-health-professionals/refer-your-patient/local-child-and-youth-mental-health-service"
MECFS_PAGE = "https://www.health.qld.gov.au/public-health/topics/neurological-gateway/mecfs"

# datastore service name -> category (exact names as published in `services`)
SERVICE_CATEGORY = {
    "Persistent Pain Management": "persistent_pain",
    "Perinatal mental health": "perinatal_mental_health",
    "Child development service": "child_development",
    "Child and youth mental health": "cymhs",
    "Child and youth mental health day program": "cymhs",
    "Child and youth inpatient mental health": "cymhs",
    "Youth mental health step up, step down": "cymhs",
}
# services whose location page text decides the category
CONTENT_RULES = [
    (re.compile(r"endometri|pelvic pain", re.I), {"Gynaecology", "Women's health clinics", "Men's and Women's health", "Persistent Pain Management"}, "endometriosis_pelvic_pain"),
    (re.compile(r"menopaus", re.I), {"Gynaecology", "Women's health clinics", "Men's and Women's health", "Endocrine"}, "menopause"),
    (re.compile(r"chronic fatigue|ME/CFS|myalgic", re.I), None, "me_cfs"),
]

# Pages outside the datastore (Metro North, Gold Coast, Townsville, statewide):
# (url, category, hhs_id, service name as the HHS publishes it, facility or None)
EXTRA_PAGES = [
    ("https://metronorth.health.qld.gov.au/specialist_service/refer-your-patient/pain-medicine", "persistent_pain", "metro-north",
     "Tess Cramond Pain and Research Centre (Metro North Persistent Pain Management)", "Surgical, Treatment and Rehabilitation Service (STARS)"),
    ("https://www.townsville.health.qld.gov.au/services/community-health/adult-community-health/north-queensland-persistent-pain-management-service/", "persistent_pain", "townsville",
     "North Queensland Persistent Pain Management Service", "Townsville University Hospital"),
    ("https://www.goldcoast.health.qld.gov.au/our-services/womens-and-maternity/womens-and-maternity-services/endometriosis-and-pelvic-pain-interdisciplinary-clinical-services", "endometriosis_pelvic_pain", "gold-coast",
     "Endometriosis and Pelvic Pain Interdisciplinary Clinical Services", None),
    ("https://www.goldcoast.health.qld.gov.au/referrals/services/endometriosis-and-pelvic-pain-service", "endometriosis_pelvic_pain", "gold-coast",
     "Endometriosis and Pelvic Pain Service (referral page)", "Gold Coast University Hospital"),
    ("https://www.townsville.health.qld.gov.au/services/womens-health/", "endometriosis_pelvic_pain", "townsville",
     "Women's health (incl. North Queensland Pelvic Pain and Endometriosis Service)", "Townsville University Hospital"),
    ("https://metronorth.health.qld.gov.au/rbwh/healthcare-services/gynaecology", "endometriosis_pelvic_pain", "metro-north",
     "Gynaecology - Royal Brisbane and Women's Hospital", "Royal Brisbane and Women's Hospital"),
    ("https://metronorth.health.qld.gov.au/rbwh/healthcare-services/gynaecology", "menopause", "metro-north",
     "Gynaecology - Royal Brisbane and Women's Hospital (menopausal health)", "Royal Brisbane and Women's Hospital"),
    ("https://metronorth.health.qld.gov.au/redcliffe/healthcare-services/perinatal-mental-health", "perinatal_mental_health", "metro-north",
     "Perinatal Mental Health - Redcliffe Hospital", "Redcliffe Hospital"),
    ("https://www.childrens.health.qld.gov.au/our-work/queensland-centre-for-perinatal-and-infant-mental-health", "perinatal_mental_health", "childrens-health-queensland",
     "Queensland Centre for Perinatal and Infant Mental Health", None),
    ("https://www.goldcoast.health.qld.gov.au/our-services/childrens-services/child-development-service/about-the-service", "child_development", "gold-coast",
     "Child Development Service - Gold Coast", None),
    ("https://www.goldcoast.health.qld.gov.au/our-services/childrens-services/child-and-youth-mental-health/child-and-youth-mental-health-access-team", "cymhs", "gold-coast",
     "Child and Youth Mental Health Access Team - Gold Coast", "Proxima Building, Southport"),
]

NOT_PUBLISHED = {
    "me_cfs": {"status": "no Queensland Health clinical service published",
               "page": MECFS_PAGE,
               "what_the_page_lists": "Emerge Australia 1800 865 321 and ME/CFS Australia (charities); HHS referral pages route ME/CFS to General Medicine 'complex or undifferentiated medical problems'"},
    "menopause": {"status": "no dedicated public menopause clinic published",
                  "what_exists": "rural women's health clinics (nurse-led) list menopause among topics; RBWH and other gynaecology services list 'menopausal health' in scope; both captured here where the page says so"},
    "find_a_specialist": {"status": "Queensland Health publishes no clinician-level directory; services are listed per HHS site, not per doctor"},
}


HEADING_PREFIX = re.compile(r"^(?:how to (?:use|access) (?:this|our) service|referral(?:s)?|am i eligible\??|referring patients)\s*:?\s*", re.I)


def referral_from(html_: str, text: str) -> str | None:
    """Referral rule as the page states it (one or two short sentences, heading words dropped)."""
    sec = section(html_, r"(how to access|referral|how to refer|access this service|am i eligible)")
    pool = sec or text
    sents = [HEADING_PREFIX.sub("", squash(s)) for s in re.split(r"(?<=[.!?])\s+|(?=How to (?:use|access))", pool)]
    hits = [s for s in sents if 25 <= len(s) <= 300
            and re.search(r"referr|\bGP\b|general practitioner|self-refer|walk[- ]in|HealthPathways", s, re.I)
            and not re.search(r"skip to content|keyboard navigation|cookie", s, re.I)]
    out = squash(re.sub(r"(?:Email:?\s*(?:\(preferred option\))?\s*)?\S+@\S+", "", " ".join(hits[:2])))  # no emails stored
    return out[:400] or None


def hours_from(text: str) -> str | None:
    m = re.search(r"((?:Monday|Mon)\b.{0,60}?\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm).{0,30}?\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm))", text, re.I)
    return squash(m.group(1))[:120] if m else None


# ----------------------------------------------------------------- 1. datastore

def from_datastore(w: JsonlWriter) -> list[dict[str, Any]]:
    svcs = {s["id"]: s for s in datastore("services")}
    facs = {f["id"]: f for f in datastore("facilities")}
    out = []
    for loc in datastore("service-locations"):
        if loc.get("status") != "active":
            continue
        svc = svcs.get(loc.get("service_id"))
        fac = facs.get(loc.get("facility_id"))
        if not svc:
            continue
        text = strip_tags((loc.get("description") or "") + " " + (loc.get("content") or ""))
        cats = set()
        if svc["name"] in SERVICE_CATEGORY:
            cats.add(SERVICE_CATEGORY[svc["name"]])
        for rx, allowed, cat in CONTENT_RULES:
            if (allowed is None or svc["name"] in allowed) and rx.search(text + " " + loc.get("name", "")):
                cats.add(cat)
        if not cats:
            continue
        hhs = (fac or {}).get("hhs_id")
        content = loc.get("content") or ""
        for cat in sorted(cats):
            out.append({
                "category": cat, "name": squash(loc.get("name") or ""), "service": svc["name"],
                "hhs": hhs, "hhs_name": HHS_ID_TO_NAME.get(hhs or ""),
                "facility": squash((fac or {}).get("name") or "") or None, "facility_code": ((fac or {}).get("code") or "").strip() or None,
                "building": squash(loc.get("building") or "") or None,
                "address": squash(loc.get("physical_address_street") or (fac or {}).get("physical_address_street") or "") or None,
                "suburb": squash(loc.get("physical_address_suburb") or (fac or {}).get("physical_address_suburb") or "").title() or None,
                "postcode": squash(loc.get("physical_address_postcode") or (fac or {}).get("physical_address_postcode") or "") or None,
                "lat": loc.get("latitude") or (fac or {}).get("latitude") or None,
                "lng": loc.get("longitude") or (fac or {}).get("longitude") or None,
                "phone": phone_in(loc.get("phone_number")) or phone_in(content) or phone_in((fac or {}).get("phone_number")),
                "opening_hours": squash(strip_tags(loc.get("opening_hours") or "")) or None,
                "referral": referral_from(content, text),
                "service_level": loc.get("facility_level") or None,
                "visiting_service_dates": squash(strip_tags(loc.get("visiting_service_dates") or "")) or None,
                "website": service_url(hhs or "", svc["web_path"], loc.get("web_path")),
                "source_url": f"https://au-e375edfd.datastore.squiz.cloud/service-locations",
                "source_id": loc["id"], "dataset": "squiz-datastore/service-locations", "legal_basis": LEGAL_DATASTORE,
            })
    w.note_fetch("https://au-e375edfd.datastore.squiz.cloud/service-locations", mvp_locations=len(out))
    return out


# ----------------------------------------------------------------- 2. statewide pain page

def from_pain_page(w: JsonlWriter) -> list[dict[str, Any]]:
    html_ = fetch_text(PAIN_PAGE)
    main = re.search(r"<main\b.*?</main>", html_, re.S | re.I)
    body = main.group(0) if main else html_
    names = [squash(re.sub(r"\(.*?\)", "", strip_tags(x))) for x in re.findall(r"<li>(.*?)</li>", body.split("Referral pathways")[0], re.S)]
    names = [n for n in names if "pain" in n.lower()]
    text = strip_tags(body.split("Referral details", 1)[-1])
    text = re.split(r"Last updated", text)[0]
    # each service's block starts at the LAST mention of its name before the next service's block
    # (the North Queensland block repeats its own name in a sentence)
    starts = []
    pos = 0
    for name in names:
        i = text.find(name, pos)
        if i < 0:
            continue
        starts.append((i, name))
        pos = i + len(name)
    out = []
    for k, (start, name) in enumerate(starts):
        block = text[start:starts[k + 1][0] if k + 1 < len(starts) else len(text)]
        street = re.search(r"(?:Enquiries and referrals:|Postal address:)\s*(.*?)(?=\s*(?:Postal address:|Phone:|Fax:|Email:|$))", block)
        addr = address_in(block) or {}
        if street and not addr:
            s = squash(street.group(1).replace("Postal address:", ""))
            m = re.search(r"^(.*?)[,\s]+([A-Z][A-Za-z' ]+?)\s+Qld\s+(\d{4})$", s)
            if m:
                addr = {"address": squash(m.group(1)), "suburb": squash(m.group(2)), "postcode": m.group(3)}
            else:
                parts = [squash(p) for p in s.split(",")]
                addr = {"address": s, "suburb": parts[-1] if len(parts) > 1 and len(parts[-1]) < 30 else None, "postcode": None}
        hhs = None
        for key, hid in (("north queensland", "townsville"), ("sunshine coast", "sunshine-coast"), ("tess cramond", "metro-north"),
                         ("metro south", "metro-south"), ("gold coast", "gold-coast"), ("paediatric", "childrens-health-queensland")):
            if key in name.lower():
                hhs = hid
        out.append({
            "category": "persistent_pain", "name": squash(name), "service": "Persistent Pain Management",
            "hhs": hhs, "hhs_name": HHS_ID_TO_NAME.get(hhs or ""), "facility": None, "facility_code": None, "building": None,
            "address": addr.get("address"), "suburb": addr.get("suburb"), "postcode": addr.get("postcode"), "lat": None, "lng": None,
            "phone": phone_in(re.search(r"Phone:\s*(.{0,20})", block).group(1) if re.search(r"Phone:", block) else block),
            "opening_hours": hours_from(block), "referral": "Referrals are only accepted from general practitioners; each service has its own referral form (statewide referral page)",
            "service_level": "statewide" if "statewide" in block.lower() or "paediatric" in name.lower() else "major",
            "visiting_service_dates": None, "website": PAIN_PAGE, "source_url": PAIN_PAGE, "source_id": None,
            "dataset": "health.qld.gov.au persistent pain service locations", "legal_basis": LEGAL_HEALTH_QLD,
        })
    w.note_fetch(PAIN_PAGE, services=len(out))
    return out


# ----------------------------------------------------------------- 3. CYMHS catchment CSV

def from_cymhs_csv(w: JsonlWriter) -> list[dict[str, Any]]:
    page = fetch_text(CYMHS_PAGE)
    m = re.search(r'href="([^"]+\.csv[^"]*)"', page, re.I)
    if not m:
        raise AdapterError("CYMHS page: no CSV link")
    url = m.group(1) if m.group(1).startswith("http") else "https://www.childrens.health.qld.gov.au" + m.group(1)
    updated = re.search(r"Last updated:\s*([A-Za-z]+ \d{4})", strip_tags(page))
    rows = list(csv.DictReader(io.StringIO(decode_csv(fetch(url)))))
    clinics: dict[str, dict[str, Any]] = {}
    for r in rows:
        name = squash(r.get("Clinic") or "")
        if not name:
            continue
        c = clinics.setdefault(name, {"name": name, "phone": phone_in(r.get("Clinic Phone Number")), "hhs_name": squash(r.get("HHS") or ""),
                                      "suburbs": 0, "postcodes": set()})
        c["suburbs"] += 1
        if (r.get("Postcode") or "").strip():
            c["postcodes"].add(r["Postcode"].strip())
    w.note_fetch(url, rows=len(rows), clinics=len(clinics), source_last_updated=updated.group(1) if updated else None)
    out = []
    for c in clinics.values():
        hhs = hhs_from_name(c["hhs_name"])
        out.append({
            "category": "cymhs", "name": c["name"], "service": "Child and youth mental health",
            "hhs": hhs, "hhs_name": HHS_ID_TO_NAME.get(hhs or "", c["hhs_name"] or None), "facility": None, "facility_code": None, "building": None,
            "address": None, "suburb": None, "postcode": None, "lat": None, "lng": None, "phone": c["phone"], "opening_hours": None,
            "referral": "community CYMHS team by patient's catchment suburb; refer the local team (CHQ statewide catchment list)",
            "catchment_suburbs": c["suburbs"], "catchment_postcodes": sorted(c["postcodes"]),
            "service_level": "community", "visiting_service_dates": None, "website": CYMHS_PAGE, "source_url": url, "source_id": None,
            "dataset": f"CHQ CYMHS statewide catchment list ({updated.group(1) if updated else 'undated'})", "legal_basis": LEGAL_HEALTH_QLD,
        })
    return out


# ----------------------------------------------------------------- 4. hand-listed pages

def from_extra_pages(w: JsonlWriter) -> list[dict[str, Any]]:
    out = []
    cache: dict[str, str] = {}
    for url, cat, hhs, name, facility in EXTRA_PAGES:
        try:
            html_ = cache[url] if url in cache else cache.setdefault(url, fetch_text(url))
        except AdapterError as e:
            w.note_failure(url, str(e))
            continue
        text = text_of(html_)
        addr = address_in(text) or {}
        ll = latlng_in(html_)
        tel = re.search(r'href="tel:([^"]+)"', html_)
        phone = None
        for cand in (re.search(r"(?:Phone|Ph|Intake line|phone)\s*(?:\(option \d\))?:?\s*([\d() \-]{8,16})", text), tel):
            if cand:
                phone = phone_in(cand.group(1))
                if phone:
                    break
        out.append({
            "category": cat, "name": name, "page_title": title_of(html_), "service": None, "hhs": hhs, "hhs_name": HHS_ID_TO_NAME.get(hhs or ""),
            "facility": facility, "facility_code": None, "building": None,
            "address": addr.get("address"), "suburb": addr.get("suburb"), "postcode": addr.get("postcode"),
            "lat": ll[0] if ll else None, "lng": ll[1] if ll else None,
            "phone": phone or phone_in(text), "opening_hours": hours_from(text), "referral": referral_from(html_, text),
            "service_level": None, "visiting_service_dates": None, "website": url, "source_url": url, "source_id": None,
            "dataset": "HHS service page", "legal_basis": LEGAL_HEALTH_QLD,
        })
    return out


def main() -> int:
    pages = arg("no-pages") is None
    w = JsonlWriter(SOURCE)
    observed = now_iso()
    recs: list[dict[str, Any]] = []
    for label, fn in (("datastore", lambda: from_datastore(w)), ("pain_page", lambda: from_pain_page(w)),
                      ("cymhs_csv", lambda: from_cymhs_csv(w)), ("extra_pages", lambda: from_extra_pages(w) if pages else [])):
        try:
            got = fn()
            log(f"{label}: {len(got)}")
            recs.extend(got)
        except AdapterError as e:
            w.note_failure(label, str(e))
    recs.sort(key=lambda r: (r["category"], r.get("hhs") or "zz", r["name"]))
    for r in recs:
        legal, src_url = r.pop("legal_basis"), r.pop("source_url")
        if r.get("lat") is not None:
            r["lat"], r["lng"] = round(float(r["lat"]), 6), round(float(r["lng"]), 6)
        w.write({"source": SOURCE, "source_url": src_url, "observed_at": observed, "legal_basis": legal, "tier": "found", "state": "QLD", **r})
    by_cat = {c: sum(1 for r in recs if r["category"] == c) for c in sorted({r["category"] for r in recs})}
    fill = {k: sum(1 for r in recs if r.get(k) not in (None, "", [])) for k in ("address", "lat", "phone", "referral", "opening_hours", "website")}
    w.close(by_category=by_cat, field_fill=fill, not_published=NOT_PUBLISHED, robots=robots_quotes(),
            user_agent="WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
