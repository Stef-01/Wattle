// NEXT_PUBLIC_STATIC=1 (scripts/build-static.mjs) builds the whole app as static files for
// GitHub Pages at https://stef-01.github.io/Wattle-Health/. Three modules have a browser twin
// that the webpack replacement below swaps in, so the client bundle never carries node:fs,
// yaml or a server action:
//   src/disciplines/load  → load.static      (vocabulary from src/generated/disciplines.json)
//   src/data/api          → api.static       (match / rerank / lookup in the page over roster.json)
//   src/server/clinician  → clinician-static (the in-memory "Local mode" join flow)
// The three route handlers are route.server.ts files, which only the server build's
// pageExtensions pick up. `pnpm static:data` regenerates src/generated/*.json.
const STATIC = process.env.NEXT_PUBLIC_STATIC === "1";
const BASE_PATH = "/Wattle-Health";

const SWAPS = [
  [/[\\/]disciplines[\\/]load$/, (request) => request.replace(/load$/, "load.static")],
  [/[\\/]data[\\/]api$/, (request) => request.replace(/api$/, "api.static")],
  [/[\\/]server[\\/]clinician$/, (request) => request.replace(/clinician$/, "clinician-static")],
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  pageExtensions: STATIC ? ["tsx", "ts", "jsx", "js"] : ["server.ts", "tsx", "ts", "jsx", "js"],
  outputFileTracingRoot: process.cwd(),
  // disciplines/*.yaml and data/providers/*.jsonl are read with fs at request time.
  outputFileTracingIncludes: { "/**": ["./disciplines/**", "./data/providers/**", "./data/enriched/**"] },
  ...(STATIC
    ? {
        output: "export",
        basePath: BASE_PATH,
        images: { unoptimized: true },
        trailingSlash: true,
        env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
        webpack: (config, { webpack }) => {
          for (const [test, replace] of SWAPS) {
            config.plugins.push(
              new webpack.NormalModuleReplacementPlugin(test, (resource) => {
                resource.request = replace(resource.request);
              }),
            );
          }
          // Belt and braces: a stray node builtin in the browser bundle resolves to nothing
          // rather than failing the build; the swaps above are what keep them out.
          config.resolve.fallback = { ...(config.resolve.fallback ?? {}), fs: false, path: false, crypto: false };
          return config;
        },
      }
    : {}),
};

export default nextConfig;
