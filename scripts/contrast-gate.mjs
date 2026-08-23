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

const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return m[1];
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

/** Every pairing the site actually renders text in. Foreground, background, where. */
const PAIRS = [
  ["ink", "paper", "body copy"],
  ["ink", "stone", "text on the tinted ground"],
  ["muted", "paper", "secondary copy"],
  ["muted", "stone", "secondary copy on the tinted ground"],
  ["gold", "paper", "eyebrows, links, card indices"],
  ["gold", "gold-soft", "text on the blossom tint"],
  ["paper", "ink", "primary button label"],
  ["on-leaf", "leaf", "headings on the band"],
  ["sage", "leaf", "body copy on the band"],
  ["blossom", "leaf", "eyebrows on the band"],
  ["sage", "leaf-deep", "footer copy"],
  ["blossom", "leaf-deep", "footer links on hover"],
];

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
