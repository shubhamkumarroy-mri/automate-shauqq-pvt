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
let currentRunDirectory: string | null = null;
let featureName: string = 'test';

// Activity timeout check
function updateActivity() {
  // Placeholder for activity tracking
}

const isHeadless = process.env.PLAYWRIGHT_HEADLESS !== 'false'; // Can be controlled via env variable

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
      
      // Check if auth-state.json exists and use it
      const authStatePath = path.resolve('auth-state.json');
      const contextOptions: any = {
        viewport: { width: 1280, height: 720 }
      };
      
      if (fs.existsSync(authStatePath)) {
        contextOptions.storageState = authStatePath;
        console.error('Loading auth state from:', authStatePath);
      }
      
      context = await browser.newContext(contextOptions);
      console.error('Browser context created');
      page = await context.newPage();
      console.error('New page created');
      
      // Create run directory for screenshots
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      currentRunDirectory = path.join('./screenshots', `${featureName}-${timestamp}`);
      if (!fs.existsSync(currentRunDirectory)) {
        fs.mkdirSync(currentRunDirectory, { recursive: true });
      }
      console.error(`Screenshots will be saved to: ${currentRunDirectory}`);
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
      currentRunDirectory = null;
      featureName = 'test';
    }
  }
}

// Tool implementations
async function navigate(
  url: string
): Promise<{ success: boolean; url: string; title: string; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait a bit for dynamic content to load
    await currentPage.waitForTimeout(1000);
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
    
    // Use the run directory created during browser init
    const filename = name ? `${name.replace(/\//g, '-')}.png` : `screenshot.png`;
    const filepath = path.join(currentRunDirectory!, filename);

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

async function hover(
  selector: string
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.hover(selector, { timeout: 10000 });
    return {
      success: true,
      message: `Successfully hovered over element: ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Hover failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function clickAtCoordinates(
  x: number,
  y: number,
  options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number; delay?: number }
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.mouse.click(x, y, {
      button: options?.button || 'left',
      clickCount: options?.clickCount || 1,
      delay: options?.delay || 0
    });
    return {
      success: true,
      message: `Successfully clicked at coordinates (${x}, ${y})`
    };
  } catch (error) {
    return {
      success: false,
      message: `Click at coordinates failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function getTextAtCoordinates(
  x: number,
  y: number
): Promise<{ success: boolean; text: string; element: any; message: string }> {
  try {
    const currentPage = await initBrowser();
    const result = await currentPage.evaluate((coords: { x: number; y: number }) => {
      const element = document.elementFromPoint(coords.x, coords.y);
      if (!element) return null;
      
      return {
        tag: element.tagName,
        text: element.textContent?.trim() || '',
        attributes: Array.from(element.attributes).map((a: any) => ({ 
          name: a.name, 
          value: a.value 
        })),
        boundingBox: element.getBoundingClientRect()
      };
    }, { x, y });
    
    if (!result) {
      return {
        success: false,
        text: '',
        element: null,
        message: `No element found at coordinates (${x}, ${y})`
      };
    }
    
    return {
      success: true,
      text: result.text,
      element: result,
      message: `Found element at (${x}, ${y}): ${result.tag}`
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      element: null,
      message: `Get text at coordinates failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function dispatchEvent(
  selector: string,
  eventType: string,
  eventProperties?: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.dispatchEvent(selector, eventType, eventProperties || {});
    return {
      success: true,
      message: `Successfully dispatched ${eventType} event on ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Dispatch event failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function pressKey(
  key: string
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPage = await initBrowser();
    await currentPage.keyboard.press(key);
    return {
      success: true,
      message: `Successfully pressed key: ${key}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Press key failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function inspectDetailed(
  selector: string
): Promise<{ success: boolean; details: any; message: string }> {
  try {
    const currentPage = await initBrowser();
    const result = await currentPage.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      
      const computedStyle = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      return {
        tag: el.tagName,
        attributes: Array.from(el.attributes).map((a: any) => ({ name: a.name, value: a.value })),
        textContent: el.textContent?.trim(),
        innerHTML: el.innerHTML.substring(0, 500), // Truncate for safety
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        },
        offsetParent: el.offsetParent !== null,
        computedStyle: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          pointerEvents: computedStyle.pointerEvents,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position
        },
        isVisible: el.offsetParent !== null && 
                   computedStyle.display !== 'none' && 
                   computedStyle.visibility !== 'hidden' &&
                   parseFloat(computedStyle.opacity) > 0
      };
    }, selector);
    
    if (!result) {
      return {
        success: false,
        details: null,
        message: `Element not found: ${selector}`
      };
    }
    
    return {
      success: true,
      details: result,
      message: `Successfully inspected element: ${selector}`
    };
  } catch (error) {
    return {
      success: false,
      details: null,
      message: `Inspect detailed failed: ${error instanceof Error ? error.message : String(error)}`
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
    name: 'setFeatureName',
    description: 'Set the feature name for organizing screenshots',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Feature name to use for screenshot directory'
        }
      },
      required: ['name']
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
  },
  {
    name: 'hover',
    description: 'Hover over an element to trigger hover states',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to hover over'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'dispatchEvent',
    description: 'Dispatch a custom event on an element (e.g., mousedown, mouseup, input, change)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the target element'
        },
        eventType: {
          type: 'string',
          description: 'Event type to dispatch (e.g., "click", "mousedown", "input")'
        },
        eventProperties: {
          type: 'object',
          description: 'Optional event properties (bubbles, cancelable, etc.)'
        }
      },
      required: ['selector', 'eventType']
    }
  },
  {
    name: 'pressKey',
    description: 'Press a keyboard key (e.g., "Enter", "ArrowDown", "Escape")',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key: {
          type: 'string',
          description: 'Key to press (e.g., "Enter", "ArrowDown", "Tab", "Escape")'
        }
      },
      required: ['key']
    }
  },
  {
    name: 'inspectDetailed',
    description: 'Get detailed information about an element including computed styles, position, and visibility',
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
    name: 'clickAtCoordinates',
    description: 'Click at specific screen coordinates (x, y) regardless of DOM structure',
    inputSchema: {
      type: 'object' as const,
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top)'
        },
        button: {
          type: 'string',
          description: 'Mouse button to click: "left", "right", or "middle" (default: "left")'
        },
        clickCount: {
          type: 'number',
          description: 'Number of clicks (default: 1, use 2 for double-click)'
        },
        delay: {
          type: 'number',
          description: 'Delay between mousedown and mouseup in milliseconds'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'getTextAtCoordinates',
    description: 'Get the element and text at specific screen coordinates',
    inputSchema: {
      type: 'object' as const,
      properties: {
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top)'
        }
      },
      required: ['x', 'y']
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
          case 'setFeatureName':
            featureName = (args.name as string).replace(/\W/g, '-').toLowerCase();
            result = { success: true, message: `Feature name set to: ${featureName}` };
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
          case 'hover':
            result = await hover(args.selector as string);
            break;
          case 'dispatchEvent':
            result = await dispatchEvent(
              args.selector as string,
              args.eventType as string,
              args.eventProperties as Record<string, any> | undefined
            );
            break;
          case 'pressKey':
            result = await pressKey(args.key as string);
            break;
          case 'inspectDetailed':
            result = await inspectDetailed(args.selector as string);
            break;
          case 'clickAtCoordinates':
            result = await clickAtCoordinates(
              args.x as number,
              args.y as number,
              {
                button: args.button as 'left' | 'right' | 'middle' | undefined,
                clickCount: args.clickCount as number | undefined,
                delay: args.delay as number | undefined
              }
            );
            break;
          case 'getTextAtCoordinates':
            result = await getTextAtCoordinates(args.x as number, args.y as number);
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
