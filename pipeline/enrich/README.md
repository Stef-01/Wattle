# Research enrichment

Links merged doctor records (`data/providers/*.jsonl`) to OpenAlex author profiles and their most-cited works, then derives inferred research topics. Stdlib only, Python 3.13, one request per second, every response cached under `data/raw/_cache/{openalex,crossref}/` (gitignored) so reruns cost nothing.

```
python pipeline/enrich/publications.py --state QLD --limit 150   # sample
python pipeline/enrich/publications.py --state QLD               # cohort
python pipeline/enrich/topics.py                                  # -> data/enriched/research_topics.json
python pipeline/enrich/test_enrich.py                             # unit tests, no network
```

## Outputs

- `data/enriched/publications/<date>.jsonl`, one line per doctor in the cohort: `provider_id, name, specialty, state, openalex_author_id, authorship_verified, match_note, discovery, candidates[], works[], source, observed_at, legal_basis`.
- `data/enriched/research_topics.json`: `inferred_research_topics` per identifier-matched doctor (top 5 OpenAlex topic labels by frequency across their works). Inferred research topics only; never a clinical-interest claim.

## How a match is decided

1. Discover candidates with `/autocomplete/authors` (0 credits), hydrate each with `GET /authors/{id}` (0 credits).
2. Score each candidate: name 0-3 (surname must match or the candidate scores 0), +2 Australian institution, +1 home-state institution, +1 per overlapping topic (max 3), reject 0 works, -2 above 1,500 works. Profiles sharing an ORCID count as one identity.
3. `authorship_verified = "identifier-matched"` only when exactly one identity scores >= 6, has an Australian institution and shares at least one topic with the specialty. Otherwise `"unverified"`: top candidates are kept for human review and no works are attached.
4. For matched authors, the 10 most-cited works (`/works?filter=author.id:` , 1 credit) and a Crossref title check on the first 3 DOIs.

## OpenAlex budget

Keyless callers share $0.10/day per IP (1,000 credits); `mailto=` does not raise it. `/authors?search=` costs 10 credits, which is why discovery uses autocomplete by default; `--search-fallback` turns the paid search on for doctors autocomplete misses. Set `OPENALEX_API_KEY` for a free activated key ($1/day). When the budget runs out the run stops cleanly and the cache keeps everything fetched so far.
