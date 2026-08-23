/**
 * CLASS GATE — every class a component asks for must exist in the stylesheet.
 *
 * Sibling to contrast-gate.mjs, and it exists for the same reason: the design
 * system is one file, and the thing that goes wrong when a design system is
 * replaced is not that a rule breaks — it is that a page keeps asking for the
 * OLD names and renders with no styling at all, silently, while the build stays
 * green and typecheck has nothing to say about it.
 *
 * That already happened here. The poster-brutalist rewrite replaced globals.css
 * and migrated `/`, `/ventures` and `/approach`; `/company` shipped to
 * production asking for twenty-one classes that no longer existed, and rendered
 * as unstyled markup — default bullet markers, portraits at intrinsic size.
 *
 * Note there is no Tailwind allowlist. tailwindcss is a dependency and is wired
 * into postcss, but globals.css never imports it, so no utilities are generated
 * and every class genuinely has to be in that file. If a `@import "tailwindcss"`
 * is ever added, this gate needs to learn about utilities or it will produce
 * nothing but false positives.
 *
 * MIGRATION BASELINE. Three pages are mid-migration, so failing on any unknown
 * class would just paint CI red and block the person doing the migrating.
 * Instead BASELINE records what is known-unmigrated. The gate fails when a file
 * gets WORSE than its baseline, or when a file not listed here has any missing
 * class at all. Finish a page, drop its line — the number only goes down.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const CSS = join(ROOT, "app/globals.css");

/** Known-unmigrated, with the count as of the poster-brutalist rewrite. */
const BASELINE = {
  "app/company/page.tsx": 21,
  "app/contact/page.tsx": 10,
  "app/accessibility/page.tsx": 11,
  // Components rendered by the pages above, and unmigrated with them.
  "app/specimen-plate.tsx": 18,
  "app/wattle-bloom.tsx": 3,
  "app/wattle-mark.tsx": 2,
};

/** Not rendered by anything — kept out of the count rather than silently passed. */
const UNREACHABLE = new Set(["app/site-header.tsx"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/**
 * Every class defined anywhere in the stylesheet.
 *
 * Deliberately scans the WHOLE file rather than trying to isolate selector text.
 * The obvious implementation — split on `}`, take everything before the first
 * `{` — silently drops every rule nested inside an `@media` block, because the
 * at-rule swallows the first brace. There are fifteen media blocks here, and
 * `.cols-3` is defined only inside two of them, so that version reported a
 * perfectly good class as missing.
 *
 * Scanning everything slightly over-collects: a `url(x.svg)` contributes "svg".
 * That direction is safe — it can only ever hide a real problem, never invent
 * one — and a gate that cries wolf gets switched off.
 */
function definedClasses(css) {
  const set = new Set();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of withoutComments.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) set.add(m[1]);
  return set;
}

/**
 * Class names a file asks for. Handles `className="a b"` and the literal
 * portions of `className={`a ${x}`}` — the interpolated part is unknowable
 * statically and is simply not checked.
 */
function requestedClasses(src) {
  const set = new Set();
  for (const m of src.matchAll(/className\s*=\s*"([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) set.add(c);
  }
  for (const m of src.matchAll(/className\s*=\s*\{`([^`]*)`\}/g)) {
    for (const c of m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/)) if (c) set.add(c);
  }
  for (const m of src.matchAll(/className\s*=\s*\{\s*"([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) set.add(c);
  }
  return set;
}

const defined = definedClasses(readFileSync(CSS, "utf8"));
const rows = [];
let failed = false;

for (const file of walk(join(ROOT, "app"))) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (UNREACHABLE.has(rel)) continue;

  const missing = [...requestedClasses(readFileSync(file, "utf8"))]
    .filter((c) => !defined.has(c))
    .sort();
  if (!missing.length && !(rel in BASELINE)) continue;

  const allowed = BASELINE[rel] ?? 0;
  const over = missing.length > allowed;
  const under = rel in BASELINE && missing.length < allowed;
  if (over) failed = true;

  rows.push({ rel, count: missing.length, allowed, over, under, missing });
}

if (!rows.length) {
  console.log("Every class resolves. No page is asking for a name the stylesheet does not have.");
  process.exit(0);
}

for (const r of rows) {
  const tag = r.over ? "FAIL" : r.under ? "improved" : "known";
  console.log(`${tag.padEnd(9)} ${r.rel}  ${r.count} missing (baseline ${r.allowed})`);
  if (r.over || !(r.rel in BASELINE)) console.log(`          ${r.missing.join(" ")}`);
  if (r.under) console.log(`          lower the baseline to ${r.count}`);
}

const total = rows.reduce((n, r) => n + r.count, 0);
console.log(`\n${total} unresolved class references across ${rows.length} file(s).`);

if (failed) {
  console.error("\nA file asks for more missing classes than its baseline allows.");
  process.exit(1);
}
console.log("Within baseline — no new unstyled markup.");
