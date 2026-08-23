# UX rationale

What each framework actually changed. **Where a framework produced no change, that is recorded
too** — inventing work to make a checklist look thorough is how a rationale document becomes
decoration.

---

## Fitts's law — CHANGED THE MOBILE HEADER

Time to acquire a target falls with size and rises with distance. The mobile header stacked the
wordmark over a row of four inline links: targets ~34px tall, in the top corner — **small and far
from the thumb, two penalties at once.**

Now: one 51px trigger opens a panel whose links are **56px tall, full-width, in the lower half of
the screen** where a thumb already is. Every `Button` variant clears 44px on its short axis; `sm`
exists at 40px only for controls nested inside another target's reach, never for a primary action.

The trigger itself is `size="default"`, not `sm` — on mobile it is the only way to reach the site,
which makes it primary, and shipping *that* control under the threshold would undo the point.

## Hick–Hyman — CHANGED THE MOBILE HEADER, AND NOTHING ELSE

Choice time rises with the number of simultaneous options. Collapsing four doors behind one
control makes the mobile header a single decision, with the four presented only once the visitor
has said they are choosing.

**Desktop was left alone deliberately.** At four items, scanning four labels is faster than one
tap plus a panel. Hick–Hyman only bites when the option set is large enough to pay for the extra
interaction, and four is not.

The footer (4 + 3 links) and the four-door IA were reviewed and left unchanged for the same
reason.

## Gestalt — CHANGED THE PANEL, AND REMOVED A LINE

**Common region:** in the panel the four doors sit inside one bounded group and the two
obligations (Accessibility, email) in another. Grouping by enclosure is read faster than grouping
by spacing alone, and it stops "Accessibility" reading as a fifth destination of the same kind as
"Ventures".

**Proximity over enclosure, once:** the second group first carried its own top rule. With the
first group already ending in a rule, that drew what read as an **empty row**. The rule came out;
the gap alone separates them.

**Similarity** is doing the work in the register layout already — label rail, hairlines — and was
not changed.

## Affordance — CHANGED THE BADGE

A `Badge` carries status and does nothing. It therefore has **no pill fill, no hover state and no
cursor change**, because each of those signals "pressable". A label that looks like a control is a
false affordance, and the cost is a visitor clicking a status and learning the interface lies.

Conversely `Button` keeps its pill, its hover and its focus ring — real affordances for things
that really act.

## Colour theory — NO CHANGE, AND HERE IS WHY

The palette is **analogous**: gold, olive and green are neighbours on the wheel. That is why the
site reads calm rather than energetic, which is the correct harmony for a company asking to be
*believed* rather than to be exciting.

No complementary accent was introduced. A violet or blue against this gold would create chromatic
tension the message does not want, and it would break the rule that the palette is wattle-derived
only.

The strong contrast here is **value, not hue** — near-black on cream, cream on foliage — which is
what carries hierarchy. All twelve text pairings are gated at 4.5:1 by `scripts/contrast-gate.mjs`
on every build.

## Spacing theory — NO CHANGE

One scale (`--gap-1` 0.5rem → `--gap-6` 6.5rem), roughly a 1.6 ratio, already applied throughout.
Spacing is chosen from the scale rather than guessed. Vertical rhythm follows the craft rule of
more space above a heading than below it, so the heading binds to its own content.

Reviewed against an 8pt grid and left alone: the existing scale is consistent and re-basing it
would churn every surface for no legibility gain.

## Nielsen heuristics — CHANGED THE PAUSE CONTROL

| Heuristic | State |
| --- | --- |
| **Visibility of system status** | **Changed.** The pause label says what the button *will do*, not what the page *is doing*. Added an `aria-live="polite"` region announcing "Motion paused / playing" — for readers who cannot see a label change they are not focused on. |
| **User control and freedom** | Already met and now verified end to end: Escape closes the panel, focus returns to the trigger, `aria-hidden` clears from the rest of the page. Motion is pausable (WCAG 2.2.2). |
| **Consistency and standards** | **Changed.** Buttons were four hand-written CSS variants; they are now one `cva` component with typed variants, and the dead `.btn` rules were deleted rather than left as a second definition. |
| **Recognition rather than recall** | Current page marked by `aria-current` *and* a visible label, not colour alone — colour alone fails a reader who cannot distinguish it. |
| **Aesthetic and minimalist design** | Front page cut to 195 words; detail lives on the pages that argue it. |
| **Error prevention / recovery** | Little surface: no forms anywhere, deliberately, because there is no privacy notice to collect under. |
| **Help and documentation** | `/accessibility` states what is enforced and what is unverified, with a reporting channel. |

## Understanding user needs

From `PRODUCT.md`, founder-confirmed: four audiences — commissioners, practices, investors,
prospective hires — arriving with the same question, *is this a real company?*, usually **after** a
meeting or a deck rather than by discovery. **Success is belief, not conversion.**

That is why there is no lead-capture form, no newsletter modal and no "Book a demo" — the visitor
is verifying, not buying, and interrupting a verification with a conversion ask is how you fail
the actual job. It is also why `/approach` publishes what the company does *not* have at the
weight a competitor would give its certifications.

---

## Implementation

React + Tailwind + shadcn patterns (`cva` + Radix + `cn`), in `src/components/ui/`.

**The components are written against this site's own tokens** — `bg-paper`, `text-ink`,
`border-line` — exposed to Tailwind via `@theme inline`. Deliberately *not* shadcn's generic
`--background`/`--foreground` names: a second vocabulary for the same colours is how two design
systems end up in one codebase, each half-true.

Radix earns its place on the panel by doing the part that is genuinely hard and easy to get wrong:
focus trapping, focus restoration, escape-to-dismiss, and `aria-hidden` on the rest of the page.

**A Tooltip was built and then removed.** It measured **27 kB** of first-load JS for a hover-only
hint that touch users never see, on a site whose stated priority is regional connections. The work
it would have done is done free by the visible label and the live region. Cost measured, not
assumed.
