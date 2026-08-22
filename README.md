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
| `pnpm verify` | typecheck + build — the gate before a commit |

## Layout

- `app/` — the routes: `/` (home), `/ventures`, `/approach`, `/contact`, `/team` (gated)
- `app/globals.css` — the whole palette and every component class, tokens at the top
- `src/content/company.ts` — **the company register.** Every fact about Wattle Technologies
- `src/content/ventures.ts` — the venture register. ADHD.ME's entry
- `src/content/team.ts` — the team gate and roster

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

## The team gate

`/team` is **built and switched off**. ADHD.ME's own team page was gated by founder direction on
2026-08-21 ("we are still building and we dont know who will be on it finally"), and that
direction is about a set of named real people — it does not stop applying because the page moved
to the parent company's domain.

Flip `TEAM_PUBLIC` in `src/content/team.ts` to `true` and the route, the header door, the footer
door and the sitemap entry all come back together. `TEAM` is empty; populate it from ADHD.ME's
`app/about/team.ts` rather than retyping it, so there is one register to keep true.

## Design

A sibling palette, not a second one. `--paper`, `--ink`, `--muted`, `--line` and the amber
`--gold` are ADHD.ME's exact tokens, with their measured contrast ratios carried across in the
comments. What makes this the *parent* is `--leaf`, a deep green ADHD.ME does not use at all:
product surfaces are paper and gold, the company speaks on the green.

The mark is a drawn wattle sprig (`app/wattle-mark.tsx`) — geometric, decorative,
`aria-hidden`, and a placeholder that holds the brand's shape until a designer supplies a real
one.

## Not in this tree yet

No tests, no e2e, no CI. `pnpm verify` is typecheck + build only. If this site grows a contact
form or any dynamic route, it needs both a test layer and a privacy notice before that ships.
