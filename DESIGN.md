# Design system — Wattle Technologies

<!-- The visual world, recorded. Companion to PRODUCT.md, which holds product truth only. -->

## The world: a company record

Not a marketing site with a hero and a card grid. The visitor is a commissioner, a practice, a
partner or a future colleague who arrived **from a meeting to check the company is real**, and the
thing that answers that is a document that looks like it was *kept* rather than written.

So the site is set as a register: a label rail beside a content column, hairlines as the only
chrome, one large serif voice for claims, foliage green reserved for where the company speaks in
the first person.

**The one exception is the front door.** The home page opens with a dark, full-bleed band carrying
one enormous living wattle spray — the venture-firm model, borrowed from Blackbird's single-organism
hero. That switch is deliberate and load-bearing: *the dark hero earns attention from a visitor who
arrived curious; the register earns belief from one who arrived to check.* A commissioner gets both,
in that order.

## Information architecture

Four doors, one per job somebody arrives with — the quadrant model large health-tech companies use,
collapsed to the four this company can actually fill.

| Door | Job | Route |
| --- | --- | --- |
| Ventures | What do you own? | `/ventures` |
| Approach | What do you believe, and what have you not resolved? | `/approach` |
| Company | Who are you? | `/company` (mission · team · advisory-board absence) |
| Contact | How do I reach you? | `/contact` |
| Accessibility | (footer) conformance and barrier reporting | `/accessibility` |

**Deliberately absent, not stubbed:** Newsroom/Insights, Impact & Evidence, Careers, Partners &
Investors data room. An empty "Insights" tab on a company with nothing published advertises a gap
and calls it a section. See `docs/BRIEF-GAPS.md`.

## Colour — the golden wattle

*Acacia pycnantha*, founder-pinned and binding. **The flower colour is split in two**, and that
split is the system's one non-obvious rule: wattle gold is bright, and bright gold on paper is
unreadable.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#fcfaf4` | Ground |
| `--stone` | `#f2efe3` | Tinted ground |
| `--line` | `#e2decf` | Hairlines — the only chrome |
| `--ink` | `#1b2416` | Type. Bark-dark, foliage green still in it |
| `--muted` | `#676c5d` | Secondary type |
| `--gold` | `#7c5e0b` | **The only gold that may carry words** |
| `--gold-soft` | `#fbf1d2` | Blossom tint ground |
| `--gold-mid` | `#c9992a` | Decorative only (2.49 on paper) — mark depth, rules, scrollbar |
| `--blossom` | `#f2c230` | The real flower. Dark grounds and the hero bloom |
| `--leaf` | `#2e3d24` | The company's own voice |
| `--leaf-deep` | `#232f1b` | Hero ground, footer |
| `--on-leaf` | `#fcfaf4` | Type on green |
| `--sage` | `#a8b394` | Secondary type on green — tinted from the hue, never grey |

Every text pairing is recomputed from this stylesheet by `scripts/contrast-gate.mjs` on each build
and in CI, and the build **fails** under 4.5:1. The comments cannot go stale.

## Type

- **Display:** Newsreader Variable. `.claim` `clamp(2.35rem, 5.6vw, 4.25rem)`, tracking `-0.035em`,
  `text-wrap: balance`. Capped well under the 6rem ceiling because the copy is sentences, not slogans.
- **Text:** Inter Variable, 16px / 1.65. Carried from ADHD.ME so the two sites read as one house.
  *Flagged by the design detector as an overused face; kept as a recorded brand commitment.*
- **Measure:** `.prose p` 68ch; leads 60ch; list items 62ch. Inside the 65–75ch band.
- Tabular numerals on anything that lines up.

## Spacing

One scale, so spacing is chosen rather than guessed: `--gap-1` 0.5rem → `--gap-6` 6.5rem.

## Motion

**One authored moment, plus one living thing.**

- The hero claim resolves from `blur(12px)` + rise, once. Nothing else on the site enters that way —
  a second identical reveal would make this one furniture.
- The bloom is *alive rather than entering*: the spray drifts on an 11s cycle, the sixteen heads
  breathe on 4.7s with per-head delays so the cluster never pulses as one blob. Two near-prime
  periods, so the pair never resolves into a visible loop.
- The stem draws itself once via `stroke-dashoffset`.
- Scroll reveals use native `animation-timeline: view()` — **no JS, no bundle**, which is what keeps
  the "live" feel compatible with the regional-bandwidth requirement.
- Every default state is **already visible**. Browsers without scroll-driven animation, and readers
  with `prefers-reduced-motion`, get the finished page rather than a blank one waiting for a script.

Hand-authored SVG + CSS, not Lottie: a JSON animation runtime is a dependency plus a network round
trip for something a stylesheet can do.

## Components

`.reg` register grid (label rail + body) · `.entries` hairline-separated list · `.split` equal-weight
what-exists/still-open · `.place` presence entry · `.notice` disclosure block · `.team-plates` ·
`.btn` (primary / quiet / on-leaf) · `.go` inline forward link with drawn arrow · `.on-leaf` band ·
`.hero` + `WattleBloom` · `Acknowledgement`.

## Browser surfaces

Themed from the palette rather than left to the browser: text selection, caret colour, scrollbar
(`scrollbar-color`), focus ring, underline offset, tabular numerals.

## Refused

No eyebrows above headings. No 01/02/03 section numbers. No card grid as page structure. No gradient
text, no glass-as-decoration, no unicode glyphs standing in for icons. No stock photography — the
only photographs are two founder-supplied portraits.
