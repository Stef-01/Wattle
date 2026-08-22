import type { MetadataRoute } from "next";
import { SITE_URL, DOORS } from "./site";

/**
 * The sitemap is generated from the SAME door list the header and footer read, so a page cannot
 * be linked and unlisted (or listed and gated) at the same time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...DOORS.map((door) => ({
      url: `${SITE_URL}${door.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
