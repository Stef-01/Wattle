"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DOORS, FOOTER_DOORS } from "./site";
import { COMPANY } from "@/content/company";
import { WattleMark } from "./wattle-mark";
import { Menu, Close } from "./icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";

/**
 * One header, one door list (app/site.ts), two presentations.
 *
 * DESKTOP keeps the doors inline: at four items there is nothing to gain by hiding them, and
 * Hick-Hyman only bites when the option set is large enough that scanning costs more than the
 * extra tap does. Four visible labels is faster than one control plus a panel.
 *
 * MOBILE collapses them into a panel — see src/components/ui/sheet.tsx for why. The short version
 * is that inline links in a top corner are small targets far from the thumb, which is two Fitts's
 * law penalties at once.
 *
 * The current page is marked with `aria-current` first and a gold underline second: the underline
 * is the visible half of a state screen readers already had.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link href="/" className="wordmark" translate="no">
          <WattleMark className="wordmark-mark" />
          <span>
            {COMPANY.shortName} <span className="wordmark-tail">Technologies</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ul>
            {DOORS.map((door) => (
              <li key={door.href}>
                <Link href={door.href} data-current={isCurrent(door.href)} aria-current={isCurrent(door.href) ? "page" : undefined}>
                  {door.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            {/* size="default" (44px), not "sm". On mobile this is the ONLY way to reach the
                site, which makes it a primary control — and shipping the one control the whole
                navigation depends on below the Fitts threshold would undo the panel's point. */}
            <Button variant="quiet" className="site-nav-trigger">
              <Menu />
              Menu
            </Button>
          </SheetTrigger>

          <SheetContent aria-describedby={undefined}>
            <div className="sheet-head">
              <SheetTitle className="sheet-title">Menu</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghostOnLeaf" size="sm" aria-label="Close menu">
                  <Close />
                </Button>
              </SheetClose>
            </div>

            {/* GESTALT — COMMON REGION. The four doors sit inside one bounded group and the two
                obligations sit in another. Grouping by enclosure is read faster than grouping by
                spacing alone, and it stops "Accessibility" reading as a fifth destination of the
                same kind as "Ventures". */}
            <ul className="sheet-nav">
              {DOORS.map((door) => (
                <li key={door.href}>
                  <SheetClose asChild>
                    <Link href={door.href} aria-current={isCurrent(door.href) ? "page" : undefined}>
                      {door.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>

            <ul className="sheet-nav sheet-nav-secondary">
              {FOOTER_DOORS.map((door) => (
                <li key={door.href}>
                  <SheetClose asChild>
                    <Link href={door.href}>{door.label}</Link>
                  </SheetClose>
                </li>
              ))}
              <li>
                <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
