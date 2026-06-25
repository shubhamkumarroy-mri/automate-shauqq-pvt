# Playwright + Cucumber Core Automation

Lightweight BDD automation framework using TypeScript, Cucumber, and Playwright.

## What This Repo Contains

- Feature files in `features/`
- Step definitions in `src/steps/`
- Hooks and world setup in `src/support/`
- Utility helpers in `src/utils/`
- Reports in `reports/`
- Screenshots and traces in `screenshots/` and `traces/`

## Setup

```bash
npm install
```

Create credentials file:

```bash
copy config.credentials.example.json config.credentials.json
```

Fill `config.credentials.json` with valid environment URL and credentials.

## Run Tests

```bash
# Run all features
npm test

# Run one feature
npm run cucumber -- features/job-management/create-job.feature
npm run cucumber -- features/purchase-to-pay/search-po.feature

# Headed mode
PLAYWRIGHT_HEADLESS=false npm test
```

## Common Commands

```bash
npm run steps-usage
npm run report
npm run lint
npm run build
```

## Notes

- Features tagged with `@requires-login` automatically create and reuse `auth-state.json`.
- Screenshots are organized per feature run.
- Failing scenarios attach screenshots and traces for debugging.
