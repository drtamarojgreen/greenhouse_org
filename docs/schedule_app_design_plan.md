# Appointment Scheduler Design Plan

## 1. Project Goal

To create a unified appointment scheduler that integrates appointments from various platforms, providing a single view for users of Dr. Green's Greenhouse for Mental Health.

## 2. Key Features

*   **Unified Calendar View:** Display appointments from multiple sources (e.g., Google Calendar, Outlook, Calendly) in a single calendar interface.
*   **Appointment Scheduling:** Allow users to schedule new appointments with healthcare professionals.
*   **Cross-Platform Synchronization:** Ensure that appointments created or modified within the application are synchronized back to the original platform.
*   **User Authentication:** Secure user accounts and personal information.
*   **Email/SMS Reminders:** Send automated reminders for upcoming appointments.

## 3. Technical Stack

*   **Frontend:** React.js with a state management library like Redux.
*   **Backend:** Node.js with Express.js for the API.
*   **Database:** PostgreSQL for storing user data, appointment information, and platform integration tokens.
*   **Authentication:** JWT (JSON Web Tokens).
*   **Third-Party Integrations:** APIs from Google Calendar, Microsoft Graph (Outlook), and Calendly.

## 4. API Design (Initial Draft)

### Authentication

*   `POST /api/auth/register`: Register a new user.
*   `POST /api/auth/login`: Log in a user and return a JWT.

### Appointments

*   `GET /api/appointments`: Get all appointments for the logged-in user.
*   `POST /api/appointments`: Create a new appointment.
*   `PUT /api/appointments/:id`: Update an existing appointment.
*   `DELETE /api/appointments/:id`: Cancel an appointment.

### Integrations

*   `POST /api/integrations/google/connect`: Initiate the OAuth flow to connect a Google Calendar.
*   `POST /api/integrations/outlook/connect`: Initiate the OAuth flow to connect an Outlook Calendar.
*   `POST /api/integrations/calendly/connect`: Connect a Calendly account using an API key.

## 5. Testing Strategy

*   **Unit Tests:** Use Jest and React Testing Library for frontend components and Jest for backend API endpoints.
*   **Behavior-Driven Development (BDD):** Use Cucumber.js to write feature files that describe the application's behavior from the user's perspective.
*   **Integration Tests:** Test the integration between the frontend, backend, and third-party APIs.

## 6. Directory Structure

```
/apps/frontend/schedule
|-- /src
|   |-- /components         // Reusable React components
|   |-- /pages              // Main pages of the application
|   |-- /services           // API calls and other services
|   |-- /store              // Redux store
|   |-- App.js
|   `-- index.js
|-- /tests
|   |-- /features           // feature files
|   |   `-- /step_definitions // Step definitions for features
|   `-- /unit               // unit tests
|-- package.json
`-- ...
```
