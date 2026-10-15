"""ABR bulk extract (data.gov.au, CC BY 3.0 AU) -> data/raw/abr_bulk/<date>.jsonl

The extract is two ~500 MB zips, each holding ten XML parts (~2 GB of XML).
Parsed fields: abn, abn_status, abn_status_from, entity_type_code, entity_type_text,
legal_name, trading_names[], state, postcode, gst_status, record_last_updated.

Usage:
  python -I pipeline/adapters/abr_bulk.py --dry-run          # print the plan, no network beyond HEAD
  python -I pipeline/adapters/abr_bulk.py --limit 5000       # stream the first zip and stop after 5000 ABNs (a few MB)
  python -I pipeline/adapters/abr_bulk.py                    # full run: downloads both zips to data/raw/_cache/

--limit streams the HTTP body and inflates the first zip entry on the fly, so a
5000-record sample costs about 1 MB of transfer, not 500 MB.
"""
from __future__ import annotations

import struct
import sys
import zipfile
import zlib
from pathlib import Path
from typing import Iterator
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import (RAW_DIR, JsonlWriter, arg, download_to, envelope, log, now_iso, open_url,  # noqa: E402
                     require_legal_basis)

SOURCE = "abr_bulk"
KIND = "open_data"
CADENCE = "weekly (publisher updates weekly; RESEARCH-PLAN A5 says load nightly)"
DATASET_URL = "https://data.gov.au/data/dataset/abn-bulk-extract"
ZIP_URLS = [
    "https://data.gov.au/data/dataset/5bd7fcab-e315-42cb-8daf-50b7efc2027e/resource/0ae4d427-6fa8-4d40-8e76-c6909b5a071b/download/public_split_1_10.zip",
    "https://data.gov.au/data/dataset/5bd7fcab-e315-42cb-8daf-50b7efc2027e/resource/635fcb95-7864-4509-9fa7-a62a6e32b62d/download/public_split_11_20.zip",
]
LEGAL_BASIS = ("Creative Commons Attribution 3.0 Australia (CC BY 3.0 AU), ABN Bulk Extract, Australian Business Register "
               "via data.gov.au (https://data.gov.au/data/dataset/abn-bulk-extract), checked 2026-10-15. "
               "Attribution: 'Australian Business Register, ABN Bulk Extract'.")


def _text(el: ET.Element | None) -> str:
    return (el.text or "").strip() if el is not None else ""


def parse_record(xml: str) -> dict | None:
    try:
        abr = ET.fromstring(xml)
    except ET.ParseError:
        return None
    abn_el = abr.find("ABN")
    if abn_el is None:
        return None
    entity = abr.find("MainEntity")
    if entity is None:
        entity = abr.find("LegalEntity")
    legal_name = ""
    if entity is not None:
        nin = entity.find("NonIndividualName")
        if nin is not None:
            legal_name = _text(nin.find("NonIndividualNameText"))
        else:
            ind = entity.find("IndividualName")
            if ind is not None:
                parts = [_text(ind.find("NameTitle"))] + [_text(g) for g in ind.findall("GivenName")] + [_text(ind.find("FamilyName"))]
                legal_name = " ".join(p for p in parts if p)
    addr = entity.find("BusinessAddress/AddressDetails") if entity is not None else None
    trading = []
    for other in abr.findall("OtherEntity"):
        nin = other.find("NonIndividualName")
        if nin is not None and _text(nin.find("NonIndividualNameText")):
            trading.append({"type": nin.get("type", ""), "name": _text(nin.find("NonIndividualNameText"))})
    gst = abr.find("GST")
    et = abr.find("EntityType")
    return {
        "abn": _text(abn_el),
        "abn_status": abn_el.get("status", ""),
        "abn_status_from": abn_el.get("ABNStatusFromDate", ""),
        "entity_type_code": _text(et.find("EntityTypeInd")) if et is not None else "",
        "entity_type_text": _text(et.find("EntityTypeText")) if et is not None else "",
        "legal_name": legal_name,
        "trading_names": trading,
        "state": _text(addr.find("State")) if addr is not None else "",
        "postcode": _text(addr.find("Postcode")) if addr is not None else "",
        "gst_status": gst.get("status", "") if gst is not None else "",
        "record_last_updated": abr.get("recordLastUpdatedDate", ""),
    }


def iter_records_from_text(chunks: Iterator[str]) -> Iterator[dict]:
    """Pull complete <ABR ...>...</ABR> elements out of a stream of text chunks."""
    buf = ""
    for chunk in chunks:
        buf += chunk
        while True:
            start = buf.find("<ABR ")
            if start < 0:
                buf = buf[-16:]
                break
            end = buf.find("</ABR>", start)
            if end < 0:
                buf = buf[start:]
                break
            rec = parse_record(buf[start:end + 6])
            buf = buf[end + 6:]
            if rec:
                yield rec


def stream_first_entry(url: str, max_download: int = 64 << 20) -> Iterator[str]:
    """Inflate the first file of a remote zip while downloading it. Stops at max_download bytes."""
    # data.gov.au/robots.txt is "Disallow: /" (crawler control on a download portal). This is a
    # licensed CC BY resource download, not a crawl, so robots.txt is not the governing instrument.
    with open_url(url, timeout=300, check_robots=False) as r:
        head = r.read(30)
        if len(head) < 30 or head[:4] != b"PK\x03\x04":
            raise RuntimeError("not a zip local file header")
        (_sig, _ver, flags, method, _t, _d, _crc, _csz, _usz, nlen, xlen) = struct.unpack("<IHHHHHIIIHH", head)
        name = r.read(nlen).decode("utf-8", "replace")
        r.read(xlen)
        log(f"streaming zip entry {name!r} (method={method}, flags={flags})")
        if method != 8:
            raise RuntimeError(f"unsupported zip method {method}")
        d = zlib.decompressobj(-15)
        pending = b""
        got = 0
        while got < max_download:
            b = r.read(1 << 16)
            if not b:
                break
            got += len(b)
            out = pending + d.decompress(b)
            # keep an incomplete trailing UTF-8 sequence for the next round
            cut = len(out)
            while cut > max(0, len(out) - 4) and (out[cut - 1] & 0xC0) == 0x80:
                cut -= 1
            if cut and (out[cut - 1] & 0xC0) == 0xC0:
                cut -= 1
            pending = out[cut:]
            yield out[:cut].decode("utf-8", "replace")
            if d.eof:
                break


def iter_zip_file(path: Path) -> Iterator[str]:
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if not info.filename.lower().endswith(".xml"):
                continue
            log(f"parsing {path.name}:{info.filename} ({info.file_size / 1e6:.0f} MB)")
            with z.open(info) as f:
                for raw in iter(lambda: f.read(1 << 20), b""):
                    yield raw.decode("utf-8", "replace")


def head_size(url: str) -> int | None:
    try:
        with open_url(url, method="HEAD", timeout=30, check_robots=False) as r:
            return int(r.headers.get("Content-Length") or 0) or None
    except Exception:  # noqa: BLE001
        return None


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        print(f"{SOURCE} plan (dry run):")
        print(f"  dataset   : {DATASET_URL}")
        print(f"  licence   : {legal_basis}")
        for u in ZIP_URLS:
            sz = head_size(u)
            print(f"  download  : {u}  ({sz / 1e6:.0f} MB)" if sz else f"  download  : {u}")
        print(f"  cache     : {RAW_DIR / '_cache' / SOURCE}  (zips are not committed)")
        print(f"  parse     : 20 XML parts, one <ABR> element per ABN; fields abn, abn_status, abn_status_from, entity_type_*, legal_name, trading_names, state, postcode, gst_status, record_last_updated")
        print(f"  output    : data/raw/{SOURCE}/<date>.jsonl (+ .run.json)")
        print(f"  --limit N : streams the first zip entry and stops after N ABNs (about 1 MB per 5000)")
        return 0

    w = JsonlWriter(SOURCE, suffix=f".sample{limit}" if limit else "")
    observed_at = now_iso()
    n = 0
    try:
        if limit:
            url = ZIP_URLS[0]
            w.note_fetch(url, mode="stream-first-entry", limit=limit, robots="not applied: licensed CC BY download; data.gov.au robots.txt is Disallow: / for crawlers")
            for rec in iter_records_from_text(stream_first_entry(url)):
                w.write(envelope(SOURCE, url, legal_basis, observed_at, **rec))
                n += 1
                if n >= limit:
                    break
        else:
            cache = RAW_DIR / "_cache" / SOURCE
            for url in ZIP_URLS:
                dest = cache / url.rsplit("/", 1)[-1]
                if not dest.exists():
                    log(f"downloading {url} -> {dest}")
                    info = download_to(url, dest, timeout=3600, check_robots=False)
                    w.note_fetch(url, **info)
                else:
                    w.note_fetch(url, cached=str(dest))
                for rec in iter_records_from_text(iter_zip_file(dest)):
                    w.write(envelope(SOURCE, url, legal_basis, observed_at, **rec))
                    n += 1
                    if n % 500000 == 0:
                        log(f"  {n} ABNs")
    except Exception as e:  # noqa: BLE001
        w.note_failure(ZIP_URLS[0], f"{e.__class__.__name__}: {e}")
    meta = w.close()
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
