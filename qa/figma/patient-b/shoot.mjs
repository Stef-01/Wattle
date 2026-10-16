// Screenshots of the P06–P11 routes at 430×932 against a running server.
// Usage: node qa/figma/patient-b/shoot.mjs [baseUrl]   (default http://localhost:3300)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3300";
const out = path.resolve("qa/figma/patient-b");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
// The dev server recompiles while other agents edit; retry a navigation that aborts mid-reload.
async function go(page, url) {
  for (let i = 0; i < 4; i++) {
    try {
      await page.goto(url, { waitUntil: "load" });
      return;
    } catch (e) {
      if (i === 3) throw e;
      await page.waitForTimeout(1500);
    }
  }
}
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// Seed a real search in sessionStorage the way the results screens store it (wattle.req.<id>).
await page.goto(`${base}/me`);
const seed = await page.evaluate(async () => {
  const res = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sentence: "Pelvic pain and endometriosis, someone who listens", suburb: "Brisbane", removed: [] }) });
  const response = await res.json();
  const id = "qa-patient-b";
  const req = { id, sentence: "Pelvic pain and endometriosis, someone who listens", suburb: "Brisbane", removed: [], response, at: new Date().toISOString() };
  sessionStorage.setItem(`wattle.req.${id}`, JSON.stringify(req));
  sessionStorage.setItem("wattle.req.current", JSON.stringify(id));
  localStorage.setItem("wattle.recent.v1", JSON.stringify([{ id, label: "Pelvic pain, Brisbane", matches: response.cards.length, at: req.at }]));
  const ids = response.cards.map((c) => c.doctor.id);
  localStorage.setItem("wattle.saved.v1", JSON.stringify(ids.slice(0, 2)));
  localStorage.setItem("wattle.name", JSON.stringify("Stefan"));
  return { ids, pubs: response.cards.map((c) => c.doctor.publications.length) };
});
console.log("seed", seed);

const doctor = process.env.QA_DOCTOR ?? seed.ids[0];
const withPubs = process.env.QA_DOCTOR_PUBS ?? "obstetrics-gynaecology:alexandra-mowat";
const enc = (s) => encodeURIComponent(s);
const shots = [
  ["p06-profile", `/doctor/${enc(withPubs)}`],
  ["p07-expertise", `/doctor/${enc(withPubs)}/expertise`],
  ["p08-adjust", `/adjust`],
  ["p09-why", `/doctor/${enc(doctor)}/why`],
  ["p10-no-match", `/results/none`],
  ["p11-partial", `/doctor/${enc(doctor)}`],
  ["recent", `/recent`],
  ["saved", `/saved`],
  ["me", `/me`],
];
for (const [name, route] of shots) {
  await go(page, `${base}${route}`);
  await page.waitForTimeout(route.endsWith("/why") || route === "/saved" ? 2500 : 700);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  const words = await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").split(/\s+/).filter(Boolean).length);
  console.log(name, route, `${words} words`);
}
// P06 contact sheet open
await go(page, `${base}/doctor/${enc(withPubs)}`);
await page.getByRole("button", { name: /Contact practice|Get to know/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "p06-contact-sheet.png") });
// P07 research tab
await go(page, `${base}/doctor/${enc(withPubs)}/expertise`);
await page.getByRole("button", { name: "Research" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "p07-research.png") });
await page.getByRole("button", { name: "Training" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "p07-training.png") });
await browser.close();
