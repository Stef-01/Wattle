/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  // disciplines/*.yaml and data/providers/*.jsonl are read with fs at request time.
  outputFileTracingIncludes: { "/**": ["./disciplines/**", "./data/providers/**", "./data/enriched/**"] },
};
export default nextConfig;
