"use client";
// Pieces the C01–C08 screens share that the kit does not carry (Roboto-medium titles, the 58 px field,
// the 44 r14 small pill, the 4 px progress bar, the step header). Icons are the Figma assets in public/figma/c.
import Link from "next/link";
import { asset } from "@/src/ui/base-path";
import type { ReactNode } from "react";
import { Circle } from "@/src/ui/kit";

export const ASSET = asset("/figma/c");

/** A Figma SVG at its own size. */
export function Asset({ name, size, className }: { name: string; size: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${ASSET}/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" className={className} />;
}

/** Back circle + spacer + right text (Roboto Medium 16 grey): "1 of 4", "Log in". */
export function StepHeader({ back, right, rightHref }: { back: string; right?: string; rightHref?: string }) {
  return (
    <div className="flex h-11 items-center gap-4">
      <Circle href={back} label="Back"><Asset name="arrow-left" size={20} /></Circle>
      <span className="flex-1" />
      {right ? (
        rightHref ? (
          <Link href={rightHref} className="text-[16px] font-medium text-grey">{right}</Link>
        ) : (
          <span className="text-[16px] font-medium text-grey">{right}</span>
        )
      ) : null}
    </div>
  );
}

/** Roboto Medium 30 / 1.2 title, optional Inter Medium 20 / 1.4 subtitle 10 px below. */
export function StepTitle({ children, sub, size = 30 }: { children: ReactNode; sub?: ReactNode; size?: 30 | 26 }) {
  return (
    <div className="flex flex-col">
      {/* globals.css sets h1 to Poppins 600 (unlayered, so it beats utilities); C-screens are Roboto Medium. */}
      <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }} className={size === 30 ? "text-[30px] leading-[1.2] text-charcoal" : "text-[26px] leading-[1.25] text-charcoal"}>{children}</h1>
      {sub ? <p className={size === 30 ? "mt-[10px] font-inter text-[20px] font-medium leading-[1.4] text-grey" : "mt-[10px] font-inter text-[16px] font-medium text-grey"}>{sub}</p> : null}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[14px] text-grey">{children}</p>;
}

export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={["text-[14px] text-grey", className].filter(Boolean).join(" ")}>{children}</p>;
}

/** Field 58 r20 2px #D2D2D2, pl 31 pr 24, optional 2x32 divider + 24 icon on the right. */
export function Field({ value, onChange, placeholder, icon, type = "text", name, inputMode, autoComplete, prefix }: { value: string; onChange: (v: string) => void; placeholder?: string; icon?: ReactNode; type?: string; name: string; inputMode?: "text" | "email" | "decimal"; autoComplete?: string; prefix?: string }) {
  return (
    <label className="flex h-[58px] w-full items-center gap-4 rounded-field border-2 border-line bg-white pl-[31px] pr-6">
      {prefix ? <span className="text-[16px] font-medium text-charcoal">{prefix}</span> : null}
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={["min-w-0 flex-1 bg-transparent text-[16px] font-medium text-charcoal outline-none placeholder:text-grey/60", prefix && "-ml-[14px]"].filter(Boolean).join(" ")}
      />
      {icon ? (
        <>
          <span className="h-8 w-0.5 shrink-0 bg-line" aria-hidden="true" />
          <span className="inline-flex size-6 shrink-0 items-center justify-center">{icon}</span>
        </>
      ) : null}
    </label>
  );
}

/** Small pill 44 r14 px16 text 14 (C06 Keep/Edit/Say it again, C07 On/Off). */
export function SmallPill({ children, on, onClick, label, role }: { children: ReactNode; on: boolean; onClick?: () => void; label?: string; role?: "switch" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "switch" ? on : undefined}
      aria-pressed={role ? undefined : on}
      aria-label={label}
      onClick={onClick}
      className={["inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] px-4 text-[14px] font-medium whitespace-nowrap", on ? "bg-charcoal text-white" : "bg-surface text-grey"].join(" ")}
    >
      {children}
    </button>
  );
}

/** 4 px progress bar, r2, charcoal over #EDEDED. */
export function StepProgress({ step, of }: { step: number; of: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-[2px] bg-surface" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={of}>
      <div className="h-full rounded-[2px] bg-charcoal" style={{ width: `${Math.min(100, (step / of) * 100)}%` }} />
    </div>
  );
}

/** Local-mode banner: shown when the server actions write to memory, not Supabase. */
export function DevBanner({ backend }: { backend?: "supabase" | "memory" }) {
  if (backend !== "memory") return null;
  return (
    <p role="status" className="pointer-events-none absolute inset-x-7 top-2 text-center text-[11px] leading-none text-grey">
      Local mode: no Supabase key, nothing is saved.
    </p>
  );
}

export function Loading() {
  return <div className="min-h-[200px]" aria-busy="true" />;
}
