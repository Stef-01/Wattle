# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, confirmed by the founder (2026-08-23), all arriving with the same underlying
question — *is this a real company?*

- **Government and commissioners.** Health departments, PHNs, ministerial staff, assessing
  whether Wattle is a credible party to fund or partner with. They typically arrive *after* a
  meeting, a deck or a search, to check the company is what the room said it was.
- **General practices.** Owners and managers deciding whether to have a conversation about
  ADHD.ME.
- **Investors and partners.** Assessing the company rather than the product: what is in the
  portfolio, who the team is, how the company operates.
- **Prospective hires and collaborators.** Clinicians, engineers, researchers deciding whether
  to work with the company. They read the approach and the team.

## Product Purpose

Wattle Technologies is the company behind ADHD.ME. This site exists so that when any of the four
audiences checks the company, they find a serious one with a clear position.

**Success is belief, not conversion.** The founder was explicit: no action is required of the
visitor. The site succeeds when a commissioner who arrives after a meeting does not bounce, and
leaves confident the company is real, considered and honest. Contact is available, not pushed.

## Positioning

The company builds the *routing layer* of care — the part that decides whether a person who
needs a clinician ever reaches one — and treats access as prior to clinical quality: a service
you cannot reach has no quality to measure.

The claim a neighbouring company could not truthfully copy is the operating one: **regulatory
and evidential discipline is enforced in the build pipeline, not promised on a page.** Copy
linters, a public-surface sweep, founder gates and a contrast gate fail the build rather than
the review.

## Operating Context

Visitors commonly arrive already primed — from a pitch deck, a ministerial conversation, a
practice-facing pitch, or a search for a name they heard once. The site is a verification stop
in a longer process, rarely a discovery channel. It is read on phones as often as desktops, and
by readers who zoom.

## Capabilities and Constraints

- Next.js 15 / React 19 / Tailwind 4, TypeScript strict. All routes prerender static.
- Routes: `/`, `/ventures`, `/approach`, `/team`, `/contact`. Dev server on port 3200.
- `pnpm verify` = typecheck + contrast gate + build. CI runs the same on push.
- No backend, no forms, no analytics. A contact form would need a corporate privacy notice that
  does not exist yet.
- **One venture today.** ADHD.ME, in build, not live at its own address.

## Brand Commitments

- **The name and the mark are the golden wattle** (*Acacia pycnantha*). The palette — blossom
  gold, foliage green, bark-dark type — was chosen explicitly by the founder on 2026-08-23 and
  is binding. `--blossom` is the flower and never carries text; `--gold` is its AA-safe form and
  is the only gold that does.
- **Voice:** plain, exact, unhedged. Short declarative sentences. It states what is true and
  names what is not, and it never reaches for an intensifier where a fact would do.
- Serif display (Newsreader) over sans text (Inter), carried from ADHD.ME so the two read as one
  house.

## Evidence on Hand

- **Real:** two founder-supplied portraits (`public/vikram.png`, `public/stefan.png`) and two
  licensed affiliation marks (NOURISH/Stanford, Harvard T.H. Chan HSIL). The ADHD.ME repository
  is the source for every claim about the product.
- **Deliberately absent, and must never be fabricated:** ABN/ACN, incorporation date, registered
  office, headcount, ownership or funding, corporate privacy policy and terms, insurance,
  clinical governance, complaints route. These are enumerated with reasons in
  `src/content/company.ts` as `UNCONFIRMED`, and no page reads from that list.
- **Also absent:** customers, testimonials, case studies, press, metrics, logos of clients. There
  are none. A layout that needs one is the wrong layout.

## Product Principles

1. **Access before quality.** The first question is whether anyone is reachable at all.
2. **A claim ships only with its source.** Figures stay ranges while unconfirmed; the clinician
   directory stays gated until its subjects confirm their own entries.
3. **Publish what is open, at the same weight as what works.** "Still open" is not a footnote —
   it is the reason the rest is believable.
4. **Enforce it in the build.** A commitment that is not a gate is a comment.
5. **Never write a sentence about a real person or company that nobody said.**

## Accessibility & Inclusion

WCAG AA is a hard floor and is enforced mechanically: `scripts/contrast-gate.mjs` recomputes
every text pairing from the stylesheet and fails the build under 4.5:1. Readers who zoom are an
explicit consideration — layouts must not clip or overflow when type grows. Motion respects
`prefers-reduced-motion`. Australian English throughout.
