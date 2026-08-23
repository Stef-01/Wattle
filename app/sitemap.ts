import type { MetadataRoute } from "next";
import { SITE_URL, DOORS, FOOTER_DOORS } from "./site";

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
