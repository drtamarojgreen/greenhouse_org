
Feature: Books Page
  As a user, I want to see the books page with a list of recommended books.

  Scenario: Books page loads with book list
    Given I am on the books page
    When the page has loaded
    Then I should see the main books container
    And I should see the book list
