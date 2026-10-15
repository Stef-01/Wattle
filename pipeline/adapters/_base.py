"""Shared plumbing for the open-data / service-list adapters (abr_bulk, ndis_register,
aged_care_service_list, medicare_acc, headspace_centres, medicare_mental_health_centres).
(_common.py belongs to the college / hospital-group directory adapters.)

Stdlib only (Python 3.13). Every adapter:
  * declares LEGAL_BASIS (RESEARCH-PLAN.md section 7) and refuses to run without one;
  * fetches politely: robots.txt checked, one request per second per host, a
    declared User-Agent;
  * writes newline-delimited JSON to data/raw/<source>/<YYYY-MM-DD>.jsonl where
    every record carries {source, source_url, observed_at, legal_basis};
  * writes a run log next to it (<date>.run.json) with counts, hashes, failures.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path
from typing import Any, Iterable, Iterator

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"

DECLARED_UA = "WattleHealthPipeline/0.1 (+https://github.com/Stef-01/Wattle-Health; open-data adapter)"
# Some gov.au hosts sit behind a WAF that drops any non-browser User-Agent
# (ndiscommission.gov.au, medicarementalhealth.gov.au as at 2026-10-15). For
# those hosts only, adapters pass browser_ua=True. The run log records which
# UA was used. Rate limits and robots.txt still apply.
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

RATE_LIMIT_SECONDS = 1.0
_last_hit: dict[str, float] = {}
_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}


class AdapterError(RuntimeError):
    pass


def today() -> str:
    return _dt.date.today().isoformat()


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()


def log(msg: str) -> None:
    print(f"[{_dt.datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr, flush=True)


def require_legal_basis(source: str, legal_basis: str | None) -> str:
    if not legal_basis or not isinstance(legal_basis, str) or not legal_basis.strip():
        raise AdapterError(
            f"{source}: LEGAL_BASIS is not set. DATA-MODEL.md: an adapter without a legal basis does not run. "
            "Set LEGAL_BASIS to a string citing the licence, agreement or public-facts case (RESEARCH-PLAN.md section 7)."
        )
    return legal_basis.strip()


# ---------------------------------------------------------------- fetching

def _host(url: str) -> str:
    return urllib.parse.urlsplit(url).netloc.lower()


def _rate_limit(url: str) -> None:
    host = _host(url)
    wait = _last_hit.get(host, 0.0) + RATE_LIMIT_SECONDS - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_hit[host] = time.monotonic()


def robots_allows(url: str, ua: str, timeout: float = 20.0) -> bool:
    """Check robots.txt once per host. Unreachable robots.txt is logged and treated as allow."""
    host = _host(url)
    if host not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        robots_url = f"{urllib.parse.urlsplit(url).scheme}://{host}/robots.txt"
        try:
            _rate_limit(robots_url)
            req = urllib.request.Request(robots_url, headers={"User-Agent": ua})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read().decode("utf-8", "replace")
            rp.parse(body.splitlines())
            _robots[host] = rp
        except Exception as e:  # noqa: BLE001
            log(f"robots.txt for {host} unavailable ({e.__class__.__name__}); proceeding")
            _robots[host] = None
    rp = _robots[host]
    if rp is None:
        return True
    return rp.can_fetch(ua, url) and rp.can_fetch("*", url)


def open_url(url: str, *, browser_ua: bool = False, method: str = "GET", data: bytes | None = None,
             headers: dict[str, str] | None = None, timeout: float = 120.0, check_robots: bool = True):
    """Rate-limited, robots-checked urlopen. Returns the response (caller reads/streams it)."""
    ua = BROWSER_UA if browser_ua else DECLARED_UA
    if check_robots and not robots_allows(url, ua):
        raise AdapterError(f"robots.txt disallows {url}")
    _rate_limit(url)
    h = {"User-Agent": ua, "Accept": "*/*"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.HTTPError as e:
        raise AdapterError(f"HTTP {e.code} for {url}") from e
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise AdapterError(f"fetch failed for {url}: {e}") from e


def fetch_bytes(url: str, **kw: Any) -> bytes:
    with open_url(url, **kw) as r:
        return r.read()


def fetch_text(url: str, encoding: str = "utf-8", **kw: Any) -> str:
    return fetch_bytes(url, **kw).decode(encoding, "replace")


def download_to(url: str, dest: Path, *, chunk: int = 1 << 20, max_bytes: int | None = None, **kw: Any) -> dict[str, Any]:
    """Stream a URL to disk; returns {bytes, sha256, path}. max_bytes stops early (partial file)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha256()
    n = 0
    with open_url(url, **kw) as r, open(dest, "wb") as f:
        while True:
            b = r.read(chunk)
            if not b:
                break
            f.write(b)
            h.update(b)
            n += len(b)
            if max_bytes is not None and n >= max_bytes:
                break
    return {"bytes": n, "sha256": h.hexdigest(), "path": rel(dest)}


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT)).replace("\\", "/") if p.is_relative_to(ROOT) else str(p)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


# ---------------------------------------------------------------- output

def envelope(source: str, source_url: str, legal_basis: str, observed_at: str, **fields: Any) -> dict[str, Any]:
    rec = {"source": source, "source_url": source_url, "observed_at": observed_at, "legal_basis": legal_basis}
    rec.update(fields)
    return rec


class JsonlWriter:
    """Writes data/raw/<source>/<date>.jsonl and a <date>.run.json beside it."""

    def __init__(self, source: str, date: str | None = None, suffix: str = "") -> None:
        self.source = source
        self.date = date or today()
        self.dir = RAW_DIR / source
        self.dir.mkdir(parents=True, exist_ok=True)
        self.path = self.dir / f"{self.date}{suffix}.jsonl"
        self.run_path = self.dir / f"{self.date}{suffix}.run.json"
        self._f = open(self.path, "w", encoding="utf-8", newline="\n")
        self.count = 0
        self.meta: dict[str, Any] = {"source": source, "started_at": now_iso(), "fetches": [], "failures": []}

    def write(self, rec: dict[str, Any]) -> None:
        for k in ("source", "source_url", "observed_at", "legal_basis"):
            if not rec.get(k):
                raise AdapterError(f"record missing {k}: {rec}")
        self._f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")
        self.count += 1

    def write_all(self, recs: Iterable[dict[str, Any]]) -> int:
        for r in recs:
            self.write(r)
        return self.count

    def note_fetch(self, url: str, **info: Any) -> None:
        self.meta["fetches"].append({"url": url, **info})

    def note_failure(self, url: str, error: str) -> None:
        log(f"FAILED {url}: {error}")
        self.meta["failures"].append({"url": url, "error": error})

    def close(self, **extra: Any) -> dict[str, Any]:
        self._f.close()
        self.meta.update({"finished_at": now_iso(), "records": self.count, "output": rel(self.path),
                          "output_sha256": sha256_file(self.path), **extra})
        self.run_path.write_text(json.dumps(self.meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        fails = f" ({len(self.meta['failures'])} failures)" if self.meta["failures"] else ""
        log(f"{self.source}: {self.count} records -> {self.meta['output']}{fails}")
        return self.meta


# ---------------------------------------------------------------- small parsers

def snake(s: str) -> str:
    import re
    s = re.sub(r"[^0-9A-Za-z]+", "_", s.strip()).strip("_").lower()
    return s or "col"


def iter_csv(text: str, skip_until_header: str | None = None) -> Iterator[dict[str, str]]:
    """csv.DictReader over text; optionally skip preamble lines until one starting with `skip_until_header`."""
    import csv
    import io
    lines = text.splitlines()
    if skip_until_header is not None:
        for i, line in enumerate(lines):
            if line.startswith(skip_until_header):
                lines = lines[i:]
                break
    for row in csv.DictReader(io.StringIO("\n".join(lines))):
        yield {snake(k): (v or "").strip() for k, v in row.items() if k is not None}


def strip_tags(fragment: str) -> str:
    import html as _html
    import re
    return squash(_html.unescape(re.sub(r"<[^>]+>", " ", fragment)).replace("\xa0", " "))


def squash(s: str) -> str:
    import re
    return re.sub(r"\s+", " ", s or "").strip(" ,")


STATE_NAMES = {
    "new south wales": "NSW", "victoria": "VIC", "queensland": "QLD", "western australia": "WA",
    "south australia": "SA", "tasmania": "TAS", "australian capital territory": "ACT", "northern territory": "NT",
}


def state_code(s: str) -> str | None:
    s = (s or "").strip()
    if s.upper() in STATE_NAMES.values():
        return s.upper()
    return STATE_NAMES.get(s.lower())


def arg(name: str, default: str | None = None) -> str | None:
    """Tiny --name value / --name parser over sys.argv (env fallback WATTLE_<NAME>)."""
    for i, a in enumerate(sys.argv[1:], 1):
        if a == f"--{name}":
            return sys.argv[i + 1] if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith("--") else "true"
        if a.startswith(f"--{name}="):
            return a.split("=", 1)[1]
    return os.environ.get("WATTLE_" + name.upper().replace("-", "_"), default)
