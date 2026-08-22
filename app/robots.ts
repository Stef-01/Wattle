import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";
import { TEAM_PUBLIC } from "@/content/team";

/**
 * The disallow list is DERIVED from the team gate, not hand-kept beside it. While the page was
 * gated this file named `/team` explicitly; when the gate opened, that line would have quietly
 * kept a live page out of every index. One flag, three readers (this, the route, the sitemap).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      ...(TEAM_PUBLIC ? {} : { disallow: ["/team"] }),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
