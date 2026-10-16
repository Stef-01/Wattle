// pnpm build:static — the GitHub Pages build: regenerate src/generated/*.json, then
// `next build` with output "export" (see next.config.mjs) into out/. The demo flag lists the
// illustrative examples, as the hosted demo does. Sets the env itself so the script works in
// every shell (no cross-env).
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, NEXT_PUBLIC_STATIC: "1", NEXT_PUBLIC_DEMO: "1", NODE_ENV: "production" };
delete env.NEXT_PUBLIC_SUPABASE_URL;
delete env.SUPABASE_SERVICE_ROLE_KEY;

function run(args) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(["--experimental-strip-types", "--no-warnings", "scripts/build-static-data.mts"]);
// A server build's cache would otherwise be reused with the wrong page set.
rmSync(path.join(ROOT, ".next"), { recursive: true, force: true });
rmSync(path.join(ROOT, "out"), { recursive: true, force: true });
run([path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "build"]);
console.log("static build in out/ (basePath /Wattle-Health)");
