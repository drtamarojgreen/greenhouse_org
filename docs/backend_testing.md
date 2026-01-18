# Backend Testing Strategy for greenhousemd.org

This document outlines a black-box backend testing strategy for the Wix-based website [greenhousemd.org](https://greenhousemd.org). Since the backend source code is not available, this strategy focuses on testing the application from the outside by interacting with its publicly exposed endpoints and functionalities.

The strategy is divided into five main areas of testing:

## 1. User Authentication System

- **Objective:** Ensure the user authentication system is secure and functions correctly.
- **Test Cases:**
    - Manually test the login process with both valid and invalid credentials to check the authentication logic.
    - Examine the network requests during login/logout to understand the API endpoints and session management mechanisms.
    - Test for security vulnerabilities such as insecure password transmission and user enumeration.
    - If a registration feature exists, test its functionality and validation.

## 2. Appointment Booking System

- **Objective:** Verify the reliability and security of the appointment booking system.
- **Test Cases:**
    - Intercept and analyze the network traffic generated when a user clicks the "Request to book" button.
    - Test the booking API with valid and invalid data to check for proper functionality and error handling.
    - Verify that booking information is stored correctly and that there are no race conditions when multiple users book simultaneously.
    - Test for authorization issues, ensuring a user cannot view or modify another user's appointments.

## 3. Contact and Communication Channels

- **Objective:** Ensure that communication channels are working correctly and are not vulnerable to abuse.
- **Test Cases:**
    - Locate and test any contact forms on the website.
    - Test form submissions with both valid and invalid inputs to check for proper data validation and error handling.
    - Verify that submitted messages are successfully delivered to the intended recipient.
    - Test for common vulnerabilities like email injection.

## 4. Security and Vulnerability Assessment

- **Objective:** Identify and mitigate common security vulnerabilities.
- **Test Cases:**
    - Perform tests for common web application vulnerabilities, including:
        - Cross-Site Scripting (XSS) in input fields.
        - SQL/NoSQL injection.
        - Insecure Direct Object References (IDOR) by attempting to access resources belonging to other users.
    - Ensure that all communication with the server is encrypted using HTTPS.

## 5. Backend Performance

- **Objective:** Assess the performance and scalability of the backend services.
- **Test Cases:**
    - Use load testing tools (e.g., JMeter, k6) to simulate concurrent users.
    - Measure the response times of critical API endpoints (login, booking, etc.) under various load levels.
    - Identify and report any performance bottlenecks or degradation under stress.
