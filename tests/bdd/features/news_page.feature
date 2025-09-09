
Feature: News Page
  As a user, I want to see the news page with a list of news articles.

  Scenario: News page loads with news list
    Given I am on the news page
    When the page has loaded
    Then I should see the main news container
    And I should see the news list
