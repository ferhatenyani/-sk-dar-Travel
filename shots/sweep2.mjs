import { chromium } from "@playwright/test";
const SIZES = [[740, 360], [844, 390], [1280, 800], [1024, 768]];
const browser = await chromium.launch({ channel: "chrome" });
for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 1000, isMobile: w < 700 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.getByRole("button", { name: "Mettre le défilement automatique en pause" }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `shots/fix-${w}x${h}.png` });
  console.log(`${w}x${h}: overflow=${overflow}px`);
  await page.close();
}
await browser.close();
