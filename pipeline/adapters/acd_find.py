#!/usr/bin/env python3
"""ACD "Find a Dermatologist" adapter (Python 3.13, stdlib only).

Page: https://www.dermcoll.edu.au/find-a-derm/

STATUS 2026-10-15: STOPPED BY ROBOTS. https://www.dermcoll.edu.au/robots.txt
allows only Googlebot and Bingbot and disallows "/" for every other agent:

    User-agent: Googlebot   Disallow:
    User-agent: Bingbot     Disallow:
    User-agent: *           Disallow: /

This adapter therefore re-checks robots.txt on every run and refuses to
search while that rule stands. Nothing beyond the landing page and robots.txt
has been fetched. The College should be asked for a republication feed (or
written permission) before this runs. No terms page was fetched for the same
reason (links seen: /about/privacy-policy/, /home/privacy).

What the search form needs (read from the landing page HTML, no JS fetched):
    form#find-derm-form, submitted by theme JS
        wp-content/themes/twentynineteen-child/js/ajax-implementation.js
    to WordPress admin-ajax.php (action name lives in that JS; not fetched).
    Three tabs: location_tab_div | doctor_name_tab_div | mohs_name_tab_div
    Fields: postcode (suburb or postcode text), radius, interests[] (multi,
            90 options incl. "Telehealth/Teledermatology"), interest_flag=1,
            dermatologist_name, current_location.
    No reCAPTCHA and no login on the public form. Results render with Google
    Maps + markerclusterer; a print-to-PDF button (jspdf) is present.

Record shape (same as every raw adapter):
    {source, source_url, observed_at, legal_basis, name, credential_tier,
     specialty, subspecialty_tags[], locations:[{address, suburb, state,
     postcode, phone}], telehealth, profile_url}
    ACD lists Fellows (FACD) only, so credential_tier is "Fellow" and
    telehealth is True when the "Telehealth/Teledermatology" interest is set.
"""
from __future__ import annotations

import argparse
import sys
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "acd_find"
LEGAL_BASIS = "facts from public page; robots checked 2026-10-15; opt-in directory; republication feed to be requested from the college"
DIRECTORY_URL = "https://www.dermcoll.edu.au/find-a-derm/"
ROBOTS_URL = "https://www.dermcoll.edu.au/robots.txt"
AJAX_URL = "https://www.dermcoll.edu.au/wp-admin/admin-ajax.php"
USER_AGENT = "WattleHealthBot"
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / SOURCE

FORM_REQUIREMENTS = """ACD find-a-derm form (form#find-derm-form -> admin-ajax.php via ajax-implementation.js):
  tabs:   location_tab_div | doctor_name_tab_div | mohs_name_tab_div
  fields: postcode (suburb/postcode text), radius, interests[] (90 options),
          interest_flag=1, dermatologist_name, current_location
  gates:  no reCAPTCHA, no login; robots.txt disallows all agents except Googlebot/Bingbot
  action: request a republication feed / written permission from the College"""


def robots_allows(user_agent: str = USER_AGENT) -> bool:
    rp = urllib.robotparser.RobotFileParser(ROBOTS_URL)
    rp.read()  # the one request this adapter makes while blocked
    return rp.can_fetch(user_agent, DIRECTORY_URL) and rp.can_fetch(user_agent, AJAX_URL)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="check robots and report; write nothing")
    ap.add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    ap.parse_args(argv)

    if not robots_allows():
        print(f"STOP: {ROBOTS_URL} disallows {USER_AGENT} for {DIRECTORY_URL}. Not searching.", file=sys.stderr)
        print(FORM_REQUIREMENTS, file=sys.stderr)
        return 2
    # Robots now permits us: the search is still unimplemented because the
    # admin-ajax action name and response shape have never been observed.
    print("robots.txt now allows this agent; implement the admin-ajax search "
          "(see FORM_REQUIREMENTS) before collecting.", file=sys.stderr)
    return 3


if __name__ == "__main__":
    sys.exit(main())
