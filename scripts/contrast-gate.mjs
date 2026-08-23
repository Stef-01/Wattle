/**
 * THE CONTRAST GATE.
 *
 * Reads the tokens straight out of `app/globals.css` and recomputes every pairing that carries
 * text, against the WCAG AA floor of 4.5. It exists because this stylesheet documents a measured
 * ratio beside nearly every colour, and a documented ratio is the first casualty of a recolour:
 * the numbers stay confidently in the comments while the colours move out from under them.
 *
 * That is not hypothetical here. `--gold-mid` shipped with "3.0 on paper" in its comment and
 * measured 2.49. Nothing caught it but a person deciding to check.
 *
 * DECORATIVE TOKENS ARE NOT EXEMPT BY ASSERTION — they are exempt by not appearing in PAIRS.
 * Adding a token to that list is a claim that nothing on the site sets words in it, and the
 * claim belongs in a review, which is exactly where a diff to this file puts it.
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Accepts #abc as well as #aabbcc — the palette writes black and white in shorthand. */
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  const h = m[1];
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
};

const srgb = (hex) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

const luminance = (hex) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/**
 * Every pairing the site actually renders text in.
 *
 * THE SPEC ITSELF FLAGS THIS AS THE LOOK'S WEAK POINT: --wattle and --bloom fail on white, and
 * are only ever legal on black or as BACKGROUNDS carrying black text. This gate is what turns
 * that from a note in a document into something the build enforces — because a rule written down
 * is a rule somebody breaks on a Friday.
 *
 * Any hue used as a section background is listed here with the text colour its utility class
 * actually sets, so a section whose ground and type disagree cannot ship.
 */
const PAIRS = [
  ["white", "black", "body copy on the default canvas"],
  ["black", "white", "white punctuation sections"],
  ["wattle", "black", "accent text and link hover on black"],
  ["black", "wattle", "the ticker, and gold-ground cards"],
  ["black", "bloom", "pale blossom grounds"],
  ["black", "eucalypt", "green grounds — the CTA block"],
  ["black", "lorikeet", "blue grounds"],
  ["black", "blossom", "soft pink grounds"],
  ["black", "ochre", "warm neutral grounds"],
  ["black", "waratah", "red-orange grounds"],
  ["black", "boronia", "hot pink grounds"],
  ["white", "desertpea", "magenta grounds"],
  ["white", "jacaranda", "violet grounds"],
];

/* --------------------------------------------------------------------------
   THE PALETTE IS EXACTLY TEN HUES, PLUS BLACK AND WHITE.

   The spec states it and says nothing outside the list, ever. It drifted once anyway — an
   eleventh, --wattle-bud, was added in good faith to solve a real rendering problem, and the
   honest fix turned out to be deriving that colour from two existing hues instead.

   A rule nobody can enforce is a rule that drifts again, so this asserts it. Adding a hue now
   means editing this list, which puts the decision in a diff somebody reviews rather than in a
   file nobody re-reads.
   -------------------------------------------------------------------------- */
const ALLOWED = [
  "black", "white",
  "wattle", "bloom", "waratah", "boronia", "blossom",
  "eucalypt", "lorikeet", "desertpea", "jacaranda", "ochre",
];

const declared = [...css.matchAll(/^\s*--([a-z-]+)\s*:\s*#[0-9a-fA-F]{3,6}/gm)].map((m) => m[1]);
const extra = declared.filter((n) => !ALLOWED.includes(n));
if (extra.length) {
  console.error(`\nPALETTE: ${extra.length} colour token(s) outside the ten:`);
  extra.forEach((n) => console.error(`  --${n}`));
  console.error("Derive the colour from two existing hues, or add it to ALLOWED deliberately.");
  process.exit(1);
}
console.log(`palette: ${ALLOWED.length - 2} hues + black/white — as specified\n`);

const FLOOR = 4.5;
let failed = 0;

for (const [fg, bg, where] of PAIRS) {
  const r = ratio(token(fg), token(bg));
  const ok = r >= FLOOR;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"}  ${r.toFixed(2).padStart(5)}  --${fg} on --${bg}  (${where})`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} pairing(s) under the ${FLOOR}:1 AA floor.`);
  process.exit(1);
}
console.log(`\nAll ${PAIRS.length} pairings clear ${FLOOR}:1.`);
