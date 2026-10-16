import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT = 'C:/Users/stefa/wattle-health/qa/figma/benchmark';
const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua, locale: 'en-US',
});
const results = {};

async function dismiss(page) {
  const sels = ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")', 'button:has-text("OK")', 'button:has-text("I agree")', '[aria-label="Close"]', 'button:has-text("Decline")'];
  for (const s of sels) { try { const b = page.locator(s).first(); if (await b.isVisible({ timeout: 800 })) { await b.click({ timeout: 1500 }); await page.waitForTimeout(400); } } catch {} }
}

async function shoot(name, url, opts = {}) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    await dismiss(page);
    if (opts.scrollTo) { await page.evaluate(y => window.scrollTo(0, y), opts.scrollTo); await page.waitForTimeout(1200); }
    const title = await page.title();
    const text = (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\s+/g, ' ');
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    results[name] = { ok: true, url: page.url(), title, text };
    if (opts.second) {
      await page.evaluate(y => window.scrollTo(0, y), opts.second.y);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(OUT, opts.second.name), fullPage: false });
      results[opts.second.name] = { ok: true };
    }
  } catch (e) { results[name] = { ok: false, err: String(e).slice(0, 200) }; }
  await page.close();
}

await shoot('headway-results.png', 'https://headway.co/therapists', { scrollTo: 500 });
await shoot('headway-profile-1.png', 'https://care.headway.co/providers/valerie-medina-hurst-2', { second: { name: 'headway-profile-2.png', y: 900 } });
await shoot('onemedical-1.png', 'https://www.onemedical.com/providers/petra-kelsey', { second: { name: 'onemedical-2.png', y: 900 } });
await shoot('grow-1.png', 'https://growtherapy.com/members/calmhealthapp/provider/sjh0ad765lgc/theresa-shultz');

console.log(JSON.stringify(results, null, 2));
await browser.close();
