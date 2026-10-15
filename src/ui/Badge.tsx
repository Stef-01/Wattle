import type { Observed, Tier } from "@/src/matching/types";
import { sourceLabel } from "@/src/data/types";

const TIER_WORD: Record<Tier, string> = { register: "Register", declared: "Declared", found: "Found" };

/** "Found · RANZCP · 2026-10-15" beside every fact. */
export function TierBadge({ tier, source, date, href }: { tier: Tier; source: string; date: string; href?: string }) {
  const text = `${TIER_WORD[tier]} · ${sourceLabel(source)} · ${date}`;
  const cls = "inline-flex items-center rounded-full border border-line bg-mist px-2 py-0.5 text-[11px] leading-4 text-ink-soft whitespace-nowrap";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} underline-offset-2 hover:underline`}>
      {text}
    </a>
  ) : (
    <span className={cls}>{text}</span>
  );
}

export function ObservedBadge({ o }: { o: Observed<unknown> }) {
  return <TierBadge tier={o.tier} source={o.source} date={o.observedAt} href={o.sourceUrl} />;
}

/** "Not declared" is a value, never a blank. */
export function NotDeclared() {
  return <span className="text-ink-soft">Not declared</span>;
}

export function Band({ band }: { band: "strong" | "some" | "listed" }) {
  const copy = { strong: "Strong clinical fit", some: "Some clinical fit", listed: "Listed, no match yet" }[band];
  const tone = { strong: "bg-foliage text-paper", some: "bg-mist text-foliage border border-foliage/40", listed: "bg-mist text-ink-soft border border-line" }[band];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{copy}</span>;
}
