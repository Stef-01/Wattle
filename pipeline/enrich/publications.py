"""Research enrichment: link merged doctor records to OpenAlex authors and their works.

Reads  data/providers/*.jsonl (one record per doctor per specialty, see pipeline/merge.py).
Writes data/enriched/publications/<YYYY-MM-DD>.jsonl, one line per doctor in the cohort.

Pipeline per doctor
  1. discover   candidate OpenAlex author profiles for the doctor's name
  2. hydrate    each candidate (institutions with country, topics, ORCID)
  3. score      surname + given name, Australian institution, home-state institution,
                topic overlap with the doctor's specialty and directory tags, works_count sanity
  4. verify     authorship_verified = "identifier-matched" only when exactly ONE identity scores
                >= THRESHOLD, its last-known institution is Australian, its given name matches in
                full (or the institution is in the doctor's state) and it shares >= 1 topic with
                the specialty, and at least half of its most-cited works are on the specialty;
                otherwise "unverified" (top candidates kept for human review, no works attached)
  5. works      for identifier-matched authors, the 10 most-cited works
  6. crossref   the first 3 DOIs are looked up on Crossref and the titles compared

OpenAlex budget (checked 2026-10-15, https://help.openalex.org/access/example-costs/):
  keyless callers share $0.10/day per IP = 1,000 credits; `mailto=` does NOT raise it.
    /authors?search=           10 credits   (the endpoint named in the brief: ~100 doctors/day)
    /autocomplete/authors        0 credits
    /authors/<id>                0 credits
    /works?filter=               1 credit
  So discovery defaults to autocomplete + free single-entity hydration, which costs nothing,
  and the paid search is an opt-in fallback (--search-fallback) for doctors autocomplete
  misses. An activated free key (OPENALEX_API_KEY env var) gives $1/day.

Rate: one request per second across all hosts. Every response is cached under
data/raw/_cache/{openalex,crossref}/<sha256(url)>.json so reruns are free.

Stdlib only, Python 3.13. Run:
  python pipeline/enrich/publications.py --state QLD --limit 150 [--dry-run] [--search-fallback]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PROVIDERS_DIR = REPO / "data" / "providers"
OUT_DIR = REPO / "data" / "enriched" / "publications"
CACHE_DIR = REPO / "data" / "raw" / "_cache"

MAILTO = "data@wattletech.au"
USER_AGENT = f"WattleHealth/0.1 (+https://github.com/Stef-01/Wattle-Health; mailto:{MAILTO})"
OPENALEX = "https://api.openalex.org"
CROSSREF = "https://api.crossref.org/works/"
RATE_SECONDS = 1.0
SOURCE = "openalex"
LEGAL_BASIS = "OpenAlex CC0; Crossref public API; PubMed public"

THRESHOLD = 6          # see score(): full name (3) + AU institution (2) + one topic (1)
MAX_CANDIDATES = 8     # candidates hydrated per doctor (free requests, but 1 s each)
MAX_WORKS = 10
CROSSREF_CHECKS = 3
AUTHOR_FIELDS = "id,display_name,display_name_alternatives,works_count,cited_by_count,last_known_institutions,affiliations,topics,ids"
WORK_FIELDS = "id,doi,title,display_name,publication_year,primary_location,ids,topics,concepts,open_access,cited_by_count"

TITLE_RE = re.compile(
    r"^(?:(?:dr|prof|professor|a/prof|assoc(?:iate)?\.?\s*prof(?:essor)?|adj(?:unct)?\.?\s*prof(?:essor)?|"
    r"emeritus\s+prof(?:essor)?|mr|mrs|ms|miss|mx)\.?\s+)+",
    re.I,
)
POST_NOMINAL_RE = re.compile(r"\b(AM|OAM|AO|AC|FRANZCP|FRANZCOG|FRACP|PhD|MBBS|MD)\b.*$")

# Specialty vocabulary matched (case-insensitive substring) against OpenAlex topic, subfield
# and field display names on the author and the works. Topic overlap >= 1 is required for a
# verified match; it is evidence of the *research* field, never of clinical interest.
SPECIALTY_TERMS: dict[str, tuple[str, ...]] = {
    "psychiatry": (
        "psychiatr", "mental health", "mental disorder", "depress", "schizophren", "psychosis", "psychotic",
        "bipolar", "anxiety", "suicid", "self-harm", "addiction", "substance", "alcohol", "opioid", "dementia",
        "autism", "adhd", "attention deficit", "eating disorder", "anorexia", "neurodevelop", "ptsd",
        "trauma", "mood", "personality disorder", "psychotherap", "antipsychotic", "antidepress",
        "cognitive behav", "forensic", "neuropsych", "psycholog", "obsessive", "insomnia", "sleep",
    ),
    "obstetrics-gynaecology": (
        "obstet", "gynaec", "gynec", "pregnan", "preterm", "fetal", "foetal", "maternal", "fertil", "infertil",
        "reproduct", "endometri", "cervical", "cervix", "ovarian", "ovary", "uterin", "uterus", "pelvic",
        "urogynec", "menopaus", "contracept", "birth", "neonat", "placent", "caesarean", "cesarean",
        "polycystic", "ivf", "perinatal", "prenatal", "antenatal", "postpartum", "labour", "labor and delivery",
        "hysterectomy", "fibroid", "vulv", "hpv", "incontinence", "prolapse", "gestation", "oocyte",
        "embryo", "assisted reproduct", "miscarriage", "stillbirth",
    ),
    "paediatrics": (
        "pediatr", "paediatr", "child", "neonat", "infant", "adolescen", "congenital", "preterm", "newborn",
        "youth", "perinatal", "developmental", "metabolic", "inborn error", "cystic fibrosis", "immuniz",
        "vaccin", "growth", "autism", "cerebral palsy", "birth",
    ),
}

STATE_INSTITUTION_HINTS: dict[str, tuple[str, ...]] = {
    "QLD": ("queensland", "brisbane", "gold coast", "sunshine coast", "townsville", "james cook", "griffith",
            "bond university", "mater", "cairns", "toowoomba", "ipswich", "logan", "redcliffe", "rockhampton",
            "mackay", "qimr", "berghofer", "southern cross"),
    "NSW": ("new south wales", "sydney", "newcastle", "wollongong", "macquarie", "westmead", "garvan", "hunter",
            "st vincent", "royal north shore", "prince of wales", "liverpool", "nepean", "wagga", "charles sturt"),
    "VIC": ("victoria", "melbourne", "monash", "deakin", "la trobe", "rmit", "alfred", "austin", "royal children",
            "murdoch children", "geelong", "barwon", "ballarat", "bendigo", "walter and eliza", "florey", "burnet"),
    "SA": ("south australia", "adelaide", "flinders", "sahmri", "women's and children's hospital"),
    "WA": ("western australia", "perth", "curtin", "murdoch university", "edith cowan", "telethon", "fiona stanley",
           "king edward memorial"),
    "TAS": ("tasmania", "hobart", "launceston", "menzies"),
    "ACT": ("canberra", "australian national university"),
    "NT": ("northern territory", "darwin", "charles darwin", "menzies", "alice springs"),
}


# ----------------------------------------------------------------------------- http + cache
class Http:
    """One request per second, every response cached by URL hash; honours OpenAlex budget."""

    def __init__(self, dry_run: bool = False, api_key: str | None = None):
        self.dry_run = dry_run
        self.api_key = api_key
        self.last = 0.0
        self.requests = 0
        self.cache_hits = 0
        self.credits_used = 0
        self.budget_exhausted = False
        self.remaining: int | None = None

    def _cache_path(self, bucket: str, url: str) -> Path:
        return CACHE_DIR / bucket / (hashlib.sha256(url.encode()).hexdigest()[:32] + ".json")

    def get_json(self, url: str, bucket: str) -> dict | list | None:
        key_url = url
        p = self._cache_path(bucket, key_url)
        if p.exists():
            self.cache_hits += 1
            return json.loads(p.read_text(encoding="utf-8"))["body"]
        if self.dry_run or self.budget_exhausted:
            return None
        req_url = url
        if bucket == "openalex" and self.api_key:
            req_url += ("&" if "?" in req_url else "?") + "api_key=" + urllib.parse.quote(self.api_key)
        wait = RATE_SECONDS - (time.monotonic() - self.last)
        if wait > 0:
            time.sleep(wait)
        body: dict | list | None = None
        status = 0
        for attempt in range(4):
            self.last = time.monotonic()
            req = urllib.request.Request(req_url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    status = r.status
                    self.requests += 1
                    if bucket == "openalex":
                        self.credits_used += int(r.headers.get("X-RateLimit-Credits-Used") or 0)
                        rem = r.headers.get("X-RateLimit-Remaining")
                        self.remaining = int(rem) if rem and rem.isdigit() else self.remaining
                    body = json.loads(r.read().decode("utf-8"))
                break
            except urllib.error.HTTPError as e:
                status = e.code
                self.requests += 1
                if e.code == 404:
                    body = None
                    break
                if e.code == 429:
                    reset = e.headers.get("X-RateLimit-Reset")
                    rem = e.headers.get("X-RateLimit-Remaining")
                    if rem is not None and rem.isdigit() and int(rem) == 0:
                        print(f"OpenAlex daily budget exhausted (resets in {reset}s); stopping network calls",
                              file=sys.stderr)
                        self.budget_exhausted = True
                        return None
                    time.sleep(5 * (attempt + 1))
                    continue
                if e.code >= 500:
                    time.sleep(5 * (attempt + 1))
                    continue
                print(f"HTTP {e.code} {url}", file=sys.stderr)
                return None
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
                print(f"attempt {attempt + 1} failed: {e} {url}", file=sys.stderr)
                time.sleep(5 * (attempt + 1))
        else:
            return None
        if status in (200, 404):
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps({"url": key_url, "status": status, "fetched_at": now_iso(), "body": body},
                                    ensure_ascii=False), encoding="utf-8")
        return body


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def oa_url(path: str, **params: str) -> str:
    params["mailto"] = MAILTO
    return f"{OPENALEX}{path}?" + urllib.parse.urlencode(params, safe=":,/")


# ----------------------------------------------------------------------------- names
def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9' -]+", " ", s.lower()).strip()


def clean_name(name: str) -> str:
    """'Associate Professor. Alka Kothari AM' -> 'Alka Kothari'."""
    n = re.sub(r"\s+", " ", (name or "").replace(",", " ")).strip()
    n = TITLE_RE.sub("", n)
    n = TITLE_RE.sub("", n)  # second pass for 'Dr Prof X'
    n = POST_NOMINAL_RE.sub("", n).strip()
    return n


def name_parts(name: str) -> tuple[str, list[str], str]:
    """Return (first given name, all given names, surname). Hyphenated/space surnames keep the
    last token as the comparison key; 'van der X' style prefixes are glued to the surname."""
    toks = fold(clean_name(name)).split()
    if not toks:
        return "", [], ""
    if len(toks) == 1:
        return "", [], toks[0]
    surname = toks[-1]
    given = toks[:-1]
    while len(given) > 1 and given[-1] in {"van", "der", "de", "da", "di", "du", "la", "le", "von", "del", "mc", "mac", "st"}:
        surname = given.pop() + surname
    return given[0], given, surname


def candidate_name_match(doctor: str, candidate: str) -> tuple[int, str]:
    """Score 0..3 for how the candidate's display name agrees with the doctor's name."""
    d_first, d_given, d_sur = name_parts(doctor)
    c_toks = fold(candidate).replace("-", "").replace(".", " ").split()
    d_sur_cmp = d_sur.replace("-", "").replace("'", "")
    c_toks = [t.replace("'", "") for t in c_toks]
    if not c_toks or not d_sur_cmp:
        return 0, "no surname"
    # surname: last token, or the doctor's surname somewhere in the candidate (double-barrelled)
    if (c_toks[-1] != d_sur_cmp and d_sur_cmp not in c_toks
            and "".join(c_toks[-2:]) != d_sur_cmp and "".join(c_toks[-3:]) != d_sur_cmp):
        return 0, "surname differs"
    c_given = [t for t in c_toks if t != d_sur_cmp]
    if not c_given or not d_first:
        return 1, "surname only"
    c_first = c_given[0]
    if c_first == d_first:
        return 3, "full first name"
    if len(c_first) == 1 and c_first == d_first[0]:
        # initial agrees; a second initial that contradicts a known middle name lowers confidence
        if len(c_given) > 1 and len(d_given) > 1 and len(c_given[1]) == 1 and c_given[1] != d_given[1][0]:
            return 0, "second initial contradicts middle name"
        return 2, "first initial"
    if len(d_first) == 1 and c_first[0] == d_first:
        return 2, "doctor listed by initial"
    if c_first in d_given[1:] or d_first in c_given[1:]:
        return 2, "given name in different position"
    if c_first.startswith(d_first) or d_first.startswith(c_first):
        return 2, "given name prefix (diminutive)"
    return 0, f"given name differs ({c_first} vs {d_first})"


# ----------------------------------------------------------------------------- topics
def doctor_terms(rec: dict) -> list[str]:
    terms = list(SPECIALTY_TERMS.get(rec.get("specialty") or "", ()))
    for tag in rec.get("tags") or []:
        for tok in re.split(r"[^a-z]+", fold(tag)):
            if len(tok) >= 5 and tok not in {"faculty", "member", "accredited", "generalist", "medicine", "general",
                                            "health", "adult", "doctor", "practitioner", "fellow", "associate"}:
                terms.append(tok[:7])  # cheap stem: 'psychiatry' -> 'psychia'
    return sorted(set(terms))


def author_topic_names(author: dict) -> list[str]:
    names = []
    for t in author.get("topics") or []:
        names.append(t.get("display_name") or "")
        for k in ("subfield", "field"):
            if isinstance(t.get(k), dict):
                names.append(t[k].get("display_name") or "")
    return [n for n in names if n]


def topic_overlap(terms: list[str], topic_names: list[str]) -> list[str]:
    hits = []
    for name in topic_names:
        low = fold(name)
        if any(term in low for term in terms) and name not in hits:
            hits.append(name)
    return hits


# ----------------------------------------------------------------------------- scoring
def institutions(author: dict) -> list[tuple[str, str]]:
    out = []
    for inst in author.get("last_known_institutions") or []:
        out.append((inst.get("display_name") or "", (inst.get("country_code") or "").upper()))
    for aff in author.get("affiliations") or []:
        inst = aff.get("institution") or {}
        pair = (inst.get("display_name") or "", (inst.get("country_code") or "").upper())
        if pair not in out:
            out.append(pair)
    return out


def score(rec: dict, author: dict, state: str | None) -> dict:
    """Score one hydrated OpenAlex author against a doctor record.

      name      0..3   surname must match, else the candidate scores 0 outright
      au        +2     any known institution in Australia (last known or past affiliation)
      state     +1     an institution name that reads as the doctor's home state
      topics    +1 each overlapping topic/subfield/field, capped at 3
      works     reject 0 works; -2 when > 1,500 (merged mega-profile risk)
    THRESHOLD 6 = full name (3) + Australian (2) + one topic (1).
    """
    name_pts, name_why = candidate_name_match(rec["name"], author.get("display_name") or "")
    insts = institutions(author)
    au = any(cc == "AU" for _, cc in insts)
    last_known = [n for n, _ in (author.get("last_known_institutions") and
                                 [(i.get("display_name") or "", i.get("country_code")) for i in author["last_known_institutions"]] or [])]
    lki = author.get("last_known_institutions") or []
    # no last-known institution on the profile: fall back to the most recent affiliation
    if lki:
        au_last_known = (lki[0].get("country_code") or "").upper() == "AU"
    else:
        affs = author.get("affiliations") or []
        au_last_known = bool(affs) and (((affs[0].get("institution") or {}).get("country_code") or "").upper() == "AU")
    hints = STATE_INSTITUTION_HINTS.get(state or "", ())
    state_hit = any(h in fold(n) for n, cc in insts if cc == "AU" for h in hints)
    overlap = topic_overlap(doctor_terms(rec), author_topic_names(author))
    works = int(author.get("works_count") or 0)
    pts = 0
    reasons = []
    if name_pts == 0:
        reasons.append(name_why)
    else:
        pts += name_pts
        reasons.append(name_why)
        if au:
            pts += 2
            reasons.append("AU institution" + ("" if au_last_known else " (past affiliation only; now abroad)"))
        if state_hit:
            pts += 1
            reasons.append(f"{state} institution")
        if overlap:
            pts += min(3, len(overlap))
            reasons.append(f"{len(overlap)} topic overlap")
        if works == 0:
            pts = 0
            reasons.append("0 works")
        elif works > 1500:
            pts -= 2
            reasons.append("works_count > 1500")
    return {
        "id": (author.get("id") or "").rsplit("/", 1)[-1],
        "display_name": author.get("display_name"),
        "institution": last_known[0] if last_known else (insts[0][0] if insts else None),
        "institution_country": (author.get("last_known_institutions") or [{}])[0].get("country_code") if author.get("last_known_institutions") else (insts[0][1] if insts else None),
        "orcid": (author.get("ids") or {}).get("orcid"),
        "works_count": works,
        "cited_by_count": author.get("cited_by_count"),
        "topic_overlap": overlap[:5],
        "score": pts,
        "au_institution": au,
        "au_last_known": au_last_known,
        "state_institution": state_hit,
        "reasons": reasons,
    }


def name_ok(c: dict) -> bool:
    """A verified match needs the full given name, or an initial/diminutive plus a home-state institution."""
    r = c["reasons"]
    return r[0] in ("full first name",) or any(x.endswith(" institution") and not x.startswith("AU") for x in r)


def merge_split_profiles(cands: list[dict]) -> list[dict]:
    """OpenAlex often holds two profiles for one person with the same ORCID; treat them as one
    identity (keep the larger profile, remember the other id) so the 'exactly one' rule does not
    reject a real match."""
    by_orcid: dict[str, dict] = {}
    out = []
    for c in sorted(cands, key=lambda c: (-c["score"], -(c["works_count"] or 0))):
        o = c.get("orcid")
        if o and o in by_orcid:
            by_orcid[o].setdefault("merged_ids", []).append(c["id"])
            continue
        if o:
            by_orcid[o] = c
        out.append(c)
    return out


# ----------------------------------------------------------------------------- openalex calls
def discover(http: Http, rec: dict, search_fallback: bool) -> tuple[list[str], str]:
    """Return candidate author ids and the discovery method used."""
    q = clean_name(rec["name"])
    ids: list[str] = []
    ac = http.get_json(oa_url("/autocomplete/authors", q=q), "openalex")
    for r in (ac or {}).get("results") or []:
        aid = (r.get("id") or "").rsplit("/", 1)[-1]
        if aid and aid not in ids:
            ids.append(aid)
    # autocomplete is prefix-based; retry with "<first initial> <surname>" when nothing comes back
    if not ids:
        first, _, sur = name_parts(rec["name"])
        if first and sur:
            ac = http.get_json(oa_url("/autocomplete/authors", q=f"{first[0]} {sur}"), "openalex")
            for r in (ac or {}).get("results") or []:
                aid = (r.get("id") or "").rsplit("/", 1)[-1]
                if aid and aid not in ids:
                    ids.append(aid)
            if ids:
                return ids[:MAX_CANDIDATES], "autocomplete-initial"
    if ids:
        return ids[:MAX_CANDIDATES], "autocomplete"
    if search_fallback:
        s = http.get_json(oa_url("/authors", search=q, filter="last_known_institutions.country_code:AU",
                                 **{"per-page": "10", "select": AUTHOR_FIELDS}), "openalex")
        for a in (s or {}).get("results") or []:
            aid = (a.get("id") or "").rsplit("/", 1)[-1]
            if aid and aid not in ids:
                ids.append(aid)
        return ids[:MAX_CANDIDATES], "search"
    return [], "autocomplete"


def hydrate(http: Http, author_id: str) -> dict | None:
    return http.get_json(oa_url(f"/authors/{author_id}", select=AUTHOR_FIELDS), "openalex")


def fetch_works(http: Http, author_id: str, terms: list[str]) -> list[dict]:
    d = http.get_json(oa_url("/works", filter=f"author.id:{author_id}", sort="cited_by_count:desc",
                             **{"per-page": str(MAX_WORKS), "select": WORK_FIELDS}), "openalex")
    out = []
    for w in (d or {}).get("results") or []:
        loc = w.get("primary_location") or {}
        src = loc.get("source") or {}
        ids = w.get("ids") or {}
        topics = [t.get("display_name") for t in (w.get("topics") or []) if t.get("display_name")]
        topic_names = list(topics)
        for t in w.get("topics") or []:
            for k in ("subfield", "field"):
                if isinstance(t.get(k), dict) and t[k].get("display_name"):
                    topic_names.append(t[k]["display_name"])
        if not topics:
            topics = [c.get("display_name") for c in (w.get("concepts") or [])
                      if c.get("display_name") and (c.get("score") or 0) >= 0.4][:5]
        oa = w.get("open_access") or {}
        doi = w.get("doi")
        out.append({
            "openalex_id": (w.get("id") or "").rsplit("/", 1)[-1],
            "title": w.get("title") or w.get("display_name"),
            "doi": doi.replace("https://doi.org/", "") if doi else None,
            "year": w.get("publication_year"),
            "venue": src.get("display_name") or loc.get("raw_source_name"),
            "pmid": (ids.get("pmid") or "").rsplit("/", 1)[-1] or None,
            "topics": topics,
            "on_specialty": bool(topic_overlap(terms, topic_names or topics)),
            "cited_by_count": w.get("cited_by_count"),
            "open_access_url": oa.get("oa_url") if oa.get("is_oa") else None,
            "landing_page_url": loc.get("landing_page_url"),
        })
    return out


def norm_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def crossref_check(http: Http, works: list[dict]) -> None:
    """Confirm the first CROSSREF_CHECKS DOIs resolve on Crossref to the same title."""
    n = 0
    for w in works:
        if not w.get("doi"):
            continue
        if n >= CROSSREF_CHECKS:
            break
        n += 1
        url = CROSSREF + urllib.parse.quote(w["doi"], safe="/") + "?mailto=" + MAILTO
        d = http.get_json(url, "crossref")
        msg = (d or {}).get("message") if isinstance(d, dict) else None
        if not msg:
            w["crossref"] = {"checked": True, "resolved": False, "title_match": None}
            continue
        cr_title = (msg.get("title") or [""])[0]
        a, b = norm_title(cr_title), norm_title(w.get("title") or "")
        match = bool(a and b) and (a == b or a.startswith(b[:60]) or b.startswith(a[:60]))
        w["crossref"] = {"checked": True, "resolved": True, "title_match": match,
                         "crossref_title": cr_title if not match else None}


# ----------------------------------------------------------------------------- cohort
def load_cohort(state: str | None) -> list[dict]:
    recs = []
    for f in sorted(PROVIDERS_DIR.glob("*.jsonl")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            r = json.loads(line)
            states = {(loc.get("state") or "").upper() for loc in r.get("locations") or []}
            if state and state.upper() not in states:
                continue
            recs.append(r)
    recs.sort(key=lambda r: r["id"])
    return recs


def enrich_one(http: Http, rec: dict, state: str | None, search_fallback: bool) -> dict:
    out = {
        "provider_id": rec["id"],
        "name": rec["name"],
        "specialty": rec.get("specialty"),
        "state": state,
        "openalex_author_id": None,
        "authorship_verified": "unverified",
        "match_note": None,
        "discovery": None,
        "candidates": [],
        "works": [],
        "source": SOURCE,
        "observed_at": now_iso(),
        "legal_basis": LEGAL_BASIS,
    }
    ids, method = discover(http, rec, search_fallback)
    out["discovery"] = method
    if not ids:
        out["match_note"] = "no candidates" if not http.dry_run else "dry run"
        return out
    cands = []
    for aid in ids:
        a = hydrate(http, aid)
        if a:
            cands.append(score(rec, a, state))
    cands = merge_split_profiles(cands)
    cands.sort(key=lambda c: (-c["score"], -(c["works_count"] or 0)))
    out["candidates"] = [c for c in cands if c["score"] > 0][:5] or cands[:3]
    above = [c for c in cands if c["score"] >= THRESHOLD]
    if len(above) == 1 and above[0]["au_institution"] and not above[0]["au_last_known"]:
        # primary last-known institution abroad: the common-name false positives (a namesake
        # overseas whose profile absorbed an Australian line) live here, so review material.
        # Genuine emigres and recent arrivals land here too; they are listed in candidates.
        out["match_note"] = "last-known institution is outside Australia; human review"
    elif len(above) == 1 and above[0]["au_institution"] and above[0]["topic_overlap"] and name_ok(above[0]):
        c = above[0]
        works = fetch_works(http, c["id"], doctor_terms(rec))
        on = sum(1 for w in works if w["on_specialty"])
        if works and on * 2 < len(works):
            # OpenAlex profile that conflates several people: most of its cited works are in
            # other fields. Keep for human review; works are not attached.
            out["match_note"] = f"mixed profile: {on}/{len(works)} most-cited works on specialty; human review"
            return out
        out["openalex_author_id"] = c["id"]
        out["authorship_verified"] = "identifier-matched"
        out["match_note"] = f"score {c['score']}: " + "; ".join(c["reasons"]) + f"; {on}/{len(works)} works on specialty"
        out["works"] = works
        crossref_check(http, out["works"])
    elif len(above) == 1 and not name_ok(above[0]):
        out["match_note"] = "candidate matches on initial only and institution is not in the doctor's state; human review"
    elif len(above) > 1:
        out["match_note"] = f"{len(above)} candidates above threshold; human review"
    elif cands:
        best = cands[0]
        out["match_note"] = f"best score {best['score']} < {THRESHOLD}: " + "; ".join(best["reasons"])
    else:
        out["match_note"] = "no candidates"
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--state", default="QLD", help="cohort state (default QLD); 'ALL' for every doctor")
    ap.add_argument("--limit", type=int, default=0, help="max doctors (0 = all)")
    ap.add_argument("--dry-run", action="store_true", help="no network; cache only; report cohort")
    ap.add_argument("--search-fallback", action="store_true",
                    help="use the paid /authors?search= endpoint (10 credits) when autocomplete finds nothing")
    ap.add_argument("--out", default=None, help="output path (default data/enriched/publications/<date>.jsonl)")
    args = ap.parse_args()
    state = None if args.state.upper() == "ALL" else args.state.upper()
    cohort = load_cohort(state)
    if args.limit:
        cohort = cohort[: args.limit]
    http = Http(dry_run=args.dry_run, api_key=os.environ.get("OPENALEX_API_KEY") or None)
    print(f"{SOURCE}: {len(cohort)} doctors in cohort state={state or 'ALL'}; "
          f"discovery=autocomplete{'+search' if args.search_fallback else ''}; threshold={THRESHOLD}; "
          f"{'DRY RUN (cache only)' if args.dry_run else 'live at 1 req/s'}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = Path(args.out) if args.out else OUT_DIR / f"{now_iso()[:10]}.jsonl"
    tmp = out_path.with_suffix(".jsonl.tmp")
    counts: Counter = Counter()
    t0 = time.monotonic()
    with tmp.open("w", encoding="utf-8", newline="\n") as f:
        for i, rec in enumerate(cohort, 1):
            row = enrich_one(http, rec, state, args.search_fallback)
            counts[row["authorship_verified"]] += 1
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            if i % 25 == 0 or i == len(cohort):
                print(f"  {i}/{len(cohort)} matched={counts['identifier-matched']} "
                      f"requests={http.requests} cache_hits={http.cache_hits} credits={http.credits_used} "
                      f"remaining={http.remaining} {int(time.monotonic() - t0)}s")
            if http.budget_exhausted:
                print("stopping early: OpenAlex budget exhausted; rerun tomorrow, cache keeps today's work",
                      file=sys.stderr)
                break
    tmp.replace(out_path)
    done = sum(counts.values())
    print(f"wrote {done} rows -> {out_path}: identifier-matched={counts['identifier-matched']} "
          f"unverified={counts['unverified']}")
    return 0 if done == len(cohort) else 1


if __name__ == "__main__":
    sys.exit(main())
