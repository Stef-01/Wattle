"""Medicare Approved Collection Centres (pathology) -> data/raw/medicare_acc/<date>.jsonl + <date>.APCCReport.pdf

Services Australia publishes the ACC register as a PDF behind a JSF form on
www2.medicareaustralia.gov.au ("download the full list of Approved Collection
Centres [PDF]"). This adapter replays that form: GET the page for the
javax.faces.ViewState, POST the download link's client id, save the PDF.

Today it records only the file (sha256, bytes, page count); row parsing of the
PDF is a later step (pdf text extraction needs more than stdlib to be reliable).
"""
from __future__ import annotations

import http.cookiejar
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, arg, envelope, fetch_text, log, now_iso, open_url, rel, require_legal_basis, sha256_file  # noqa: E402

SOURCE = "medicare_acc"
KIND = "open_data"
CADENCE = "every 10 days (RESEARCH-PLAN section 4 row 7)"
PAGE_URL = "https://www2.medicareaustralia.gov.au/pdsPortal/pub/approvedCollectionCentreSearch.faces"
INFO_URL = "https://www.servicesaustralia.gov.au/approved-collection-centres?context=20"
LEGAL_BASIS = ("Public statutory list: Approved Collection Centre register published by Services Australia under the "
               "Health Insurance Act 1973 (approved pathology collection centres), downloadable at "
               f"{PAGE_URL} (linked from {INFO_URL}), checked 2026-10-15.")


def pdf_page_count(data: bytes) -> int | None:
    pages = len(re.findall(rb"/Type\s*/Page(?![s/\w])", data))
    if pages:
        return pages
    m = re.search(rb"/Type\s*/Pages[^>]*?/Count\s+(\d+)", data, re.S)
    return int(m.group(1)) if m else None


def run(limit: int | None, dry_run: bool) -> int:  # noqa: ARG001
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE}: would GET {PAGE_URL}, POST the 'download the full list' JSF action, save the PDF and record its hash and page count")
        return 0
    # The JSF portal keys the ViewState to a session cookie.
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())))
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    try:
        page = fetch_text(PAGE_URL, timeout=60)
        vs = re.search(r'name="javax\.faces\.ViewState"[^>]*value="([^"]+)"', page)
        link = re.search(r"submitForm\('([^']+)','([^']+)'\);\">download the full list", page)
        if not vs or not link:
            raise RuntimeError("could not find ViewState or the download link on the ACC page (layout changed?)")
        form_id, link_id = link.group(1), link.group(2)
        body = urllib.parse.urlencode({f"{form_id}_SUBMIT": "1", "javax.faces.ViewState": vs.group(1), f"{form_id}:_idcl": link_id}).encode()
        with open_url(PAGE_URL, method="POST", data=body, timeout=180,
                      headers={"Content-Type": "application/x-www-form-urlencoded", "Referer": PAGE_URL}) as r:
            ctype = r.headers.get("Content-Type", "")
            disp = r.headers.get("Content-Disposition", "")
            data = r.read()
        if "pdf" not in ctype.lower() or not data.startswith(b"%PDF"):
            raise RuntimeError(f"expected a PDF, got {ctype!r} ({len(data)} bytes)")
        pdf_path = w.dir / f"{w.date}.APCCReport.pdf"
        pdf_path.write_bytes(data)
        digest = sha256_file(pdf_path)
        pages = pdf_page_count(data)
        w.note_fetch(PAGE_URL, bytes=len(data), sha256=digest, content_disposition=disp, pages=pages)
        w.write(envelope(SOURCE, PAGE_URL, legal_basis, observed_at, kind="file", file=rel(pdf_path), bytes=len(data),
                         sha256=digest, pages=pages, content_type=ctype, content_disposition=disp,
                         note="PDF stored; row extraction pending"))
        log(f"{SOURCE}: PDF {len(data)} bytes, {pages} pages, sha256 {digest[:12]}")
    except Exception as e:  # noqa: BLE001
        w.note_failure(PAGE_URL, f"{e.__class__.__name__}: {e}")
    meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
