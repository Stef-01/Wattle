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

css/wattle.css    The whole design system, in 18 numbered sections
js/wattle.js      Theme toggle, nav, scroll reveal, marquee, form. ~120 lines.
assets/           SVG motifs + generated social card
tools/make-og.py  Regenerates the social card
```

Pages are intentionally self-contained: header and footer are duplicated in each file rather than templated. Five pages, no build tooling — the duplication is cheaper than the pipeline. If the site grows past ~10 pages, that trade flips.

---

## Design system

Quiet by construction. Soft violet grounds carry every panel, wattle gold is reserved for the letterforms, and the layout is mostly whitespace. The wordmark is the one loud element: WATL set enormous in a garalde serif and cropped by the lower edge of its panel.

| Token | Value | Role |
|---|---|---|
| `--gold` | `#E9B44C` | Wattle gold. Letterforms and small accents only — never a background. |
| `--gold-deep` | `#C8912E` | The same gold, darkened for small text on light grounds |
| `--violet-deep` | `#2E2545` | Deep ground, dark-theme panels |
| `--violet` / `--violet-soft` | `#6B5B95` / `#B9AAD6` | Mid and light ground stops |
| `--ink` / `--paper` | `#221C33` / `#FAF8FC` | Violet-tinted neutral pair, both themes |

**Type** — Cormorant Garamond (300/400) for display and the wordmark; Inter (400/500) for body and labels. Two families, both from Google Fonts.

**Grounds** — `.soft` is a stack of four radial gradients over a linear base, with a grain overlay to stop the wide gradients banding. `.soft--deep` is the dark variant. Both are fixed violet in either theme; only the surrounding page flips.

**Themes** — light by default, dark honoured from `prefers-color-scheme`, and an explicit toggle persisted to `localStorage` under `watl-theme`. A tiny inline script in each `<head>` sets the attribute before first paint so there is no flash.

**Motion** — one easing curve (`--ease`), one duration (`--dur`). Scroll reveal via `IntersectionObserver`, staggered with `data-reveal-delay`. Everything collapses under `prefers-reduced-motion`.

### Assets

| File | Purpose |
|---|---|
| `assets/wattle-sprig.svg` | Wattle sprig, used once per page at most, on a plate |
| `assets/bloom.svg` | Single bloom rosette in gold |
| `assets/grain.svg` | `feTurbulence` noise, overlaid on every soft ground |
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
- **The social card** bakes in a Windows Garamond as a stand-in for Cormorant. If you install Cormorant Garamond locally, point `SERIF` in `tools/make-og.py` at it and re-render for an exact match with the site.
- **`sitemap.xml`, `robots.txt` and a `<link rel="canonical">`** were removed along with the old GitHub Pages setup, since they only make sense once a real origin exists. Re-add them pointing at the live domain.

If you go back to GitHub Pages, note that it only serves **public** repos on the free plan.

---

## Licence

Code is MIT — see [LICENSE](LICENSE). The Wattle Technologies name, the WATL wordmark and the bloom motif are not.
