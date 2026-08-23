import Link from "next/link";
import { DOORS, FOOTER_DOORS } from "./site";
import { COMPANY } from "@/content/company";
import { Acknowledgement } from "./acknowledgement";

/**
 * FOOTER — two zones.
 *
 * The wordmark set EDGE TO EDGE across the full viewport as the last thing on the page is the
 * signature: the masthead returns at the end, at the largest size it appears anywhere, and the
 * page closes on the company's name rather than on legal small print.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-top">
        <div className="padding-global">
          <div className="footer-cta">
            <h2 className="display-footer">A practice, a service, or a question about the work</h2>
            <div>
              <p className="body-text" style={{ maxWidth: "34ch" }}>
                One address, read by the people building it. No form — there is nowhere for one to
                post yet, and we would rather say so.
              </p>
              <p style={{ marginTop: "1.5vw" }}>
                <a href={`mailto:${COMPANY.email}`} className="button button-pressed">
                  {COMPANY.email}
                </a>
              </p>
              <p className="text-style-tag" style={{ marginTop: "1vw", opacity: 0.6 }}>
                Replies Mon–Fri · AEST/AEDT
              </p>
            </div>
          </div>

          <div className="footer-cols">
            <nav aria-labelledby="f-site">
              <h2 id="f-site">Site</h2>
              {DOORS.map((d) => <Link key={d.href} href={d.href}>{d.label}</Link>)}
            </nav>
            <nav aria-labelledby="f-reach">
              <h2 id="f-reach">Reach us</h2>
              <a href={`mailto:${COMPANY.email}`}>Email</a>
              {FOOTER_DOORS.map((d) => <Link key={d.href} href={d.href}>{d.label}</Link>)}
            </nav>
            <nav aria-labelledby="f-work">
              <h2 id="f-work">Work</h2>
              <Link href="/ventures">ADHD.ME</Link>
              <Link href="/approach">What we do not have</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <Acknowledgement />
        <div className="padding-global">
          {/* Edge to edge. The last thing on the page is the name. */}
          <p className="footer-wordmark" translate="no">Wattle</p>
          <div className="footer-meta">
            <span>© {year} {COMPANY.name}</span>
            <span>{COMPANY.country}</span>
            <span>ADHD.ME is a {COMPANY.shortName} product</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
