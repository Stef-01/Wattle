import Link from "next/link";

/**
 * Migrated to the poster-brutalist vocabulary. It was still asking for shell,
 * eyebrow, display, prose-h1, lede and hero-actions — none of which survived
 * the rewrite — so a visitor who mistyped a URL got unstyled markup with the
 * two links run together as "Back to the startWhat we build".
 *
 * The button row is an inline flex rather than a new class: the migrated pages
 * never place two buttons side by side, so there is nothing in the system to
 * reuse, and one page's one-off spacing does not earn a token.
 */
export default function NotFound() {
  return (
    <section className="section is-black">
      <div className="padding-global">
        <p className="text-style-tag">404</p>
        <h1 className="heading-style-h1">There is nothing at this address.</h1>
        <p className="subheading-large max-width-medium" style={{ marginTop: "1.5rem" }}>
          The page may have moved, or it may not be public yet. Both happen here.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2.5rem" }}>
          <Link href="/" className="button button-pressed">Back to the start</Link>
          <Link href="/ventures" className="button">What we build</Link>
        </div>
      </div>
    </section>
  );
}
