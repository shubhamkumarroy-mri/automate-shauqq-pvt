import { ICustomWorld } from './custom-world';
import { config } from './config';
import { credentials } from './credentials';
import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import {
  chromium,
  ChromiumBrowser,
  firefox,
  FirefoxBrowser,
  webkit,
  WebKitBrowser,
  ConsoleMessage,
  request,
  Browser
} from '@playwright/test';
import { ensureDir } from 'fs-extra';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let browser: ChromiumBrowser | FirefoxBrowser | WebKitBrowser | Browser;
const tracesDir = 'traces';

declare global {

  var browser: ChromiumBrowser | FirefoxBrowser | WebKitBrowser | Browser;
}

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

BeforeAll(async function () {
  switch (config.browser) {
    case 'firefox':
      browser = await firefox.launch(config.browserOptions);
      break;
    case 'webkit':
      browser = await webkit.launch(config.browserOptions);
      break;
    case 'msedge':
      browser = await chromium.launch({ ...config.browserOptions, channel: 'msedge' });
      break;
    case 'chrome':
      browser = await chromium.launch({ ...config.browserOptions, channel: 'chrome' });
      break;
    default:
      browser = await chromium.launch(config.browserOptions);
  }
  await ensureDir(tracesDir);
});

// Login once per feature for features tagged with @requires-login
BeforeAll({ tags: '@requires-login' }, async function () {
  console.log('Performing login before feature...');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate and login
  await page.goto(credentials.testEnvironment.loginUrl);
  await page.waitForSelector('input#username', { state: 'visible' });
  await page.fill('input#username', credentials.testUser.username);
  await page.fill('input#password', credentials.testUser.password);
  await page.click("button:has-text('Sign In')");
  
  // Wait for Continue button and click it
  try {
    await page.waitForSelector("button:has-text('Continue'):not([disabled])", { timeout: 10000 });
    await page.click("button:has-text('Continue'):not([disabled])");
    // Wait for dashboard to load
    await page.waitForSelector("[data-test-id='dashboard'], .dashboard, main, h1, h2", { timeout: 10000 });
  } catch (e) {
    console.log('Continue button or dashboard not found, but continuing anyway');
  }
  
  // Save the authenticated state
  await context.storageState({ path: 'auth-state.json' });
  
  await page.close();
  await context.close();
  
  console.log('Login completed and state saved!');
});

Before({ tags: '@ignore' }, function () {
  return 'skipped';
});

Before({ tags: '@debug' }, function (this: ICustomWorld) {
  this.debug = true;
});

Before(async function (this: ICustomWorld, { pickle }) {
  this.startTime = new Date();
  this.testName = pickle.name.replace(/\W/g, '-');

  // Extract feature name from pickle URI
  const featureName = pickle.uri?.split('/').pop()?.replace('.feature', '') || 'unknown';

  // Initialize MCP clients
  this.mcpClients = {};

  try {
    // GitHub Server
    const githubTransport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'mcp-servers/github-server/index.ts'],
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    });
    this.mcpClients.github = new Client(
      {
        name: 'cucumber-github-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
    await this.mcpClients.github.connect(githubTransport);

    // Specification Server
    const specTransport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'mcp-servers/specification-server/index.ts'],
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    });
    this.mcpClients.specification = new Client(
      {
        name: 'cucumber-spec-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
    await this.mcpClients.specification.connect(specTransport);

    // Test Execution Server
    const testExecTransport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'mcp-servers/test-execution-server/index.ts'],
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    });
    this.mcpClients.testExecution = new Client(
      {
        name: 'cucumber-test-exec-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
    await this.mcpClients.testExecution.connect(testExecTransport);

    // Playwright Server
    const playwrightTransport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'mcp-servers/playwright-server/index.ts'],
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    });
    this.mcpClients.playwright = new Client(
      {
        name: 'cucumber-playwright-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );
    await this.mcpClients.playwright.connect(playwrightTransport);

    // Set feature name in playwright server for screenshot organization
    try {
      await this.mcpClients.playwright.callTool({
        name: 'setFeatureName',
        arguments: { name: featureName }
      });
    } catch (error) {
      console.error('Failed to set feature name:', error);
    }

    this.attach('MCP clients initialized successfully');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.attach(`Warning: MCP clients initialization failed: ${errorMsg}`);
    console.error('MCP initialization error:', error);
  }

  // customize the [browser context](https://playwright.dev/docs/next/api/class-browser#browsernewcontextoptions)
  const contextOptions: any = {
    acceptDownloads: true,
    recordVideo: process.env.PWVIDEO ? { dir: 'screenshots' } : undefined,
    viewport: { width: 1200, height: 800 }
  };

  // Use saved auth state if feature has @requires-login tag
  const hasLoginTag = pickle.tags?.some((tag: any) => tag.name === '@requires-login');
  if (hasLoginTag) {
    try {
      // Load the saved authentication state
      const { existsSync } = await import('fs');
      const { resolve } = await import('path');
      const authStatePath = resolve('auth-state.json');
      if (existsSync(authStatePath)) {
        contextOptions.storageState = authStatePath;
        console.log('Loading auth state from:', authStatePath);
      } else {
        console.log('Auth state file not found at:', authStatePath);
      }
    } catch (e) {
      console.error('Error loading auth state:', e);
    }
  }

  this.context = await browser.newContext(contextOptions);
  this.server = await request.newContext({
    // All requests we send go to this API endpoint.
    baseURL: config.BASE_API_URL
  });

  await this.context.tracing.start({ screenshots: true, snapshots: true });
  this.page = await this.context.newPage();
  this.page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'log') {
      this.attach(msg.text());
    }
  });
  this.feature = pickle;
});

After(async function (this: ICustomWorld, { result }) {
  if (result) {
    this.attach(`Status: ${result?.status}. Duration:${result.duration?.seconds}s`);

    if (result.status !== Status.PASSED) {
      const image = await this.page?.screenshot();

      // Replace : with _ because colons aren't allowed in Windows paths
      const timePart = this.startTime?.toISOString().split('.')[0].replaceAll(':', '_');

      if (image) {
        this.attach(image, 'image/png');
      }
      await this.context?.tracing.stop({
        path: `${tracesDir}/${this.testName}-${timePart}trace.zip`
      });
    }
  }

  // Close MCP clients with timeout protection
  try {
    const closePromises = [];

    if (this.mcpClients?.github) {
      closePromises.push(
        Promise.race([
          this.mcpClients.github.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GitHub MCP client close timeout')), 3000)
          )
        ]).catch(err => console.warn('Failed to close GitHub MCP client:', err))
      );
    }

    if (this.mcpClients?.specification) {
      closePromises.push(
        Promise.race([
          this.mcpClients.specification.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Specification MCP client close timeout')), 3000)
          )
        ]).catch(err => console.warn('Failed to close Specification MCP client:', err))
      );
    }

    if (this.mcpClients?.testExecution) {
      closePromises.push(
        Promise.race([
          this.mcpClients.testExecution.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test Execution MCP client close timeout')), 3000)
          )
        ]).catch(err => console.warn('Failed to close Test Execution MCP client:', err))
      );
    }

    if (this.mcpClients?.playwright) {
      closePromises.push(
        Promise.race([
          this.mcpClients.playwright.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Playwright MCP client close timeout')), 10000)
          )
        ]).catch(err => console.warn('Failed to close Playwright MCP client:', err))
      );
    }

    await Promise.all(closePromises);
  } catch (error) {
    console.warn('Error during MCP client cleanup:', error);
  }

  await this.page?.close();
  await this.context?.close();
});

AfterAll(async function () {
  await browser.close();
});
