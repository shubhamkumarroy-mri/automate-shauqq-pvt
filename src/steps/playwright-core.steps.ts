import { Given, Then, When } from '@cucumber/cucumber';
import { expect, Locator } from '@playwright/test';
import { ICustomWorld } from '../support/custom-world.js';
import { substituteCredentials } from '../utils/credential-helpers.js';
import { credentials } from '../support/credentials.js';

function requirePage(world: ICustomWorld) {
  if (!world.page) {
    throw new Error('Playwright page is not initialized');
  }
  return world.page;
}

function toScreenshotPath(world: ICustomWorld, name: string) {
  const safeName = name.replace(/[\\/]/g, '-').replace(/\s+/g, '-');
  const baseDir = world.screenshotRunDir || 'screenshots';
  return `${baseDir}/${safeName}.png`;
}

async function firstVisible(locator: Locator, timeoutMs = 15000): Promise<Locator> {
  const maxWaitUntil = Date.now() + timeoutMs;

  while (Date.now() < maxWaitUntil) {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        return candidate;
      }
    }
    await locator.page().waitForTimeout(150);
  }

  throw new Error('No visible element found for locator');
}

function clickableByText(page: ReturnType<typeof requirePage>, text: string): Locator {
  const escaped = text.replace(/"/g, '\\"');
  return page.locator(
    [
      `button:has-text("${escaped}")`,
      `a:has-text("${escaped}")`,
      `[role="button"]:has-text("${escaped}")`,
      `input[type="button"][value*="${escaped}"]`,
      `input[type="submit"][value*="${escaped}"]`
    ].join(', ')
  );
}

Given('I navigate to {string}', async function (this: ICustomWorld, url: string) {
  const page = requirePage(this);
  const targetUrl = substituteCredentials(url);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Some protected routes can still bounce to /login if the saved auth state is stale.
  if (page.url().includes('/login')) {
    await page.waitForSelector('input#username', { state: 'visible', timeout: 15000 });
    await page.fill('input#username', credentials.testUser.username);
    await page.fill('input#password', credentials.testUser.password);
    await page.click("button:has-text('Sign In')");

    try {
      await page.waitForSelector("button:has-text('Continue'):not([disabled])", { timeout: 15000 });
      await page.click("button:has-text('Continue'):not([disabled])");
    } catch {
      // Continue button may not be present for all auth paths.
    }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }

  this.attach(`Navigated to: ${page.url()}`, 'text/plain');
});

When('I click on {string}', async function (this: ICustomWorld, selector: string) {
  const page = requirePage(this);
  await page.locator(selector).first().click({ timeout: 20000 });
  this.attach(`Clicked element: ${selector}`, 'text/plain');
});

When('I fill {string} with {string}', async function (this: ICustomWorld, selector: string, text: string) {
  const page = requirePage(this);
  await page.locator(selector).first().fill(substituteCredentials(text), { timeout: 20000 });
  this.attach(`Filled ${selector}`, 'text/plain');
});

When('I take a screenshot named {string}', async function (this: ICustomWorld, name: string) {
  const page = requirePage(this);
  const path = toScreenshotPath(this, name);
  await page.screenshot({ path, fullPage: true });
  this.attach(`Screenshot saved: ${path}`, 'text/plain');
});

When('I take a screenshot', async function (this: ICustomWorld) {
  const page = requirePage(this);
  const image = await page.screenshot({ fullPage: true });
  this.attach(image, 'image/png');
});

When('I wait for {int} seconds', async function (this: ICustomWorld, seconds: number) {
  const page = requirePage(this);
  await page.waitForTimeout(seconds * 1000);
  this.attach(`Waited ${seconds} second(s)`, 'text/plain');
});

When('I wait for {int} second', async function (this: ICustomWorld, seconds: number) {
  const page = requirePage(this);
  await page.waitForTimeout(seconds * 1000);
  this.attach(`Waited ${seconds} second(s)`, 'text/plain');
});

When('I wait for text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
  this.attach(`Text visible: ${text}`, 'text/plain');
});

When('I wait for button with text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const escaped = text.replace(/"/g, '\\"');
  const buttonOnly = page.locator(`button:has-text("${escaped}"), [role="button"]:has-text("${escaped}"), input[type="button"][value*="${escaped}"], input[type="submit"][value*="${escaped}"]`);
  try {
    await firstVisible(buttonOnly, 20000);
  } catch {
    await firstVisible(clickableByText(page, text), 20000);
  }
  this.attach(`Button visible: ${text}`, 'text/plain');
});

When('I force click on button with text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const escaped = text.replace(/"/g, '\\"');
  const buttonOnly = page.locator(`button:has-text("${escaped}"), [role="button"]:has-text("${escaped}"), input[type="button"][value*="${escaped}"], input[type="submit"][value*="${escaped}"]`);
  let button: Locator;
  try {
    button = await firstVisible(buttonOnly, 10000);
  } catch {
    button = await firstVisible(clickableByText(page, text));
  }
  await button.click({ force: true, timeout: 20000 });
  this.attach(`Force clicked button with text: ${text}`, 'text/plain');
});

When('I force click on button with text {string} if visible', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);

  try {
    const button = await firstVisible(clickableByText(page, text), 3000);
    await button.click({ force: true, timeout: 15000 });
    this.attach(`Force clicked optional button with text: ${text}`, 'text/plain');
  } catch {
    this.attach(`Optional button not visible, skipping click: ${text}`, 'text/plain');
  }
});

When('I click button containing text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const button = await firstVisible(clickableByText(page, text));
  await button.click({ timeout: 20000 });
  this.attach(`Clicked button containing text: ${text}`, 'text/plain');
});

When('I force click on {string}', async function (this: ICustomWorld, selector: string) {
  const page = requirePage(this);
  const locator = page.locator(selector);

  try {
    const element = await firstVisible(locator);
    await element.click({ force: true, timeout: 20000 });
    this.attach(`Force clicked: ${selector} (Playwright click)`, 'text/plain');
    return;
  } catch {
    // Fall back to a DOM click sequence for controls that ignore Playwright force click.
  }

  const fallback = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) {
      return { success: false, reason: 'not-found' };
    }

    el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });

    const events = ['pointerdown', 'mousedown', 'mouseup', 'click'];
    for (const type of events) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }

    // Native click keeps behavior consistent with onclick handlers.
    el.click();

    return {
      success: true,
      tag: el.tagName,
      id: el.id || '',
      className: el.className || ''
    };
  }, selector);

  if (!fallback.success) {
    throw new Error(`Could not force click selector: ${selector} (${fallback.reason})`);
  }

  this.attach(`Force clicked: ${selector} (DOM fallback)`, 'text/plain');
});

When('I fill modal input with {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const value = substituteCredentials(text);
  const dialog = page.locator('.modal-dialog:visible, [role="dialog"]:visible').first();
  const modalInput = dialog.locator('input[type="text"], input:not([type]), textarea').first();

  if (await dialog.isVisible().catch(() => false)) {
    await modalInput.fill(value, { timeout: 20000 });
  } else {
    await page.locator('input[type="text"], input:not([type]), textarea').first().fill(value, {
      timeout: 20000
    });
  }

  this.attach(`Filled modal input with value: ${value}`, 'text/plain');
});

When('I click modal button with text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const dialog = page.locator('.modal-dialog:visible, [role="dialog"]:visible').first();
  const modalButton = dialog.locator(`button:has-text("${text}")`).first();

  if (await modalButton.isVisible().catch(() => false)) {
    await modalButton.click({ timeout: 20000 });
  } else {
    await page.locator(`button:has-text("${text}")`).first().click({ timeout: 20000 });
  }

  this.attach(`Clicked modal button: ${text}`, 'text/plain');
});

When('I click on dialog button with text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  const button = await firstVisible(
    page.locator(`.modal-dialog button:has-text("${text}"), [role="dialog"] button:has-text("${text}")`)
  );
  await button.click({ timeout: 20000 });
  this.attach(`Clicked dialog button: ${text}`, 'text/plain');
});

When('I click first visible grid cell', async function (this: ICustomWorld) {
  const page = requirePage(this);
  const gridCell = await firstVisible(
    page.locator('table td, [role="gridcell"], .ag-cell, .ui-grid-cell')
  );
  await gridCell.click({ timeout: 20000 });
  this.attach('Clicked first visible grid cell', 'text/plain');
});

When(
  'I select option {int} from Select2 dropdown labeled {string}',
  async function (this: ICustomWorld, optionIndex: number, labelText: string) {
    const page = requirePage(this);
    const label = await firstVisible(page.locator(`label:has-text("${labelText}")`));

    const forAttr = await label.getAttribute('for');
    if (forAttr) {
      const container = page.locator(`#select2-${forAttr}-container`).first();
      if (await container.isVisible().catch(() => false)) {
        await container.click({ timeout: 15000 });
      } else {
        await page.locator(`#${forAttr}`).first().click({ timeout: 15000 });
      }
    } else {
      const select2FromLabel = label.locator(
        'xpath=following::span[contains(@class,"select2-selection")][1]'
      );
      await select2FromLabel.first().click({ timeout: 15000 });
    }

    const option = page
      .locator('.select2-results__option:not([aria-disabled="true"])')
      .nth(Math.max(optionIndex - 1, 0));
    await option.waitFor({ state: 'visible', timeout: 20000 });
    await option.click({ timeout: 15000 });

    this.attach(`Selected Select2 option ${optionIndex} for label: ${labelText}`, 'text/plain');
  }
);

When(
  'I select {string} from Select2 dropdown labeled {string}',
  async function (this: ICustomWorld, optionText: string, labelText: string) {
    const page = requirePage(this);
    const label = await firstVisible(page.locator(`label:has-text("${labelText}")`));

    const forAttr = await label.getAttribute('for');
    if (forAttr) {
      const container = page.locator(`#select2-${forAttr}-container`).first();
      if (await container.isVisible().catch(() => false)) {
        await container.click({ timeout: 15000 });
      } else {
        await page.locator(`#${forAttr}`).first().click({ timeout: 15000 });
      }
    } else {
      const select2FromLabel = label.locator(
        'xpath=following::span[contains(@class,"select2-selection")][1]'
      );
      await select2FromLabel.first().click({ timeout: 15000 });
    }

    // Wait for the dropdown to open then select by matching text
    const option = page
      .locator('.select2-results__option:not([aria-disabled="true"])')
      .filter({ hasText: optionText })
      .first();
    await option.waitFor({ state: 'visible', timeout: 20000 });
    await option.click({ timeout: 15000 });

    this.attach(`Selected Select2 option "${optionText}" for label: ${labelText}`, 'text/plain');
  }
);

When(
  'I select {string} from dropdown labeled {string}',
  async function (this: ICustomWorld, optionText: string, labelText: string) {
    const page = requirePage(this);
    const label = await firstVisible(page.locator(`label:has-text("${labelText}")`));

    const forAttr = await label.getAttribute('for');
    let select: Locator;

    if (forAttr) {
      select = page.locator(`select#${forAttr}`).first();
    } else {
      select = label.locator('xpath=following::select[1]').first();
    }

    await select.waitFor({ state: 'visible', timeout: 20000 });

    await select
      .selectOption({ label: optionText })
      .catch(async () => select.selectOption({ value: optionText }))
      .catch(async () => select.selectOption({ index: 0 }));

    this.attach(`Selected option ${optionText} from ${labelText}`, 'text/plain');
  }
);

Then('I should see text {string}', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 20000 });
});

Then('I verify text {string} is visible', async function (this: ICustomWorld, text: string) {
  const page = requirePage(this);
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 20000 });
});

When(
  'I click at dropdown option {int} below {string}',
  async function (this: ICustomWorld, optionIndex: number, selector: string) {
    const page = requirePage(this);

    // Ensure the trigger is open before searching for options.
    await page.locator(selector).first().click({ force: true, timeout: 20000 });
    await page.waitForTimeout(500);

    const options = page.locator(
      '.daterangepicker li:visible, .dropdown-menu li:visible, ul[role="listbox"] li:visible'
    );
    await options.first().waitFor({ state: 'visible', timeout: 10000 });

    const option = options.nth(Math.max(optionIndex - 1, 0));
    await option.click({ force: true, timeout: 15000 });

    this.attach(`Clicked dropdown option ${optionIndex} below ${selector}`, 'text/plain');
  }
);

When('I calculate coordinates for {string}', async function (this: ICustomWorld, selector: string) {
  const page = requirePage(this);
  const box = await page.locator(selector).first().boundingBox();
  expect(box).toBeTruthy();

  if (!box) {
    return;
  }

  this.calculatedPosition = {
    selector,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    centerX: box.x + box.width / 2,
    centerY: box.y + box.height / 2
  };

  this.attach(
    `Calculated position for ${selector}: center=(${this.calculatedPosition.centerX}, ${this.calculatedPosition.centerY})`,
    'text/plain'
  );
});

When(
  'I click {int} pixels below {string}',
  async function (this: ICustomWorld, pixelsBelow: number, selector: string) {
    const page = requirePage(this);
    const box = await page.locator(selector).first().boundingBox();
    expect(box).toBeTruthy();

    if (!box) {
      return;
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height + pixelsBelow;
    await page.mouse.click(x, y);

    this.attach(`Clicked at (${x}, ${y})`, 'text/plain');
  }
);
