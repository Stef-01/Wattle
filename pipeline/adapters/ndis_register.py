"""NDIS Quality and Safeguards Commission provider register -> data/raw/ndis_register/<date>.jsonl

Three public CSVs:
  * full provider register  (download-csv, ~16 MB; one row per provider x registration group)
  * Part 3: SIL providers    (sil_providers.csv)
  * Part 3: platform providers (platform_providers.csv)

Each record carries `register` in {"full", "sil", "platform"} plus the CSV's own
columns in snake_case (organisation ABN, legal/business name, address, state,
postcode, registration groups and status where present).

The ndiscommission.gov.au WAF drops non-browser User-Agents, so the full
register is fetched with the browser UA (see _common.BROWSER_UA); the CDN CSVs
accept the declared UA.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import JsonlWriter, arg, envelope, fetch_bytes, iter_csv, log, now_iso, require_legal_basis  # noqa: E402

SOURCE = "ndis_register"
KIND = "open_data"
CADENCE = "nightly"
FILES = [
    ("full", "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider/download-csv", True),
    ("sil", "https://cdn.ndiscommission.gov.au/nqsc_website/sil_providers.csv", False),
    ("platform", "https://cdn.ndiscommission.gov.au/nqsc_website/platform_providers.csv", False),
]
LEGAL_BASIS = ("Public statutory list: NDIS Provider Register published by the NDIS Quality and Safeguards Commission under "
               "the NDIS Act 2013 s.73ZS for public inspection; CSV offered for download at "
               "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider (checked 2026-10-15).")


def run(limit: int | None, dry_run: bool) -> int:
    legal_basis = require_legal_basis(SOURCE, LEGAL_BASIS)
    if dry_run:
        for reg, url, _ in FILES:
            print(f"{SOURCE}: would fetch {reg:8s} {url}")
        return 0
    w = JsonlWriter(SOURCE)
    observed_at = now_iso()
    counts: dict[str, int] = {}
    for reg, url, browser_ua in FILES:
        try:
            raw = fetch_bytes(url, browser_ua=browser_ua, timeout=600)
            text = raw.decode("utf-8-sig", "replace")
            w.note_fetch(url, bytes=len(raw), ua="browser" if browser_ua else "declared")
            n = 0
            # The Part 3 CSVs start with a title line ("Provider Register Part 3: SIL") before the header.
            first = text.splitlines()[0] if text else ""
            skip = None if "," in first else text.splitlines()[1].split(",")[0] if text.count("\n") > 1 else None
            for row in iter_csv(text, skip_until_header=skip):
                if not any(row.values()):
                    continue
                w.write(envelope(SOURCE, url, legal_basis, observed_at, register=reg, **row))
                n += 1
                if limit and n >= limit:
                    break
            counts[reg] = n
            log(f"{SOURCE}/{reg}: {n} rows")
        except Exception as e:  # noqa: BLE001
            w.note_failure(url, f"{e.__class__.__name__}: {e}")
    meta = w.close(counts=counts)
    return 1 if meta["failures"] else 0


if __name__ == "__main__":
    lim = arg("limit")
    sys.exit(run(int(lim) if lim else None, arg("dry-run") == "true"))
