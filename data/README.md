# Provider data

Two layers. `raw/` is what each source said, untouched except for shape. `providers/` is one record per doctor per specialty, with every contributing source listed on the record. `coverage.json` is the honesty report: how much of the Ahpra register each specialty file reaches.

## Layout

```
data/
  raw/<source>/<YYYY-MM-DD>.jsonl   one line per source record; every line carries
                                    source, source_url, observed_at, legal_basis, tier
  providers/<specialty>.jsonl       merged; see pipeline/merge.py for the shape
  coverage.json                     per specialty: doctors, share of register, field fill, by state
```

Rebuild: `PYTHONUTF8=1 python -I pipeline/merge.py` (stdlib only, Python 3.13).

## Rules

- Nothing enters `raw/` without a `legal_basis` string on every record, and nothing is written for a source whose robots.txt or terms forbid it (ACD's robots blocks everyone but Google and Bing; healthdirect's terms forbid commercial reuse; both are recorded in `research/raw/` and not collected).
- Facts only. No bios, summaries, photos or emails, even when the source exposes them.
- `tier` is `found` for everything collected from a public page. `register` arrives only with Ahpra data under agreement; `declared` only through the claim flow.
- Same name is not the same person. Records merge only on a shared source id, or across sources when they agree on a state.
- The register denominator in `coverage.json` is Ahpra specialist registrations at 30 June 2026 (`research/raw/02-medical-disciplines.md`). For O&G it counts Fellows only; GP obstetricians (RANZCOG Associates) are kept but not counted against the specialist register.

## Sources collected so far (2026-10-15)

| Source | Specialty | Records | What it carries | Basis |
|---|---|---|---|---|
| `ranzcp-find` RANZCP Find a Psychiatrist | psychiatry | 1,299 (24% of register) | wait time to first appointment, "not taking new patients", telehealth, in-person, expertise tags, services, age groups, languages, geocoded addresses with phone and website, faculty accreditations, source last-updated date | opt-in public directory; terms assert copyright, no automated-access clause; robots allows all |
| `ranzcog_find` RANZCOG Find a Women's Health Doctor | obstetrics-gynaecology | 2,277 AU (1,468 Fellows = 59% of register; 809 GP obstetricians) | scope tags (generalist obstetrics / gynaecology, five subspecialties, GP obstetrician), workplaces with address, languages | opt-in public directory; robots allows the page; terms say personal use and no on-selling, so a college feed is needed before public display |

Not collected: healthdirect public site (terms), ACD Find a Derm (robots), HealthShare (commercial, no reuse right), Ahpra register (terms; extract or PCA only).
