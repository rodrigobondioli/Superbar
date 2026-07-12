/* Screenshots da landing em viewport mobile (iPhone 14) + detector de
   overflow horizontal. Uso: npm run dev em um terminal, depois:
   node shot-lp-mobile.mjs
   Saída: screenshots/lp-mobile-*.png */
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

mkdirSync("screenshots", { recursive: true });

const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

try {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);

  // Overflow horizontal + culpados
  const o = await page.evaluate(() => {
    const overW = document.documentElement.scrollWidth - window.innerWidth;
    const culprits = [];
    if (overW > 0) {
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 2 || r.left < -2) {
          if (culprits.length < 12)
            culprits.push(
              `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} → left:${Math.round(r.left)} right:${Math.round(r.right)}`,
            );
        }
      });
    }
    return { overW, culprits, scrollH: document.documentElement.scrollHeight };
  });
  console.log("OVERFLOW-X:", o.overW, "px");
  o.culprits.forEach((c) => console.log("  ", c));

  // Screenshots rolando a página
  const step = Math.round(844 * 0.9);
  const shots = Math.min(24, Math.ceil(o.scrollH / step));
  for (let i = 0; i < shots; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * step);
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `screenshots/lp-mobile-${String(i).padStart(2, "0")}.png`,
    });
    console.log(`shot ${i + 1}/${shots}`);
  }
  console.log("PRONTO — screenshots em ./screenshots/");
} catch (e) {
  console.log("ERRO:", e.message);
}
await b.close();
