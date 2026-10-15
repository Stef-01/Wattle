"""Queensland public per-hospital, per-specialty wait-time data -> data/raw/qld_outpatient_waits/.

What Queensland Health publishes, checked 2026-10-15:

  * Specialist outpatient ("specialist appointments") waiting-list data by hospital and by
    specialty exists ONLY as Power BI embeds on https://www.performance.health.qld.gov.au
    (statewide report 7be54f8d-7ad7-4c87-88f3-18ca98eda29d; per-facility pages such as
    /view-performance-by-facility/hospitals/princess-alexandra-hospital embed report
    47b84e59-33ff-47eb-8205-ccbb15197067). There is no CSV, no datastore and no CKAN
    dataset: package_search for "specialist outpatient" returns 0 packages and "outpatient"
    returns nothing relevant. The run log records this under `not_published`.
  * The nearest open data is the "elective-surgery" dataset (CC BY 4.0, quarterly since
    October 2020): per hospital, per surgical specialty — volume treated, % treated in time,
    volume waiting, long waits and % waiting in time. Those rows are what this adapter
    collects, each tagged measure_family="elective_surgery" so nobody mistakes them for
    outpatient waits. Pre-October-2020 data is a separate dataset and is not collected.

Resources are discovered from the dataset HTML page (robots.txt disallows /api/), downloaded
ten seconds apart (Crawl-Delay: 10). Run:
  python pipeline/adapters/qld_outpatient_waits.py [--latest N]   (N quarters; default all)
"""
from __future__ import annotations

import csv
import io
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, arg, log, now_iso, squash, strip_tags  # noqa: E402
from qld_common import LEGAL_DATA_QLD, fetch, fetch_text, robots_quotes  # noqa: E402

SOURCE = "qld_outpatient_waits"
ES_DATASET = "https://www.data.qld.gov.au/dataset/elective-surgery"
PERF_SITE = "https://www.performance.health.qld.gov.au/statewide-performance/planned-care/specialist-appointments-performance"

NOT_PUBLISHED = {
    "specialist_outpatient_waits_by_hospital_by_specialty": {
        "status": "not published as open data",
        "where_it_exists": "Power BI embeds on www.performance.health.qld.gov.au (statewide report 7be54f8d-7ad7-4c87-88f3-18ca98eda29d; per-facility report 47b84e59-33ff-47eb-8205-ccbb15197067)",
        "ckan_search": "package_search q='specialist outpatient' -> 0 packages (2026-10-15); q='outpatient' -> 2 unrelated packages",
        "page": PERF_SITE,
        "next_step": "request the quarterly specialist outpatient extract from Queensland Health Statistical Services Branch (the public report is derived from the same extract)",
    }
}

MONTHS = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}


def resources() -> list[dict[str, str]]:
    """By-specialty quarterly CSV/XLS resources on the elective-surgery dataset page."""
    page = fetch_text(ES_DATASET)
    out = []
    for m in re.finditer(r'<a[^>]+href="(/dataset/[0-9a-f-]+/resource/[0-9a-f-]+/download/([^"]+))"[^>]*>', page):
        href, fname = m.group(1), m.group(2).lower()
        title = re.search(r'title="([^"]*)"', m.group(0))
        title = squash(strip_tags(title.group(1))) if title else fname
        if "_desc" in fname or "description" in title.lower():
            continue
        by_specialty = "speciality" in title.lower() or "specialty" in title.lower() or "summary 2" in title.lower() or re.search(r"quarterly2|byspecialty", fname)
        if not by_specialty:
            continue
        mm = re.search(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_ ]?(\d{2})(?!\d)", fname)
        period = f"20{mm.group(2)}-{MONTHS[mm.group(1)]:02d}" if mm else None
        out.append({"url": "https://www.data.qld.gov.au" + href, "title": title, "file": fname, "period": period})
    out.sort(key=lambda r: r["period"] or "", reverse=True)
    return out


def parse_csv(blob: bytes) -> list[dict[str, str]]:
    text = blob.decode("utf-8-sig", "replace")
    return [{squash(k): squash(v) for k, v in row.items() if k} for row in csv.DictReader(io.StringIO(text))]


def to_float(s: str | None) -> float | None:
    if s is None or s == "" or s == "-":
        return None
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def main() -> int:
    latest = int(arg("latest", "0") or 0)
    w = JsonlWriter(SOURCE)
    observed = now_iso()
    res = resources()
    w.note_fetch(ES_DATASET, dataset="elective-surgery", licence="CC-BY-4.0", by_specialty_resources=len(res))
    if latest:
        res = res[:latest]
    n_files = 0
    skipped = []
    for r in res:
        if not r["file"].endswith(".csv"):
            skipped.append(r["url"])  # 2020-21 quarters are .xls (binary BIFF); not parsed with stdlib
            continue
        try:
            rows = parse_csv(fetch(r["url"]))
        except Exception as e:  # noqa: BLE001
            w.note_failure(r["url"], str(e))
            continue
        n_files += 1
        w.note_fetch(r["url"], title=r["title"], period=r["period"], rows=len(rows))
        for row in rows:
            w.write({
                "source": SOURCE, "source_url": r["url"], "observed_at": observed, "legal_basis": LEGAL_DATA_QLD,
                "tier": "found", "state": "QLD", "dataset": "data.qld.gov.au/elective-surgery", "licence": "CC-BY-4.0",
                "measure_family": "elective_surgery", "resource_title": r["title"], "period": r["period"],
                "report_month": row.get("Report_Month"), "data_last_update": row.get("data_last_update"),
                "facility_code": row.get("Facility_Code"), "facility_name": row.get("Facility_Name"),
                "specialty_code": row.get("Specialty_Code"), "specialty": row.get("Specialty_Desc"),
                "treated": to_float(row.get("Vol_Treated")), "treated_in_time_pct": to_float(row.get("Percent_Treated_InTime")),
                "treated_change_vs_prior_year_pct": to_float(row.get("Percent_Variation_Treated_Prior_Year")),
                "waiting": to_float(row.get("Vol_Waiting")), "long_waits": to_float(row.get("Vol_LongWaits")),
                "long_waits_ready_for_surgery": to_float(row.get("Vol_LongWaits_RFS")),
                "long_waits_not_ready_for_surgery": to_float(row.get("Vol_LongWaits_NRFS")),
                "waiting_in_time_pct": to_float(row.get("Percent_Waiting_InTime_Total")),
                "waiting_in_time_ready_for_surgery_pct": to_float(row.get("Percent_Waiting_InTime_RFS")),
            })
    w.close(files_parsed=n_files, xls_skipped=skipped, not_published=NOT_PUBLISHED, robots=robots_quotes(),
            user_agent="WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
