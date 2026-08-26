"use client";

import { useId, useState } from "react";

/**
 * A DISCLOSURE LIST — headings you can open.
 *
 * WHAT THIS REPLACES. /approach published four commitments and seven absences as two columns of
 * fully-expanded prose, side by side, with a third column of argument beside them and the same
 * four commitments repeated in long form further down the page. Every word of it was worth
 * saying and all of it was on screen at once, which is the reliable way to have none of it read.
 * A visitor scanning for "what does this company actually hold" met roughly six hundred words
 * arranged in three parallel columns.
 *
 * The headings are the page now. The detail is one click away and stays out of the way until
 * asked for.
 *
 * NO ACCORDION LIBRARY. Radix Accordion is the obvious reach and it is about 10kB for behaviour
 * that is a button, an aria-expanded, and a height transition. The site ships 102kB total and
 * already declines GSAP and p5 on the same reasoning.
 *
 * THE HEIGHT ANIMATION IS grid-template-rows: 0fr -> 1fr. Height is not animatable from `auto`,
 * which is why this is normally done by measuring the content in JavaScript and writing a pixel
 * height back — a measurement that goes stale on every font load, resize and text reflow. A grid
 * track fraction interpolates natively, so the row grows to exactly its content's height with no
 * measurement anywhere and nothing to go stale. The inner element needs `min-height:0` and
 * `overflow:hidden` or it refuses to be compressed below its content.
 *
 * INDEPENDENT, NOT EXCLUSIVE. Opening one does not close the others: these are reference items
 * somebody may want two of side by side, and an accordion that closes what you were reading
 * because you opened something else is a widget fighting its reader.
 */

export interface DisclosureItem {
  /** The heading. This is the part that is always on screen. */
  title: string;
  /** What opening it reveals. */
  body: string;
  /** Optional second paragraph, for items that carry a longer argument. */
  more?: string;
}

export function DisclosureList({ items, tone }: { items: readonly DisclosureItem[]; tone?: "absent" }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const base = useId();
  /* Resolved OUTSIDE the JSX so the className expression is a bare identifier.

     The class gate extracts every string literal inside a className expression, which is correct
     — `className={cond ? "bloom-head" : undefined}` is a real pattern and it exists to catch
     exactly that. But it means a comparison string sitting in the same expression, as in
     `tone === "absent" ? ... : ...`, is read as a class name and reported missing. The gate is
     not wrong; the code shape was. */
  const listClass = tone === "absent" ? "disclosure disclosure-absent" : "disclosure";

  return (
    <ul className={listClass}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const panelId = `${base}-${i}`;
        return (
          <li key={item.title} className={isOpen ? "is-open" : undefined}>
            <button
              type="button"
              className="disclosure-head"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  next.has(i) ? next.delete(i) : next.add(i);
                  return next;
                })
              }
            >
              <span className="disclosure-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="disclosure-title">{item.title}</span>
              {/* Two crossed rules that become one. A glyph would depend on a font that may not
                  have loaded, and would rotate as a character rather than as a mark. */}
              <span className="disclosure-mark" aria-hidden="true">
                <i /><i />
              </span>
            </button>

            {/* ALWAYS IN THE DOM, NEVER `hidden`.

                Mounting the panel on open would give the height transition nothing to animate
                from. But `hidden` cannot do the hiding either — it resolves to display:none,
                which is not animatable and collapses the grid row instantly, so the transition
                would be dropped on the way in and out.

                The collapsed state is `visibility:hidden` applied on a delay: it takes the panel
                out of the accessibility tree and out of the tab order exactly the way display:none
                would, but only once the height has finished animating shut. Opening removes it
                immediately. A screen reader never reaches a collapsed panel's text, and a
                sighted reader still sees it slide. */}
            <div className="disclosure-panel" id={panelId} role="region">
              <div>
                <p className="body-text">{item.body}</p>
                {item.more ? <p className="body-text" style={{ marginTop: "1em" }}>{item.more}</p> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
