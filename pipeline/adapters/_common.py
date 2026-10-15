"""Shared helpers for the hospital-group specialist directory adapters.

Stdlib only (Python 3.13): urllib, json, re, html, time, argparse.
Rules every adapter follows:
  * robots.txt is fetched once per host and every URL is checked with
    urllib.robotparser before it is requested;
  * at most one request per second per process;
  * facts only -- name, specialty, locations, phone, tags, telehealth,
    profile URL. No bios, no photos.
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from collections import Counter
from datetime import datetime, timezone

USER_AGENT = "WattleHealthBot/0.1 (+stefan.thottunkal@gmail.com)"
OBSERVED_DATE = "2026-10-15"
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_ROOT = os.path.join(REPO_ROOT, "data", "raw")

STATES = ("NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT")
STATE_RE = re.compile(r"\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b")
POSTCODE_RE = re.compile(r"\b(\d{4})\b")

# Specialty categories the pipeline collects. A specialist is kept when any
# of their specialty strings matches one of these. Paediatric surgery,
# orthopaedics, dentistry and anaesthesia are surgical/other disciplines and
# are excluded on purpose; psychology is not psychiatry.
CATEGORY_RULES = {
    "psychiatry": (re.compile(r"psychiatr", re.I), re.compile(r"psycholog", re.I)),
    "paediatrics": (
        re.compile(r"paediatric|pediatric|neonat", re.I),
        re.compile(r"surg|orthop|dent|anaesth|radiol|patholog|urolog|ophthalm|\bent\b", re.I),
    ),
    "obstetrics_gynaecology": (
        re.compile(r"obstet|gynaec|gynec|maternal|fetal|foetal|fertil|\bivf\b|reproductive", re.I),
        re.compile(r"^$"),
    ),
}


def classify(specialties) -> set[str]:
    """Return the set of pipeline categories a list of specialty strings hits."""
    hits = set()
    for s in specialties or []:
        if not s:
            continue
        for cat, (yes, no) in CATEGORY_RULES.items():
            if yes.search(s) and not no.search(s):
                hits.add(cat)
    return hits


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def clean(s) -> str:
    if s is None:
        return ""
    return re.sub(r"\s+", " ", html.unescape(str(s))).strip()


def split_au_address(addr: str) -> dict:
    """'3 Gibb St, Berwick VIC 3806' -> address/suburb/state/postcode."""
    addr = clean(addr)
    out = {"address": addr, "suburb": "", "state": "", "postcode": ""}
    m = re.search(r"^(.*?)[,\s]+([A-Za-z][A-Za-z .'\-]*?)\s+(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\s*(\d{4})?\s*$", addr)
    if m:
        out["address"] = clean(m.group(1)).rstrip(",")
        out["suburb"] = clean(m.group(2))
        out["state"] = m.group(3)
        out["postcode"] = m.group(4) or ""
        return out
    m = STATE_RE.search(addr)
    if m:
        out["state"] = m.group(1)
    m = POSTCODE_RE.search(addr)
    if m:
        out["postcode"] = m.group(1)
    return out


def location(name="", address="", suburb="", state="", postcode="", phone="") -> dict:
    return {
        "name": clean(name),
        "address": clean(address),
        "suburb": clean(suburb),
        "state": clean(state).upper(),
        "postcode": clean(postcode),
        "phone": clean(phone),
    }


def record(source, source_url, legal_basis, name, specialty, tags, locations, telehealth, profile_url) -> dict:
    seen, uniq = set(), []
    for t in tags or []:
        t = clean(t)
        if t and t.lower() not in seen:
            seen.add(t.lower())
            uniq.append(t)
    return {
        "source": source,
        "source_url": source_url,
        "observed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "legal_basis": legal_basis,
        "name": clean(name),
        "specialty": clean(specialty),
        "subspecialty_tags": uniq,
        "locations": [l for l in (locations or []) if any(l.values())],
        "telehealth": telehealth,
        "profile_url": profile_url,
    }


class Fetcher:
    """Rate-limited, robots-aware HTTP client."""

    def __init__(self, min_interval=1.0, timeout=40, backend="urllib"):
        """backend="curl" shells out to curl for GETs: some Cloudflare fronts
        (sjog.org.au) answer 403 to Python's TLS client but 200 to curl."""
        self.min_interval = min_interval
        self.timeout = timeout
        self.backend = backend
        self._last = 0.0
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self.requests = 0
        self.failures: list[str] = []

    def _wait(self):
        delta = time.monotonic() - self._last
        if delta < self.min_interval:
            time.sleep(self.min_interval - delta)
        self._last = time.monotonic()

    def robots_for(self, url: str):
        host = urllib.parse.urlsplit(url)
        key = f"{host.scheme}://{host.netloc}"
        if key not in self._robots:
            rp = urllib.robotparser.RobotFileParser()
            for attempt in range(2):
                try:
                    self._wait()
                    req = urllib.request.Request(key + "/robots.txt", headers={"User-Agent": USER_AGENT})
                    with urllib.request.urlopen(req, timeout=self.timeout) as r:
                        body = r.read().decode("utf-8", "replace")
                    if "<html" in body[:500].lower():
                        rp.parse([])  # HTML 404 page served as robots -> no rules
                    else:
                        rp.parse(body.splitlines())
                    break
                except urllib.error.HTTPError as e:
                    if e.code in (401, 403) and attempt == 0:
                        time.sleep(3)
                        continue
                    if e.code in (401, 403):
                        rp.disallow_all = True
                        print(f"  robots {key}: HTTP {e.code}, treating host as disallowed")
                    else:
                        rp.allow_all = True
                    break
                except Exception:
                    rp.allow_all = True
                    break
            self._robots[key] = rp
        return self._robots[key]

    def allowed(self, url: str) -> bool:
        return self.robots_for(url).can_fetch(USER_AGENT, url)

    def fetch(self, url: str, data: bytes | None = None, headers: dict | None = None, retries=2) -> bytes:
        if not self.allowed(url):
            raise PermissionError(f"robots.txt disallows {url}")
        hdrs = {"User-Agent": USER_AGENT, "Accept": "*/*"}
        if headers:
            hdrs.update(headers)
        last_err = None
        for attempt in range(retries + 1):
            self._wait()
            self.requests += 1
            try:
                if self.backend == "curl" and data is None:
                    return self._curl(url, hdrs)
                req = urllib.request.Request(url, data=data, headers=hdrs, method="POST" if data is not None else "GET")
                with urllib.request.urlopen(req, timeout=self.timeout) as r:
                    return r.read()
            except urllib.error.HTTPError as e:
                last_err = e
                if e.code in (404, 410):
                    break
                if e.code < 500 and e.code != 429:
                    break
            except Exception as e:  # timeouts, resets
                last_err = e
            time.sleep(2 * (attempt + 1))
        self.failures.append(f"{url} :: {last_err}")
        raise last_err

    def _curl(self, url: str, hdrs: dict) -> bytes:
        import subprocess
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as tmp:
            out_path = tmp.name
        cmd = ["curl", "-sS", "-L", "-m", str(self.timeout), "--compressed", "-o", out_path, "-w", "%{http_code}"]
        for k, v in hdrs.items():
            cmd += ["-H", f"{k}: {v}"]
        cmd.append(url)
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=self.timeout + 10)
            code = int((proc.stdout or "0").strip()[-3:] or 0)
            with open(out_path, "rb") as fh:
                body = fh.read()
        finally:
            try:
                os.unlink(out_path)
            except OSError:
                pass
        if code != 200:
            raise urllib.error.HTTPError(url, code, proc.stderr.strip() or "curl error", {}, None)
        return body

    def text(self, url, **kw) -> str:
        return self.fetch(url, **kw).decode("utf-8", "replace")

    def json(self, url, body=None, headers=None):
        hdrs = {"Accept": "application/json"}
        if headers:
            hdrs.update(headers)
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            hdrs["Content-Type"] = "application/json"
        return json.loads(self.fetch(url, data=data, headers=hdrs).decode("utf-8", "replace"))


def sitemap_urls(fetcher: Fetcher, url: str) -> list[str]:
    body = fetcher.text(url)
    locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body)
    out = []
    for loc in locs:
        loc = html.unescape(loc)
        if loc.endswith(".xml") and "sitemap" in loc.lower():
            try:
                out.extend(sitemap_urls(fetcher, loc))
            except Exception as e:
                fetcher.failures.append(f"{loc} :: {e}")
        else:
            out.append(loc)
    return out


def next_flight_strings(page: str) -> str:
    """Concatenate and unescape the Next.js RSC flight payload embedded in a page."""
    parts = []
    for m in re.finditer(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', page):
        try:
            parts.append(json.loads(m.group(1)))
        except json.JSONDecodeError:
            continue
    return "".join(parts)


def json_after(text: str, marker: str, start_char="{"):
    """Decode the JSON value that starts right after `marker` in `text`."""
    i = text.find(marker)
    if i < 0:
        return None
    j = text.find(start_char, i + len(marker) - (1 if marker.endswith(start_char) else 0))
    if j < 0:
        return None
    try:
        val, _ = json.JSONDecoder().raw_decode(text, j)
        return val
    except json.JSONDecodeError:
        return None


def parse_args(description: str) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--dry-run", action="store_true", help="fetch a handful of records, print them, write nothing")
    p.add_argument("--limit", type=int, default=0, help="cap on profile pages fetched (0 = all)")
    p.add_argument("--states", default="", help="comma list of states to keep (default: all)")
    return p.parse_args()


def summarize(records: list[dict]) -> str:
    c = Counter()
    for r in records:
        cats = classify([r["specialty"], *r["subspecialty_tags"]]) or {"other"}
        states = {l["state"] for l in r["locations"] if l["state"]} or {"?"}
        for cat in cats:
            for st in states:
                c[(cat, st)] += 1
    lines = [f"  {cat:24s} {st:4s} {n}" for (cat, st), n in sorted(c.items())]
    return "\n".join(lines) if lines else "  (none)"


def finish(group: str, records: list[dict], fetcher: Fetcher, args: argparse.Namespace) -> None:
    if args.states:
        keep = {s.strip().upper() for s in args.states.split(",") if s.strip()}
        records = [r for r in records if any(l["state"] in keep for l in r["locations"])]
    print(f"[{group}] records={len(records)} requests={fetcher.requests} failures={len(fetcher.failures)}")
    print(summarize(records))
    for f in fetcher.failures[:20]:
        print("  FAIL", f)
    if args.dry_run:
        for r in records[:5]:
            print(json.dumps(r, ensure_ascii=False))
        print(f"[{group}] dry run: nothing written")
        return
    out_dir = os.path.join(RAW_ROOT, group)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{OBSERVED_DATE}.jsonl")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        for r in records:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"[{group}] wrote {path}")
