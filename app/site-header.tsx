"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOORS } from "./site";
import { COMPANY } from "@/content/company";
import { WattleMark } from "./wattle-mark";

/**
 * One header, one door list (app/site.ts). A page added tomorrow cannot ship with a different
 * idea of what this site contains.
 *
 * The current-page marker is `aria-current="page"` first and a gold underline second — the
 * underline is the visible half of a state screen readers already had.
 */
export function SiteHeader() {
  const pathname = usePathname();

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
            {DOORS.map((door) => {
              const current = pathname === door.href || pathname.startsWith(`${door.href}/`);
              return (
                <li key={door.href}>
                  <Link href={door.href} data-current={current} aria-current={current ? "page" : undefined}>
                    {door.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
