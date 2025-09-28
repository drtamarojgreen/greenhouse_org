# Schedule App Backend Development Plan

This document outlines the phased development plan for the scheduling application's backend, detailing the steps, goals, and deliverables for each stage.

## Architectural Overview: Two-Application Approach

The scheduling solution will consist of two distinct applications, each with specific user roles and functionalities:

1.  **Public-Facing User Application (Frontend: `apps/frontend/schedule/`):**
    *   **Purpose:** Allows users to request appointments, view available services, and potentially manage their own bookings.
    *   **Key Features:** Appointment request form, service browsing, confirmation/notification display.
    *   **Backend Interaction:** Primarily consumes data (services, availability) and submits new appointment requests.

2.  **Administrator Dashboard & Editor Application (New Frontend/UI):**
    *   **Purpose:** Provides administrators with tools to manage all aspects of scheduling, including conflict resolution, event updates, service management, and user management.
    *   **Key Features:** Conflict resolution interface, event CRUD operations, service configuration, user/client management.
    *   **Backend Interaction:** Performs comprehensive CRUD operations on scheduling data, triggers notifications, and manages system configurations.

This two-application approach necessitates a backend that can securely serve both public and administrative functionalities, with appropriate access controls.

## Phase 1: Velo Development & Understanding Wix Backend

*   **Goal:** Gain proficiency in Velo development and a deep understanding of the existing Wix backend, specifically how it can support both public-facing user interactions and administrative functionalities, to inform future development.

*   **Tasks:**
    *   **Velo Environment Setup & Basics:**
        *   Set up a Velo development environment (Wix Editor, Wix CLI, local IDE setup if applicable).
        *   Familiarize with Velo's IDE, tools, and deployment process.
        *   Complete official Velo tutorials and basic example projects to grasp core concepts.
        *   Understand Velo's server-side (backend .jsw files) and client-side (page code, public files) code structure and execution context.
    *   **Wix Backend Architecture Analysis:**
        *   Identify and document key Wix backend services currently used by the existing scheduling functionality (e.g., Wix Bookings, Wix Events, Wix Data, Wix CRM, Wix Automations).
        *   Map out existing data models and collections used for scheduling (e.g., `Bookings/Appointments`, `Services`, `Staff`, `Clients`, custom collections). Analyze their schemas and relationships.
        *   Analyze existing backend code (JWS files in `backend/` directory) for business logic, data interactions, and exposed API endpoints. Pay attention to how data is queried, updated, and validated.
        *   Understand Wix's security model, permissions, and authentication mechanisms for backend calls (e.g., `wix-users`, `wix-members`, `wix-auth`), with a focus on differentiating access for public users vs. administrators.
        *   Document existing backend flows related to scheduling (e.g., how a booking is created, modified, cancelled; how staff availability is managed; how notifications are triggered).
        *   **Identify Public vs. Admin Backend Needs:** Begin to categorize existing or potential backend functions and data access patterns based on whether they serve the public user application or the administrator dashboard.
    *   **Data Migration/Integration Strategy (Initial Assessment):**
        *   Assess if existing Wix data needs to be migrated or integrated with any new custom backend components.
        *   Identify potential challenges with data consistency and synchronization between Wix's native services and custom solutions.

*   **Deliverables:**
    *   A fully functional Velo development environment.
    *   Comprehensive documentation of the existing Wix backend architecture, data models, key functionalities, and security considerations relevant to scheduling, with initial distinctions for public vs. admin access.
    *   A basic Velo proof-of-concept (e.g., a simple backend function that queries a Wix collection and returns data to the frontend).

*   **Success Metrics:**
    *   Ability to confidently navigate, understand, and make minor modifications to Velo backend code.
    *   Clear and detailed understanding of how Wix backend services interact to support the current scheduling system, and how these interactions might differ for public and administrative use cases.

### Progress Update (as of September 2, 2025)

**Status:** Significant progress has been made in migrating the core scheduling logic from in-memory data to persistent Wix Data Collections. The terminology has been standardized from "event" to "appointment" across relevant backend modules.

**Completed Tasks:**
*   Modified `apps/wv/backend/services.jsw` to:
    *   Remove in-memory data storage.
    *   Update `getServices()` to query the "Services" Wix Data Collection.
    *   Rename `getServiceEvents` to `getServiceAppointments` and update it to query the "Appointments" Wix Data Collection.
    *   Rename `addEventToService` to `addAppointmentToService` and update it to insert into the "Appointments" Wix Data Collection.
    *   Rename `updateEventInService` to `updateAppointmentInService` and update it to update records in the "Appointments" Wix Data Collection.
    *   Rename `deleteEventFromService` to `deleteAppointmentFromService` and update it to remove records from the "Appointments" Wix Data Collection.
*   Modified `apps/wv/backend/scheduling.jsw` to:
    *   Update import statements to reflect renamed functions from `services.jsw`.
    *   Remove in-memory ID generation (`nextEventId`, `generateId`).
    *   Rename `checkConflict` to `checkAppointmentConflict` and update its logic to use "appointment" terminology and `getAppointments`.
    *   Rename `proposeEvent` to `proposeAppointment` and update its logic to use "appointment" terminology and `checkAppointmentConflict`.
    *   Rename `getEvents` to `getAppointments` and update its logic to call `getServiceAppointments`.
    *   Rename `createEvent` to `createAppointment` and update its logic to call `addAppointmentToService`.
    *   Rename `updateEvent` to `updateAppointment` and update its logic to call `updateAppointmentInService`.
    *   Rename `deleteEvent` to `deleteAppointment` and update its logic to call `deleteAppointmentFromService`.

**Pending Tasks:**
*   **Manual Action Required:** Creation of the "Services" and "Appointments" collections in the Wix Editor. This is a critical prerequisite for the updated backend code to function correctly.
*   **Security Rules:** Implementation of proper security rules for Wix Data Collections to ensure appropriate permissions for public users (e.g., only create appointments) and administrators (e.g., full CRUD on appointments, manage services).
*   **Thorough Testing:** Comprehensive testing of all updated backend functions to ensure data integrity, correct conflict detection, and proper interaction with Wix Data.
*   **Refinement of `checkAppointmentConflict`:** Further refinement of the conflict detection logic, if necessary, to handle edge cases or more complex scheduling rules.
*   **Error Handling & Logging:** Review and enhance error handling and logging mechanisms for all backend functions.

## Phase 2: Developing Around Wix Backend

*   **Goal:** Implement custom backend functionalities that complement or extend the existing Wix scheduling capabilities, leveraging Velo for custom logic and data handling, specifically developing distinct backend APIs and logic for the public-facing user application and the administrator dashboard, while maintaining seamless integration.

*   **Tasks:**
    *   **Identify Custom Logic Requirements:**
        *   Collaborate with stakeholders to determine specific scheduling features that cannot be fully achieved or optimized with standard Wix services (e.g., complex availability rules based on multiple criteria, custom pricing logic, multi-resource booking scenarios, advanced notification triggers, custom reporting).
        *   Define new data structures or custom collections required to support these new features.
    *   **Velo Backend Module Development:**
        *   Create new `.jsw` modules (e.g., `backend/publicScheduling.jsw`, `backend/adminScheduling.jsw`, `backend/availabilityEngine.jsw`, `backend/notificationService.jsw`) for custom backend functions.
        *   **Public-Facing Functions:** Implement logic for user-initiated actions (e.g., `submitAppointmentRequest`, `checkPublicAvailability`). Ensure these functions have appropriate permissions for public access.
            *   **New: `checkPublicAvailability`:** Implement a robust API to query available appointment slots based on service, date, and time, considering existing appointments and service capacity.
        *   **Administrator Functions:** Implement logic for administrative actions (e.g., `resolveConflict`, `updateEventStatus`, `manageServices`, `viewAllBookings`). Implement robust access control and authentication checks (`wix-users-backend`, `wix-members-backend`) to restrict these functions to authorized administrators only.
            *   **New: `getAppointmentsByDateRange`:** Retrieve all appointments within a specified date range for the admin dashboard.
            *   **New: `getConflictsForDateRange`:** Identify and return only conflicting appointments within a given date range.
            *   **New: `updateAppointmentStatus`:** Update the status of an appointment (e.g., confirmed, cancelled, rescheduled).
            *   **New: `resolveConflict`:** Implement logic to resolve conflicts by modifying multiple appointments (e.g., rescheduling, cancelling).
            *   **New: `getAppointmentById`:** Retrieve details of a single appointment for the individual admin page.
        *   Implement business logic for custom scheduling rules, data validations, and complex data processing.
        *   Utilize Wix Data API for interacting with both new custom collections and existing Wix collections (e.g., `wixData.query`, `wixData.insert`, `wixData.update`).
        *   Implement robust error handling, comprehensive logging (using `console.log` or `wix-crm-backend` for activity logs), and adhere to security best practices within all custom backend code.
        *   Consider using Wix Jobs for scheduled backend tasks (e.g., nightly availability updates, reminder emails).
    *   **Integration with Wix Frontend:**
        *   Expose custom backend functions via web modules (`export function myBackendFunction()`) for secure consumption by the respective frontend applications.
        *   Develop or modify frontend components (using Wix Corvid API, React, or plain JavaScript within Wix pages) to interact with the new backend functions. Ensure proper data serialization/deserialization.
        *   **Public App Frontend:** Integrate with public-facing backend functions.
        *   **Admin Dashboard Frontend:** Integrate with administrator-specific backend functions, ensuring secure communication and proper display of administrative data.
    *   **Testing & Debugging:**
        *   Implement unit tests for custom backend functions (if a testing framework is adopted or through manual testing).
        *   Perform thorough integration testing with both the public-facing and admin frontend applications, and existing Wix services, to ensure data consistency and functional correctness.
        *   Utilize Velo's debugging tools, site monitoring, and logs for efficient troubleshooting and performance analysis.

*   **Deliverables:**
    *   New Velo backend modules containing custom scheduling logic and data manipulation, clearly separated for public and administrative use, including:
        *   Public-facing APIs for appointment requests and availability checking.
        *   Administrator APIs for dashboard views, conflict resolution, and individual appointment management.
    *   Updated or new frontend components that seamlessly interact with the custom backend functionalities for both public and admin applications.
    *   A documented testing strategy and executed test cases for custom backend features, including security testing for admin functions.

*   **Success Metrics:**
    *   Custom scheduling features function correctly, reliably, and meet defined requirements for both public users and administrators.
    *   Seamless and performant integration with existing Wix scheduling flows and data.
    *   Maintainable, well-structured, and adequately documented custom backend code, with clear separation of concerns and robust security for administrative functions.

## Phase 3: External API Connection

*   **Goal:** Establish secure and reliable API connections with external services to enhance scheduling capabilities for both the public-facing user application and the administrator dashboard (e.g., payment gateways for public users, external calendar systems for admin, advanced analytics, CRM), extending beyond Wix's native integrations.

*   **Tasks:**
    *   **External Service Selection & API Documentation Review:**
        *   Identify specific external services required based on new feature requirements for both public and admin applications (e.g., Stripe for custom payment flows for public users, Google Calendar API for two-way synchronization for administrators, Twilio for custom SMS notifications, a third-party CRM for lead management).
        *   Thoroughly review the API documentation of the chosen external services, paying close attention to:
            *   Authentication mechanisms (API keys, OAuth, JWT).
            *   Request/response formats (JSON, XML).
            *   Rate limits and error codes.
            *   Webhook capabilities and security considerations.
    *   **API Key Management & Security:**
        *   Implement secure storage and retrieval of API keys and sensitive credentials using Wix Secrets Manager.
        *   Ensure all API calls from the Velo backend are made securely over HTTPS.
        *   Implement proper authentication headers and request signing as required by the external API.
        *   Consider IP whitelisting or other network security measures if supported by the external API and necessary for enhanced security.
    *   **Velo Backend Integration (HTTP Functions & Fetch API):**
        *   Create Velo HTTP functions (e.g., `backend/externalApi.jsw`, `backend/paymentGateway.jsw`) to act as secure intermediaries between the Wix frontend/backend and the external APIs.
        *   Utilize the `fetch` API within Velo backend code to make HTTP requests to external services.
        *   Implement logic to construct API requests, handle various response types (success, error), and manage data transformation between Wix's internal format and the external API's format.
        *   Implement robust retry mechanisms, timeouts, and circuit breakers for resilient API calls, especially for critical integrations.
        *   **Public-Facing API Integrations:** Develop integrations for services directly consumed by public users (e.g., payment processing).
        *   **Administrator API Integrations:** Develop integrations for services primarily used by administrators (e.g., CRM updates, detailed calendar sync).
    *   **Webhook Implementation (if applicable):**
        *   If external services provide webhooks for real-time updates (e.g., payment confirmations, calendar events), implement Velo HTTP functions (`backend/http-functions.js`) to receive and process these webhooks.
        *   Ensure webhook endpoints are secure and validate incoming webhook signatures to confirm authenticity and prevent spoofing.
    *   **Error Handling, Logging & Monitoring:**
        *   Implement comprehensive error handling for all external API calls, distinguishing between network errors, API-specific errors, and data transformation issues.
        *   Set up detailed logging for external API interactions (request/response payloads, timestamps, errors) to track performance, debug issues, and ensure compliance.
        *   Explore Wix Monitoring tools or integrate with external monitoring services for API health and performance.
    *   **Testing External Integrations:**
        *   Develop thorough integration tests for each external API connection. Utilize mock data, sandbox environments, or dedicated test accounts provided by the external services.
        *   Test edge cases, error conditions, rate limit handling, and data synchronization scenarios.

*   **Deliverables:**
    *   Velo backend modules specifically designed for secure and robust external API integrations, catering to both public and administrative needs.
    *   A secure system for managing API keys and credentials.
    *   Comprehensive error handling, logging, and monitoring for all external API interactions.
    *   A complete test suite demonstrating the reliability and correctness of external API connections.

*   **Success Metrics:**
    *   Seamless, secure, and reliable communication with all integrated external services.
    *   Enhanced scheduling features powered by accurate and timely data from external integrations for both public and administrative use cases.
    *   A scalable and maintainable external API integration solution.
