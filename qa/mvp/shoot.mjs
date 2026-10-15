// Screenshots of every route at phone and laptop widths. Run: node qa/mvp/shoot.mjs (dev or start on :3300).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3300";
const OUT = path.resolve("qa/mvp");
mkdirSync(OUT, { recursive: true });

const SENTENCE =
  "I've had chronic pelvic pain for years. I feel like nobody listens. I want someone experienced with endometriosis who takes a collaborative approach, and ideally someone who understands what living with a chronic condition feels like.";
const ASK = { sentence: SENTENCE, suburb: "Brisbane", removed: [], weights: { clinical: 1, communication: 1, lived: 1, research: 1 } };
const EMERGENCY = { ...ASK, sentence: "I am planning to end my life tonight" };

const VIEWPORTS = [
  { name: "390", width: 390, height: 844, isMobile: true },
  { name: "1280", width: 1280, height: 800, isMobile: false },
];

const browser = await chromium.launch();
const res = await fetch(`${BASE}/api/match`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ASK) });
const data = await res.json();
const cards = data.cards ?? [];
const first = cards[0]?.doctor;
const pair = cards.slice(0, 2).map((c) => c.doctor);
console.log("cards", cards.length, "first", first?.id);

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, deviceScaleFactor: 1 });
  const shoot = async (name, url, seed) => {
    const page = await context.newPage();
    if (seed) await page.addInitScript(seed);
    await page.goto(`${BASE}${url}`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `${name}-${vp.name}.png`), fullPage: true });
    const words = (await page.evaluate(() => document.body.innerText)).trim().split(/\s+/).filter(Boolean).length;
    console.log(vp.name, name, "words", words);
    await page.close();
  };
  await shoot("ask", "/");
  await shoot("results", "/results", `sessionStorage.setItem("wattle.ask", ${JSON.stringify(JSON.stringify(ASK))}); sessionStorage.removeItem("wattle.results");`);
  await shoot("emergency", "/results", `sessionStorage.setItem("wattle.ask", ${JSON.stringify(JSON.stringify(EMERGENCY))}); sessionStorage.removeItem("wattle.results");`);
  if (first) {
    await shoot("doctor", `/doctor/${encodeURIComponent(first.id)}`, `sessionStorage.setItem("wattle.results", ${JSON.stringify(JSON.stringify(data))});`);
    await shoot("claim", `/claim/${encodeURIComponent(first.id)}`);
  }
  await shoot("compare", "/compare", `localStorage.setItem("wattle.compare", ${JSON.stringify(JSON.stringify(pair))});`);
  await shoot("saved", "/saved", `localStorage.setItem("wattle.saved", ${JSON.stringify(JSON.stringify(pair.slice(0, 1)))});`);
  await shoot("about", "/about");
  await context.close();
}
await browser.close();
