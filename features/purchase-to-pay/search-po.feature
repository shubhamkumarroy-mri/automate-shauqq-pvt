@playwright @search-po @requires-login
Feature: Search Purchase Order Workflow
  Demonstrate searching for purchase orders and viewing results

  Scenario: Search for purchase orders and verify results
    # Login happens automatically via @requires-login tag
    # Navigate directly to Purchase Order Control Screen
    When I navigate to "<PURCHASE_ORDER_CONTROL_SCREEN_URL>"
    And I wait for 5 seconds
    And I take a screenshot named "search-po/step-1-po-control-screen"
