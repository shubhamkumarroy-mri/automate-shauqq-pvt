import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import * as messages from '@cucumber/messages';
import { BrowserContext, Page, PlaywrightTestOptions, APIRequestContext } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface CucumberWorldConstructorParams {
  parameters: Record<string, string>;
}

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  context?: BrowserContext;
  page?: Page;

  testName?: string;
  startTime?: Date;

  server?: APIRequestContext;

  username?: string;
  playwrightOptions?: PlaywrightTestOptions;

  // MCP Clients
  mcpClients?: {
    github?: Client;
    specification?: Client;
    testExecution?: Client;
    playwright?: Client;
  };

  // Playwright MCP state tracking
  lastQueryResult?: any;
  lastInspectResult?: any;
  lastPageState?: any;
  lastScriptResult?: any;
  pageExploration?: any;
}

export class CustomWorld extends World implements ICustomWorld {
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  mcpClients = {};
}

setWorldConstructor(CustomWorld);
