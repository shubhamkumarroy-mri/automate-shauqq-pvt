const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'auth-state.json', viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const url = require('./config.credentials.json').testEnvironment.purchaseOrderControlScreenUrl || require('./config.credentials.json').testEnvironment.purchaseOrderControlScreenURL || require('./config.credentials.json').testEnvironment.purchaseOrderUrl;
  console.log('TARGET_URL=' + url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  console.log('FINAL_URL=' + page.url());
  console.log('TITLE=' + await page.title());
  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('BODY_TEXT_START');
  console.log((bodyText || '').slice(0, 4000));
  console.log('BODY_TEXT_END');
  const buttons = await page.locator('button, input[type="button"], input[type="submit"], a, [role="button"]').evaluateAll(els => els.map(el => ({
    tag: el.tagName,
    text: (el.textContent || el.value || '').trim(),
    visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
  })).filter(x => x.visible).slice(0, 100));
  console.log('VISIBLE_CONTROLS=' + JSON.stringify(buttons, null, 2));
  await page.screenshot({ path: 'screenshots/po-inspect-current.png', fullPage: true });
  await browser.close();
})();
