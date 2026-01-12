/**
 * Playwright MCP Helper Utilities
 *
 * Provides type-safe, reusable functions for browser automation via MCP.
 * These helpers abstract the MCP tool invocation pattern and provide
 * convenient interfaces for common Playwright operations.
 */

import { ICustomWorld } from '../support/custom-world.js';

interface NavigateResult {
  success: boolean;
  url: string;
  title: string;
  message: string;
}

interface ClickResult {
  success: boolean;
  message: string;
}

interface FillResult {
  success: boolean;
  message: string;
}

interface ScreenshotResult {
  success: boolean;
  path: string;
  message: string;
}

interface QueryResult {
  success: boolean;
  count: number;
  elements: { text: string; visible: boolean }[];
}

interface InspectResult {
  success: boolean;
  html: string;
  attributes: Record<string, string>;
}

interface EvaluateResult {
  success: boolean;
  result: unknown;
  error?: string;
}

interface PageStateResult {
  success: boolean;
  url: string;
  title: string;
  content: string;
}

interface CloseBrowserResult {
  success: boolean;
  message: string;
}

interface WaitForSelectorResult {
  success: boolean;
  message: string;
}

/**
 * Navigate to a URL
 * @param world The Cucumber world context
 * @param url The URL to navigate to
 * @returns Navigation result with success status, URL, and page title
 */
export async function navigateTo(world: ICustomWorld, url: string): Promise<NavigateResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'navigate',
    arguments: { url }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Click an element
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @param options Optional click options (delay, force)
 * @returns Click result with success status and message
 */
export async function clickElement(
  world: ICustomWorld,
  selector: string,
  options: { delay?: number; force?: boolean } = {}
): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'click',
    arguments: {
      selector,
      delay: options.delay,
      force: options.force
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Fill an input field with text
 * @param world The Cucumber world context
 * @param selector CSS selector for the input
 * @param text Text to fill
 * @returns Fill result with success status and message
 */
export async function fillInput(
  world: ICustomWorld,
  selector: string,
  text: string
): Promise<FillResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'fill',
    arguments: {
      selector,
      text
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Take a screenshot
 * @param world The Cucumber world context
 * @param name Optional screenshot name
 * @returns Screenshot result with file path
 */
export async function takeScreenshot(
  world: ICustomWorld,
  name?: string
): Promise<ScreenshotResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'screenshot',
    arguments: {
      name: name || `screenshot`
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Query all elements matching a selector
 * @param world The Cucumber world context
 * @param selector CSS selector to query
 * @returns Query result with element count and details
 */
export async function queryElements(world: ICustomWorld, selector: string): Promise<QueryResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'queryElements',
    arguments: {
      selector
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Inspect a single element
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @returns Inspect result with HTML and attributes
 */
export async function inspectElement(
  world: ICustomWorld,
  selector: string
): Promise<InspectResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'inspect',
    arguments: {
      selector
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Execute JavaScript in the page context
 * @param world The Cucumber world context
 * @param script JavaScript code to execute
 * @returns Evaluate result with return value
 */
export async function evaluateScript(world: ICustomWorld, script: string): Promise<EvaluateResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'evaluateScript',
    arguments: {
      script
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Get current page state
 * @param world The Cucumber world context
 * @returns Page state with URL, title, and HTML content
 */
export async function getPageState(world: ICustomWorld): Promise<PageStateResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'getPageState',
    arguments: {}
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Close the browser session
 * @param world The Cucumber world context
 * @returns Close result with success status
 */
export async function closeBrowserSession(world: ICustomWorld): Promise<CloseBrowserResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'closeBrowserSession',
    arguments: {}
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Wait for a selector to be visible
 * @param world The Cucumber world context
 * @param selector Selector to wait for
 * @param timeoutMs Optional timeout in milliseconds
 */
export async function waitForSelector(
  world: ICustomWorld,
  selector: string,
  timeoutMs?: number
): Promise<WaitForSelectorResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  const result = await world.mcpClients.playwright.callTool({
    name: 'waitForSelector',
    arguments: {
      selector,
      timeoutMs
    }
  });
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
}

/**
 * Navigate and wait for element (convenience wrapper)
 * @param world The Cucumber world context
 * @param url URL to navigate to
 * @param selector Selector to wait for
 * @param timeout Timeout in milliseconds
 * @returns Navigation result
 */
export async function navigateAndWaitForElement(
  world: ICustomWorld,
  url: string,
  selector: string,
  timeout = 5000
): Promise<NavigateResult> {
  const navResult = await navigateTo(world, url);

  if (navResult.success) {
    // Simple retry logic for element visibility
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const queryResult = await queryElements(world, selector);
      if (queryResult.count > 0 && queryResult.elements.some(el => el.visible)) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return navResult;
}

/**
 * Fill and submit a form (convenience wrapper)
 * @param world The Cucumber world context
 * @param formFields Object mapping selectors to values
 * @returns Fill results
 */
export async function fillForm(
  world: ICustomWorld,
  formFields: Record<string, string>
): Promise<FillResult[]> {
  const results: FillResult[] = [];
  for (const [selector, text] of Object.entries(formFields)) {
    const result = await fillInput(world, selector, text);
    results.push(result);
    if (!result.success) {
      break;
    }
  }
  return results;
}

/**
 * Get visible text content from elements
 * @param world The Cucumber world context
 * @param selector CSS selector for elements
 * @returns Array of visible text content
 */
export async function getVisibleText(world: ICustomWorld, selector: string): Promise<string[]> {
  const queryResult = await queryElements(world, selector);
  return queryResult.elements.filter(el => el.visible).map(el => el.text);
}

/**
 * Check if element is visible
 * @param world The Cucumber world context
 * @param selector CSS selector for element
 * @returns True if element is visible
 */
export async function isElementVisible(world: ICustomWorld, selector: string): Promise<boolean> {
  const queryResult = await queryElements(world, selector);
  return queryResult.count > 0 && queryResult.elements.some(el => el.visible);
}

/**
 * Click element by role attribute
 * @param world The Cucumber world context
 * @param role The role (button, link, textbox, etc.)
 * @param options Filter options (name, exact, etc.)
 * @returns Click result
 */
export async function clickByRole(
  world: ICustomWorld,
  role: string,
  options?: Record<string, any>
): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    let selector = `[role="${role}"]`;

    if (options?.name) {
      // Try exact match first
      selector = `[role="${role}"]:has-text("${options.name}")`;
    }

    // Primary attempt
    const baseArguments: Record<string, any> = { selector };
    const primary = await world.mcpClients.playwright.callTool({
      name: 'click',
      arguments: baseArguments
    });

    const primaryContent = primary.content as { type: string; text: string }[];
    const parsedPrimary = JSON.parse(
      primaryContent[0].type === 'text' ? primaryContent[0].text : primaryContent[0].text
    );

    if (parsedPrimary.success) {
      return {
        success: true,
        message: parsedPrimary.message || `Clicked ${role}`
      };
    }

    // Fallback with force click if allowed
    if (options?.force === false) {
      return {
        success: false,
        message: parsedPrimary.message || `Failed to click ${role}`
      };
    }

    const forced = await world.mcpClients.playwright.callTool({
      name: 'click',
      arguments: { ...baseArguments, force: true }
    });

    const forcedContent = forced.content as { type: string; text: string }[];
    const parsedForced = JSON.parse(
      forcedContent[0].type === 'text' ? forcedContent[0].text : forcedContent[0].text
    );

    return {
      success: parsedForced.success,
      message: parsedForced.message || `Clicked ${role} (forced)`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to click ${role}: ${(error as Error).message}`
    };
  }
}

/**
 * Fill input by role attribute
 * @param world The Cucumber world context
 * @param role The role (textbox, combobox, etc.)
 * @param text Text to fill
 * @param options Filter options (name, exact, etc.)
 * @returns Fill result
 */
export async function fillByRole(
  world: ICustomWorld,
  role: string,
  text: string,
  options?: Record<string, any>
): Promise<FillResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    let selector = `[role="${role}"]`;

    if (options?.name) {
      selector = `[aria-label*="${options.name}"], [placeholder*="${options.name}"]`;
    }

    const result = await world.mcpClients.playwright.callTool({
      name: 'fill',
      arguments: { selector, text }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Filled ${role}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to fill ${role}: ${(error as Error).message}`
    };
  }
}

/**
 * Fill first element of a role type
 * @param world The Cucumber world context
 * @param role The role (textbox, etc.)
 * @param text Text to fill
 * @returns Fill result
 */
export async function fillFirstRole(
  world: ICustomWorld,
  role: string,
  text: string
): Promise<FillResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `[role="${role}"]`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'fill',
      arguments: { selector, text }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Filled first ${role}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to fill first ${role}: ${(error as Error).message}`
    };
  }
}

/**
 * Click element by title attribute
 * @param world The Cucumber world context
 * @param title The title attribute value
 * @returns Click result
 */
export async function clickByTitle(world: ICustomWorld, title: string): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `[title="${title}"]`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'click',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Clicked element with title`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to click element by title: ${(error as Error).message}`
    };
  }
}

/**
 * Click button inside a dialog
 * @param world The Cucumber world context
 * @param buttonText The button text
 * @returns Click result
 */
export async function clickDialogButton(
  world: ICustomWorld,
  buttonText: string
): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `[role="dialog"] button:has-text("${buttonText}")`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'click',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Clicked dialog button`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to click dialog button: ${(error as Error).message}`
    };
  }
}

/**
 * Click element containing specific text
 * @param world The Cucumber world context
 * @param text The text to search for
 * @returns Click result
 */
export async function clickByText(world: ICustomWorld, text: string): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `:has-text("${text}")`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'click',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Clicked element with text`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to click element by text: ${(error as Error).message}`
    };
  }
}

/**
 * Wait for text to appear on page
 * @param world The Cucumber world context
 * @param text The text to wait for
 * @param timeoutMs Timeout in milliseconds
 * @returns Wait result
 */
export async function waitForText(
  world: ICustomWorld,
  text: string,
  timeoutMs = 15000
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `:has-text("${text}")`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'waitForSelector',
      arguments: { selector, timeoutMs }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Text appeared`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to wait for text: ${(error as Error).message}`
    };
  }
}

/**
 * Check if text is visible on page
 * @param world The Cucumber world context
 * @param text The text to check
 * @returns Visibility result
 */
export async function isTextVisible(
  world: ICustomWorld,
  text: string
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const selector = `:has-text("${text}")`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'queryElements',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    const isVisible = parsed.elements?.some((el: any) => el.visible);

    return {
      success: isVisible,
      message: isVisible ? `Text is visible` : `Text is not visible`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check text visibility: ${(error as Error).message}`
    };
  }
}

/**
 * Wait for element to appear
 * @param world The Cucumber world context
 * @param selector CSS selector for element
 * @param timeoutMs Timeout in milliseconds
 * @returns Wait result
 */
export async function waitForElement(
  world: ICustomWorld,
  selector: string,
  timeoutMs = 15000
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'waitForSelector',
      arguments: { selector, timeoutMs }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);

    return {
      success: parsed.success,
      message: parsed.message || `Element appeared`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to wait for element: ${(error as Error).message}`
    };
  }
}

/**
 * Force click on element by tag and text using script (bypasses actionability checks)
 * @param world The Cucumber world context
 * @param tag HTML tag name (button, a, div, etc.)
 * @param text Text content to match
 * @param partialMatch If true, matches substring ignoring case
 * @returns Click result
 */
export async function forceClickByText(
  world: ICustomWorld,
  tag: string,
  text: string,
  partialMatch = false
): Promise<ClickResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    let script: string;
    if (partialMatch || text === '') {
      // For partial match or empty text, search with more flexibility
      script = `(function() {
        const searchText = '${text.toLowerCase()}';
        const elements = Array.from(document.querySelectorAll('${tag}'));
        let el;
        
        if (searchText === '') {
          // For empty string, just take first matching element
          el = elements[0];
        } else {
          // For partial match, check textContent normalized
          el = elements.find(e => {
            const content = (e.textContent || '').toLowerCase().trim();
            return content.includes(searchText);
          });
        }
        
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
        }
        return !!el;
      })()`;
    } else {
      script = `(function() {
        const el = Array.from(document.querySelectorAll('${tag}')).find(
          e => (e.textContent || '').includes('${text}')
        );
        if (el) el.click();
        return !!el;
      })()`;
    }

    const result = await world.mcpClients.playwright.callTool({
      name: 'evaluateScript',
      arguments: { script }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.result === true,
      message: `Force clicked ${tag} with text "${text}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to force click: ${(error as Error).message}`
    };
  }
}

/**
 * Force set input value using script (bypasses actionability checks)
 * @param world The Cucumber world context
 * @param selector CSS selector for the input
 * @param value Value to set
 * @returns Fill result
 */
export async function forceSetValue(
  world: ICustomWorld,
  selector: string,
  value: string
): Promise<FillResult> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const escapedValue = value.replace(/'/g, '\\\'').replace(/"/g, '\\"');
    const script = `(function() {
      const el = document.querySelector('${selector}');
      if (el) {
        el.value = '${escapedValue}';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return !!el;
    })()`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'evaluateScript',
      arguments: { script }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.result === true,
      message: `Force filled ${selector} with value`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to force fill: ${(error as Error).message}`
    };
  }
}

/**
 * Type text into the focused element
 * @param world The Cucumber world context
 * @param text Text to type
 * @returns Result
 */
export async function typeText(
  world: ICustomWorld,
  text: string
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'type',
      arguments: { text }
    });

    const content = result.content as { type: string; text: string }[];
    let parsed: any;

    try {
      parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    } catch {
      // If JSON parse fails, treat the response as success if it's text
      return {
        success: true,
        message: `Typed text: "${text}"`
      };
    }

    return {
      success: parsed.success !== false,
      message: parsed.message || `Typed text: "${text}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to type text: ${(error as Error).message}`
    };
  }
}

/**
 * Debug helper - inspect page elements of a specific type
 * @param world The Cucumber world context
 * @param selector CSS selector to inspect
 * @returns Array of element information
 */
export async function inspectElements(
  world: ICustomWorld,
  selector: string
): Promise<{ success: boolean; elements: any[]; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const script = `(function() {
      const elements = Array.from(document.querySelectorAll('${selector}'));
      return elements.map((el, idx) => ({
        index: idx,
        tag: el.tagName,
        role: el.getAttribute('role'),
        text: (el.textContent || '').trim(),
        visible: el.offsetParent !== null,
        classes: el.className
      }));
    })()`;

    const result = await world.mcpClients.playwright.callTool({
      name: 'evaluateScript',
      arguments: { script }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: true,
      elements: parsed.result || [],
      message: `Found ${(parsed.result || []).length} elements`
    };
  } catch (error) {
    return {
      success: false,
      elements: [],
      message: `Failed to inspect: ${(error as Error).message}`
    };
  }
}

/**
 * Hover over an element
 * @param world The Cucumber world context
 * @param selector CSS selector for the element to hover
 * @returns Hover result
 */
export async function hoverElement(
  world: ICustomWorld,
  selector: string
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'hover',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Hovered on ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to hover: ${(error as Error).message}`
    };
  }
}

/**
 * Press a keyboard key
 * @param world The Cucumber world context
 * @param key Key to press (e.g., "Enter", "ArrowDown", "Escape")
 * @returns Press key result
 */
export async function pressKey(
  world: ICustomWorld,
  key: string
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'pressKey',
      arguments: { key }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Pressed key: ${key}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to press key: ${(error as Error).message}`
    };
  }
}

/**
 * Get detailed information about an element
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @returns Detailed element information
 */
export async function inspectElementDetailed(
  world: ICustomWorld,
  selector: string
): Promise<{ success: boolean; details: any; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'inspectDetailed',
      arguments: { selector }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      details: parsed.details,
      message: parsed.message || `Inspected ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      details: null,
      message: `Failed to inspect element: ${(error as Error).message}`
    };
  }
}

/**
 * Dispatch a custom event on an element
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @param eventType Event type to dispatch
 * @param eventProperties Optional event properties
 * @returns Dispatch result
 */
export async function dispatchCustomEvent(
  world: ICustomWorld,
  selector: string,
  eventType: string,
  eventProperties?: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'dispatchEvent',
      arguments: { selector, eventType, eventProperties }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Dispatched ${eventType} on ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to dispatch event: ${(error as Error).message}`
    };
  }
}

/**
 * Click an element using multiple strategies with retry logic
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @param options Additional options like maxRetries
 * @returns Click result with strategy used
 */
export async function clickWithRetry(
  world: ICustomWorld,
  selector: string,
  options: { maxRetries?: number; waitBetween?: number } = {}
): Promise<{ success: boolean; message: string; strategy: string }> {
  const maxRetries = options.maxRetries || 5;
  const waitBetween = options.waitBetween || 500;

  const strategies: Array<{
    name: string;
    fn: () => Promise<{ success: boolean; message: string }>;
  }> = [
    {
      name: 'standard-click',
      fn: async () => clickElement(world, selector)
    },
    {
      name: 'force-click',
      fn: async () => clickElement(world, selector, { force: true })
    },
    {
      name: 'hover-then-click',
      fn: async () => {
        await hoverElement(world, selector);
        await new Promise(resolve => setTimeout(resolve, 100));
        return clickElement(world, selector);
      }
    },
    {
      name: 'js-click',
      fn: async () => {
        const result = await evaluateScript(
          world,
          `(() => {
            const el = document.querySelector('${selector}');
            if (el) { el.click(); return true; }
            return false;
          })()`
        );
        return {
          success: result.result === true,
          message: result.result === true ? 'JS click successful' : 'Element not found'
        };
      }
    },
    {
      name: 'dispatch-mouse-events',
      fn: async () => {
        const script = `(() => {
          const el = document.querySelector('${selector}');
          if (!el) return false;
          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            el.dispatchEvent(new MouseEvent(eventType, { bubbles: true, cancelable: true }));
          });
          return true;
        })()`;
        const result = await evaluateScript(world, script);
        return {
          success: result.result === true,
          message: result.result === true ? 'Mouse events dispatched' : 'Element not found'
        };
      }
    }
  ];

  for (let i = 0; i < maxRetries; i++) {
    for (const strategy of strategies) {
      try {
        const result = await strategy.fn();
        if (result.success) {
          return {
            success: true,
            message: `${result.message} (attempt ${i + 1}, strategy: ${strategy.name})`,
            strategy: strategy.name
          };
        }
      } catch (error) {
        // Continue to next strategy
      }
    }

    // Wait before next retry
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, waitBetween));
    }
  }

  return {
    success: false,
    message: `Failed to click ${selector} after ${maxRetries} attempts with all strategies`,
    strategy: 'none'
  };
}

/**
 * Select a date range option with robust interaction strategies
 * @param world The Cucumber world context
 * @param rangeKey Date range key attribute (e.g., "Last 30 Days")
 * @returns Selection result with strategy used
 */
export async function selectDateRangeOption(
  world: ICustomWorld,
  rangeKey: string
): Promise<{ success: boolean; message: string; strategy: string }> {
  const selector = `li[data-range-key="${rangeKey}"]`;

  // First, ensure the dropdown is open and element is visible
  await new Promise(resolve => setTimeout(resolve, 500));

  // Try to click with retry strategies
  const result = await clickWithRetry(world, selector, { maxRetries: 3, waitBetween: 300 });

  // Verify that the dropdown closed (indicating successful selection)
  await new Promise(resolve => setTimeout(resolve, 500));
  const stillVisible = await isElementVisible(world, selector);

  if (!stillVisible) {
    return {
      success: true,
      message: `Successfully selected date range: ${rangeKey} using ${result.strategy}`,
      strategy: result.strategy
    };
  }

  return {
    success: false,
    message: `Clicked ${rangeKey} but dropdown did not close`,
    strategy: result.strategy
  };
}

/**
 * Click at specific screen coordinates
 * @param world The Cucumber world context
 * @param x X coordinate in pixels
 * @param y Y coordinate in pixels
 * @param options Click options (button, clickCount, delay)
 * @returns Click result
 */
export async function clickAtCoordinates(
  world: ICustomWorld,
  x: number,
  y: number,
  options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; delay?: number }
): Promise<{ success: boolean; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'clickAtCoordinates',
      arguments: { x, y, ...options }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      message: parsed.message || `Clicked at (${x}, ${y})`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to click at coordinates: ${(error as Error).message}`
    };
  }
}

/**
 * Get element and text at specific screen coordinates
 * @param world The Cucumber world context
 * @param x X coordinate in pixels
 * @param y Y coordinate in pixels
 * @returns Element information at coordinates
 */
export async function getTextAtCoordinates(
  world: ICustomWorld,
  x: number,
  y: number
): Promise<{ success: boolean; text: string; element: any; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await world.mcpClients.playwright.callTool({
      name: 'getTextAtCoordinates',
      arguments: { x, y }
    });

    const content = result.content as { type: string; text: string }[];
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : content[0].text);
    return {
      success: parsed.success,
      text: parsed.text || '',
      element: parsed.element || null,
      message: parsed.message || `Got element at (${x}, ${y})`
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      element: null,
      message: `Failed to get text at coordinates: ${(error as Error).message}`
    };
  }
}

/**
 * Get element's bounding box for dynamic positioning
 * @param world The Cucumber world context
 * @param selector CSS selector for the element
 * @returns Bounding box with x, y, width, height
 */
export async function getElementPosition(
  world: ICustomWorld,
  selector: string
): Promise<{ success: boolean; position: any; message: string }> {
  if (!world.mcpClients?.playwright) {
    throw new Error('Playwright MCP client not initialized');
  }

  try {
    const result = await inspectElementDetailed(world, selector);
    if (!result.success || !result.details) {
      return {
        success: false,
        position: null,
        message: `Failed to get element position: ${result.message}`
      };
    }

    return {
      success: true,
      position: result.details.boundingBox,
      message: `Got position for ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      position: null,
      message: `Failed to get element position: ${(error as Error).message}`
    };
  }
}

/**
 * Calculate coordinates relative to an element (e.g., "3 items below")
 * @param world The Cucumber world context
 * @param selector Base element selector
 * @param offsetX Horizontal offset in pixels (can be negative)
 * @param offsetY Vertical offset in pixels (can be negative)
 * @param useCenter If true, calculates from element center; if false, from top-left
 * @returns Calculated coordinates
 */
export async function calculateRelativeCoordinates(
  world: ICustomWorld,
  selector: string,
  offsetX: number = 0,
  offsetY: number = 0,
  useCenter: boolean = true
): Promise<{ success: boolean; x: number; y: number; message: string }> {
  try {
    const posResult = await getElementPosition(world, selector);
    if (!posResult.success || !posResult.position) {
      return {
        success: false,
        x: 0,
        y: 0,
        message: `Failed to get base element position: ${posResult.message}`
      };
    }

    const box = posResult.position;
    let baseX = box.x;
    let baseY = box.y;

    if (useCenter) {
      baseX += box.width / 2;
      baseY += box.height / 2;
    }

    const finalX = Math.round(baseX + offsetX);
    const finalY = Math.round(baseY + offsetY);

    return {
      success: true,
      x: finalX,
      y: finalY,
      message: `Calculated coordinates: (${finalX}, ${finalY}) from ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      x: 0,
      y: 0,
      message: `Failed to calculate coordinates: ${(error as Error).message}`
    };
  }
}

/**
 * Click at a position relative to an element
 * @param world The Cucumber world context
 * @param selector Base element selector
 * @param offsetX Horizontal offset in pixels
 * @param offsetY Vertical offset in pixels
 * @param useCenter If true, offset from center; if false, from top-left
 * @returns Click result
 */
export async function clickRelativeToElement(
  world: ICustomWorld,
  selector: string,
  offsetX: number,
  offsetY: number,
  useCenter: boolean = true
): Promise<{ success: boolean; message: string; coordinates: { x: number; y: number } }> {
  const coordsResult = await calculateRelativeCoordinates(world, selector, offsetX, offsetY, useCenter);
  
  if (!coordsResult.success) {
    return {
      success: false,
      message: coordsResult.message,
      coordinates: { x: 0, y: 0 }
    };
  }

  const clickResult = await clickAtCoordinates(world, coordsResult.x, coordsResult.y);
  
  return {
    success: clickResult.success,
    message: `${clickResult.message} (relative to ${selector})`,
    coordinates: { x: coordsResult.x, y: coordsResult.y }
  };
}
