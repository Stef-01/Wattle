import { PLATE, LABEL } from "@/wattle/specimen";

/**
 * THE SPECIMEN PLATE — the company's name, presented as the thing it is named after.
 *
 * The form is a herbarium sheet: dark ground, one specimen centred, taxonomy set beside it. It
 * earns its place editorially rather than decoratively — this is the page that answers "why is
 * the company called Wattle", and the answer is a plate of Acacia pycnantha with its real
 * measurements on it.
 *
 * THE DRAWING IS GENERATED, NOT ILLUSTRATED. Every phyllode is a falcate curve from
 * `phyllode()`, every head is a real 40–80 floret cluster from `flowerHead()` — the same
 * functions that build the WebGL field in the hero. The plate and the hero are one plant
 * described twice, not two drawings that happen to share a palette.
 *
 * ANIMATION BUDGET: heads animate as GROUPS, not as ~900 individual florets. The visual read is
 * identical — heads open, not specks — and it is the difference between 38 animated elements and
 * nine hundred.
 */
export function SpecimenPlate() {
  return (
    <section className="plate" aria-labelledby="plate-title">
      <div className="shell plate-grid">
        <div className="plate-id">
          <p className="plate-family">{LABEL.family}</p>
          <h2 id="plate-title" className="display plate-binomial">
            {LABEL.binomial}
          </h2>
          <p className="plate-authority">
            {LABEL.authority} · {LABEL.common}
          </p>
          <p className="plate-note">
            Australia&rsquo;s national floral emblem, and the plant this company is named after.
            Everything in our design system is derived from its real structure — the flower head
            is a cluster of forty to eighty florets, and so is ours.
          </p>
        </div>

        <div className="plate-figure">
          <svg
            viewBox="0 0 640 900"
            className="plate-svg"
            role="img"
            aria-label="A generated botanical plate of Acacia pycnantha: a leaning stem with six lateral branches, falcate phyllodes, and clustered globular flower heads."
          >
            <defs>
              <radialGradient id="plate-head" cx="36%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#ffe27a" />
                <stop offset="58%" stopColor="var(--blossom)" />
                <stop offset="100%" stopColor="var(--gold-mid)" />
              </radialGradient>
            </defs>

            <path className="plate-stem" d={PLATE.stem} />

            {PLATE.branches.map((d, i) => (
              <path
                key={d}
                className="plate-branch"
                d={d}
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}

            {PLATE.phyllodes.map((p, i) => (
              <g
                key={`${p.x}-${p.y}-${i}`}
                className="plate-phyllode"
                transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rotate.toFixed(1)}) scale(${p.scale.toFixed(2)})`}
                style={{ "--o": p.order.toFixed(3) } as React.CSSProperties}
              >
                <path className="plate-blade" d={p.d} />
                {/* The single prominent central vein: the diagnostic feature of the species,
                    so it is drawn rather than implied. */}
                <path className="plate-vein" d={p.vein} />
              </g>
            ))}

            {PLATE.heads.map((h, i) => (
              <g
                key={`${h.cx}-${h.cy}-${i}`}
                className="plate-head"
                style={
                  {
                    "--o": h.order.toFixed(3),
                    transformOrigin: `${h.cx.toFixed(1)}px ${h.cy.toFixed(1)}px`,
                  } as React.CSSProperties
                }
              >
                {h.florets.map(([x, y, r], j) => (
                  <circle key={j} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill="url(#plate-head)" />
                ))}
              </g>
            ))}
          </svg>
        </div>

        <dl className="plate-label">
          {LABEL.rows.map((row) => (
            <div key={row.term}>
              <dt>{row.term}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
