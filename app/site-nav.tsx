"use client";

import Link from "next/link";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DOORS, FOOTER_DOORS } from "./site";
import { COMPANY } from "@/content/company";
import { VENTURES } from "@/content/ventures";
import { MotionToggle } from "./motion-toggle";

/**
 * NAVIGATION — three cells: menu toggle, wordmark, one CTA.
 *
 * THE WORDMARK IS THE HEADER. At 3.4vw it is the largest thing on screen above the fold, which
 * is the poster move: the masthead is set like a printed title page rather than tucked into a
 * corner at 16px.
 *
 * The full-screen menu runs on Radix Dialog rather than a hand-rolled overlay, because the hard
 * parts of a 100vw menu are the invisible ones — trapping focus inside it, restoring focus to
 * the toggle on close, making the page behind inert, and closing on Escape. The look is entirely
 * the spec's; only the behaviour is borrowed.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className="nav-block">
        <div className="nav-wrapper padding-global">
          <Dialog.Trigger asChild>
            <button type="button" className="menu-toggle" aria-expanded={open}>
              <span /><span /><span />
              <span className="sr-only">Menu</span>
            </button>
          </Dialog.Trigger>

          <Link href="/" className="nav-logo display-wordmark" translate="no">
            Wattle
          </Link>

          <Link href="/contact" className="button button-small nav-cta">
            Get in touch
          </Link>
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Content className="menu-overlay" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          {/* LEFT, BLACK: the destinations, set as display type. */}
          <nav className="menu-left" aria-label="Primary">
            {DOORS.map((door, i) => (
              <div className="menu-group" key={door.href}>
                <Dialog.Close asChild>
                  <Link
                    href={door.href}
                    className="display-nav"
                    /* One link per menu takes the accent, to give the eye an entry point
                       rather than four identical slabs. */
                    style={i === 0 ? { color: "var(--wattle)" } : undefined}
                  >
                    {door.label}
                  </Link>
                </Dialog.Close>
              </div>
            ))}

            {/* THE PAUSE CONTROL LIVES HERE NOW.

              It was a pill sitting on the gate itself and was removed from there by direction —
              it read as chrome on top of the artwork. Deleting the capability was not an option:
              WCAG 2.2.2 asks for a mechanism to stop content that starts on its own, runs past
              five seconds and sits alongside other content, and the bloom does all three.
              `prefers-reduced-motion` does not discharge that — it serves the reader who set a
              preference in advance, and says nothing to the one who did not and is simply
              finding it hard to read next to a moving object.

              In the menu it is off every tile, reachable from every page, and in the one place a
              visitor already goes looking for site-wide controls. */}
          <div className="menu-group menu-motion">
            <MotionToggle />
          </div>

          <ul className="menu-links">
              {FOOTER_DOORS.map((d) => (
                <li key={d.href}>
                  <Dialog.Close asChild>
                    <Link href={d.href}>{d.label}</Link>
                  </Dialog.Close>
                </li>
              ))}
              <li><a href={`mailto:${COMPANY.email}`}>Email</a></li>
            </ul>
          </nav>

          {/* RIGHT, WHITE: what the company actually has. Blackbird puts recent articles here;
              this company has no newsroom, so the slot carries the venture rather than an empty
              "Insights" grid pretending to be one. */}
          <div className="menu-right">
            <p className="text-style-tag">In build</p>
            <h2 className="heading-style-h3" style={{ marginTop: "1vw" }}>
              {VENTURES[0]?.name}
            </h2>
            <p className="body-text" style={{ marginTop: "1vw", maxWidth: "34ch" }}>
              {VENTURES[0]?.summary}
            </p>
            <p style={{ marginTop: "2vw" }}>
              <Dialog.Close asChild>
                <Link href="/ventures" className="button button-small">
                  See the venture
                </Link>
              </Dialog.Close>
            </p>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="button button-small button-invert"
              style={{ position: "fixed", top: "1vw", right: "var(--gutter)", zIndex: 5 }}
            >
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
