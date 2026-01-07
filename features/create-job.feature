@playwright-mcp @create-job
Feature: Create Job Workflow
  Demonstrate creating a new job with property and adaptation selection

  Scenario: Create a job with property, adaptation, and location
    Given I navigate to "<LOGIN_URL>?redirect=%2F"
    And I take a screenshot named "step-1-login-page"
    
    # Login
    When I fill "input#username" with "<USERNAME>"
    And I fill "input#password" with "<PASSWORD>"
    And I take a screenshot named "step-2-credentials-entered"
    And I click on "button:has-text('Sign In')"
    And I force click on button with text "Continue"
    And I wait for 2 seconds
    And I take a screenshot named "step-3-dashboard-nevergonnashowup-use-url"
    
    # Navigate directly to Job Control page
    When I navigate to "<SEARCH_JOBS_URL>"
    And I take a screenshot named "step-4-job-control-page"
    And I wait for button with text "Add New Job"
    And I force click on button with text "Add New Job"
    And I take a screenshot named "step-5-select-property-button"
    And I wait for 2 seconds
    And I force click on button with text "Select Property"
    And I wait for 1 second

    # Search for Property
    When I force click on input with text ""
    And I type "<PROPERTY_SEARCH_TERM>"
    And I take a screenshot named "step-5b-after-fill"
    And I force click on button with text "Search"
    And I wait for 2 seconds
    And I take a screenshot named "step-6-search-results"
    And I debug inspect "[role=\"gridcell\"]"
    And I debug inspect "div"
    And I debug inspect "a"
    And I force click on gridcell with text "<PROPERTY_CODE>"
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
