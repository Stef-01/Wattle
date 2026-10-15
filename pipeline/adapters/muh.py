"""Macquarie University Hospital (www.muh.org.au, NSW).

Status 2026-10-15: every request to https://www.muh.org.au/ and
https://muh.org.au/ (curl, Python urllib, and a headless browser via Firecrawl)
returns HTTP 421 Misdirected Request -- the server's TLS/SNI configuration
rejects the hostname, so robots.txt cannot even be read. www.mqhealth.org.au
answers but has no specialist directory path. This adapter re-checks the host
and exits non-zero with the status so the failure stays visible.
"""
import sys
import os
import urllib.error

sys.path.insert(0, os.path.dirname(__file__))
from _common import Fetcher, finish, parse_args  # noqa: E402

GROUP = "muh"
LEGAL_BASIS = ("facts from public page; Macquarie University Hospital robots.txt could not be fetched "
               "(HTTP 421 Misdirected Request on every request) checked 2026-10-15; nothing collected")


def main():
    args = parse_args(__doc__)
    f = Fetcher()
    for url in ("https://www.muh.org.au/", "https://muh.org.au/"):
        try:
            f.fetch(url, retries=0)
            print(f"[{GROUP}] {url} now answers -- directory structure needs a fresh probe before collecting")
            finish(GROUP, [], f, args)
            return 0
        except urllib.error.HTTPError as e:
            print(f"[{GROUP}] {url} -> HTTP {e.code} {e.reason}")
        except Exception as e:
            print(f"[{GROUP}] {url} -> {e}")
    print(f"[{GROUP}] blocked: host unreachable; nothing written")
    return 2


if __name__ == "__main__":
    sys.exit(main())
