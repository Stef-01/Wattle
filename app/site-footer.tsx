import Link from "next/link";
import { DOORS, FOOTER_DOORS } from "./site";
import { COMPANY } from "@/content/company";
import { WattleMark } from "./wattle-mark";
import { Acknowledgement } from "./acknowledgement";

/**
 * WHAT IS DELIBERATELY ABSENT: an ABN, a registered office, certification badges, and a
 * copyright range implying a founding year. Each is a fact about a legal entity and none has
 * been supplied. The year is the current one only, which asserts nothing about when the company
 * began. See UNCONFIRMED in src/content/company.ts.
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
          <p style={{ margin: "1rem 0 0", maxWidth: "36ch", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--sage)" }}>
            {COMPANY.tagline}
          </p>
        </div>

        <nav aria-labelledby="footer-site">
          <h2 id="footer-site">Site</h2>
          <ul>
            {DOORS.map((door) => (
              <li key={door.href}>
                <Link href={door.href}>{door.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-reach">
          <h2 id="footer-reach">Reach us</h2>
          <ul>
            <li>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            {FOOTER_DOORS.map((door) => (
              <li key={door.href}>
                <Link href={door.href}>{door.label}</Link>
              </li>
            ))}
            <li style={{ color: "var(--sage)", fontSize: "0.875rem" }}>
              Replies Mon–Fri, AEST/AEDT
            </li>
          </ul>
        </nav>
      </div>

      <Acknowledgement />

      <div className="shell">
        <div className="site-footer-legal">
          <span>
            © {year} {COMPANY.name}. {COMPANY.country}.
          </span>
          <span>ADHD.ME is a {COMPANY.name} product.</span>
        </div>
      </div>
    </footer>
  );
}
