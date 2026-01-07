@playwright-mcp @create-job @requires-login
Feature: Create Job Workflow
  Demonstrate creating a new job with property and adaptation selection

  Scenario: Create a job with property, adaptation, and location
    # Login happens automatically via @requires-login tag
    # Navigate directly to Job Control page
    When I navigate to "<SEARCH_JOBS_URL>"
    And I take a screenshot named "step-4-job-control-page"
    And I wait for button with text "Add New Job"
    And I force click on button with text "Add New Job"
    And I take a screenshot named "step-5-select-property-button"
    And I wait for 2 seconds
    And I force click on button with text "Select Property"
    And I wait for text "Select Property"
    And I wait for 2 seconds
    And I take a screenshot named "step-5c-property-dialog-opened"
    
    # Fill the search input with the property search term
    When I execute script "(function() { const input = document.querySelector('.modal.show input[type=\"text\"]'); if (input) { input.value = '<PROPERTY_SEARCH_TERM>'; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); } })();"
    And I take a screenshot named "step-5d-search-term-filled"
    And I wait for 1 second
    
    # Click the Search button
    And I execute script "(function() { const btns = Array.from(document.querySelectorAll('.modal.show button')); const searchBtn = btns.find(btn => btn.textContent.trim() === 'Search'); if (searchBtn) { searchBtn.click(); console.log('Clicked Search button'); } })();"
    And I wait for 3 seconds
    And I take a screenshot named "step-6-search-results"
    
    # Click the first property in the grid results
    And I execute script "(function() { const rows = Array.from(document.querySelectorAll('[role=\"row\"]')).filter(r => !r.querySelector('[role=\"columnheader\"]') && r.offsetParent !== null && r.getBoundingClientRect().height > 0); console.log('Found ' + rows.length + ' data rows'); if (rows.length > 0) { const cells = rows[0].querySelectorAll('[role=\"gridcell\"]'); console.log('Found ' + cells.length + ' cells in first row'); if (cells.length > 0) { cells[0].scrollIntoView(); cells[0].click(); console.log('Clicked cell with text: ' + cells[0].textContent.trim()); } } })();"
    And I wait for 2 seconds
    And I take a screenshot named "step-7-property-selected"
    
    # Select Property in Dialog
    When I click on dialog button with text "Select Property"
    And I wait for 1 second
    And I take a screenshot named "step-8-property-dialog"
    
    # Select Duration from dropdown
    When I click on combobox with name "A0 - 2 DAY"
    And I click on treeitem with text "<DURATION>"
    And I take a screenshot named "step-9-duration-selected"
    
    # Select Adaptation
    When I click on select2 container with id "select2-40p1-container"
    And I click on text "<ADAPTATION>"
    And I take a screenshot named "step-10-adaptation-selected"
    
    # Select Job Location
    When I click on text "Job Location*"
    And I click on combobox with name "<JOB_LOCATION>"
    And I click on treeitem with text "<JOB_LOCATION>"
    And I take a screenshot named "step-11-location-selected"
    
    # Save Job
    Then I click on button with text "Save Job"
    And I wait for text "The changes have been saved"
    And I take a screenshot named "step-12-job-saved"
    And I verify text "The changes have been saved" is visible
