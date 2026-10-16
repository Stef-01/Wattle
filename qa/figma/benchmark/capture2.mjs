import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT = 'C:/Users/stefa/wattle-health/qa/figma/benchmark';
const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua, locale: 'en-US' });
const results = {};

async function dismiss(page) {
  const sels = ['button:has-text("Accept all")', 'button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("Save")', '[role=dialog] button[aria-label*="lose" i]', '[aria-label="Close"]', 'button:has-text("×")'];
  for (const s of sels) { try { const b = page.locator(s).first(); if (await b.isVisible({ timeout: 700 })) { await b.click({ timeout: 1500 }); await page.waitForTimeout(500); } } catch {} }
  // hard-remove leftover overlays
  await page.evaluate(() => { for (const el of document.querySelectorAll('[role=dialog], [id*=onetrust], [class*=cookie], [class*=consent], [id*=consent]')) el.remove(); document.body.style.overflow = 'auto'; });
}

async function shoot(name, url, shots) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4500);
    await dismiss(page);
    const title = await page.title();
    const text = (await page.evaluate(() => document.body.innerText)).slice(0, 400).replace(/\s+/g, ' ');
    for (const [file, y] of shots) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, file), fullPage: false });
    }
    results[name] = { ok: true, url: page.url(), title, text };
  } catch (e) { results[name] = { ok: false, err: String(e).slice(0, 200) }; }
  await page.close();
}

const arg = process.argv[2];
if (!arg || arg === 'headway') {
  for (const u of ['https://care.headway.co/search?location=Austin%2C%20TX', 'https://headway.co/therapists/texas/austin', 'https://headway.co/therapists/tx']) {
    await shoot('probe:' + u, u, [['headway-probe.png', 600]]);
  }
}
if (!arg || arg === 'om') await shoot('onemedical', 'https://www.onemedical.com/providers/petra-kelsey', [['onemedical-1.png', 0], ['onemedical-2.png', 900]]);
if (!arg || arg === 'grow') await shoot('grow', 'https://growtherapy.com/members/calmhealthapp/provider/sjh0ad765lgc/theresa-shultz', [['grow-1.png', 0]]);
console.log(JSON.stringify(results, null, 2));
await browser.close();
