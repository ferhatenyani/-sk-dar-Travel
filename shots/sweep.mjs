import { chromium } from "@playwright/test";

const SIZES = [
  [320, 700], [360, 740], [390, 844], [480, 800], [600, 900],
  [640, 800], [768, 900], [900, 800], [1024, 768], [1180, 820],
  [1280, 800], [1440, 900], [1920, 1080],
  [740, 360], [844, 390], // téléphones en paysage
];

const browser = await chromium.launch({ channel: "chrome" });
const results = [];
for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  // pause pour des captures déterministes
  await page.getByRole("button", { name: "Mettre le défilement automatique en pause" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/sweep-${w}x${h}.png` });
  results.push([w, h, overflow]);
  await page.close();
}
await browser.close();
for (const [w, h, o] of results) console.log(`${w}x${h}: overflow=${o}px`);
