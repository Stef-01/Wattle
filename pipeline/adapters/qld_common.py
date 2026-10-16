"""Shared plumbing for the Queensland Health adapters (qld_health_facilities,
qld_outpatient_waits, qld_services_mvp). Stdlib only, Python 3.13.

Differences from _base.py (which these adapters still use for JsonlWriter,
envelope, strip_tags, today, log):
  * the declared User-Agent is WattleHealthBot/0.1;
  * robots.txt Crawl-delay is honoured per host (data.qld.gov.au asks for 10 s,
    metronorth.health.qld.gov.au for 10 s); the floor is one request per second;
  * the Squiz "datastore" JSON that the Hospital and Health Service websites load
    in the browser is fetched once per run and shared.

Legal basis texts quoted here were checked on 2026-10-15 (see the LEGAL_* strings).
"""
from __future__ import annotations

import html as _html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _base import AdapterError, log, squash, strip_tags  # noqa: E402

UA = "WattleHealthBot/0.1 (+https://github.com/Stef-01/Wattle-Health)"
MIN_GAP = 1.0

# ----------------------------------------------------------------- legal bases
# data.qld.gov.au: every dataset used carries license_id CC-BY-4.0 and the dataset
# page states "Creative Commons Attribution 4.0" (rel="dc:rights"). robots.txt
# (checked 2026-10-15) for "User-agent: *" has "Disallow: /api/" and "Crawl-Delay: 10";
# dataset pages, /dataset/.../download/... and /datastore/dump/... are not disallowed.
# The adapters therefore discover resources from the dataset HTML page and download
# through the allowed paths, ten seconds apart, and never call /api/.
LEGAL_DATA_QLD = (
    "data.qld.gov.au open dataset, Creative Commons Attribution 4.0 (CC BY 4.0), attribution "
    "'State of Queensland (Queensland Health)'; robots.txt 2026-10-15: 'Disallow: /api/' and "
    "'Crawl-Delay: 10' honoured (dataset page + download paths only, >=10 s apart)"
)
# health.qld.gov.au copyright statement (https://www.health.qld.gov.au/global/copyright-statement,
# checked 2026-10-15): "Unless otherwise indicated, copyright material on this website is licensed
# under a Creative Commons Attribution No Derivatives V4.0 International licence (CC BY-ND 4.0)".
# We copy no prose: only facts (facility and service names, addresses, phones, geocodes, opening
# hours, which services sit where and how to be referred), which are not copyright works.
# robots.txt per HHS host checked at run time (Squiz Matrix defaults, WordPress on Metro North
# with Crawl-delay 10, Joomla on Townsville); none disallows the facility or service pages.
LEGAL_HEALTH_QLD = (
    "facts (names, addresses, phones, geocodes, hours, referral route) from public Queensland "
    "Health / HHS pages; site content is CC BY-ND 4.0 (copyright statement 2026-10-15), no prose "
    "copied, attribution State of Queensland (Queensland Health); robots.txt of each host checked, "
    "Crawl-delay honoured"
)
# The HHS websites render facility and service pages from a Squiz Datastore
# (https://au-e375edfd.datastore.squiz.cloud/{facilities,services,service-locations}) which the
# browser fetches unauthenticated (the /utilities/datastore-token endpoint issues a "Public User"
# token with isPublic:true but the GETs succeed without it). It has no robots.txt (404). It is the
# same CC BY-ND content in JSON form, so the same facts-only rule applies.
LEGAL_DATASTORE = (
    LEGAL_HEALTH_QLD
    + "; records read from the public Squiz datastore JSON the HHS sites load in the browser "
    "(no robots.txt, no authentication), editor names dropped"
)

DATASTORE = "https://au-e375edfd.datastore.squiz.cloud"

# HHS website host -> (hhs_id, HHS name). Covers all 16 HHSs plus Children's Health Queensland
# and the Mater (public services contracted by Queensland Health).
HHS_HOSTS: dict[str, tuple[str, str]] = {
    "cairns-hinterland.health.qld.gov.au": ("cairns-and-hinterland", "Cairns and Hinterland"),
    "cq.health.qld.gov.au": ("central-queensland", "Central Queensland"),
    "centralwest.health.qld.gov.au": ("central-west", "Central West"),
    "childrens.health.qld.gov.au": ("childrens-health-queensland", "Children's Health Queensland"),
    "darlingdowns.health.qld.gov.au": ("darling-downs", "Darling Downs"),
    "goldcoast.health.qld.gov.au": ("gold-coast", "Gold Coast"),
    "mackay.health.qld.gov.au": ("mackay", "Mackay"),
    "metronorth.health.qld.gov.au": ("metro-north", "Metro North"),
    "metrosouth.health.qld.gov.au": ("metro-south", "Metro South"),
    "northwest.health.qld.gov.au": ("north-west", "North West"),
    "southwest.health.qld.gov.au": ("south-west", "South West"),
    "sunshinecoast.health.qld.gov.au": ("sunshine-coast", "Sunshine Coast"),
    "torres-cape.health.qld.gov.au": ("torres-and-cape", "Torres and Cape"),
    "townsville.health.qld.gov.au": ("townsville", "Townsville"),
    "westmoreton.health.qld.gov.au": ("west-moreton", "West Moreton"),
    "widebay.health.qld.gov.au": ("wide-bay", "Wide Bay"),
    "mater.org.au": ("mater", "Mater Health Service"),
    "health.qld.gov.au": ("queensland-health", "Queensland Health (statewide)"),
}
HHS_ID_TO_HOST = {v[0]: k for k, v in HHS_HOSTS.items()}
HHS_ID_TO_NAME = {v[0]: v[1] for v in HHS_HOSTS.values()}
# Names as they appear in the 2021 public-hospitals spreadsheet and the CYMHS CSV.
HHS_NAME_TO_ID = {v[1].lower(): v[0] for v in HHS_HOSTS.values()}
HHS_NAME_TO_ID.update({
    "children's health queensland": "childrens-health-queensland",
    "childrens health queensland": "childrens-health-queensland",
    "children's health": "childrens-health-queensland",
    "torres and cape york": "torres-and-cape",
    "torres & cape": "torres-and-cape",
    "cairns & hinterland": "cairns-and-hinterland",
    "mackay & whitsundays": "mackay",
})


def decode_csv(blob: bytes) -> str:
    """Queensland Health spreadsheets exported as CSV are usually cp1252, sometimes UTF-8."""
    try:
        return blob.decode("utf-8-sig")
    except UnicodeDecodeError:
        return blob.decode("cp1252", "replace")


def hhs_from_host(url: str) -> tuple[str | None, str | None]:
    host = urllib.parse.urlsplit(url).netloc.lower()
    host = host[4:] if host.startswith("www.") else host
    for h, (hid, name) in HHS_HOSTS.items():
        if host == h or host.endswith("." + h):
            return hid, name
    return None, None


def hhs_from_name(name: str) -> str | None:
    raw = squash(name).lower().replace("’", "'")
    n = raw.replace(" hospital and health service", "").replace(" health", "")
    return HHS_NAME_TO_ID.get(raw) or HHS_NAME_TO_ID.get(n) or HHS_NAME_TO_ID.get(n.replace("&", "and"))


# ----------------------------------------------------------------- fetching

_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
_last: dict[str, float] = {}
_robots_quotes: dict[str, str] = {}


def _host(url: str) -> str:
    return urllib.parse.urlsplit(url).netloc.lower()


def _robots_for(url: str) -> urllib.robotparser.RobotFileParser | None:
    host = _host(url)
    if host in _robots:
        return _robots[host]
    rp = urllib.robotparser.RobotFileParser()
    robots_url = f"{urllib.parse.urlsplit(url).scheme}://{host}/robots.txt"
    try:
        _sleep_for(host, MIN_GAP)
        req = urllib.request.Request(robots_url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace")
        rp.parse(body.splitlines())
        _robots[host] = rp
        lines = [ln.strip() for ln in body.splitlines() if ln.strip() and not ln.startswith("#")]
        _robots_quotes[host] = " | ".join(lines[:12])
    except urllib.error.HTTPError as e:
        _robots[host] = None
        _robots_quotes[host] = f"robots.txt HTTP {e.code} (no robots file; treated as allow)"
    except Exception as e:  # noqa: BLE001
        _robots[host] = None
        _robots_quotes[host] = f"robots.txt unavailable ({e.__class__.__name__}); treated as allow"
    return _robots[host]


def robots_quotes() -> dict[str, str]:
    """What each host's robots.txt said (first lines), for the run log."""
    return dict(_robots_quotes)


def _sleep_for(host: str, gap: float) -> None:
    wait = _last.get(host, 0.0) + gap - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last[host] = time.monotonic()


def fetch(url: str, *, timeout: float = 120.0, headers: dict[str, str] | None = None, retries: int = 2) -> bytes:
    """Robots-checked, crawl-delay-aware GET with the declared UA. Raises AdapterError."""
    rp = _robots_for(url)
    gap = MIN_GAP
    if rp is not None:
        if not (rp.can_fetch(UA, url) and rp.can_fetch("*", url)):
            raise AdapterError(f"robots.txt disallows {url}")
        cd = rp.crawl_delay(UA) or rp.crawl_delay("*")
        if cd:
            gap = max(gap, float(cd))
    h = {"User-Agent": UA, "Accept": "*/*"}
    if headers:
        h.update(headers)
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        _sleep_for(_host(url), gap)
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            # 403: the Cloudflare front of health.qld.gov.au / CHQ intermittently scores a
            # first urllib request as a bot and lets the retry through; one retry after 8 s.
            if e.code in (403, 429, 500, 502, 503, 504) and attempt < retries:
                last_err = e
                time.sleep(8.0 * (attempt + 1))
                continue
            raise AdapterError(f"HTTP {e.code} for {url}") from e
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            if attempt < retries:
                time.sleep(5.0 * (attempt + 1))
                continue
            raise AdapterError(f"fetch failed for {url}: {e}") from e
    raise AdapterError(f"fetch failed for {url}: {last_err}")


def fetch_text(url: str, **kw: Any) -> str:
    return fetch(url, **kw).decode("utf-8", "replace")


def fetch_json(url: str, **kw: Any) -> Any:
    return json.loads(fetch(url, headers={"Accept": "application/json"}, **kw).decode("utf-8", "replace"))


# ----------------------------------------------------------------- data.qld.gov.au dataset pages

def dataset_resources(dataset_url: str) -> dict[str, Any]:
    """Resources of a data.qld.gov.au dataset from the schema.org JSON-LD on its HTML page
    (robots.txt disallows the CKAN /api/ path for crawlers, the page is allowed).
    Returns {"licence": url, "name": str, "resources": [{name, url, format, description}]}."""
    page = fetch_text(dataset_url)
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', page, re.S)
    if not m:
        raise AdapterError(f"{dataset_url}: no JSON-LD block on dataset page")
    graph = json.loads(_html.unescape(m.group(1)))
    nodes = graph.get("@graph", [graph]) if isinstance(graph, dict) else graph
    out: dict[str, Any] = {"licence": None, "name": None, "resources": []}
    for n in nodes:
        t = n.get("@type")
        if t in ("schema:Dataset", "Dataset"):
            out["licence"] = n.get("schema:license") or n.get("license")
            out["name"] = n.get("schema:name") or n.get("name")
        elif t in ("schema:DataDownload", "DataDownload"):
            out["resources"].append({
                "name": squash(n.get("schema:name") or n.get("name") or ""),
                "url": n.get("schema:url") or n.get("url") or n.get("contentUrl"),
                "format": (n.get("schema:encodingFormat") or n.get("encodingFormat") or "").upper(),
                "description": squash(n.get("schema:description") or n.get("description") or ""),
            })
    return out


# ----------------------------------------------------------------- Squiz datastore

_ds_cache: dict[str, list[dict[str, Any]]] = {}


def datastore(collection: str) -> list[dict[str, Any]]:
    """facilities | services | service-locations | service-categories (list of dicts)."""
    if collection not in _ds_cache:
        url = f"{DATASTORE}/{collection}"
        data = fetch_json(url)
        if not isinstance(data, list):
            raise AdapterError(f"datastore {collection}: unexpected shape {type(data).__name__}")
        for rec in data:
            rec.pop("updatedBy", None)  # editor's personal name; not a fact about the service
        _ds_cache[collection] = data
        log(f"datastore/{collection}: {len(data)} records")
    return _ds_cache[collection]


def service_url(hhs_id: str, service_path: str, location_path: str | None = None) -> str | None:
    """HHS sites publish services at https://www.<host>/services/<service>/<location>."""
    host = HHS_ID_TO_HOST.get(hhs_id)
    if not host:
        return None
    base = f"https://www.{host}/services/{service_path}"
    return f"{base}/{location_path}" if location_path else base


# ----------------------------------------------------------------- text helpers

PHONE_RE = re.compile(
    r"(?<![\d])(?:\(?0[2-9]\)?[ \-]?\d{4}[ \-]?\d{4}|1[38]00[ \-]?\d{3}[ \-]?\d{3}|13[ \-]?\d{2}[ \-]?\d{2}|13[ \-]?\d{4}|04\d{2}[ \-]?\d{3}[ \-]?\d{3}|[3-7]\d{3}[ \-]\d{4})(?![\d])"
)
ADDR_RE = re.compile(
    r"(\d+[A-Za-z]?(?:\s*[-–/]\s*\d+[A-Za-z]?)?\s+[A-Za-z][A-Za-z' .]{2,60}?(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parade|Pde|Highway|Hwy|Terrace|Tce|Lane|Place|Pl|Way|Crescent|Cres|Court|Ct|Esplanade|Boulevard|Blvd)\.?)\s*,?\s+([A-Z][A-Za-z' ]{2,40}?)\s*,?\s+(?:QLD|Qld)\s*,?\s*(\d{4})\b"
)


def text_of(html_: str) -> str:
    """Visible text of a page's main content (nav/header/footer/script dropped)."""
    s = re.sub(r"<(script|style|nav|header|footer|noscript)\b.*?</\1>", " ", html_, flags=re.S | re.I)
    m = re.search(r"<main\b.*?</main>", s, re.S | re.I)
    if m and len(strip_tags(m.group(0))) > 200:
        s = m.group(0)
    return strip_tags(s)


def title_of(html_: str) -> str | None:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html_, re.S | re.I)
    if m:
        t = strip_tags(m.group(1))
        if t:
            return t
    m = re.search(r"<title>(.*?)</title>", html_, re.S | re.I)
    return squash(_html.unescape(m.group(1)).split("|")[0]) if m else None


def phone_in(s: str | None) -> str | None:
    """First landline / 1300 / 13 number in a string, normalised to '07 1234 5678' style."""
    if not s:
        return None
    for m in PHONE_RE.finditer(strip_tags(s) if "<" in s else s):
        raw = m.group(0)
        digits = re.sub(r"\D", "", raw)
        if digits == "000" or digits.startswith("134325"):  # Triple Zero / 13 HEALTH are not the service
            continue
        if digits.startswith(("1300", "1800")) and len(digits) == 10:
            return f"{digits[:4]} {digits[4:7]} {digits[7:]}"
        if len(digits) == 10:
            return f"{digits[:2]} {digits[2:6]} {digits[6:]}"
        if len(digits) == 8 and raw.strip().startswith(("3", "4", "5", "7")):
            return f"07 {digits[:4]} {digits[4:]}"
        if len(digits) == 6 and digits.startswith("13"):
            return f"13 {digits[2:4]} {digits[4:]}"
        return raw.strip()
    return None


def address_in(s: str | None) -> dict[str, str] | None:
    if not s:
        return None
    m = ADDR_RE.search(s)
    if not m:
        return None
    return {"address": squash(m.group(1)), "suburb": squash(m.group(2)).title(), "postcode": m.group(3)}


def latlng_in(html_: str) -> tuple[float, float] | None:
    """Facility coordinates from an embedded Google Maps link (the destination's !2d/!3d pair)."""
    for pat in (r"!3d(-?\d+\.\d+)!2d(-?\d+\.\d+)", r"!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)",
                r"!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)", r"destination=(-?\d+\.\d+),(-?\d+\.\d+)"):
        m = re.search(pat, html_)
        if m:
            a, b = float(m.group(1)), float(m.group(2))
            lat, lng = (a, b) if a < 0 else (b, a)
            if -30 <= lat <= -9 and 137 <= lng <= 155:
                return lat, lng
    return None


def norm_name(s: str) -> str:
    s = squash(s).lower()
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\b(the|and|of|hospital and health service)\b", " ", s)
    return squash(s)


def section(html_: str, heading_re: str) -> str | None:
    """Text under the first <h2>/<h3> matching heading_re, up to the next heading."""
    rx = re.compile(heading_re, re.I)
    heads = list(re.finditer(r"<(h[23])\b[^>]*>(.*?)</\1>", html_, re.S | re.I))
    for i, h in enumerate(heads):
        if rx.search(strip_tags(h.group(2))):
            end = heads[i + 1].start() if i + 1 < len(heads) else len(html_)
            body = squash(strip_tags(html_[h.end():end]))
            if body:
                return body
    return None


def facility_type(name: str) -> str:
    n = name.lower()
    for key, label in (
        ("satellite hospital", "Satellite hospital"), ("satellite health centre", "Satellite hospital"),
        ("multipurpose", "Multipurpose health service"), ("multi-purpose", "Multipurpose health service"),
        ("primary health", "Primary health centre"), ("community health", "Community health centre"),
        ("community care", "Community health centre"), ("medical centre", "General practice"),
        ("medical practice", "General practice"), ("general practice", "General practice"),
        ("health service", "Health service"), ("health centre", "Health centre"), ("hospital", "Hospital"),
        ("nursing home", "Residential aged care"), ("aged care", "Residential aged care"),
        ("oral health", "Oral health clinic"), ("dental", "Oral health clinic"),
        ("mental health", "Mental health facility"), ("clinic", "Clinic"),
    ):
        if key in n:
            return label
    return "Health facility"
