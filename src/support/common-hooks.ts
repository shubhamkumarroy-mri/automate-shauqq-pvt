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
import { existsSync } from 'fs';
import { resolve } from 'path';

let browser: ChromiumBrowser | FirefoxBrowser | WebKitBrowser | Browser;
const tracesDir = 'traces';
let loginStatePrepared = false;

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
  await ensureDir('screenshots');
});

Before({ tags: '@requires-login' }, async function () {
  if (loginStatePrepared) {
    return;
  }

  console.log('Performing login before feature...');

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(credentials.testEnvironment.loginUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

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

  await context.storageState({ path: 'auth-state.json' });
  await page.close();
  await context.close();

  loginStatePrepared = true;
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

  const featureName = pickle.uri?.split('/').pop()?.replace('.feature', '') || 'unknown';
  const runTime = new Date().toISOString().replace(/[.:]/g, '-');
  this.screenshotRunDir = `screenshots/features-${featureName}-${runTime}`;
  await ensureDir(this.screenshotRunDir);

  const contextOptions: any = {
    acceptDownloads: true,
    recordVideo: process.env.PWVIDEO ? { dir: 'screenshots' } : undefined,
    viewport: { width: 1200, height: 800 }
  };

  const hasLoginTag = pickle.tags?.some((tag: any) => tag.name === '@requires-login');
  if (hasLoginTag) {
    const authStatePath = resolve('auth-state.json');
    if (existsSync(authStatePath)) {
      contextOptions.storageState = authStatePath;
      console.log('Loading auth state from:', authStatePath);
    }
  }

  this.context = await browser.newContext(contextOptions);
  await this.context.tracing.start({ screenshots: true, snapshots: true });

  this.page = await this.context.newPage();
  this.page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'log') {
      this.attach(msg.text());
    }
  });

  this.server = await request.newContext({
    baseURL: config.BASE_API_URL
  });

  this.feature = pickle;
});

After(async function (this: ICustomWorld, { result }) {
  if (result) {
    this.attach(`Status: ${result.status}. Duration:${result.duration?.seconds}s`);

    if (result.status !== Status.PASSED) {
      const image = await this.page?.screenshot();
      if (image) {
        this.attach(image, 'image/png');
      }
    }
  }

  const timePart = this.startTime?.toISOString().split('.')[0].replaceAll(':', '_') || 'unknown';
  await this.context?.tracing.stop({
    path: `${tracesDir}/${this.testName}-${timePart}trace.zip`
  });

  await this.server?.dispose();
  await this.page?.close();
  await this.context?.close();
});

AfterAll(async function () {
  await browser.close();
});
