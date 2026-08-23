import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">404</p>
        <h1 className="display prose-h1">There is nothing at this address.</h1>
        <p className="lede" style={{ marginTop: "1.5rem", maxWidth: "44ch" }}>
          The page may have moved, or it may not be public yet. Both happen here.
        </p>
        <div className="hero-actions">
          <Button asChild>
            <Link href="/">Back to the start</Link>
          </Button>
          <Button asChild variant="quiet">
            <Link href="/ventures">What we build</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
