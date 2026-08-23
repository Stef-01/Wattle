import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SITE_URL } from "./site";
import { COMPANY } from "@/content/company";

/** The browser chrome matches --paper, so there is no seam at the top of a phone screen. */
export const viewport: Viewport = {
  themeColor: "#fcfaf4",
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
 * DELIBERATELY ABSENT: `foundingDate`, `address`, `numberOfEmployees`, `founder`, and any
 * rating or review markup. The first four are facts nobody has supplied (src/content/company.ts,
 * UNCONFIRMED); rating and review markup is prohibited for regulated health services and is
 * banned by the ADHD.ME tree's own compliance laws, which this site does not get to escape by
 * being the parent company.
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
      areaServed: { "@type": "Country", name: "Australia" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#site`,
      url: SITE_URL,
      name: COMPANY.name,
      publisher: { "@id": `${SITE_URL}#org` },
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
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
