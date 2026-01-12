/**
 * Search Purchase Order Feature Step Definitions
 * 
 * Custom step definitions specific to the search-po feature.
 * Reuses common steps from playwright-mcp.steps.ts where possible.
 * 
 * Available reusable steps:
 * - When I navigate to {string}
 * - When I click button with text {string}
 * - When I take a screenshot named {string}
 * - When I wait for {int} seconds
 * - Then I should see text {string}
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/custom-world.js';
import * as playwrightHelpers from '../utils/playwright-mcp-helpers.js';

/**
 * PURCHASE ORDER SPECIFIC STEPS
 * Add custom steps here that are specific to Purchase Order workflows
 */

// Example: Custom step that combines navigation and waiting
When(
  'I navigate to Purchase Order Control Screen',
  async function (this: ICustomWorld) {
    const url = 'https://internal-dev.accuserv.cloud/purchase-orders/purchase-order-control-screen/';
    const result = await playwrightHelpers.navigateTo(this, url);
    this.attach(`Navigated to PO Control Screen: ${result.url}`, 'text/plain');
    expect(result.success).toBeTruthy();
    
    // Wait for page to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
);

// Example: Custom step for taking PO feature screenshots
When(
  'I capture PO screenshot {string}',
  async function (this: ICustomWorld, name: string) {
    const fullName = `search-po/${name}`;
    const result = await playwrightHelpers.takeScreenshot(this, fullName);
    this.attach(`PO Screenshot saved: ${result.path}`, 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

// Example: Verify purchase order search criteria screen
Then(
  'I should see the Purchase Order Search Criteria screen',
  async function (this: ICustomWorld) {
    const result = await playwrightHelpers.isTextVisible(this, 'Purchase Order Search Criteria');
    this.attach('Verified PO Search Criteria screen is visible', 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

// Example: Verify search results screen
Then(
  'I should see the Search Results screen',
  async function (this: ICustomWorld) {
    const result = await playwrightHelpers.isTextVisible(this, 'Search Results');
    this.attach('Verified Search Results screen is visible', 'text/plain');
    expect(result.success).toBeTruthy();
  }
);

/**
 * Add more Purchase Order specific steps here as needed:
 * - Steps for filtering purchase orders
 * - Steps for selecting specific PO fields
 * - Steps for verifying PO data
 * - Steps for PO actions (edit, delete, etc.)
 */
