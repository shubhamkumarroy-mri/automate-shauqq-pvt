@playwright-mcp @aw-login
Feature: AW Login
  Demonstrate black-box login flow with screenshots

  Scenario: Login and reach dashboard
    Given I navigate to "<BASE_URL>/"
    And I take a screenshot named "step-1-landing"
    When I wait for "input#username"
    And I fill "input#username" with "<USERNAME>"
    And I fill "input#password" with "<PASSWORD>"
    And I take a screenshot named "step-2-credentials-filled"
    And I click on "button:has-text('Sign In')"
    And I wait for "button:has-text('Continue'):not([disabled])"
    And I take a screenshot named "step-3-profile-clients-selector"
    And I click on "button:has-text('Continue'):not([disabled])"
    And I wait for "[data-test-id='dashboard'], .dashboard, main, h1, h2"
    And I take a screenshot named "step-4-final-page"
