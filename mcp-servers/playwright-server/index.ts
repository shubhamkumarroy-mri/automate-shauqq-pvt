#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Tool
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let currentRunDirectory: string | null = null;
let featureName = 'test';

const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

function response(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }]
  };
}

async function initBrowser() {
  if (browser) {
    return page!;
  }

  browser = await chromium.launch({ headless: isHeadless, timeout: 30000 });

  const authStatePath = path.resolve('auth-state.json');
  const contextOptions: Record<string, unknown> = {
    viewport: { width: 1280, height: 720 }
  };

  if (fs.existsSync(authStatePath)) {
    contextOptions.storageState = authStatePath;
  }

  context = await browser.newContext(contextOptions);
  page = await context.newPage();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  currentRunDirectory = path.join('screenshots', `${featureName}-${timestamp}`);
  fs.mkdirSync(currentRunDirectory, { recursive: true });

  return page;
}

async function closeBrowser() {
  if (page) {
    await page.close().catch(() => undefined);
  }
  if (context) {
    await context.close().catch(() => undefined);
  }
  if (browser) {
    await browser.close().catch(() => undefined);
  }

  browser = null;
  context = null;
  page = null;
  currentRunDirectory = null;
  featureName = 'test';
}

async function navigate(url: string) {
  try {
    const currentPage = await initBrowser();
    await currentPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return response({ success: true, url: currentPage.url(), title: await currentPage.title() });
  } catch (error) {
    return response({ success: false, message: String(error), url });
  }
}

async function click(selector: string, options: { delay?: number; force?: boolean } = {}) {
  try {
    const currentPage = await initBrowser();
    await currentPage.locator(selector).first().click({
      delay: options.delay,
      force: options.force
    });
    return response({ success: true, message: `Clicked ${selector}` });
  } catch (error) {
    return response({ success: false, message: String(error), selector });
  }
}

async function fill(selector: string, text: string) {
  try {
    const currentPage = await initBrowser();
    await currentPage.locator(selector).first().fill(text);
    return response({ success: true, message: `Filled ${selector}` });
  } catch (error) {
    return response({ success: false, message: String(error), selector });
  }
}

async function screenshot(name?: string) {
  try {
    const currentPage = await initBrowser();
    const filename = `${(name || 'screenshot').replace(/[\\/]/g, '-')}.png`;
    const filePath = path.join(currentRunDirectory || 'screenshots', filename);
    await currentPage.screenshot({ path: filePath, fullPage: true });
    return response({ success: true, path: filePath });
  } catch (error) {
    return response({ success: false, message: String(error) });
  }
}

async function queryElements(selector: string) {
  try {
    const currentPage = await initBrowser();
    const locator = currentPage.locator(selector);
    const count = await locator.count();
    const elements = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const el = locator.nth(index);
        return {
          text: (await el.textContent())?.trim() || '',
          visible: await el.isVisible().catch(() => false)
        };
      })
    );
    return response({ success: true, count, elements });
  } catch (error) {
    return response({ success: false, message: String(error), count: 0, elements: [] });
  }
}

async function inspect(selector: string) {
  try {
    const currentPage = await initBrowser();
    const element = currentPage.locator(selector).first();
    const html = await element.evaluate(el => el.outerHTML);
    const attributes = await element.evaluate(el =>
      Array.from(el.attributes).reduce<Record<string, string>>((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    );
    return response({ success: true, html, attributes });
  } catch (error) {
    return response({ success: false, message: String(error), html: '', attributes: {} });
  }
}

async function evaluateScript(script: string) {
  try {
    const currentPage = await initBrowser();
    const result = await currentPage.evaluate(code => eval(code), script);
    return response({ success: true, result });
  } catch (error) {
    return response({ success: false, error: String(error), result: null });
  }
}

async function getPageState() {
  try {
    const currentPage = await initBrowser();
    return response({
      success: true,
      url: currentPage.url(),
      title: await currentPage.title(),
      content: await currentPage.content()
    });
  } catch (error) {
    return response({ success: false, message: String(error), url: '', title: '', content: '' });
  }
}

async function waitForSelector(selector: string, timeoutMs = 15000) {
  try {
    const currentPage = await initBrowser();
    await currentPage.locator(selector).first().waitFor({ state: 'visible', timeout: timeoutMs });
    return response({ success: true, message: `Visible: ${selector}` });
  } catch (error) {
    return response({ success: false, message: String(error) });
  }
}

async function hover(selector: string) {
  try {
    const currentPage = await initBrowser();
    await currentPage.locator(selector).first().hover();
    return response({ success: true, message: `Hovered ${selector}` });
  } catch (error) {
    return response({ success: false, message: String(error) });
  }
}

async function pressKey(key: string) {
  try {
    const currentPage = await initBrowser();
    await currentPage.keyboard.press(key);
    return response({ success: true, message: `Pressed ${key}` });
  } catch (error) {
    return response({ success: false, message: String(error) });
  }
}

async function clickAtCoordinates(x: number, y: number) {
  try {
    const currentPage = await initBrowser();
    await currentPage.mouse.click(x, y);
    return response({ success: true, message: `Clicked at (${x}, ${y})` });
  } catch (error) {
    return response({ success: false, message: String(error) });
  }
}

async function getTextAtCoordinates(x: number, y: number) {
  try {
    const currentPage = await initBrowser();
    const result = await currentPage.evaluate(coords => {
      const element = document.elementFromPoint(coords.x, coords.y);
      if (!element) {
        return null;
      }
      return {
        tag: element.tagName,
        text: element.textContent?.trim() || '',
        attributes: Array.from(element.attributes).reduce<Record<string, string>>((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      };
    }, { x, y });

    return response({ success: true, text: result?.text || '', element: result, message: result ? 'Found element' : 'No element found' });
  } catch (error) {
    return response({ success: false, message: String(error), text: '', element: null });
  }
}

async function closeBrowserSession() {
  await closeBrowser();
  return response({ success: true, message: 'Browser session closed' });
}

const tools: Tool[] = [
  { name: 'navigate', description: 'Navigate to a URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'click', description: 'Click an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, delay: { type: 'number' }, force: { type: 'boolean' } }, required: ['selector'] } },
  { name: 'fill', description: 'Fill an input', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
  { name: 'screenshot', description: 'Take a screenshot', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
  { name: 'setFeatureName', description: 'Set screenshot feature directory name', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'queryElements', description: 'Query elements', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'inspect', description: 'Inspect element HTML and attributes', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'evaluateScript', description: 'Execute JavaScript in page context', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
  { name: 'getPageState', description: 'Get current page state', inputSchema: { type: 'object', properties: {} } },
  { name: 'waitForSelector', description: 'Wait for selector to become visible', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, timeoutMs: { type: 'number' } }, required: ['selector'] } },
  { name: 'closeBrowserSession', description: 'Close browser session', inputSchema: { type: 'object', properties: {} } },
  { name: 'hover', description: 'Hover an element', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
  { name: 'pressKey', description: 'Press a keyboard key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'clickAtCoordinates', description: 'Click at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } },
  { name: 'getTextAtCoordinates', description: 'Get text at coordinates', inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } }
];

class PlaywrightMCPServer {
  private readonly server = new Server(
    { name: 'playwright-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  constructor() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      if (!args && name !== 'getPageState' && name !== 'closeBrowserSession' && name !== 'screenshot' && name !== 'setFeatureName') {
        throw new McpError(ErrorCode.InvalidRequest, 'Arguments are required');
      }

      switch (name) {
        case 'navigate':
          return navigate(args.url as string);
        case 'click':
          return click(args.selector as string, { delay: args.delay as number | undefined, force: args.force as boolean | undefined });
        case 'fill':
          return fill(args.selector as string, args.text as string);
        case 'screenshot':
          return screenshot(args.name as string | undefined);
        case 'setFeatureName':
          featureName = String(args.name || 'test').replace(/\W/g, '-').toLowerCase();
          return response({ success: true, message: `Feature name set to ${featureName}` });
        case 'queryElements':
          return queryElements(args.selector as string);
        case 'inspect':
          return inspect(args.selector as string);
        case 'evaluateScript':
          return evaluateScript(args.script as string);
        case 'getPageState':
          return getPageState();
        case 'waitForSelector':
          return waitForSelector(args.selector as string, args.timeoutMs as number | undefined);
        case 'closeBrowserSession':
          return closeBrowserSession();
        case 'hover':
          return hover(args.selector as string);
        case 'pressKey':
          return pressKey(args.key as string);
        case 'clickAtCoordinates':
          return clickAtCoordinates(args.x as number, args.y as number);
        case 'getTextAtCoordinates':
          return getTextAtCoordinates(args.x as number, args.y as number);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    await this.server.connect(new StdioServerTransport());
    console.error('Playwright MCP server running on stdio');
  }
}

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

const server = new PlaywrightMCPServer();
server.run().catch(error => {
  console.error(error);
  process.exit(1);
});
