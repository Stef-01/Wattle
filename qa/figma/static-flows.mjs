// Claim redirect + clinician local-mode flow against a static deployment (no server actions):
//   BASE=https://stef-01.github.io/Wattle-Health node qa/figma/static-flows.mjs
import { chromium } from "@playwright/test";
const BASE = (process.env.BASE ?? "http://localhost:3400/Wattle-Health").replace(/\/$/, "");
const browser = await chromium.launch();
let page = await (await browser.newContext({ viewport: { width: 430, height: 932 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(`${BASE}/claim/illustrative~imogen-wattlebrook/`);
await page.waitForTimeout(2500);
console.log("claim →", page.url());

// A fresh session: the claim above prefilled the join state of the first one.
page = await (await browser.newContext({ viewport: { width: 430, height: 932 } })).newPage();
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`${BASE}/join/verify/`);
await page.fill("input[name=ahpra]", "MED0001234567");
await page.fill("input[name=name]", "Dr Imogen Wattlebrook (example)");
await page.fill("input[name=email]", "imogen@example-practice.com.au");
await page.click("text=Look me up");
await page.waitForTimeout(1200);
console.log("banner:", await page.locator("[role=status]").first().textContent().catch(() => "none"));
console.log("lookup card:", (await page.locator("[aria-live=polite]").first().textContent().catch(() => "none"))?.slice(0, 120));
await page.click("text=That’s me");
await page.waitForURL(/\/join\/practice/, { timeout: 8000 });
console.log("after claim →", page.url());
await page.fill("input[name=practice]", "Spring Hill Specialist Centre");
await page.click("text=Continue");
await page.waitForURL(/\/join\/interview/, { timeout: 8000 });
console.log("after practice →", page.url());
await page.goto(`${BASE}/join/review/`);
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Publish" }).click();
await page.waitForSelector("text=Submitted.", { timeout: 8000 });
console.log("after publish:", (await page.locator("text=Profile saved as a draft").count()) ? "Submitted, draft saved (local mode)" : "submitted");
console.log("errors:", errors.length ? errors : "none");
await browser.close();
