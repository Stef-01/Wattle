/**
 * Two deploy targets, one app.
 *
 * VERCEL (vercel.json) serves the app normally at the domain root — server rendering,
 * image optimisation, everything Next does by default. That path is untouched here.
 *
 * GITHUB PAGES serves a STATIC EXPORT at https://stef-01.github.io/Wattle/, which is a
 * project page and therefore lives under a `/Wattle` sub-path rather than at the root. Two
 * things follow, and both are why this file is conditional rather than fixed:
 *
 *   BASE PATH.  Every internal link and asset URL must carry `/Wattle`, or the deployed site
 *               loads its HTML and then 404s on its own CSS, JS and images.
 *   NO OPTIMISER. `next/image` optimises on a server Pages does not have, so images must be
 *               passed through unoptimised or the build refuses to export.
 *
 * The switch is an env var set only by the Pages workflow. Local `next dev -p 3200` and the
 * Vercel build both see the plain config, so nothing about day-to-day work changes — a
 * hard-coded basePath would move the dev server to localhost:3200/Wattle and quietly break
 * every link anybody is working on.
 */
const isPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  devIndicators: false,
  ...(isPages
    ? {
        output: "export",
        basePath: "/Wattle",
        assetPrefix: "/Wattle/",
        images: { unoptimized: true },
        // Pages serves /approach as /approach/index.html; without this the export emits
        // /approach.html and every internal link 404s.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
