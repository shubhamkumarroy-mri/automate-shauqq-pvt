# Playwright BDD Testing with MCP Integration

![Test](https://github.com/Tallyb/cucumber-playwright/workflows/Test/badge.svg)

A modern BDD testing framework combining **Cucumber**, **Playwright**, and **Model Context Protocol (MCP)** servers for intelligent black-box testing with AI-powered automation capabilities.

## Overview

This project demonstrates **real-world black-box testing** using:
- **Cucumber.js** for BDD-style test scenarios
- **Playwright** for cross-browser automation (Chromium, Firefox, WebKit)
- **MCP Servers** for AI-powered test enhancement and browser control
- **TypeScript** for type-safe step definitions and utilities

### Key Features

- ✅ **Interactive Browser Automation** - Playwright MCP server with 10+ tools
- ✅ **AI-Powered Testing** - MCP integration for intelligent test generation
- ✅ **Real-World Workflows** - Actual login flows with multi-step interactions
- ✅ **Screenshot Documentation** - Automatic captures at each step
- ✅ **TypeScript Support** - Full type safety with ESLint/Prettier
- ✅ **Cross-Browser Testing** - Chromium, Firefox, WebKit support
- ✅ **Clean Process Management** - Graceful MCP server shutdown
- ✅ **Comprehensive Reporting** - HTML reports with Allure support

## Project Structure

```
├── features/
│   └── *.feature                      # BDD feature files
├── mcp-servers/                       # MCP server implementations
│   ├── github-server/                 # Git repository tools
│   ├── playwright-server/             # Browser automation tools
│   ├── specification-server/          # Gherkin parsing & analysis
│   └── test-execution-server/         # Test orchestration
├── src/
│   ├── steps/
│   │   ├── playwright-mcp.steps.ts    # Browser step definitions
│   │   ├── mcp.steps.ts               # MCP tool invocation steps
│   │   └── *.steps.ts                 # Other domain-specific steps
│   ├── utils/
│   │   ├── playwright-mcp-helpers.ts  # Browser automation helpers
│   │   └── mcp-helpers.ts             # MCP tool wrappers
│   └── support/
│       ├── common-hooks.ts            # Scenario lifecycle & MCP init
│       ├── custom-world.ts            # Test context/world object
│       └── config.ts                  # Configuration
├── docs/                              # Comprehensive guides
└── reports/                           # Test reports & artifacts
```

## Quick Start

### Installation

```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific feature
npm run test features/your-feature.feature

# Run with specific tag
npm run cucumber -- --tags @your-tag

# Run in headed mode (see browser)
PLAYWRIGHT_HEADLESS=false npm run test

# Run with specific browser
BROWSER=firefox npm run test
```

## MCP Integration (Model Context Protocol)

This project integrates 4 MCP servers for enhanced testing capabilities:

### 1. **Playwright Server** (Browser Automation)
10 interactive browser tools for test automation:
- `navigate` - Load URLs
- `fill` - Enter text in inputs
- `click` - Click elements
- `screenshot` - Capture page state
- `queryElements` - Find elements with CSS selectors
- `waitForSelector` - Synchronize with page state
- `evaluateScript` - Execute JavaScript
- `getPageState` - Inspect current DOM
- `inspect` - Analyze element properties
- `closeBrowserSession` - Clean shutdown

### 2. **GitHub Server** (Repository Tools)
Git integration for detecting changes:
- `get_changed_files` - List modified files
- `get_file_diff` - Show code differences
- `detect_feature_changes` - Identify test changes
- `get_commit_history` - Track test history

### 3. **Specification Server** (Gherkin Analysis)
Feature file intelligence:
- `parseFeature` - Extract scenarios and steps
- `analyzeCoverage` - Step definition coverage
- `validateSteps` - Check step implementation
- `generateStepSnippets` - Auto-generate stub steps

### 4. **Test Execution Server** (Orchestration)
Test management and validation:
- `runTests` - Execute test suite
- `validateSteps` - Verify step definitions
- `generateStepSnippets` - Create step templates
- `analyzeFailures` - Debug test failures

## Adding New Workflows

### Optimal Approach

1. **Use Playwright Codegen** (Optional - speeds up selector discovery)
   ```bash
   npx playwright codegen [URL]
   ```
   Record your manual interactions; codegen generates selectors and actions.

2. **Create Feature File**
   ```gherkin
   @playwright-mcp @workflow-name
   Feature: Workflow Description
     Scenario: Specific test case
       Given I navigate to "..."
       When I fill "..." with "..."
       And I click on "..."
       Then I take a screenshot named "..."
   ```

3. **Reuse Existing Steps**
   All common actions (navigate, click, fill, wait, screenshot) already exist in `src/steps/playwright-mcp.steps.ts`.

4. **Add Domain-Specific Steps (if needed)**
   Create new steps in appropriate file (e.g., `src/steps/checkout.steps.ts`) and use helpers from `src/utils/playwright-mcp-helpers.ts`.

5. **Run & Validate**
   ```bash
   npm run cucumber -- features/workflow-name.feature --format progress
   ```

## Configuration

### Environment Variables

```bash
# Browser selection (default: chromium)
BROWSER=firefox npm run test

# Headed mode - see browser during execution
PLAYWRIGHT_HEADLESS=false npm run test

# Reporting options
USE_ALLURE=1 npm run test
```

### Browser Options

Edit `src/support/config.ts` for:
- Viewport size (default: 1280x720)
- Launch timeout (default: 30s)
- Navigation timeout (default: 30s)
- Default screenshot selector waits

## Available Commands

```bash
npm run test                    # Run all tests
npm run debug                   # Run with debug APIs in headful mode
npm run api                     # Run with debug APIs in headless mode
npm run video                   # Run with video recording
npm run build                   # Check TypeScript, ESLint, Gherkin
npm run steps-usage             # List all step definitions
npm run report                  # View HTML test report
npm run allure                  # Generate and view Allure report
npm run cucumber -- [options]   # Run Cucumber with custom options
```

## Debugging

### In VS Code
1. Open the feature file
2. Select "Debug" from VSCode debugger dropdown
3. Set breakpoints in TypeScript code
4. Press F5 to start debugging

### CLI Debugging
```bash
npm run debug                   # Breakable with APIs enabled
Then debug                      # Add this step to pause execution
```

## Writing Steps

### Using Playwright Helpers

```typescript
import { navigateTo, fill, click, screenshot } from '../utils/playwright-mcp-helpers';

When('I fill {string} with {string}', async function (this: ICustomWorld, selector: string, text: string) {
  const result = await fill(this, selector, text);
  this.attach(result.message, 'text/plain');
  expect(result.success).toBeTruthy();
});
```

### Using MCP Tools

```typescript
import { callMcpTool } from '../utils/mcp-helpers';

Then('I verify {int} elements exist', async function (this: ICustomWorld, count: number) {
  const result = await callMcpTool(this, 'playwright', 'queryElements', { selector: '[data-test]' });
  expect(result.elements.length).toBeGreaterThanOrEqual(count);
});
```

## Troubleshooting

### Tests timeout
- Increase timeout in `src/support/config.ts`
- Use `And I wait for "selector"` to ensure element readiness

### Selectors not found
- Use `npm run debug` to pause and inspect selectors
- Use Playwright Inspector: `PWDEBUG=1 npm run test`
- Check feature files for selector examples

### MCP server hangs
- Ensure `src/support/common-hooks.ts` has proper shutdown handlers
- Check MCP server logs in terminal output
- Verify all MCP clients initialize in Before hook

## Documentation

- 📖 [MCP Usage Guide](docs/MCP_USAGE.md) - Comprehensive MCP examples
- 📋 [MCP Quick Reference](docs/MCP_QUICK_REFERENCE.md) - API reference
- 🔧 [MCP Integration Details](docs/MCP_INTEGRATION.md) - Architecture
- 🌐 [Playwright MCP Guide](docs/PLAYWRIGHT_MCP_GUIDE.md) - Browser automation

## References

- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Playwright Documentation](https://playwright.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Medium Article: E2E Testing with Cucumber & Playwright](https://tally-b.medium.com/e2e-testing-with-cucumber-and-playwright-9584d3ef3360)
- [YouTube Playlist](https://www.youtube.com/watch?v=PUVFmhYJNJA&list=PLwwCtx3xQxlVMZzS4oi2TafVRngQ1wF_0&index=2)

## Project Basis

Originally based on [Cucumber-typescript-starter](https://github.com/hdorgeval/cucumber7-ts-starter/) - evolved to include MCP integration and interactive browser automation.
