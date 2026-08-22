import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* The gated route is disallowed as well as 404'd — belt and braces, and it costs a line. */
      disallow: ["/team"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
