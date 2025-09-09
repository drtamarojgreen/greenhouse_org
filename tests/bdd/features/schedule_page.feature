
Feature: Schedule Page
  As a user, I want to be able to schedule an appointment.

  Scenario: Schedule page loads with a scheduling form
    Given I am on the schedule page
    When the page has loaded
    Then I should see the scheduling form
