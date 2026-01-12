# Strategy for Handling Dynamic Components in Automated Testing

## Problem Analysis

Based on the screenshot and test execution, we've identified that the date range dropdown component has the following behavior:
1. The dropdown opens successfully when clicking `input.datepickerTxt`
2. The options (Today, Yesterday, Last 7 Days, etc.) are displayed
3. However, clicking on these options using `li[data-range-key="Last 30 Days"]` selector does not trigger the expected behavior

## Root Causes

### 1. **JavaScript Event Handlers**
The component likely uses custom JavaScript event handlers that require:
- Specific event types (mousedown, mouseup, pointerdown)
- Event propagation/bubbling
- Custom data attributes being set

### 2. **React/Vue/Angular Framework Event System**
Modern frameworks may intercept native DOM events and require:
- Proper event dispatching with correct event properties
- Triggering framework-specific state updates
- Calling framework lifecycle methods

### 3. **Timing Issues**
- The dropdown may not be fully rendered when the click is attempted
- Animations or transitions might interfere with clickability
- DOM elements might be replaced/re-rendered dynamically

### 4. **Element Visibility/Actionability**
- Elements might be technically in the DOM but not "actionable" per Playwright's standards
- Z-index or overlay issues
- CSS pointer-events: none

## Diagnostic Strategies

### Strategy 1: DOM Inspection & Analysis
```gherkin
When I inspect the date picker dropdown structure
```

**Implementation:**
- Use `inspectElement()` to examine the dropdown container
- Use `queryElements()` to list all dropdown options with their states
- Use `evaluateScript()` to get computed styles and event listeners
- Take screenshots at each stage for visual verification

### Strategy 2: Multiple Click Approaches
Try different interaction methods in order of preference:

#### A. Standard Playwright Click
```javascript
await page.click('li[data-range-key="Last 30 Days"]')
```

#### B. Force Click (Bypass Actionability Checks)
```javascript
await page.click('li[data-range-key="Last 30 Days"]', { force: true })
```

#### C. JavaScript Click
```javascript
await page.evaluate(() => {
  document.querySelector('li[data-range-key="Last 30 Days"]').click()
})
```

#### D. Dispatch MouseEvent
```javascript
await page.evaluate((selector) => {
  const el = document.querySelector(selector);
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, 'li[data-range-key="Last 30 Days"]')
```

#### E. Keyboard Navigation
```javascript
// After opening dropdown, use arrow keys and enter
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
```

### Strategy 3: Framework-Aware Interaction
For React/Vue/Angular components:

```javascript
// Trigger React synthetic event
await page.evaluate((selector) => {
  const el = document.querySelector(selector);
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  el.dispatchEvent(event);
  
  // Also trigger input event if it's a value selector
  const inputEvent = new Event('input', { bubbles: true });
  el.dispatchEvent(inputEvent);
}, 'li[data-range-key="Last 30 Days"]')
```

### Strategy 4: Wait and Retry Pattern
```javascript
// Wait for element to be fully interactive
await page.waitForSelector('li[data-range-key="Last 30 Days"]', {
  state: 'visible',
  timeout: 5000
});

// Add small delay for animations
await page.waitForTimeout(500);

// Then attempt click
```

### Strategy 5: Hover Before Click
Some components require hover state:
```javascript
await page.hover('li[data-range-key="Last 30 Days"]');
await page.waitForTimeout(100);
await page.click('li[data-range-key="Last 30 Days"]');
```

## Implementation Plan

### Phase 1: Enhanced Helper Functions
Add to `playwright-mcp-helpers.ts`:

1. **`hoverElement()`** - Hover over an element before interaction
2. **`clickWithRetry()`** - Try multiple click strategies with retries
3. **`dispatchMouseEvents()`** - Dispatch full mouse event sequence
4. **`selectByKeyboard()`** - Use keyboard navigation for dropdowns
5. **`inspectElementDetails()`** - Get comprehensive element info including event listeners

### Phase 2: New Step Definitions
Add to `playwright-mcp.steps.ts`:

```gherkin
When I hover on {string}
When I click {string} with retry strategies
When I select dropdown option {string} by keyboard
When I dispatch mouse events on {string}
When I wait for {string} to be interactive
```

### Phase 3: Specialized Date Picker Handlers
Create `date-picker-helpers.ts`:

```typescript
export async function selectDateRange(
  world: ICustomWorld,
  rangeOption: string
): Promise<ClickResult> {
  // 1. Open date picker
  // 2. Wait for dropdown to be fully rendered
  // 3. Try multiple strategies to select option
  // 4. Verify selection was successful
}
```

### Phase 4: Test Implementation Pattern

```gherkin
Scenario: Select date range with robust interaction
  When I navigate to the PO search screen
  And I wait for 2 seconds
  
  # Diagnostic step - inspect the date picker before interaction
  When I inspect element "input.datepickerTxt"
  And I take a screenshot named "before-click"
  
  # Open date picker
  When I force click on "input.datepickerTxt"
  And I wait for 1 second
  And I take a screenshot named "dropdown-opened"
  
  # Inspect dropdown options
  When I inspect element "li[data-range-key='Last 30 Days']"
  
  # Try the robust selection approach
  When I select date range option "Last 30 Days" with retry strategies
  And I wait for 1 second
  And I take a screenshot named "option-selected"
  
  # Verify the selection worked
  Then the date range input should show "Last 30 Days"
```

## Recommended MCP Server Enhancements

Add these tools to `playwright-server/index.ts`:

### 1. Hover Tool
```typescript
async function hover(selector: string): Promise<{ success: boolean; message: string }> {
  const currentPage = await initBrowser();
  await currentPage.hover(selector);
  return { success: true, message: `Hovered on ${selector}` };
}
```

### 2. Dispatch Events Tool
```typescript
async function dispatchEvent(
  selector: string,
  eventType: string,
  eventProperties: any
): Promise<{ success: boolean; message: string }> {
  const currentPage = await initBrowser();
  await currentPage.dispatchEvent(selector, eventType, eventProperties);
  return { success: true, message: `Dispatched ${eventType} on ${selector}` };
}
```

### 3. Press Key Tool
```typescript
async function pressKey(key: string): Promise<{ success: boolean; message: string }> {
  const currentPage = await initBrowser();
  await currentPage.keyboard.press(key);
  return { success: true, message: `Pressed key: ${key}` };
}
```

### 4. Advanced Inspect Tool
```typescript
async function inspectDetailed(selector: string) {
  const currentPage = await initBrowser();
  const result = await currentPage.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    
    return {
      tag: el.tagName,
      attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
      computedStyle: window.getComputedStyle(el),
      boundingBox: el.getBoundingClientRect(),
      offsetParent: el.offsetParent !== null,
      pointerEvents: window.getComputedStyle(el).pointerEvents,
      zIndex: window.getComputedStyle(el).zIndex,
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility
    };
  }, selector);
  
  return result;
}
```

## Testing Checklist for Dynamic Components

When encountering a component that doesn't respond to clicks:

- [ ] Verify element exists in DOM using `queryElements()`
- [ ] Check element visibility and computed styles
- [ ] Inspect element's position and bounding box
- [ ] Check for overlaying elements or z-index issues
- [ ] Try clicking after a small wait/delay
- [ ] Attempt force click to bypass actionability checks
- [ ] Try JavaScript click via `evaluateScript()`
- [ ] Dispatch full mouse event sequence
- [ ] Try keyboard navigation as alternative
- [ ] Check for framework-specific event requirements
- [ ] Verify no JavaScript errors in console
- [ ] Take screenshots at each stage for debugging

## Best Practices

1. **Always inspect before interacting** with dynamic components
2. **Use wait strategies** - Don't just wait for visibility, wait for interactivity
3. **Implement retry logic** - Try multiple strategies before failing
4. **Take screenshots** at each step for debugging
5. **Add descriptive logging** to understand which strategy succeeded
6. **Verify success** - Don't assume interaction worked, verify state changed
7. **Keep tests maintainable** - Abstract complex interactions into reusable helpers

## Example: Complete Robust Date Picker Interaction

```typescript
export async function selectDateRangeRobust(
  world: ICustomWorld,
  rangeKey: string
): Promise<{ success: boolean; message: string; strategy: string }> {
  const strategies = [
    { name: 'standard-click', fn: async () => {
      await clickElement(world, `li[data-range-key="${rangeKey}"]`);
    }},
    { name: 'force-click', fn: async () => {
      await clickElement(world, `li[data-range-key="${rangeKey}"]`, { force: true });
    }},
    { name: 'js-click', fn: async () => {
      await evaluateScript(world, `document.querySelector('li[data-range-key="${rangeKey}"]').click()`);
    }},
    { name: 'mouse-events', fn: async () => {
      await evaluateScript(world, `
        const el = document.querySelector('li[data-range-key="${rangeKey}"]');
        ['mousedown', 'mouseup', 'click'].forEach(evt => {
          el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true }));
        });
      `);
    }},
    { name: 'hover-then-click', fn: async () => {
      // Need to add hover support
      await evaluateScript(world, `
        const el = document.querySelector('li[data-range-key="${rangeKey}"]');
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      `);
      await new Promise(resolve => setTimeout(resolve, 100));
      await clickElement(world, `li[data-range-key="${rangeKey}"]`);
    }}
  ];
  
  for (const strategy of strategies) {
    try {
      await strategy.fn();
      // Verify success by checking if dropdown closed or value changed
      await new Promise(resolve => setTimeout(resolve, 500));
      const isOpen = await isElementVisible(world, `li[data-range-key="${rangeKey}"]`);
      if (!isOpen) {
        // Dropdown closed, likely successful
        return { 
          success: true, 
          message: `Selected ${rangeKey} using ${strategy.name}`,
          strategy: strategy.name
        };
      }
    } catch (error) {
      // Try next strategy
      continue;
    }
  }
  
  return {
    success: false,
    message: `Failed to select ${rangeKey} with all strategies`,
    strategy: 'none'
  };
}
```

## Next Steps

1. ✅ Document the strategy (this file)
2. ⏳ Add hover, dispatchEvent, and keyboard tools to MCP server
3. ⏳ Add helper functions for robust interactions
4. ⏳ Create date-picker-specific helpers
5. ⏳ Add diagnostic step definitions
6. ⏳ Update test to use robust interaction patterns
7. ⏳ Run tests and iterate based on findings
