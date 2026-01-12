@playwright-mcp @search-po @requires-login
Feature: Search Purchase Order Workflow
  Demonstrate searching for purchase orders and viewing results

  Scenario: Search for purchase orders and verify results
    # Login happens automatically via @requires-login tag
    # Navigate directly to Purchase Order Control Screen
    When I navigate to "https://internal-dev.accuserv.cloud/purchase-orders/purchase-order-control-screen/"
    And I wait for 2 seconds
    And I take a screenshot named "search-po/step-1-po-control-screen"
    
    # Click Search button
    And I force click on button with text "Search"
    And I take a screenshot named "search-po/step-2-search-clicked"
    
    # Click OK on popup
    When I wait for 2 seconds
    And I force click on button with text "Yes"
    And I take a screenshot named "search-po/step-3-popup-confirmed"
    
    # Verify Search Results appears
    When I wait for 5 seconds
    Then I should see text "Search Results"
    And I take a screenshot named "search-po/step-4-search-results"
    
    # Click Search Again
    And I force click on button with text "Search Again"
    And I wait for 2 seconds
    And I take a screenshot named "search-po/step-5-search-again-clicked"
    
    # Verify Search Criteria screen appears
    Then I should see text "Purchase Order Search Criteria"
    And I wait for 4 seconds
    And I take a screenshot named "search-po/step-6-search-criteria-screen"

  Scenario: Search purchase orders by date range
    # Login happens automatically via @requires-login tag
    # Navigate directly to Purchase Order Control Screen
    When I navigate to "https://internal-dev.accuserv.cloud/purchase-orders/purchase-order-control-screen/"
    And I wait for 2 seconds
    And I take a screenshot named "search-po-date/step-1-po-control-screen"
    
    # Click on Select Date Range input field
    When I force click on "input.datepickerTxt"
    And I wait for 1 second
    And I take a screenshot named "search-po-date/step-2-date-picker-opened"
    
    # Option 1: JavaScript click (current working solution - resolution independent)
    # When I execute script "document.querySelector('li[data-range-key=\"Last 30 Days\"]').click()"
    
    # Option 2: Static coordinate click (manual coordinates - resolution dependent)
    # When I click at coordinates 241, 282
    
    # Option 3: Dynamic coordinate click (calculates coordinates at runtime - resolution independent!)
    # "Last 30 Days" is the 4th dropdown option below the input
    When I click at dropdown option 5 below "input.datepickerTxt"
    
    And I wait for 1 second
    And I take a screenshot named "search-po-date/step-3-date-range-selected"
    And I force click on button with text "Search"
    And I wait for 2 seconds
    And I take a screenshot named "search-po-date/step-4-search-button-clicked"
    
    # Verify Search Results appears
    When I wait for 5 seconds
    Then I should see text "Search Results"
    And I take a screenshot named "search-po-date/step-5-search-results"
    
    # Click Search Again
    And I force click on button with text "Search Again"
    And I wait for 2 seconds
    And I take a screenshot named "search-po-date/step-6-search-again-clicked"
    
    # Verify Search Criteria screen appears
    Then I should see text "Purchase Order Search Criteria"
    And I wait for 4 seconds
    And I take a screenshot named "search-po-date/step-7-search-criteria-screen"

  @playwright-mcp @search-po @requires-login @demo-dynamic-coords
  Scenario: Demo - Dynamic coordinate calculation (run separately to avoid nav issues)
    # This scenario demonstrates the dynamic coordinate features
    # Note: May have navigation issues due to session/auth timing
    
    When I navigate to "https://internal-dev.accuserv.cloud/purchase-orders/purchase-order-control-screen/"
    And I wait for 2 seconds
    
    # Calculate and display the date picker position
    When I calculate coordinates for "input.datepickerTxt"
    
    # Open date picker
    When I force click on "input.datepickerTxt"
    And I wait for 1 second
    
    # Use dynamic relative clicking - adapts to any screen resolution
    # Option 1: Click N pixels below element
    When I click 140 pixels below "input.datepickerTxt"
    
    # Option 2: Click at specific dropdown item number
    # When I click at dropdown option 4 below "input.datepickerTxt"
    
    And I wait for 2 seconds
