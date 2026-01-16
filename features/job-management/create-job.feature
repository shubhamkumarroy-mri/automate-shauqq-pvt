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
    
    # Search for property
    When I fill modal input with "<PROPERTY_SEARCH_TERM>"
    And I take a screenshot named "step-5d-search-term-filled"
    And I wait for 1 second
    And I click modal button with text "Search"
    And I wait for 3 seconds
    And I take a screenshot named "step-6-search-results"
    
    # Select first property from results
    And I click first visible grid cell
    And I wait for 2 seconds
    And I take a screenshot named "step-7-property-selected"
    
    # Confirm property selection
    When I click on dialog button with text "Select Property"
    And I wait for 1 second
    And I take a screenshot named "step-8-create-job-screen"
    
    And I wait for 3 seconds

    # Select dropdowns quickly before they timeout - Job Category first
    When I select option 1 from Select2 dropdown labeled "Job Category"
    And I wait for 1 second
    And I take a screenshot named "step-10-job-category-selected"
    
    # Now select Job Type
    When I select option 1 from Select2 dropdown labeled "Job Type"
    And I wait for 1 second
    And I take a screenshot named "step-10b-job-type-selected"
    
    # Select Job Location (regular select element)
    When I select "EXTERNAL" from dropdown labeled "Job Location"
    And I wait for 1 second
    And I take a screenshot named "step-11-location-selected"
    
    # Save Job
    And I wait for 2 seconds
    When I click button containing text "Save Job"
    And I wait for 3 seconds
    And I take a screenshot named "step-12-after-save-click"
    And I wait for text "The changes have been saved"
    And I take a screenshot named "step-13-job-saved"
    And I verify text "The changes have been saved" is visible
    And I wait for 5 seconds
