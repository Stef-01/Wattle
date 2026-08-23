import { ImageResponse } from "next/og";

export const alt = "Wattle Technologies — health software for the parts of the system people cannot reach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card. Typographic and generated at build time — no photograph, no stock image, and
 * nothing that would need a licence. The palette is the site's, hardcoded here because the OG
 * renderer has no stylesheet to read tokens from — so a palette change in globals.css
 * must be repeated here by hand. Last synced 2026-08-23 with the golden-wattle palette.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2e3d24",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: "#f2c230" }} />
            <div style={{ width: 16, height: 16, borderRadius: 999, background: "#c9992a", marginTop: 8 }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#c9992a", marginTop: 2 }} />
          </div>
          <div style={{ fontSize: 30, color: "#fcfaf4", letterSpacing: "-0.01em" }}>Wattle Technologies</div>
        </div>

        <div style={{ display: "flex", fontSize: 68, color: "#fcfaf4", lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 900 }}>
          Health software for the parts of the system people cannot reach.
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#a8b394" }}>Australia · ADHD.ME</div>
      </div>
    ),
    size,
  );
}
