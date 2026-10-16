"""Queensland public hospital and health facility collector -> data/raw/qld_health_facilities/.

One record per facility, merged from four sources (merge key: the Queensland facility code
where every source carries it, else the normalised name):

  1. Squiz datastore `facilities` (the JSON every HHS website renders its facility pages
     from): 380 facilities across 14 HHSs with street address, geocode, phone and the
     services each one hosts (via `service-locations` and `services`).
  2. data.qld.gov.au "hospital-performance" dataset, resource "Facilities" (CC BY 4.0):
     the 40 emergency departments with geocode, phone, website, treatment spaces, hours.
  3. data.qld.gov.au "queensland-public-hospitals" (CC BY 4.0, March 2021 spreadsheet):
     ~195 public acute hospitals with HHS, facility code, address and phone.
  4. https://www.health.qld.gov.au/services alphabetical facility index (name, HHS site
     URL for ~260 facilities). Facilities whose HHS is not in the datastore (Metro North,
     Gold Coast) have their HHS page fetched for address, phone and map coordinates.

Facts only: no descriptions, alerts or editor names. Run:
  python pipeline/adapters/qld_health_facilities.py [--no-pages] [--limit-pages N]
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import AdapterError, JsonlWriter, arg, log, now_iso, sha256_file, squash, strip_tags  # noqa: E402
from qld_common import (  # noqa: E402
    HHS_ID_TO_HOST, HHS_ID_TO_NAME, LEGAL_DATASTORE, LEGAL_DATA_QLD, LEGAL_HEALTH_QLD, address_in, dataset_resources,
    datastore, facility_type, fetch, fetch_json, fetch_text, hhs_from_host, hhs_from_name, latlng_in, norm_name,
    phone_in, robots_quotes,
)

SOURCE = "qld_health_facilities"
SERVICES_INDEX = "https://www.health.qld.gov.au/services"
HP_DATASET = "https://www.data.qld.gov.au/dataset/hospital-performance"
QPH_DATASET = "https://www.data.qld.gov.au/dataset/queensland-public-hospitals"
DATASTORE_URL = "https://au-e375edfd.datastore.squiz.cloud/facilities"


# ----------------------------------------------------------------- source 1: datastore

def from_datastore() -> list[dict[str, Any]]:
    facs = datastore("facilities")
    svcs = {s["id"]: s for s in datastore("services")}
    locs = datastore("service-locations")
    by_fac: dict[str, set[str]] = {}
    for loc in locs:
        if loc.get("status") != "active":
            continue
        s = svcs.get(loc.get("service_id"))
        if s:
            by_fac.setdefault(loc["facility_id"], set()).add(s["name"])
    out = []
    for f in facs:
        if f.get("status") != "active":
            continue
        hhs = f.get("hhs_id") or None
        host = HHS_ID_TO_HOST.get(hhs or "")
        services = set(by_fac.get(f["id"], set()))
        for sid in f.get("top_services") or []:
            if sid in svcs:
                services.add(svcs[sid]["name"])
        out.append({
            "facility_code": (f.get("code") or "").strip() or None,
            "name": squash(f["name"]),
            "hhs": hhs, "hhs_name": f.get("hhs_name") or HHS_ID_TO_NAME.get(hhs or ""),
            "address": squash(f.get("physical_address_street") or "") or None,
            "suburb": squash(f.get("physical_address_suburb") or "").title() or None,
            "postcode": squash(f.get("physical_address_postcode") or "") or None,
            "lat": f.get("latitude") or None, "lng": f.get("longitude") or None,
            "phone": phone_in(f.get("phone_number")),
            "website": f"https://www.{host}/hospitals-and-health-centres/{f['web_path']}" if host and f.get("web_path") and hhs != "childrens-health-queensland"
            else (f"https://www.{host}/services/locations/{f['web_path']}" if host and f.get("web_path") else None),
            "services": sorted(services),
            "_src": {"dataset": "squiz-datastore/facilities", "url": DATASTORE_URL, "id": f["id"], "legal_basis": LEGAL_DATASTORE},
        })
    return out


# ----------------------------------------------------------------- source 2: hospital-performance

def from_hospital_performance(w: JsonlWriter) -> list[dict[str, Any]]:
    ds = dataset_resources(HP_DATASET)
    url = next((r["url"] for r in ds["resources"] if r["name"] == "Facilities"), None)
    if not url:
        raise AdapterError("hospital-performance: no 'Facilities' resource on dataset page")
    url = url.split("?")[0] + "?format=json"
    data = fetch_json(url)
    fields = [f["id"] for f in data["fields"]]
    rows = [dict(zip(fields, r)) for r in data["records"]]
    w.note_fetch(url, dataset="hospital-performance", licence=ds["licence"], rows=len(rows))
    out = []
    for r in rows:
        addr = address_in(r.get("Address") or "")
        parts = [squash(p) for p in (r.get("Address") or "").split(",")]
        out.append({
            "facility_code": (r.get("FacilityCode") or "").strip() or None,
            "name": squash(r.get("FacilityName") or ""),
            "hhs": hhs_from_host(r.get("WebUrl") or "")[0],
            "address": addr["address"] if addr else (parts[0].title() if parts else None),
            "suburb": addr["suburb"] if addr else (parts[1].title() if len(parts) > 2 else None),
            "postcode": addr["postcode"] if addr else (re.sub(r"\D", "", parts[-1])[-4:] or None),
            "lat": float(r["FacilityLatitude"]) if r.get("FacilityLatitude") else None,
            "lng": float(r["FacilityLongitude"]) if r.get("FacilityLongitude") else None,
            "phone": phone_in(r.get("ContactPhone")),
            "website": (r.get("WebUrl") or "").strip() or None,
            "facility_type": r.get("FacilityType") or None,
            "emergency_department": {
                "treatment_spaces": r.get("NumberOfTreatmentSpaces"),
                "open_hours": r.get("OpenHours"), "open_days": r.get("OpenDays"),
                "limited_hours": r.get("LimitedOpenHours") == "Y",
            },
            "services": [],
            "_src": {"dataset": "data.qld.gov.au/hospital-performance (Facilities)", "url": url, "id": r.get("FacilityCode"),
                     "licence": "CC-BY-4.0", "legal_basis": LEGAL_DATA_QLD},
        })
    return out


# ----------------------------------------------------------------- source 3: queensland-public-hospitals xlsx

def _xlsx_rows(blob: bytes) -> list[list[str]]:
    z = zipfile.ZipFile(io.BytesIO(blob))
    shared = [squash(strip_tags(x)) for x in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]
    sheet = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
    rows = []
    for row in re.findall(r"<row[^>]*>(.*?)</row>", sheet, re.S):
        cells: dict[str, str] = {}
        for col, attrs, val in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(?:<v>(.*?)</v>)?', row):
            cells[col] = shared[int(val)] if 't="s"' in attrs and val else (val or "")
        rows.append([cells.get(c, "") for c in "ABCDEF"])
    return rows


def from_public_hospitals(w: JsonlWriter) -> list[dict[str, Any]]:
    ds = dataset_resources(QPH_DATASET)
    url = next((r["url"] for r in ds["resources"] if r["format"] == "XLSX"), None)
    if not url:
        raise AdapterError("queensland-public-hospitals: no xlsx resource on dataset page")
    blob = fetch(url)
    rows = _xlsx_rows(blob)
    w.note_fetch(url, dataset="queensland-public-hospitals", licence=ds["licence"], rows=len(rows))
    out = []
    hdr_seen = False
    for r in rows:
        if r[1].lower().startswith("facility iden"):
            hdr_seen = True
            continue
        if not hdr_seen or not r[2].strip():
            continue
        hhs_name, code, name, address, phone = r[0], r[1], r[2], r[3], r[4]
        parts = [squash(p) for p in address.split(",")]
        postcode = re.sub(r"\D", "", parts[-1])[-4:] if parts else ""
        suburb = parts[-2] if len(parts) >= 3 else (parts[-1] if len(parts) == 2 and not postcode else None)
        if suburb and re.fullmatch(r"\d{4}", suburb):
            suburb = parts[-3] if len(parts) >= 3 else None
        out.append({
            "facility_code": code.strip() or None, "name": squash(name),
            "hhs": hhs_from_name(hhs_name), "hhs_name": squash(hhs_name) or None,
            "address": parts[0] if parts else None, "suburb": (suburb or "").title() or None,
            "postcode": postcode or None, "lat": None, "lng": None,
            "phone": phone_in(phone), "website": None, "services": [],
            "_src": {"dataset": "data.qld.gov.au/queensland-public-hospitals (March 2021)", "url": url, "id": code.strip() or None,
                     "licence": "CC-BY-4.0", "legal_basis": LEGAL_DATA_QLD},
        })
    return out


# ----------------------------------------------------------------- source 4: health.qld.gov.au/services index (+ HHS pages)

def from_services_index(w: JsonlWriter, fetch_pages: bool, page_limit: int, covered_hhs: set[str]) -> list[dict[str, Any]]:
    page = fetch_text(SERVICES_INDEX)
    main = re.search(r"<main\b.*?</main>", page, re.S | re.I)
    body = main.group(0) if main else page
    links = re.findall(r'<li><a href="([^"]+)">(.*?)</a></li>', body)
    w.note_fetch(SERVICES_INDEX, facilities_listed=len(links))
    out = []
    fetched = 0
    for url, name in links:
        hhs, hhs_name = hhs_from_host(url)
        rec: dict[str, Any] = {
            "facility_code": None, "name": squash(strip_tags(name)), "hhs": hhs, "hhs_name": hhs_name,
            "address": None, "suburb": None, "postcode": None, "lat": None, "lng": None, "phone": None,
            "website": url.strip(), "services": [],
            "_src": {"dataset": "health.qld.gov.au/services index", "url": SERVICES_INDEX, "id": url.strip(), "legal_basis": LEGAL_HEALTH_QLD},
        }
        if fetch_pages and hhs not in covered_hhs and (not page_limit or fetched < page_limit):
            fetched += 1
            try:
                html_ = fetch_text(url)
                text = strip_tags(re.sub(r"<(script|style)\b.*?</\1>", " ", html_, flags=re.S | re.I))
                addr = address_in(text)
                if addr:
                    rec.update(addr)
                m = re.search(r"Phone:?\s*((?:\(?0\d\)?[ \-]?)?\d{4}[ \-]?\d{4}|1[38]00[ \-]?\d{3}[ \-]?\d{3})", text)
                rec["phone"] = phone_in(m.group(1) if m else text)
                ll = latlng_in(html_)
                if ll:
                    rec["lat"], rec["lng"] = ll
                rec["_src"]["url"] = url.strip()
                rec["_src"]["page_fetched"] = True
            except AdapterError as e:
                w.note_failure(url, str(e))
        out.append(rec)
    return out


# ----------------------------------------------------------------- merge

def merge(groups: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    by_code: dict[str, dict[str, Any]] = {}
    by_name: dict[str, dict[str, Any]] = {}
    merged: list[dict[str, Any]] = []

    def fold(dst: dict[str, Any], src: dict[str, Any]) -> None:
        for k, v in src.items():
            if k == "_src":
                dst["sources"].append(v)
            elif k == "services":
                dst["services"] = sorted(set(dst.get("services") or []) | set(v or []))
            elif k in ("lat", "lng") and dst.get(k) is not None and v is not None:
                continue  # first geocode wins (datastore / open data before scraped pages)
            elif dst.get(k) in (None, "", []) and v not in (None, "", []):
                dst[k] = v

    for group in groups:
        for rec in group:
            # Queensland facility codes are numeric (zero-padded to 5). The datastore fills the
            # field with placeholders ("NASF", "NA", "SF-NA", "1") for non-hospital sites; those
            # are not keys.
            code = (rec.get("facility_code") or "").strip()
            code = code.zfill(5) if code.isdigit() and len(code) >= 2 else None
            rec["facility_code"] = code
            key_n = norm_name(rec["name"])
            target = (by_code.get(code) if code else None) or by_name.get(key_n)
            if target is None:
                target = {"name": rec["name"], "facility_code": code, "sources": [], "services": []}
                merged.append(target)
            fold(target, rec)
            if code:
                by_code[code] = target
            by_name.setdefault(key_n, target)
    for t in merged:
        for k in ("hhs", "hhs_name", "facility_type", "address", "suburb", "postcode", "lat", "lng", "phone", "website"):
            t.setdefault(k, None)
        if not t["facility_type"]:
            t["facility_type"] = facility_type(t["name"])
        if t.get("hhs") and not t.get("hhs_name"):
            t["hhs_name"] = HHS_ID_TO_NAME.get(t["hhs"])
        if t.get("lat") is not None:
            t["lat"], t["lng"] = round(float(t["lat"]), 6), round(float(t["lng"]), 6)
    return merged


def main() -> int:
    fetch_pages = arg("no-pages") is None
    page_limit = int(arg("limit-pages", "0") or 0)
    w = JsonlWriter(SOURCE)
    observed = now_iso()
    groups: list[list[dict[str, Any]]] = []
    counts: dict[str, int] = {}
    ds = from_datastore()
    counts["squiz_datastore_facilities"] = len(ds)
    groups.append(ds)
    covered = {r["hhs"] for r in ds if r.get("hhs")}
    for label, fn in (("hospital_performance_facilities", lambda: from_hospital_performance(w)),
                      ("queensland_public_hospitals_2021", lambda: from_public_hospitals(w))):
        try:
            recs = fn()
            counts[label] = len(recs)
            groups.append(recs)
        except AdapterError as e:
            w.note_failure(label, str(e))
    idx = from_services_index(w, fetch_pages, page_limit, covered)
    counts["services_index"] = len(idx)
    counts["services_index_pages_fetched"] = sum(1 for r in idx if r["_src"].get("page_fetched"))
    groups.append(idx)
    merged = merge(groups)
    merged.sort(key=lambda r: (r.get("hhs") or "zz", r["name"]))
    for rec in merged:
        primary = rec["sources"][0]
        w.write({
            "source": SOURCE, "source_url": primary["url"], "observed_at": observed,
            "legal_basis": primary["legal_basis"], "tier": "found", "state": "QLD",
            **{k: v for k, v in rec.items() if k != "sources"},
            "sources": rec["sources"],
        })
    fill = {k: sum(1 for r in merged if r.get(k) not in (None, "", [])) for k in ("address", "postcode", "lat", "phone", "website", "services", "facility_code")}
    w.close(source_counts=counts, merged_facilities=len(merged), field_fill=fill,
            hhs_counts={h: sum(1 for r in merged if r.get("hhs") == h) for h in sorted({r.get("hhs") or "unknown" for r in merged})},
            robots=robots_quotes(), user_agent="WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)",
            licences={"data.qld.gov.au datasets": "CC BY 4.0", "health.qld.gov.au / HHS sites": "CC BY-ND 4.0 (facts only)",
                      "squiz datastore JSON": "same content as HHS sites (facts only)"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
