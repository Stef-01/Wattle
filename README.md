# Wattle Technologies — WATL

Marketing site for **Wattle Technologies**, a modern futurism practice. Static HTML, CSS and vanilla JS — no build step, no dependencies, no framework.

**Not currently hosted.** Run it locally, or see [Deployment](#deployment) to put it somewhere.

---

## Run it locally

Any static server works. From the repo root:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`. Opening `index.html` directly off the filesystem also works — nothing depends on a server except the `404.html` route.

---

## Structure

```
index.html        Landing — poster hero, thesis, capabilities, method, fieldwork tease
approach.html     Method — three horizons, six lenses, five movements, standing rules
work.html         Fieldwork — featured engagements, engagement shapes, artefacts
about.html        Practice — the wattle principle, structure, position, colophon
contact.html      Brief form (mailto-composed) + what happens next
404.html          Not-found poster

css/wattle.css    The whole design system, in 20 numbered sections
js/wattle.js      Theme toggle, nav, scroll reveal, marquee, form. ~120 lines.
assets/           SVG motifs + generated social card
tools/make-og.py  Regenerates the social card
```

Pages are intentionally self-contained: header and footer are duplicated in each file rather than templated. Five pages, no build tooling — the duplication is cheaper than the pipeline. If the site grows past ~10 pages, that trade flips.

---

## Design system

Golden wattle (*Acacia pycnantha*) as the whole visual argument: gold pom-pom blooms as hard circles, duotone plates under a CSS halftone screen, oversized wide-grotesk type, and repeated stacked wordmarks used as texture.

| Token | Value | Role |
|---|---|---|
| `--gold` | `#FFC300` | The only fixed brand colour. Accent, never ground — except the closing slab. |
| `--violet` / `--violet-deep` | `#4B2FB8` / `#2B1A6B` | Primary duotone partner, sprig ink |
| `--sky` | `#35B6E8` | Cool gradient terminus |
| `--coral` / `--blush` | `#FF4A2B` / `#FF9DBB` | Warm poster gradient |
| `--leaf` | `#1F6F5C` | Phyllode green, success states |
| `--ink` / `--paper` | `#0A0912` / `#F7F4EC` | Ground pair, both themes |

**Type** — Archivo (variable, `font-stretch: 125%` at weight 900) for display; Space Grotesk for body; JetBrains Mono for labels and micro-copy. All from Google Fonts.

**Themes** — light by default, dark honoured from `prefers-color-scheme`, and an explicit toggle persisted to `localStorage` under `watl-theme`. A tiny inline script in each `<head>` sets the attribute before first paint so there is no flash.

**Motion** — one easing curve (`--ease`), one duration (`--dur`). Scroll reveal via `IntersectionObserver`, staggered with `data-reveal-delay`. Everything collapses under `prefers-reduced-motion`.

### Assets

| File | Purpose |
|---|---|
| `assets/mark.svg` | Brandmark — three blooms over a W-shaped stem |
| `assets/wattle-sprig.svg` | Hero illustration — duotone sprig with an internal dot screen |
| `assets/bloom.svg`, `assets/bloom-ink.svg` | Single bloom rosette in gold and in ink (an `<img>` cannot inherit `currentColor`, so each colourway is its own file) |
| `assets/grain.svg` | `feTurbulence` noise, overlaid on poster gradients |
| `assets/og.png` | 1200×630 social card |
| `assets/favicon.svg`, `assets/apple-touch-icon.png` | Icons |

The social card is generated, not hand-drawn — see `tools/make-og.py`. Re-render with:

```bash
python tools/make-og.py
```

It uses Pillow and Arial Black from the Windows font directory; adjust `BLACK_TTF` on other platforms.

---

## Content status

Copy is written and structurally final. Two things are placeholders and should be replaced before this is treated as a live commercial site:

- **Featured fieldwork** on `work.html` and the fieldwork rows on `index.html` are illustrative engagement shapes, not real named clients.
- **`hello@wattle.technology`** is used throughout as the contact address and in the `mailto:` the form composes. Change it in all five pages plus `js/wattle.js`.

The contact form deliberately has no backend — it composes a `mailto:` in the visitor's own client, so the site stores and transmits nothing. Swap in a form endpoint if that changes.

---

## Deployment

There is no deployment configured. Every path in the site is relative, so the repo root can be dropped onto any static host as-is — Cloudflare Pages, Netlify, Vercel, S3, or GitHub Pages — with no build command and no output directory.

Two things to set once a host and domain are chosen:

- **`og:image`** is currently the relative `assets/og.png`. Social scrapers need an absolute URL, so change it to `https://<your-domain>/assets/og.png` in all five pages.
- **`sitemap.xml`, `robots.txt` and a `<link rel="canonical">`** were removed along with the old GitHub Pages setup, since they only make sense once a real origin exists. Re-add them pointing at the live domain.

If you go back to GitHub Pages, note that it only serves **public** repos on the free plan.

---

## Licence

Code is MIT — see [LICENSE](LICENSE). The Wattle Technologies name, the WATL wordmark and the bloom motif are not.
