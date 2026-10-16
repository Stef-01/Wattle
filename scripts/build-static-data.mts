// pnpm static:data — writes the two files the static build (GitHub Pages) ships in the browser
// bundle instead of reading disk at request time:
//   src/generated/disciplines.json  every disciplines/*.yaml, parsed by the strict loader
//   src/generated/roster.json       the Doctor[] src/data/providers.ts serves (Queensland rooms,
//                                   publications, deep-profile fields, illustrative examples)
// Runs under `node --experimental-strip-types` with scripts/static-loader.mjs, so it reuses the
// app's own loaders; nothing is duplicated here. Both files are committed so a Pages build is
// reproducible from the repository alone.
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src", "generated");

// The static demo lists the labelled illustrative examples, like a development server does.
process.env.NEXT_PUBLIC_DEMO ??= "1";
process.env.NODE_ENV ??= "production";

register(pathToFileURL(path.join(ROOT, "scripts", "static-loader.mjs")));

// Placeholders so the loaders' own JSON imports resolve on a first run.
mkdirSync(OUT, { recursive: true });
for (const [file, empty] of [["disciplines.json", "{}"], ["roster.json", "[]"]] as const) {
  const target = path.join(OUT, file);
  if (!existsSync(target)) writeFileSync(target, empty);
}

const { loadDiscipline } = (await import("../src/disciplines/load.ts")) as typeof import("../src/disciplines/load");
const { buildRoster } = (await import("../src/data/providers.ts")) as typeof import("../src/data/providers");

const slugs = readdirSync(path.join(ROOT, "disciplines"))
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .sort();
const disciplines = Object.fromEntries(slugs.map((slug) => [slug, loadDiscipline(slug, ROOT)]));
const roster = buildRoster();

writeFileSync(path.join(OUT, "disciplines.json"), JSON.stringify(disciplines));
writeFileSync(path.join(OUT, "roster.json"), JSON.stringify(roster));

const counts = roster.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.specialty]: (acc[d.specialty] ?? 0) + 1 }), {});
console.log(`disciplines.json: ${slugs.join(", ")}`);
console.log(`roster.json: ${roster.length} doctors`, counts, `(${roster.filter((d) => d.synthetic).length} illustrative)`);
