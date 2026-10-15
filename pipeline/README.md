# Wattle Health pipeline

Source adapters that turn public and licensed lists into timestamped,
source-tagged raw records. The product never creates a practitioner from a web
page alone (DATA-MODEL.md): registers are the spine, everything else attaches
observations to an identity that already has a key.

## Layout

```
pipeline/
  sources.yaml                 every source from RESEARCH-PLAN.md sections 2 to 5: kind, legal_basis, cadence, url, status
  adapters/
    _base.py                   shared plumbing for the open-data / service-list adapters (fetch, robots, rate limit, jsonl)
    _common.py                 shared plumbing for the college / hospital-group directory adapters
    _template.py               copy this to start a new adapter
    abr_bulk.py                ABN Bulk Extract (CC BY 3.0 AU)                      live
    ndis_register.py           NDIS Commission provider register, SIL, platforms     live
    aged_care_service_list.py  AIHW GEN Aged Care Service List XLSX                  live
    medicare_acc.py            Medicare Approved Collection Centres PDF              live (file + hash + page count; rows later)
    headspace_centres.py       headspace centre list                                 live
    medicare_mental_health_centres.py  Medicare Mental Health Centre list            live
    ranzcp_find.py / ranzcog_find.py / acd_find.py   college directories            see their headers
data/raw/<source>/<YYYY-MM-DD>.jsonl   one record per line, every record carries
                                        {source, source_url, observed_at, legal_basis}
data/raw/<source>/<YYYY-MM-DD>.run.json counts, fetched URLs, hashes, failures
data/raw/_cache/                        downloaded archives (gitignored)
```

## Running

Python 3.13 standard library only. No pandas, no requests. Run with `-I` so a
planted module in the data directory can never be imported.

```
PY=/c/Users/stefa/AppData/Local/Programs/Python/Python313/python.exe   # the Task Scheduler Python, not the shell venv
$PY -I pipeline/adapters/abr_bulk.py --dry-run         # print the plan (two ~500 MB zips, output path, licence)
$PY -I pipeline/adapters/abr_bulk.py --limit 5000      # stream ~1 MB of the first zip, stop after 5000 ABNs
$PY -I pipeline/adapters/abr_bulk.py                   # full run, zips cached under data/raw/_cache/
$PY -I pipeline/adapters/ndis_register.py
$PY -I pipeline/adapters/aged_care_service_list.py
$PY -I pipeline/adapters/medicare_acc.py
$PY -I pipeline/adapters/headspace_centres.py
$PY -I pipeline/adapters/medicare_mental_health_centres.py
```

Every adapter accepts `--dry-run` and `--limit N`. Exit code 1 means at least
one fetch failed; the failure and its URL are in the `.run.json`.

## Rules every adapter follows

1. **Legal basis first.** `LEGAL_BASIS` is a string citing the licence,
   agreement, statutory list or public-facts case (RESEARCH-PLAN.md section 7).
   `None` makes `require_legal_basis` raise before any network call.
   `_template.py` ships with `None` and refuses to run, on purpose.
2. **Facts only.** Names, addresses, phones, hours, fees, capacity statements,
   interests. No bios, no photos, no accounts, no Ahpra register scraping, no
   Google Places content.
3. **Polite fetching.** `robots.txt` is fetched once per host and checked for
   every URL; one request per second per host; a declared User-Agent
   (`WattleHealthPipeline/0.1 (+repo)`).
   - *Licensed downloads vs robots.* `data.gov.au/robots.txt` is a blanket
     `Disallow: /`, which is crawler control on a portal whose purpose is bulk
     download under CC BY. For a licensed resource URL the licence is the
     governing instrument, so `abr_bulk.py` passes `check_robots=False` on the
     zip fetch and records that in the run log. Scrape adapters never do this.
   - *WAF hosts.* `ndiscommission.gov.au` and `medicarementalhealth.gov.au`
     drop any non-browser User-Agent (timeouts, no response). Those two
     adapters pass `browser_ua=True`; the run log records `"ua": "browser"`.
     Rate limit and robots still apply.
4. **Envelope.** `envelope(source, source_url, legal_basis, observed_at, **fields)`;
   the writer refuses a record missing any of the four.
5. **Run log.** `JsonlWriter.close()` writes counts, per-URL fetch info
   (bytes, sha256), failures, and the output file's sha256.

## Source notes

| Source | What we get | Notes |
|---|---|---|
| ABR bulk | abn, status, entity type, legal name, trading names, state, postcode, GST | 20 XML parts in two zips (~1 GB download, ~2 GB XML). `--limit` inflates the first entry while streaming the HTTP body, so sampling is cheap. |
| NDIS register | full register (one row per provider, registration groups, head office suburb/state/postcode, status), Part 3 SIL and platform applicants | Full CSV ~16 MB; 64,734 rows on 2026-10-15. |
| GEN aged care service list | 5,378 services with provider, care type, places, address, SA2/SA3/LGA/PHN/MMM, lat/lng, funding | Annual; the URL carries the year, update it each October. |
| Medicare ACC | the APCCReport.pdf (10 pages, ~950 KB), sha256, page count | Behind a JSF form; row extraction is the next step (the PDF is a table). |
| headspace | 177 centres: name, address, suburb, state, postcode, centre URL | One request. Outreach services without a postcode keep an empty postcode. |
| Medicare Mental Health Centres | 55 centres: name, state, address lines, suburb, postcode, hours, operator URL | Embedded JSON on the list page. 91 are planned; the page lists the open ones. |

## Adding an adapter

1. Copy `_template.py`, set `SOURCE`, `KIND`, `CADENCE`, `URL`, `LEGAL_BASIS`.
2. Add the source to `pipeline/sources.yaml` (same `id`) and, when it goes to
   Supabase, a row in `sources` (`supabase/migrations/0001_schema.sql`; the
   `legal_basis` column is `NOT NULL`).
3. Write the parser; emit one record per entity with the envelope.
4. Run `--dry-run`, then `--limit 50`, then the real thing. Commit the adapter,
   `sources.yaml`, and the `data/raw/<source>/` output together.

Raw pulls over ~50 MB (the NDIS register is 88 MB today) should move to
Supabase storage once the project exists; the repo is for the code, the run
logs and samples.
