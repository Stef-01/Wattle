import type { MetadataRoute } from "next";
import { SITE_URL, DOORS, FOOTER_DOORS } from "./site";

/**
 * Static export (GitHub Pages) needs this declared: with `output: "export"` Next refuses to
 * collect a metadata route it cannot prove is static. It is static — the door lists are
 * module constants — so saying so costs nothing and the Vercel build is unaffected.
 */
export const dynamic = "force-static";

/**
 * Generated from the SAME door lists the header and footer read, so a page cannot be linked and
 * unlisted at the same time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...[...DOORS, ...FOOTER_DOORS].map((door) => ({
      url: `${SITE_URL}${door.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
