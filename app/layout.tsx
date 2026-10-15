import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wattle Health",
  description: "Find a doctor you can trust, from one sentence. Queensland first.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FBF8F1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="flex min-h-dvh flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="display flex min-h-11 items-center gap-2 text-xl" aria-label="Wattle Health, home">
            <span aria-hidden className="inline-block size-3 rounded-full bg-blossom" />
            Wattle
          </Link>
          <nav className="flex gap-1 text-sm">
            <Link href="/saved" className="flex min-h-11 items-center px-3 text-foliage underline-offset-4 hover:underline">Saved</Link>
            <Link href="/about" className="flex min-h-11 items-center px-3 text-foliage underline-offset-4 hover:underline">About</Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-ink-soft">Facts only, each with its source. Not medical advice.</footer>
      </body>
    </html>
  );
}
