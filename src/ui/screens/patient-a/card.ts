// What a result card says, in closed vocabulary, read off the engine's reasons (2026-10-16).
// Nothing here invents a fact: the chips are the reasons' labels, the quote is the doctor's
// published words, the practical line is what the record declares.
import type { Card } from "@/src/data/search-types";

const PATTERNS: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/^Declares (.+) as a condition they see$/, (m) => m[1]!],
  [/^Sees (.+) sometimes$/, (m) => m[1]!],
  [/^Lists (.+) among their clinical interests$/, (m) => m[1]!],
  [/^Says they particularly enjoy helping with (.+)$/, (m) => m[1]!],
  [/^Says they particularly enjoy working with (.+)$/, (m) => m[1]!],
  [/^Has published on (.+)$/, (m) => `research on ${m[1]!}`],
  [/^Has published research$/, () => "published research"],
  [/^Describes their approach as (.+)$/, (m) => m[1]!],
  [/^Their philosophy of care reads as (.+)$/, (m) => m[1]!],
  [/^Declares a (.+) manner$/, (m) => m[1]!],
  [/^Shares lived experience/, () => "lived experience"],
];

/** "ADHD" stays; "Persistent pelvic pain" → "persistent pelvic pain". */
function lower(label: string): string {
  const head = label.split(/\s+/)[0] ?? label;
  return /^[A-Z0-9/-]{2,}$/.test(head) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/** The short labels a card shows as "Matches" chips, clinical first, no duplicates, at most `max`. */
export function matchChips(card: Card, max = 4): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (label: string) => {
    const key = label.toLowerCase();
    if (seen.has(key) || out.length >= max) return;
    seen.add(key);
    out.push(lower(label));
  };
  const texts = [...card.clinicalFit.reasons, ...(card.humanFit.basis === "none" ? [] : card.humanFit.reasons)];
  for (const t of texts) {
    for (const [re, pick] of PATTERNS) {
      const m = re.exec(t);
      if (m) {
        push(pick(m));
        break;
      }
    }
  }
  return out;
}

/** True when the card rests on a specialty listing only, with no documented focus. */
export function listedOnly(card: Card): boolean {
  return card.clinicalFit.band === "listed";
}
