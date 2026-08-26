# Wattle Technologies

The corporate site for **Wattle Technologies**, the company behind [ADHD.ME](../ADHD).

It is a separate tree from the product on purpose: the product's public surfaces are governed
by Australian health-advertising rules and a compliance suite that runs in its build, and a
company page about hiring or partnerships has no business being routed through that. Same
house, different door.

## Run it

```bash
export PATH="$HOME/.local/bin:$PATH"   # node + pnpm live here on this machine
pnpm install
pnpm dev                                # http://localhost:3200
```

Port **3200** is deliberate — ADHD.ME's dev server holds 3000 (and falls back to 3001), and its
Playwright suite uses 3100. All three can run at once.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on :3200 |
| `pnpm build` | Production build (all routes prerender static) |
| `pnpm start` | Serve the production build on :3200 |
| `pnpm typecheck` | `tsc --noEmit`, strict, `noUncheckedIndexedAccess` on |
| `pnpm contrast` | Recomputes every text pairing in `globals.css` against the 4.5:1 AA floor |
| `pnpm classes` | Fails if any component asks for a CSS class or `var()` that does not exist |
| `pnpm verify` | typecheck + contrast + classes + build — the gate before a commit |

## Layout

- `app/` — the routes: `/` (home), `/ventures`, `/approach`, `/company`, `/contact`, `/accessibility`
- `app/globals.css` — the whole palette and every component class, tokens at the top
- `src/content/company.ts` — **the company register.** Every fact about Wattle Technologies
- `src/content/ventures.ts` — the venture register. ADHD.ME's entry
- `src/content/team.ts` — the team gate and roster
- `src/content/presence.ts` — where the company actually operates
- `src/content/disclosures.ts` — **what it does not hold**, published rather than faked
- `PRODUCT.md` / `DESIGN.md` — product truth and the visual world
- `docs/BRIEF-GAPS.md` — **read before launch.** Every point needing a real fact or genuine consultation

Three doors, one list: `DOORS` in `app/site.ts` feeds the header, the footer *and* the sitemap,
so a page cannot be linked and unlisted at the same time.

## What this site deliberately does not say

The rule carried over from the ADHD.ME tree is that a sentence about a real company or a real
person ships only if somebody actually said it. So there is no logo wall, no metrics strip, no
testimonial row, no "founded in ____", and no ABN in the footer — not because a company site
should not have them, but because **nobody has supplied them to this repository.**

`UNCONFIRMED` in `src/content/company.ts` is the list of exactly those gaps, with the reason
each one matters. No page reads from it; it is a to-do for a human. **Before this goes public,
close these:**

1. ABN / ACN and the registered entity name — required on Australian commercial pages
2. Date of incorporation
3. Registered office (ADHD.ME names Beecroft NSW and the Gold Coast QLD as areas *served* — an
   area served is not an address)
4. A privacy policy and terms **for the company**; ADHD.ME's own do not cover the parent
5. Insurance, clinical governance and a complaints route — every practice will ask
6. A company email. `COMPANY.email` currently points at the address ADHD.ME already publishes
   in its Organization JSON-LD, so it discloses nothing new — but it is a personal Gmail, and it
   is the one constant to change once a domain exists.

## The team

The team lives on `/company` and is **live**, carrying Vikram Ganeshalingam and Stefan Thottunkal — Vikram's direction,
2026-08-22.

`TEAM_PUBLIC` in `src/content/team.ts` is the single switch: flip it and the team section on
`/company` disappears with it. Adding a person is one entry in `TEAM`.

Both entries are **transcribed** from ADHD.ME's `app/about/team.ts`, where they were supplied by
their subjects — not rewritten for a company page. `role` and `remit` render only when supplied,
so somebody can be added the day their name arrives and gain a line later; a plate with nothing
but a name is the honest intermediate state. Portraits are the founder-supplied photographs from
the same tree, and `portrait: null` falls back to a monogram at the same size. Affiliation logos
ship only where licensed to us — which is why Bond renders as a wordmark and NOURISH and the
Health Systems Innovation Lab render as marks.

**ADHD.ME's own `/about` stays gated.** Its 2026-08-21 direction ("we dont know who will be on it
finally") covers five people, two of whom have not confirmed their entries. A narrower
instruction here is not a wider one there, which is why the two gates are separate flags in
separate trees.

## Design

See **[DESIGN.md](DESIGN.md)** for the full system. The short version: the site is set as a
*company record* — label rail beside content, hairlines as the only chrome — behind one dark
full-bleed front door carrying a living wattle spray. The dark hero earns attention; the register
earns belief.

### The golden wattle palette

The palette is *Acacia pycnantha*: bright golden blossom, grey-green foliage, a warm bark-dark
for the type. It started as ADHD.ME's tokens and was recoloured on 2026-08-23 — the product's
brown-amber accent reads as spice rather than as wattle, and this is the parent company, which
gets to look like the thing it is named after.

**The flower colour is split in two, and that split is load-bearing.** Wattle gold is bright,
and bright gold on paper is unreadable. So `--blossom` (`#f2c230`) is the real flower and is
used on dark grounds and as decoration, while `--gold` (`#7c5e0b`) is the same hue taken down
to a golden-olive that clears AA as text. **Anything carrying words uses `--gold`.**
`--gold-mid` measures 2.49 on paper and carries nothing but the depth in the mark.

Measured, not eyeballed — every ratio in the `:root` comments was verified in-browser:

| pairing | ratio |
| --- | --- |
| `--ink` on `--paper` | 15.35 |
| `--muted` on `--paper` / `--stone` | 5.19 / 4.70 |
| `--gold` on `--paper` / `--gold-soft` | 5.81 / 5.38 |
| `--on-leaf` / `--sage` / `--blossom` on `--leaf` | 11.12 / 5.27 / 6.93 |

`--leaf` is the foliage green, and it is what makes this the *parent*: ADHD.ME has no green at
all. Product surfaces are paper and gold; the company speaks on the green.

The mark is a drawn wattle sprig (`app/wattle-mark.tsx`) — geometric, decorative,
`aria-hidden`, and a placeholder that holds the brand's shape until a designer supplies a real
one. `app/opengraph-image.tsx` hardcodes its palette because the OG renderer has no stylesheet
to read tokens from, so **a `:root` change must be repeated there by hand.**

## CI

`.github/workflows/ci.yml` runs three jobs on push to `main` and on every PR: **verify**
(install, typecheck, build), **contrast**, and **classes**.

The contrast job exists because `globals.css` documents a measured ratio beside nearly every
token, and a documented ratio is the first casualty of a recolour — the numbers stay
confidently in the comments while the colours move out from under them. That already happened
once: `--gold-mid` shipped commented at 3.0 and measured 2.49. `scripts/contrast-gate.mjs`
reads the tokens out of the stylesheet, recomputes all twelve text pairings and fails under
4.5:1. Decorative tokens are exempt by *not appearing in the pairs list*, so exempting one is a
diff somebody reviews.

### The class gate

`scripts/class-gate.mjs` exists because a design system lives in one file, and what breaks when
one is replaced is not a rule — it is a page still asking for the old names. That is not
hypothetical either. The poster-brutalist rewrite migrated `/`, `/ventures` and `/approach`;
`/company`, `/contact`, `/accessibility` and the 404 kept their old class names and shipped to
production as **unstyled markup** — default bullet markers, portraits at intrinsic size,
affiliation logos at full width — with the build green and typecheck silent the whole time.

It checks two things, and the second matters more:

1. Every class in a `className` resolves to a selector in `globals.css`.
2. Every `var(--x)` resolves to a property defined there.

A missing class is at least visible. A missing **custom property** fails silently and partially:
`fill: var(--gold-mid)` with no `--gold-mid` is an invalid declaration, not a fallback. The
specimen plate and the hero's no-WebGL spray were both painting *Acacia pycnantha* with
`--blossom` — which is soft pink in the ten-hue palette — plus `--gold-mid` and `--sage`, neither
of which exists. A pink national floral emblem with two dead gradient stops, and nothing in CI
had an opinion. It was found by looking at a screenshot.

It carries a `BASELINE` for known-unmigrated files so a half-finished migration does not paint CI
red and block the person doing it. The baseline is empty now; leave it that way.

## Not in this tree yet

No unit tests and no e2e. If this site grows a contact form or any dynamic route, it needs both
a test layer and a privacy notice before that ships.

## The wattle animation

Two tiers — a Canvas2D base that runs everywhere and an instanced WebGL layer that enhances it
on capable devices. Skill attribution, the phyllotaxis and shader maths, and the things
deliberately left out are in **[docs/BLOOM-SYSTEM.md](docs/BLOOM-SYSTEM.md)**.
