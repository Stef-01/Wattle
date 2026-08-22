import Link from "next/link";
import { DOORS, SITE_URL } from "./site";
import { COMPANY } from "@/content/company";
import { WattleMark } from "./wattle-mark";

/**
 * The footer states two things and no more: who this is, and how to reach them.
 *
 * WHAT IS DELIBERATELY ABSENT: an ABN, a registered office, a copyright year tied to an
 * incorporation date, and a "© 2019–2026" range. Each of those is a fact about a legal entity,
 * and none has been supplied to this repository — see UNCONFIRMED in src/content/company.ts.
 * The year below is the current year only, which asserts nothing about when the company began.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <div>
          <Link href="/" className="wordmark" translate="no">
            <WattleMark className="wordmark-mark" />
            <span>
              {COMPANY.shortName} <span className="wordmark-tail">Technologies</span>
            </span>
          </Link>
          <p style={{ margin: "1rem 0 0", maxWidth: "34ch", fontSize: "0.9375rem", lineHeight: 1.65 }}>
            {COMPANY.tagline}
          </p>
        </div>

        <nav aria-label="Footer">
          <ul>
            {DOORS.map((door) => (
              <li key={door.href}>
                <Link href={door.href}>{door.label}</Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="shell">
        <div className="site-footer-legal">
          <span>
            © {year} {COMPANY.name}. {COMPANY.country}.
          </span>
          <span>
            {/* The product's own site, once it has an address of its own. */}
            ADHD.ME is a {COMPANY.name} product.
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Exported so the sitemap and metadata cannot drift from the footer's idea of the origin. */
export { SITE_URL };
