// pnpm deploy:pages — pushes out/ (from pnpm build:static) to the gh-pages branch of origin as
// a single fresh commit (force), with .nojekyll so Pages serves the _next/ folder. Uses a
// temporary git repository, never the working tree. GitHub Pages must be set to serve that
// branch from "/" (gh api repos/Stef-01/Wattle-Health/pages).
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const BRANCH = process.env.PAGES_BRANCH ?? "gh-pages";
const REMOTE = process.env.PAGES_REMOTE ?? "origin";

if (!existsSync(path.join(OUT, "index.html"))) {
  console.error("out/index.html is missing: run pnpm build:static first");
  process.exit(1);
}

const git = (args, cwd) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
const remoteUrl = git(["remote", "get-url", REMOTE], ROOT);
const sha = git(["rev-parse", "--short", "HEAD"], ROOT);

const tmp = mkdtempSync(path.join(os.tmpdir(), "wattle-pages-"));
try {
  cpSync(OUT, tmp, { recursive: true });
  writeFileSync(path.join(tmp, ".nojekyll"), "");
  git(["init", "-q", "-b", BRANCH], tmp);
  git(["config", "user.email", "pages@wattle.local"], tmp);
  git(["config", "user.name", "wattle deploy"], tmp);
  git(["add", "-A"], tmp);
  git(["commit", "-q", "-m", `pages: static build of ${sha}`], tmp);
  git(["push", "--force", remoteUrl, `${BRANCH}:${BRANCH}`], tmp);
  console.log(`pushed out/ to ${REMOTE}/${BRANCH} (${sha})`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
