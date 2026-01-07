#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

// Global browser instance management
let browser: any = null;
let context: any = null;
let page: any = null;
// Activity timeout check
function updateActivity() {
  // Placeholder for activity tracking
}

const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'true';

async function initBrowser() {
  if (!browser) {
    updateActivity();
    try {
      console.error(`Launching browser (headless: ${isHeadless})...`);
      browser = await chromium.launch({
        headless: isHeadless,
        timeout: 30000 // 30 second timeout
      });
      console.error('Browser launched successfully');
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      console.error('Browser context created');
      page = await context.newPage();
      console.error('New page created');
    } catch (error) {
      console.error('Browser initialization failed:', error);
      throw error;
    }
  }
  updateActivity();
  return page!;
}

async function closeBrowser() {
  if (browser) {
    try {
      console.error('Closing browser...');
      await Promise.race([
        browser.close(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Browser close timeout')), 5000)
        )
      ]);
      console.error('Browser closed successfully');
    } catch (error) {
      console.error('Browser close error:', error);
    } finally {
      browser = null;
      context = null;
      page = null;
    }
  }
}

// Tool implementations
async function navigate(
  url: string
): Promise<{ success: boolean; url: string; title: string; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await currentPage.title();
    return {
      success: true,
      url: currentPage.url(),
      title,
      message: `Successfully navigated to ${url}`
    };
  } catch (error) {
    return {
      success: false,
      url,
      title: '',
      message: `Navigation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function click(
  selector: string,
  options: { delay?: number; force?: boolean } = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.click(selector, { delay: options.delay, force: options.force });
    return {
      success: true,
      message: `Successfully clicked element: ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Click failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function fill(
  selector: string,
  text: string
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.fill(selector, text);
    return {
      success: true,
      message: `Successfully filled ${selector} with text`
    };
  } catch (error) {
    return {
      success: false,
      message: `Fill failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function screenshot(
  name?: string
): Promise<{ success: boolean; path: string; message: string }> {
  try {
    const currentPage = await initBrowser();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = name ? `${name}-${timestamp}.png` : `screenshot-${timestamp}.png`;
    const filepath = path.join('./screenshots', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await currentPage.screenshot({ path: filepath });
    return {
      success: true,
      path: filepath,
      message: `Screenshot saved to ${filepath}`
    };
  } catch (error) {
    return {
      success: false,
      path: '',
      message: `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function queryElements(selector: string): Promise<{
  success: boolean;
  count: number;
  elements: { text: string; visible: boolean }[];
}> {
  try {
    const currentPage = await initBrowser();
    const elements = await currentPage.$$(selector);
    const elementData = await Promise.all(
      elements.map(async (el: any) => ({
        text: await el.textContent().then((t: any) => t?.trim() || ''),
        visible: await el.isVisible().catch(() => false)
      }))
    );
    return {
      success: true,
      count: elements.length,
      elements: elementData
    };
  } catch {
    return {
      success: false,
      count: 0,
      elements: []
    };
  }
}

async function inspect(
  selector: string
): Promise<{ success: boolean; html: string; attributes: Record<string, string> }> {
  try {
    const currentPage = await initBrowser();
    const element = await currentPage.$(selector);
    if (!element) {
      return {
        success: false,
        html: '',
        attributes: {}
      };
    }
    const html = await element.evaluate((el: any) => el.outerHTML);
    const attributes: Record<string, string> = {};
    const attrList = await element.evaluate((el: any) =>
      Array.from(el.attributes).map((attr: any) => ({ name: attr.name, value: attr.value }))
    );
    attrList.forEach(({ name, value }: any) => {
      attributes[name] = value;
    });
    return {
      success: true,
      html,
      attributes
    };
  } catch {
    return {
      success: false,
      html: '',
      attributes: {}
    };
  }
}

async function evaluateScript(
  script: string
): Promise<{ success: boolean; result: unknown; error?: string }> {
  try {
    const currentPage = await initBrowser();
    const result = await currentPage.evaluate((code: any) => {
      return eval(code);
    }, script);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function getPageState(): Promise<{
  success: boolean;
  url: string;
  title: string;
  content: string;
}> {
  try {
    const currentPage = await initBrowser();
    const content = await currentPage.content();
    return {
      success: true,
      url: currentPage.url(),
      title: await currentPage.title(),
      content
    };
  } catch {
    return {
      success: false,
      url: '',
      title: '',
      content: ''
    };
  }
}

async function waitForSelector(
  selector: string,
  timeoutMs = 15000
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.waitForSelector(selector, { timeout: timeoutMs, state: 'visible' });
    return { success: true, message: `Selector became visible: ${selector}` };
  } catch (error) {
    return {
      success: false,
      message: `waitForSelector failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function closeBrowserSession(): Promise<{ success: boolean; message: string }> {
  try {
    await closeBrowser();
    return {
      success: true,
      message: 'Browser session closed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to close browser: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

const tools: Tool[] = [
  {
    name: 'navigate',
    description: 'Navigate to a URL in the browser',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to (e.g., https://example.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'click',
    description: 'Click an element on the page using a CSS selector',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to click'
        },
        delay: {
          type: 'number',
          description: 'Delay between mouse down and mouse up in milliseconds'
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass visibility checks'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'fill',
    description: 'Fill an input field or textarea with text',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the input element'
        },
        text: {
          type: 'string',
          description: 'Text to fill in the input'
        }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Optional name for the screenshot file'
        }
      }
    }
  },
  {
    name: 'queryElements',
    description:
      'Query all elements matching a CSS selector and return their text content and visibility',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector to query elements'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'inspect',
    description: 'Inspect a single element to get its HTML and attributes',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to inspect'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'evaluateScript',
    description: 'Execute JavaScript in the page context and return the result',
    inputSchema: {
      type: 'object' as const,
      properties: {
        script: {
          type: 'string',
          description: 'JavaScript code to execute (can reference page state)'
        }
      },
      required: ['script']
    }
  },
  {
    name: 'getPageState',
    description: 'Get the current page URL, title, and full HTML content',
    inputSchema: {
      type: 'object' as const,
      properties: {}
    }
  },
  {
    name: 'waitForSelector',
    description: 'Wait for a selector to become visible',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS/text selector to wait for'
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds (default 15000)'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'closeBrowserSession',
    description: 'Close the browser session and clean up resources',
    inputSchema: {
      type: 'object' as const,
      properties: {}
    }
  }
];

class PlaywrightMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'playwright-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        if (!args) {
          throw new McpError(ErrorCode.InvalidRequest, 'Arguments are required');
        }

        switch (name) {
          case 'navigate':
            result = await navigate(args.url as string);
            break;
          case 'click':
            result = await click(args.selector as string, {
              delay: args.delay as number | undefined,
              force: args.force as boolean | undefined
            });
            break;
          case 'fill':
            result = await fill(args.selector as string, args.text as string);
            break;
          case 'screenshot':
            result = await screenshot(args.name as string | undefined);
            break;
          case 'queryElements':
            result = await queryElements(args.selector as string);
            break;
          case 'inspect':
            result = await inspect(args.selector as string);
            break;
          case 'evaluateScript':
            result = await evaluateScript(args.script as string);
            break;
          case 'getPageState':
            result = await getPageState();
            break;
          case 'waitForSelector':
            result = await waitForSelector(
              args.selector as string,
              args.timeoutMs as number | undefined
            );
            break;
          case 'closeBrowserSession':
            result = await closeBrowserSession();
            break;
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP server running on stdio');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

process.stdin.on('end', async () => {
  await closeBrowser();
  process.exit(0);
});

process.stdin.on('close', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('disconnect', async () => {
  await closeBrowser();
  process.exit(0);
});

const server = new PlaywrightMCPServer();
server.run().catch(console.error);
