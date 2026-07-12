import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
try {
  await page.goto('https://app.superbar.com.br/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('input[type=email], input[name=email]', 'dono@aurorabar.dev');
  await page.fill('input[type=password], input[name=password]', 'SenhaForte123!');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  const o = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, over: document.documentElement.scrollWidth - window.innerWidth }));
  console.log('URL:', page.url());
  console.log('OVERFLOW:', JSON.stringify(o));
  await page.screenshot({ path: 'mobile-dashboard.png', fullPage: true });
  console.log('screenshot ok');
} catch (e) { console.log('ERRO:', e.message); }
await b.close();
