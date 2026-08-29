import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteNav } from "./site-nav";
import { Reveal } from "./reveal";
import { SiteFooter } from "./site-footer";
import { SITE_URL } from "./site";
import { COMPANY } from "@/content/company";

/**
 * The browser chrome matches the HERO's ground rather than --paper, because the hero is the first
 * thing under the address bar on every phone that lands on the home page. Matching --paper here
 * would put a cream seam directly above a dark green band.
 */
export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY.name} — health software for the parts of the system people cannot reach`,
    template: `%s · ${COMPANY.name}`,
  },
  description: COMPANY.tagline,
  openGraph: {
    siteName: COMPANY.name,
    type: "website",
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image" },
};

/**
 * Organization structured data, the compliant subset.
 *
 * `Organization`, NOT `MedicalOrganization`. The brief asked for MedicalOrganization "where
 * applicable" and it is not applicable: Wattle Technologies writes software, it does not provide
 * medical care, and claiming a medical schema type to a search engine is the machine-readable
 * version of holding yourself out as a health service. ADHDME is declared as a `brand` because
 * that is what it is — a product of this company, not a subsidiary entity.
 *
 * DELIBERATELY ABSENT: foundingDate, address, numberOfEmployees, founder, hasCredential, and any
 * rating or review markup. The first five are facts nobody has supplied (src/content/company.ts,
 * UNCONFIRMED); rating and review markup is prohibited for regulated health services and is
 * banned by the ADHDME tree's own compliance laws, which this site does not escape by being the
 * parent company.
 */
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#org`,
      name: COMPANY.name,
      url: SITE_URL,
      email: COMPANY.email,
      description: COMPANY.tagline,
      areaServed: { "@type": "Country", name: "Australia" },
      brand: { "@type": "Brand", name: "ADHDME" },
      knowsLanguage: "en-AU",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#site`,
      url: SITE_URL,
      name: COMPANY.name,
      publisher: { "@id": `${SITE_URL}#org` },
      inLanguage: "en-AU",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteNav />
        <main id="main">{children}</main>
        <SiteFooter />
        <Reveal />
      </body>
    </html>
  );
}
