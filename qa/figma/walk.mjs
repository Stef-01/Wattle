// Full-journey screenshot walk at 430x932 against a running `pnpm start` (port 3300).
// Usage: node qa/figma/walk.mjs  → qa/figma/walk/*.png + sheet.png
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3300";
const OUT = path.resolve("qa/figma/walk");
fs.mkdirSync(OUT, { recursive: true });
const SENTENCE = "I've had chronic pelvic pain for years. I feel like nobody listens. I want someone experienced with endometriosis who takes a collaborative approach, and ideally someone who understands what living with a chronic condition feels like.";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const shots = [];
if (process.env.SHARE) { await page.goto(process.env.SHARE); await page.waitForTimeout(1500); }
async function shot(name) {
  await page.waitForTimeout(400);
  const file = path.join(OUT, `${String(shots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  shots.push({ name, file, url: page.url() });
  console.log(name, page.url());
}

await page.goto(`${BASE}/splash`); await shot("P01-splash");
await page.goto(`${BASE}/`); await page.evaluate(() => localStorage.setItem("wattle.splash.seen", "true")); await page.goto(`${BASE}/`); await shot("P02-home");
await page.fill("textarea", SENTENCE); await shot("P02-home-filled");
await page.click("text=Find my doctor"); await page.waitForURL(/\/heard/); await page.waitForTimeout(800); await shot("P03-heard");
await page.click("text=Meet your matches"); await page.waitForURL(/\/match\/1/); await page.waitForTimeout(800); await shot("P04-match-1");
await page.goto(`${BASE}/match/2`); await shot("P04-match-2");
await page.goto(`${BASE}/results`); await page.waitForTimeout(800); await shot("P05-results");
await page.goto(`${BASE}/match/1`); await page.waitForTimeout(600);
const first = await page.locator("a[href^='/doctor/']").first().getAttribute("href");
await page.goto(`${BASE}${first}`); await page.waitForTimeout(600); await shot("P06-profile");
await page.goto(`${BASE}${first}/expertise`); await shot("P07-expertise");
await page.goto(`${BASE}${first}/why`); await shot("P09-why");
await page.goto(`${BASE}/adjust`); await shot("P08-adjust");
await page.goto(`${BASE}/results/none`); await shot("P10-nomatch");
await page.goto(`${BASE}/saved`); await shot("tab-saved");
await page.goto(`${BASE}/recent`); await shot("tab-recent");
await page.goto(`${BASE}/me`); await shot("tab-me");
await page.goto(`${BASE}/join`); await shot("C01-join");
await page.goto(`${BASE}/join/verify`); await shot("C02-verify");
await page.goto(`${BASE}/join/practice`); await shot("C03-practice");
await page.goto(`${BASE}/join/interview`); await shot("C04-interview");
await page.goto(`${BASE}/join/interview/3`); await shot("C05-question");
await page.fill("textarea", "um I ask people to tell me the whole story before we talk about options, most have been rushed before"); await page.click("text=Next"); await page.waitForURL(/\/join\/draft\/3/); await page.waitForTimeout(500); await shot("C06-draft");
await page.goto(`${BASE}/join/share`); await shot("C07-share");
await page.goto(`${BASE}/join/review`); await shot("C08-review");
await browser.close();

// contact sheet: 6 per row, each 215x466
const sharp = await import("sharp").catch(() => null);
if (sharp) {
  const w = 215, h = 466, cols = 6, rows = Math.ceil(shots.length / cols);
  const composites = await Promise.all(shots.map(async (s, i) => ({ input: await sharp.default(s.file).resize(w, h).toBuffer(), left: (i % cols) * (w + 10) + 10, top: Math.floor(i / cols) * (h + 10) + 10 })));
  await sharp.default({ create: { width: cols * (w + 10) + 10, height: rows * (h + 10) + 10, channels: 3, background: "#1b1b1b" } }).composite(composites).png().toFile(path.join(OUT, "sheet.png"));
  console.log("sheet.png written");
}
fs.writeFileSync(path.join(OUT, "walk.json"), JSON.stringify(shots, null, 2));
