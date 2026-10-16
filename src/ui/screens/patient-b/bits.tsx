// Small layout pieces shared by the P06–P11 screens.
import type { ReactNode } from "react";

/** Explicit vertical gap at any Figma measurement. */
export function Space({ h }: { h: number }) {
  return <div style={{ height: h }} aria-hidden="true" />;
}

/** The 430-wide frame with the hero flush to the top (P06/P11 put the photo at y=28). */
export function HeroScreen({ children, padBottom = "pb-[140px]" }: { children: ReactNode; padBottom?: string }) {
  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip bg-white sm:my-6 sm:min-h-[932px] sm:rounded-[50px] sm:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className={`px-7 pt-7 ${padBottom}`}>{children}</div>
    </main>
  );
}
