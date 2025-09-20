Feature: Schedule Page
  As a user, I want to be able to schedule an appointment with a therapist.

  Scenario: Successfully book a new appointment
    Given I am on the schedule page
    When I select "Individual Therapy" from the service dropdown
    And I select "Dr. Emily Carter" from the therapist dropdown
    And I choose a valid date from the calendar
    And I select an available time slot "10:00 AM"
    And I fill in my details in the booking form
    And I click the "Confirm Your Booking" button
    Then I should see a confirmation message "Thank You! Your appointment is booked."
    And I should receive a confirmation email
  
  Scenario: Schedule page loads basic elements
    Given I am on the schedule page
    When the page has loaded
    Then I should see the site header
    And I should see the site footer
    And I should see the main site container

  Scenario: Schedule page loads main application containers
    Given I am on the schedule page
    When the page has loaded
    Then I should see the main schedule container

  Scenario: Schedule page loads dashboard elements
    Given I am on the schedule page
    When the page has loaded
    Then I should see the administrator dashboard title
    And I should see the new appointment box

  Scenario: Schedule page loads schedule table elements
    Given I am on the schedule page
    When the page has loaded
    Then I should see the weekly schedule title
    And I should see the time column header
    And I should see the Sunday column header
