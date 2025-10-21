Feature: Projects Page
  As a user, I want to see the projects page with a list of projects.

  Scenario: Projects page loads with project list
    Given I am on the projects page
    When the page has loaded
    Then I should see the site header
    And I should see the site footer
    And I should see the main site container
    And I should see the main projects container
    And I should see the projects title
    And I should see the project list