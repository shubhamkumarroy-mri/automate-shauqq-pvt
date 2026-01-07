/**
 * Playwright MCP Integration Step Definitions
 *
 * Example step definitions demonstrating browser automation via MCP.
 * These steps show how to use the Playwright MCP server for interactive
 * exploration and test creation workflows.
 */

import { Given, When, Then, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/custom-world.js';
import * as playwrightHelpers from '../utils/playwright-mcp-helpers.js';
import { substituteCredentials } from '../utils/credential-helpers.js';

/**
 * NAVIGATION & PAGE INTERACTION STEPS
 */

Given('I navigate to {string}', async function (this: ICustomWorld, url: string) {
  const substitutedUrl = substituteCredentials(url);
  const result = await playwrightHelpers.navigateTo(this, substitutedUrl);
  this.attach(`Navigated to: ${result.url}`, 'text/plain');

  expect(result.success).toBeTruthy();
});

Given('I am on the {string} page', async function (this: ICustomWorld, pageName: string) {
  // Map friendly names to URLs
  const pageMap: Record<string, string> = {
    'example homepage': 'https://example.com',
    'playwright testing': 'https://playwright.dev',
    'github': 'https://github.com',
    'cucumber': 'https://cucumber.io'
  };

  const url = pageMap[pageName.toLowerCase()];
  if (!url) {
    throw new Error(
      `Unknown page: ${pageName}. Available pages: ${Object.keys(pageMap).join(', ')}`
    );
  }

  const result = await playwrightHelpers.navigateTo(this, url);
  this.attach(`Navigated to: ${result.url}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.clickElement(this, selector);
  this.attach(`Click result: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When(
  'I fill {string} with {string}',
  async function (this: ICustomWorld, selector: string, text: string) {
    const substitutedText = substituteCredentials(text);
    const result = await playwrightHelpers.fillInput(this, selector, substitutedText);
    this.attach(`Fill result: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When('I take a screenshot named {string}', async function (this: ICustomWorld, name: string) {
  const result = await playwrightHelpers.takeScreenshot(this, name);
  this.attach(`Screenshot saved: ${result.path}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I take a screenshot', async function (this: ICustomWorld) {
  const result = await playwrightHelpers.takeScreenshot(this);
  this.attach(`Screenshot saved: ${result.path}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I wait for {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.waitForSelector(this, selector, 30000);
  this.attach(result.message, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I wait for button with text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.waitForElement(this, `button:has-text("${text}")`, 15000);
  this.attach(`Waited for button: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I wait for {int} seconds', async function (this: ICustomWorld, seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  this.attach(`Waited ${seconds} second(s)`, 'text/plain');
});

When('I wait for {int} second', async function (this: ICustomWorld, seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  this.attach(`Waited ${seconds} second(s)`, 'text/plain');
});
/**
 * ELEMENT QUERY & INSPECTION STEPS
 */

When('I query elements matching {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.queryElements(this, selector);
  this.attach(
    `Found ${result.count} elements matching "${selector}":\n${result.elements.map(el => `- ${el.text} (visible: ${el.visible})`).join('\n')}`,
    'text/plain'
  );
  this.lastQueryResult = result;
});

When('I inspect element {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.inspectElement(this, selector);
  this.attach(
    `Element HTML:\n${result.html}\n\nAttributes:\n${JSON.stringify(result.attributes, null, 2)}`,
    'text/plain'
  );
  this.lastInspectResult = result;
});

Then(
  'the element {string} should be visible',
  async function (this: ICustomWorld, selector: string) {
    const isVisible = await playwrightHelpers.isElementVisible(this, selector);
    expect(isVisible).toBeTruthy();
    this.attach(`Element "${selector}" is visible`, 'text/plain');
  }
);

Then(
  'the element {string} should not be visible',
  async function (this: ICustomWorld, selector: string) {
    const isVisible = await playwrightHelpers.isElementVisible(this, selector);
    expect(isVisible).toBeFalsy();
    this.attach(`Element "${selector}" is not visible`, 'text/plain');
  }
);

Then(
  'I should see {int} elements matching {string}',
  async function (this: ICustomWorld, expectedCount: number, selector: string) {
    const result = await playwrightHelpers.queryElements(this, selector);
    expect(result.count).toBe(expectedCount);
    this.attach(`Found ${result.count} elements matching "${selector}"`, 'text/plain');
  }
);

Then(
  'I should see at least {int} elements matching {string}',
  async function (this: ICustomWorld, minCount: number, selector: string) {
    const result = await playwrightHelpers.queryElements(this, selector);
    expect(result.count).toBeGreaterThanOrEqual(minCount);
    this.attach(
      `Found ${result.count} elements matching "${selector}" (expected at least ${minCount})`,
      'text/plain'
    );
  }
);

Then(
  'the text content should include {string}',
  async function (this: ICustomWorld, expectedText: string) {
    if (!this.lastQueryResult) {
      throw new Error(
        'No previous query result. Query elements first using "I query elements matching..."'
      );
    }

    const allText = this.lastQueryResult.elements.map((el: any) => el.text).join(' ');
    expect(allText).toContain(expectedText);
    this.attach(`Text content includes: "${expectedText}"`, 'text/plain');
  }
);

/**
 * PAGE STATE & VERIFICATION STEPS
 */

When('I get the current page state', async function (this: ICustomWorld) {
  const state = await playwrightHelpers.getPageState(this);
  this.attach(
    `Page State:\nURL: ${state.url}\nTitle: ${state.title}\nHTML length: ${state.content.length} characters`,
    'text/plain'
  );
  this.lastPageState = state;
});

Then(
  'the page title should be {string}',
  async function (this: ICustomWorld, expectedTitle: string) {
    const state = await playwrightHelpers.getPageState(this);
    expect(state.title).toBe(expectedTitle);
    this.attach(`Page title: "${state.title}"`, 'text/plain');
  }
);

Then('the page URL should contain {string}', async function (this: ICustomWorld, urlPart: string) {
  const state = await playwrightHelpers.getPageState(this);
  expect(state.url).toContain(urlPart);
  this.attach(`Page URL contains: "${urlPart}"`, 'text/plain');
});

Then('the page should contain {string}', async function (this: ICustomWorld, text: string) {
  if (!this.lastPageState) {
    const state = await playwrightHelpers.getPageState(this);
    this.lastPageState = state;
  }

  expect(this.lastPageState.content).toContain(text);
  this.attach(`Page contains: "${text}"`, 'text/plain');
});

/**
 * SCRIPTING & ADVANCED STEPS
 */

When('I execute script {string}', async function (this: ICustomWorld, script: string) {
  const substitutedScript = substituteCredentials(script);
  const result = await playwrightHelpers.evaluateScript(this, substitutedScript);
  this.attach(
    `Script execution:\nCode: ${substitutedScript}\nResult: ${JSON.stringify(result.result, null, 2)}\nError: ${result.error || 'None'}`,
    'text/plain'
  );
  this.lastScriptResult = result;
});

Then(
  'the script result should be {string}',
  async function (this: ICustomWorld, expectedResult: string) {
    if (!this.lastScriptResult) {
      throw new Error('No previous script result. Execute a script first.');
    }

    const actualResult = JSON.stringify(this.lastScriptResult.result);
    expect(actualResult).toContain(expectedResult);
    this.attach(`Script result matches: "${expectedResult}"`, 'text/plain');
  }
);

/**
 * FORM INTERACTION STEPS
 */

When('I fill the following form fields:', async function (this: ICustomWorld, dataTable: any) {
  const formData: Record<string, string> = {};
  dataTable.hashes().forEach((row: Record<string, string>) => {
    formData[row.selector] = row.value;
  });

  const results = await playwrightHelpers.fillForm(this, formData);

  const resultMessages = results.map(r => `${r.success ? '✓' : '✗'} ${r.message}`).join('\n');
  this.attach(`Form fill results:\n${resultMessages}`, 'text/plain');

  const allSuccessful = results.every(r => r.success);
  expect(allSuccessful).toBeTruthy();
});

When('I fill username textbox with {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.fillByRole(this, 'textbox', text, { name: 'Username' });
  this.attach(`Filled username: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I fill password textbox with {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.fillByRole(this, 'textbox', text, { name: 'Password' });
  this.attach(`Filled password: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on button with text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.clickByRole(this, 'button', { name: text });
  this.attach(`Clicked button: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on link with text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.clickByRole(this, 'link', { name: text });
  this.attach(`Clicked link: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on element with title {string}', async function (this: ICustomWorld, title: string) {
  const result = await playwrightHelpers.clickByTitle(this, title);
  this.attach(`Clicked element with title: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I fill first textbox with {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.fillFirstRole(this, 'textbox', text);
  this.attach(`Filled first textbox: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on gridcell with text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.clickByRole(this, 'gridcell', { name: text });
  this.attach(`Clicked gridcell: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When(
  'I click on dialog button with text {string}',
  async function (this: ICustomWorld, text: string) {
    const result = await playwrightHelpers.clickDialogButton(this, text);
    this.attach(`Clicked dialog button: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When('I click on combobox with name {string}', async function (this: ICustomWorld, name: string) {
  const result = await playwrightHelpers.clickByRole(this, 'combobox', { name });
  this.attach(`Clicked combobox: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I click on treeitem with text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.clickByRole(this, 'treeitem', { name: text });
  this.attach(`Clicked treeitem: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When(
  'I click on select2 container with id {string}',
  async function (this: ICustomWorld, id: string) {
    const result = await playwrightHelpers.clickElement(this, `#${id}`);
    this.attach(`Clicked select2 container: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When('I click on text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.clickByText(this, text);
  this.attach(`Clicked text: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I wait for text {string}', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.waitForText(this, text, 15000);
  this.attach(`Waited for text: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

Then('I verify text {string} is visible', async function (this: ICustomWorld, text: string) {
  const result = await playwrightHelpers.isTextVisible(this, text);
  this.attach(`Text visibility check: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

/**
 * INTERACTIVE EXPLORATION STEPS
 */

Given('I explore the page structure', async function (this: ICustomWorld) {
  const state = await playwrightHelpers.getPageState(this);

  // Extract common elements
  const elementTypes = ['button', 'a', 'input', 'form', 'h1', 'h2', 'h3'];
  const exploration: Record<string, any> = {
    url: state.url,
    title: state.title,
    elements: {}
  };

  for (const elementType of elementTypes) {
    const result = await playwrightHelpers.queryElements(this, elementType);
    exploration.elements[elementType] = {
      count: result.count,
      visible: result.elements.filter(el => el.visible).length,
      samples: result.elements
        .filter(el => el.visible && el.text)
        .slice(0, 3)
        .map(el => el.text)
    };
  }

  this.attach(`Page Exploration:\n${JSON.stringify(exploration, null, 2)}`, 'text/plain');
  this.pageExploration = exploration;
});

Then(
  'I should see the following element types:',
  async function (this: ICustomWorld, dataTable: any) {
    const expectedTypes: string[] = dataTable.raw().flat();

    for (const elementType of expectedTypes) {
      const result = await playwrightHelpers.queryElements(this, elementType);
      expect(result.count).toBeGreaterThan(0);
      this.attach(`✓ Found ${result.count} "${elementType}" elements`, 'text/plain');
    }
  }
);

/**
 * FORCE INTERACTION STEPS (bypass actionability checks via script execution)
 */

When(
  'I force click on button with text {string}',
  async function (this: ICustomWorld, text: string) {
    const result = await playwrightHelpers.forceClickByText(this, 'button', text);
    this.attach(`Force clicked button: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When(
  'I force click on {string} with text {string}',
  async function (this: ICustomWorld, tag: string, text: string) {
    const result = await playwrightHelpers.forceClickByText(this, tag, text);
    this.attach(`Force clicked ${tag}: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When(
  'I force fill {string} with {string}',
  async function (this: ICustomWorld, selector: string, text: string) {
    const result = await playwrightHelpers.forceSetValue(this, selector, text);
    this.attach(`Force filled: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When(
  'I force click on gridcell with text {string}',
  async function (this: ICustomWorld, text: string) {
    // Use partial match for gridcells since they might have extra whitespace
    const substitutedText = substituteCredentials(text);
    const result = await playwrightHelpers.forceClickByText(this, '[role="gridcell"]', substitutedText, true);
    this.attach(`Force clicked gridcell: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

When('I type {string}', async function (this: ICustomWorld, text: string) {
  const substitutedText = substituteCredentials(text);
  const result = await playwrightHelpers.typeText(this, substitutedText);
  this.attach(`Typed: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When('I force click on selector {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.clickElement(this, selector, { force: true });
  this.attach(`Force clicked selector: ${result.message}`, 'text/plain');
  expect(result.success).toBeTruthy();
});

When(
  'I force click on input with text {string}',
  async function (this: ICustomWorld, text: string) {
    const result = await playwrightHelpers.forceClickByText(this, 'input', text);
    this.attach(`Force clicked input: ${result.message}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

/**
 * CLEANUP & SESSION MANAGEMENT
 */

After(async function (this: ICustomWorld) {
  // Close browser session after each scenario (optional)
  // This can be commented out to keep browser open for inspection
  // const result = await playwrightHelpers.closeBrowserSession(this);
  // if (result.success) {
  //   console.log('Browser session closed');
  // }
});

// Debug step - inspect page elements
When('I debug inspect {string}', async function (this: ICustomWorld, selector: string) {
  const result = await playwrightHelpers.inspectElements(this, selector);
  this.attach(
    `Inspected "${selector}":\n${JSON.stringify(result.elements, null, 2)}`,
    'text/plain'
  );
});
