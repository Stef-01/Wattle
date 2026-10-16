// Playwright screenshots of the clinician routes at 430x932 → qa/figma/clinician/*.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3301";
const out = process.argv[3] ?? "C:/Users/stefa/wattle-health/qa/figma/clinician";
mkdirSync(out, { recursive: true });

// Fictional sample state (the Figma example doctor), so screens render as designed.
const seeded = {
  backend: "memory",
  ahpra: "MED0001234567",
  name: "Dr Nathan Reilly",
  email: "nathan@springhill.com.au",
  doctorId: null,
  specialtyLine: "Specialist, obstetrics and gynaecology",
  registerChecked: true,
  registered: true,
  conditions: false,
  practitionerId: "11111111-1111-4111-8111-111111111111",
  practice: "Spring Hill Specialist Centre",
  fee: "280",
  telehealth: true,
  referral: true,
  bulkBilling: false,
  answers: {
    2: { raw: "I ask people to tell me the whole story before we talk about options. Most have been rushed before.", draft: "", show: true },
    4: { raw: "I wanted to help people through the hardest moments", draft: "Dr Reilly chose medicine to help people through the hardest moments.", show: true },
    6: { raw: "endometriosis in my family", draft: "Dr Reilly shares lived experience of endometriosis in their family.", show: true },
    7: { raw: "trail running, ceramics", draft: "Dr Reilly enjoys trail running, ceramics.", show: true },
    8: { raw: "", draft: "", show: true },
  },
  shares: { lived: true, outside: true, books: false, why: true },
};

const shots = [
  ["C01-join", "/join", null],
  ["C02-verify", "/join/verify", seeded],
  ["C03-practice", "/join/practice", seeded],
  ["C04-interview", "/join/interview", seeded],
  ["C05-question", "/join/interview/2", seeded],
  ["C06-draft", "/join/draft/2", seeded],
  ["C07-share", "/join/share", seeded],
  ["C08-review", "/join/review", seeded],
  ["C09-submitted", "/join/review", { ...seeded, submitted: true }],
  ["C02-verify-empty", "/join/verify", null],
];

const browser = await chromium.launch();
for (const [name, path, state] of shots) {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  if (state) await ctx.addInitScript((s) => sessionStorage.setItem("wattle.join", JSON.stringify(s)), state);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  const words = (await page.locator("main").innerText().catch(() => "")).split(/\s+/).filter(Boolean).length;
  console.log(name, "words:", words, errors.length ? "ERRORS: " + errors.join(" | ") : "");
  await ctx.close();
}

// Functional pass through the flow in memory mode.
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto(base + "/join");
await page.getByRole("link", { name: "Get started" }).click();
await page.waitForURL("**/join/verify");
await page.locator('input[name="ahpra"]').fill("MED0001234567");
await page.locator('input[name="name"]').fill("Nathan Reilly");
await page.locator('input[name="email"]').fill("nathan@springhill.com.au");
await page.getByRole("button", { name: "Look me up" }).click();
await page.getByRole("button", { name: "That’s me" }).waitFor();
console.log("verify card:", (await page.locator("[aria-live=polite]").innerText()).replace(/\n/g, " / "));
await page.getByRole("button", { name: "That’s me" }).click();
await page.waitForURL("**/join/practice");
await page.locator('input[name="practice"]').fill("Spring Hill Specialist Centre");
await page.locator('input[name="fee"]').fill("280");
await page.getByRole("button", { name: "Telehealth" }).click();
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForURL("**/join/interview");
await page.getByRole("link", { name: "Start" }).click();
await page.waitForURL("**/join/interview/1");
for (let n = 1; n <= 8; n++) {
  await page.locator("textarea").fill(n === 2 ? "um so I ask people to tell me the whole story, like, before we talk about options" : `answer ${n} about things I like`);
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForURL(`**/join/draft/${n}`);
  if (n === 2) console.log("draft 2:", await page.locator("p.text-\\[18px\\]").first().innerText());
  await page.getByRole("button", { name: n < 8 ? "Next question" : "Continue" }).click();
  await page.waitForURL(n < 8 ? `**/join/interview/${n + 1}` : "**/join/share");
}
await page.getByRole("link", { name: "Continue" }).click();
await page.waitForURL("**/join/review");
console.log("review:", (await page.locator("main").innerText()).replace(/\n/g, " / ").slice(0, 300));
await page.getByRole("button", { name: "Publish" }).click();
await page.getByText("Submitted.").waitFor();
console.log("submitted OK; state:", JSON.parse(await page.evaluate(() => sessionStorage.getItem("wattle.join"))).submitted);
await page.screenshot({ path: `${out}/flow-end.png` });
await ctx.close();
await browser.close();
