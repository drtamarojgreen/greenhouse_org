
Feature: Videos Page
  As a user, I want to see the videos page with a list of videos.

  Scenario: Videos page loads with video player and list
    Given I am on the videos page
    When the page has loaded
    Then I should see the main video container
    And I should see the video grid
