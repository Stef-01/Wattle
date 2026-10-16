// Small layout pieces shared by the P06–P11 screens.
import type { ReactNode } from "react";

/** Explicit vertical gap at any Figma measurement. */
export function Space({ h }: { h: number }) {
  return <div style={{ height: h }} aria-hidden="true" />;
}

/** The 430-wide frame with the hero flush to the top (P06/P11 put the photo at y=28). */
export function HeroScreen({ children, padBottom = "pb-[140px]" }: { children: ReactNode; padBottom?: string }) {
  return (
    <main className="frame overflow-x-clip bg-white">
      <div className={`frame-pad pt-7 ${padBottom}`}>{children}</div>
    </main>
  );
}
