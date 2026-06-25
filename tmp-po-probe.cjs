const { chromium } = require('@playwright/test');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('config.credentials.json', 'utf8'));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(cfg.testEnvironment.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input#username', cfg.testUser.username);
  await page.fill('input#password', cfg.testUser.password);
  await page.click("button:has-text('Sign In')");
  try {
    await page.waitForSelector("button:has-text('Continue'):not([disabled])", { timeout: 15000 });
    await page.click("button:has-text('Continue'):not([disabled])");
  } catch {}

  const targetUrl = cfg.testEnvironment.purchaseOrderControlScreenUrl;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(15000);

  console.log('FINAL_URL=' + page.url());
  console.log('TITLE=' + await page.title());

  const hasSearchBtn = await page.locator('button:has-text("Search")').count();
  const hasDateInput = await page.locator('input.datepickerTxt').count();
  const hasCriteria = await page.getByText('Purchase Order Search Criteria', { exact: false }).count();

  console.log('hasSearchBtn=' + hasSearchBtn);
  console.log('hasDateInput=' + hasDateInput);
  console.log('hasCriteriaText=' + hasCriteria);

  const body = await page.locator('body').innerText().catch(() => '');
  console.log('BODY_START');
  console.log((body || '').slice(0, 1200));
  console.log('BODY_END');

  await page.screenshot({ path: 'screenshots/po-inspect-after-fix.png', fullPage: true });
  await browser.close();
})();
