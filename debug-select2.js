// Debug script to check Select2 dropdown structure
// This can be run in browser console when the dropdown is open

console.log('=== Checking for Select2 dropdown elements ===');

// Check for regular DOM
const select2Results = document.querySelectorAll('.select2-results');
console.log('Found .select2-results in regular DOM:', select2Results.length);

const select2Container = document.querySelectorAll('.select2-container--open');
console.log('Found .select2-container--open:', select2Container.length);

const select2Dropdown = document.querySelectorAll('.select2-dropdown');
console.log('Found .select2-dropdown:', select2Dropdown.length);

// Check if dropdown is rendered at body level
const bodyChildren = document.body.children;
console.log('Body children count:', bodyChildren.length);
Array.from(bodyChildren).forEach((child, index) => {
  if (child.classList.contains('select2-container') || 
      child.classList.contains('select2-dropdown')) {
    console.log(`Found Select2 element as body child #${index}:`, child.className);
  }
});

// Check for shadow roots
const elementsWithShadow = [];
document.querySelectorAll('*').forEach(el => {
  if (el.shadowRoot) {
    elementsWithShadow.push({
      tag: el.tagName,
      classes: el.className
    });
  }
});
console.log('Elements with shadow roots:', elementsWithShadow);

// Check specific Select2 structure
setTimeout(() => {
  const options = document.querySelectorAll('.select2-results__option');
  console.log('\nAfter dropdown opens:');
  console.log('Found .select2-results__option:', options.length);
  if (options.length > 0) {
    console.log('First option text:', options[0].textContent);
    console.log('First option parent:', options[0].parentElement?.className);
  }
}, 1000);
