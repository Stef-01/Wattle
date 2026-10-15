"""GEN Aged Care Service List (AIHW, CC BY) -> data/raw/aged_care_service_list/<date>.jsonl

Downloads the national XLSX (one row per aged care service: residential, home
care, CHSP, flexible) and parses it with stdlib zipfile + xml. Every sheet with a
header row is emitted; records carry `sheet` plus the sheet's columns in
snake_case (service name, provider, address, suburb, state, postcode, care type,
places, ABS/MMM region where published).

The page lists one XLSX per state and a national one; we take the national file.
Update LIST_PAGE / XLSX_URL when AIHW publishes a new year (currently 30 June 2025, released 7 Oct 2025).
"""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path
from typing import Iterator
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import RAW_DIR, JsonlWriter, arg, download_to, envelope, log, now_iso, require_legal_basis, snake  # noqa: E402

SOURCE = "aged_care_service_list"
KIND = "open_data"
CADENCE = "annual (AIHW publishes each October for 30 June)"
LIST_PAGE = "https://www.gen-agedcaredata.gov.au/resources/access-data/2025/october/aged-care-service-list-30-june-2025"
XLSX_URL = "https://www.gen-agedcaredata.gov.au/getmedia/2599a590-3c5f-4227-aac3-f0a3a8aa84e4/Service-List-2025-Australia_300126"
LEGAL_BASIS = ("Creative Commons Attribution 4.0 International (CC BY 4.0): AIHW GEN Aged Care Data, 'Aged care service list: "
               "30 June 2025' (https://www.gen-agedcaredata.gov.au/resources/access-data/2025/october/aged-care-service-list-30-june-2025), "
               "licence statement at https://www.gen-agedcaredata.gov.au/copyright, checked 2026-10-15. "
               "Attribution: 'Australian Institute of Health and Welfare, GEN Aged Care Data'.")

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


def _col_index(ref: str) -> int:
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):  # type: ignore[union-attr]
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_xlsx(path: Path) -> Iterator[tuple[str, list[list[str]]]]:
    """Yield (sheet_name, rows) for each worksheet; cells as strings, shared strings resolved."""
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
                shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
        rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels")).findall("rel:Relationship", NS)}
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        for sh in wb.findall("m:sheets/m:sheet", NS):
            target = rels.get(sh.get(f"{{{NS['r']}}}id"), "")
            target = target.lstrip("/")
            member = target if target.startswith("xl/") else "xl/" + target
            rows: list[list[str]] = []
            for row in ET.fromstring(z.read(member)).iter(f"{{{NS['m']}}}row"):
                cells: list[str] = []
                for c in row.findall("m:c", NS):
                    idx = _col_index(c.get("r", "A1"))
                    t = c.get("t")
                    v = c.find("m:v", NS)
                    if t == "s" and v is not None:
                        val = shared[int(v.text)] if v.text and v.text.isdigit() and int(v.text) < len(shared) else ""
                    elif t == "inlineStr":
                        val = "".join(x.text or "" for x in c.iter(f"{{{NS['m']}}}t"))
                    else:
                        val = (v.text or "") if v is not None else ""
                    while len(cells) < idx:
                        cells.append("")
                    cells.append(val.strip())
                rows.append(cells)
            yield sh.get("name", member), rows


def sheet_records(rows: list[list[str]]) -> Iterator[dict[str, str]]:
    """First row with >= 4 non-empty text cells is the header; rows after it are records."""
    header: list[str] | None = None
    for cells in rows:
        filled = [c for c in cells if c]
        if header is None:
            if len(filled) >= 4 and sum(1 for c in filled if not re.fullmatch(r"[\d.]+", c)) >= 4:
                header = [snake(c) if c else f"col_{i}" for i, c in enumerate(cells)]
            continue
        if not filled:
            continue
        rec = {}
        for i, c in enumerate(cells):
            if c and i < len(header):
                rec[header[i]] = c
        if rec:
            yield rec


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE}: would download {XLSX_URL} (about 1 MB) from {LIST_PAGE} and parse every sheet")
        return 0
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    dest = RAW_DIR / "_cache" / SOURCE / f"{w.date}-Service-List-Australia.xlsx"
    try:
        info = download_to(XLSX_URL, dest, timeout=300)
        w.note_fetch(XLSX_URL, list_page=LIST_PAGE, **info)
        n = 0
        per_sheet: dict[str, int] = {}
        for sheet, rows in read_xlsx(dest):
            k = 0
            for rec in sheet_records(rows):
                w.write(envelope(SOURCE, XLSX_URL, legal_basis, observed_at, sheet=sheet, **rec))
                n += 1
                k += 1
                if limit and n >= limit:
                    break
            per_sheet[sheet] = k
            log(f"{SOURCE}/{sheet}: {k} rows")
            if limit and n >= limit:
                break
        meta = w.close(sheets=per_sheet)
    except Exception as e:  # noqa: BLE001
        w.note_failure(XLSX_URL, f"{e.__class__.__name__}: {e}")
        meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
