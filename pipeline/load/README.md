# pipeline/load

Loads the merged provider records (`data/providers/*.jsonl`, written by `pipeline/merge.py`) into the
Supabase schema (`supabase/migrations/0001` to `0003`). No database driver: the loader emits plain SQL
batches, and something that holds the service role (Supabase MCP `execute_sql`, `psql`, the SQL editor)
runs them in filename order.

## What lands where

| Target | Natural key | From the record |
|---|---|---|
| `sources` | `id` = raw `sources[].source` | `legal_basis` from the record; name/url/cadence from `pipeline/sources.yaml` when the id matches (`-` and `_` interchangeable), else the source_url host |
| `practitioners` | `source_key` = record `id`; `id` = uuid5(source_key) | name split into given/family (titles stripped), `profession = 'medical'`, `specialties = [specialty]`, `registration_status` null until the register extract confirms them |
| `locations` | `id` = uuid5(name, address, suburb, state, postcode) | `geo` from lat/lng when present; invalid postcode or state stored as null |
| `practitioner_roles` | `(practitioner_id, location_id)` | first location is `primary`; `booking` = `{via, phone?, url?}` |
| `observations` (tier `found`) | `(entity_type, entity_id, field, source_id, observed_at)` | practitioner: `clinical_tags`, `languages`, `telehealth`, `wait_time`, `capacity` (taking_new_patients); location: `phone`, `website` (once per location). `capacity`/`wait_time` expire after 90 d, `phone`/`website` after 365 d |
| `provider_clinical_focus` | `(practitioner_id, condition_id)` | tags matched to the seeded `conditions` synonyms, case-insensitive substring; synonyms under five characters (`add`, `eds`, `pem`, `gad`...) match on word boundaries only. `strength = 'secondary'`, tier `found` |

Every statement is an upsert (`on conflict ... do update`) or an `insert ... where not exists`, so re-running
a cohort only changes what the records changed. Ids are uuid5 of the natural key with a fixed namespace, so
they are the same on every machine and every run.

## Re-run

```bash
PY=/c/Users/stefa/AppData/Local/Programs/Python/Python313/python.exe
$PY -I pipeline/load/load_providers.py --state QLD        # data/load/qld_*.sql (one cohort first)
$PY -I pipeline/load/load_providers.py --skip-state QLD   # data/load/all_minus_qld_*.sql (the rest)
$PY -I pipeline/load/load_providers.py                    # data/load/all_*.sql (everything, idempotent)
```

Options: `--batch N` (rows per statement, default 500), `--out DIR` (default `data/load`), `--providers GLOB`.
Each run deletes that cohort's previous files and writes `<cohort>_manifest.json` with the counts.

Then execute the files in filename order. Files of the same table are independent and can run in parallel;
tables must finish in the order `sources, practitioners, locations, roles, observations, focus`.

```
mcp: execute_sql(project_id=zbwvctztpdiugvwjwzbl, query=<file contents>)     # one call per file
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f data/load/qld_001_sources.sql       # or psql, same order
```

Afterwards:

```sql
refresh materialized view coverage;
update sources s set record_count = (select count(distinct entity_id) from observations o where o.source_id = s.id);
```

`data/load/` is generated output and is not committed; regenerate it from the records.

## Checks that catch a bad load

```sql
select specialty, state, verification, on_register, resolved_to_location, with_phone from coverage order by 1,2;
select count(*) from practitioners where source_key is null and ahpra_number is null and not synthetic;  -- must be 0
select field, count(*) from observations group by 1 order by 2 desc;
```
