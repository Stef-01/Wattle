import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

/**
 * Static export (GitHub Pages) needs this declared: with `output: "export"` Next refuses to
 * collect a metadata route it cannot prove is static. It is static — the door lists are
 * module constants — so saying so costs nothing and the Vercel build is unaffected.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
