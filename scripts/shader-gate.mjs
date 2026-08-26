/**
 * A BACKTICK INSIDE A GLSL COMMENT ENDS THE TEMPLATE LITERAL.
 *
 * Every shader in this repo is a JavaScript template literal, and the comments inside them are
 * written the way comments are written everywhere else in the codebase — which means reaching
 * for `backticks` to quote an identifier. That closes the string. The failure surfaces as a
 * TypeScript parse error dozens of lines further down, in code that is completely fine, and it
 * has now happened three times.
 *
 * tsc does catch it. It catches it as "',' expected" at a line that has nothing to do with the
 * cause, which is a bad enough signpost to be worth a gate that names the real problem.
 */
import { readFileSync } from "node:fs";

const FILE = "src/wattle/shaders.ts";
const src = readFileSync(FILE, "utf8");
const lines = src.split("\n");

let inGlsl = false;
const offenders = [];

lines.forEach((line, i) => {
  // Opening a shader literal: `export const X = /* glsl */ \``
  if (!inGlsl && /\/\* glsl \*\/\s*`/.test(line)) { inGlsl = true; return; }
  // Closing it: a line that is exactly the terminator.
  if (inGlsl && /^`;\s*$/.test(line)) { inGlsl = false; return; }
  if (inGlsl && line.includes("`")) {
    offenders.push({ line: i + 1, text: line.trim().slice(0, 96) });
  }
});

if (offenders.length) {
  console.error(`\n${FILE}: backtick inside a GLSL literal — this ends the template string.\n`);
  for (const o of offenders) console.error(`  line ${o.line}:  ${o.text}`);
  console.error(`\nQuote identifiers in shader comments with "double quotes" instead.\n`);
  process.exit(1);
}

console.log("shaders: no stray backticks inside GLSL literals.");
