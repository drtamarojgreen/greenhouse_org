# Wix Velo Scheduler: Implementation Plan & Architectural Deep Dive

## 1. Project Overview

This document provides a comprehensive technical roadmap for developing a centralized scheduling interface for medical and behavioral health practices within the Wix Velo ecosystem. This system is designed to aggregate appointments from multiple external platforms, provide robust administrative management tools, and ensure real-time synchronization with Google Calendar.

The project's complexity lies in integrating disparate third-party APIs (Zocdoc, SimplePractice, Kareo, Athenahealth), ensuring HIPAA-compliant data handling, and implementing a real-time conflict detection engine. This plan outlines the functional requirements, technical architecture, and implementation strategies required for a successful deployment.

---

## 2. Table of Contents

- [3. Functional Requirements](#3-functional-requirements)
- [4. Technical Architecture](#4-technical-architecture)
  - [4.1. System Layers and Data Flow](#41-system-layers-and-data-flow)
  - [4.2. API Integration Strategy](#42-api-integration-strategy)
- [5. Data Normalization Strategy](#5-data-normalization-strategy)
- [6. Authentication and Security](#6-authentication-and-security)
  - [6.1. OAuth2 and Token Handling](#61-oauth2-and-token-handling)
  - [6.2. HIPAA Compliance and PHI Segregation](#62-hipaa-compliance-and-phi-segregation)
- [7. Core Logic Implementation](#7-core-logic-implementation)
  - [7.1. Data Model and Wix Collections](#71-data-model-and-wix-collections)
  - [7.2. Real-Time Conflict Detection](#72-real-time-conflict-detection)
- [8. Frontend and UI/UX](#8-frontend-and-uiux)
  - [8.1. Velo Component Strategy](#81-velo-component-strategy)
  - [8.2. Core User Flows](#82-core-user-flows)
- [9. Performance and Monitoring](#9-performance-and-monitoring)
- [10. Testing and Quality Assurance](#10-testing-and-quality-assurance)
- [11. Development Timeline & Milestones](#11-development-timeline--milestones)
- [12. Future Enhancements](#12-future-enhancements)
- [13. References](#13-references)

---

## 3. Functional Requirements

| Category                       | Key Requirements                                                                 | Challenges                                           | Solution Directions                                       |
| ------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| **Scheduling Aggregation**     | Aggregate, display, and manage appointments from multiple external platforms.      | Disparate APIs, data models, and sync logic.         | Backend modules for API integration & data normalization. |
| **Admin Calendar Management**  | Allow admin editing of therapist calendars; filter by clinician, office, source. | Permissions, real-time updates, scalability.         | Role-based access; UI data binding; webhooks for refresh. |
| **Google Calendar Sync**       | Two-way appointment sync; display "busy" blocks from external Google accounts.   | OAuth2 delegation, bidirectional syncing, conflicts. | Google API integration, token rotation, conflict logic.   |
| **Real-Time Conflict Detection** | Dynamically detect and warn on double-bookings and calendar conflicts.           | Complex detection logic, UI alerts, concurrency.     | Backend event queue, scheduling algorithms, live UI cues. |
| **Role-Based Access Control**  | Differentiate between admins, therapists, and front desk with restricted views.  | Secure access, permission enforcement, scalability.  | Utilize Wix roles, restrict backend APIs, field-level security. |
| **Secure Health Data Handling**| Ensure all data flows and storage are HIPAA-compliant.                            | Technical and legal limitations of the Wix platform. | PHI segmentation, externalized storage, encryption.       |
| **Audit & Error Reporting**    | Log all changes, data access, and errors for administrative review.              | Real-time, persistent, and secure logging.           | Backend logging modules, Site Monitoring, and alerts.     |
| **Performance and Uptime**     | Ensure rapid UI updates and robustness against outages and high-frequency use.    | Cache consistency, API throttling, error recovery.   | Caching strategies, rate limits, optimistic UI updates.   |
| **Extensibility**              | Design for future integration with new EMR/EHR systems and analytics.            | Flexible schema, API abstraction, event bus.         | Modular backend, schema versioning, event-driven design.  |

---

## 4. Technical Architecture

### 4.1. System Layers and Data Flow

The system is designed with a multi-layered architecture to separate concerns and enhance security:

1.  **Frontend UI (Velo):** The user-facing interface built with Velo components. It communicates with the backend via secure web methods and handles rendering calendars, conflict warnings, and appointment details.
2.  **Backend Web Modules (Velo):** The core of the application logic. These modules handle all integrations with external APIs, data normalization, conflict detection, and secure token management.
3.  **Wix Data Collections:** The primary data store for non-sensitive information, such as appointment metadata, therapist profiles, user roles, and sync logs.
4.  **Role-Based Authorization:** Enforced using Wix Members/Groups and custom logic within backend modules to protect sensitive endpoints and actions.
5.  **External Services:** Third-party platforms including Google Calendar and medical scheduling systems (Zocdoc, Kareo, etc.).

### 4.2. API Integration Strategy

A dedicated backend module will be created for each external service to encapsulate its unique logic.

-   **Zocdoc:**
    -   **API:** REST API with OAuth2.
    -   **Challenges:** Strict rate limits, proprietary data schema.
    -   **Solution:** Implement a backend connector with scheduled jobs for bulk syncs and on-demand fetching. Normalize Zocdoc objects to our canonical format. Store credentials securely in the Wix Secrets Manager.

-   **SimplePractice:**
    -   **API:** Enterprise-level API, access may require a business agreement.
    -   **Challenges:** Potential for limited API access; data model may differ significantly.
    -   **Solution:** If direct API access is granted, build a connector similar to Zocdoc. If not, leverage calendar export/sync (ICS/CSV) with periodic imports.

-   **Kareo:**
    -   **API:** Public REST API with API key authentication.
    -   **Challenges:** Limited polling frequency (5-10 minutes), separate endpoints for patient, provider, and appointment data.
    -   **Solution:** Develop a backend module for scheduled polling within the allowed windows. Cache results locally to minimize redundant requests and only update deltas.

-   **Athenahealth:**
    -   **API:** Comprehensive REST API with OAuth2, supports FHIR standards.
    -   **Challenges:** High API complexity, large nested data objects.
    -   **Solution:** Utilize FHIR-compatible endpoints where possible to simplify data normalization. Implement a field-by-field mapping in the backend module and handle token refresh securely.

-   **Google Calendar:**
    -   **API:** Google Calendar API via `googleapis` npm package.
    -   **Challenges:** Managing delegated permissions for each therapist, handling token expiration.
    -   **Solution:** Use the Velo backend for the OAuth2 flow. Store refresh tokens in Wix Secrets Manager. Map appointments to Google Calendar events using a unique ID for idempotency.

---

## 5. Data Normalization Strategy

To aggregate data from multiple sources, all external appointments will be mapped to a single **canonical appointment object**.

```javascript
{
  "id": "string", // Internal Wix DB ID
  "sourceSystem": "Zocdoc | Kareo | SimplePractice | Google | Athenahealth",
  "externalId": "string", // ID from the source system
  "providerId": "string",
  "patientId": "string", // May be pseudonymized for HIPAA compliance
  "therapistId": "string",
  "startDateTime": "ISO-8601", // Normalized to UTC
  "endDateTime": "ISO-8601",   // Normalized to UTC
  "location": "string",
  "status": "Scheduled | Confirmed | Cancelled | Completed",
  "type": "Consult | Follow-up | Admin | Personal",
  "conflictIds": ["array", "of", "conflicting", "appointment", "IDs"],
  "metadata": {} // Raw JSON from source for audit/reference
}
```

**Key Principles:**
-   All timezone information will be normalized to UTC on ingest and converted to local time for display.
-   Transformer functions will be implemented in each API module to handle the mapping.
-   Raw metadata from the source system will always be stored for auditing and fallback purposes.

---

## 6. Authentication and Security

### 6.1. OAuth2 and Token Handling

All OAuth2 flows will be executed on the backend to protect client secrets and tokens.

-   **Implementation:** Use Velo's backend capabilities with `npm` packages and the **Wix Secrets Manager**.
-   **Flow:**
    1.  **Interactive Consent:** A user (e.g., a therapist connecting their Google Calendar) will be redirected to the provider to grant consent.
    2.  **Token Storage:** The retrieved refresh tokens will be stored securely in the Wix Secrets Manager, associated with the user's ID.
    3.  **Token Refresh:** Backend jobs will handle token refreshing to ensure long-term access.

### 6.2. HIPAA Compliance and PHI Segregation

Wix is not inherently a HIPAA-compliant platform. Therefore, a strict **PHI segregation** strategy is mandatory.

-   **Core Principle:** **Protected Health Information (PHI) must not be stored in Wix Data Collections.**
-   **Mitigation Strategy:**
    -   Only store appointment metadata (e.g., time, therapist, anonymized patient ID) in Wix.
    -   Store all PHI in an external, HIPAA-eligible service (e.g., a BAA-covered service like Google Cloud or AWS).
    -   All data in transit must be encrypted using HTTPS/TLS 1.2+.
    -   Implement rigorous Role-Based Access Control (RBAC) on all backend modules.
    -   Maintain a detailed audit trail of all data access and modifications.

---

## 7. Core Logic Implementation

### 7.1. Data Model and Wix Collections

The following Wix Data Collections will be created with specific schemas and permissions to form the application's backbone.

-   **`Appointments`**
    -   **Description:** Stores the canonical appointment objects (non-PHI data only).
    -   **Schema:**
        -   `_id`: (Text) Wix unique ID
        -   `externalId`: (Text) ID from the source system. **Index this field.**
        -   `sourceSystem`: (Text) e.g., "Zocdoc", "Google". **Index this field.**
        -   `therapistId`: (Reference to `Therapists` collection)
        -   `startDateTime`: (Date and Time) Stored in UTC. **Index this field.**
        -   `endDateTime`: (Date and Time) Stored in UTC.
        -   `status`: (Text) e.g., "Confirmed", "Cancelled".
        -   `type`: (Text) e.g., "Consult", "Admin".
        -   `conflictIds`: (Array of Text) Stores `_id` of conflicting appointments.
    -   **Permissions:** Admin: R/W. Therapist: Read-only for their own appointments.

-   **`Therapists`**
    -   **Description:** Stores profiles for therapists and clinicians.
    -   **Schema:**
        -   `_id`: (Text) Wix unique ID
        -   `name`: (Text) Full name of the therapist.
        -   `email`: (Text) Contact email.
        -   `availability`: (JSON) Object defining working hours, e.g., `{ "monday": ["09:00-12:00", "13:00-17:00"] }`.
        -   `googleSyncToken`: (Reference to Wix Secrets Manager)
    -   **Permissions:** Admin: R/W. Therapist: Read-only for their own profile.

-   **`AuditLogs`**
    -   **Description:** A comprehensive, immutable log of all significant actions.
    -   **Schema:**
        -   `_id`: (Text) Wix unique ID
        -   `timestamp`: (Date and Time)
        -   `userId`: (Text) ID of the user performing the action.
        -   `action`: (Text) e.g., "CREATE_APPOINTMENT", "RESOLVE_CONFLICT".
        -   `details`: (JSON) Contextual details of the action.
    -   **Permissions:** Admin: Read-only. No one has write access via API; records are created via backend data hooks only.

### 7.2. Real-Time Conflict Detection

The conflict detection engine is a critical backend function that ensures schedule integrity.

-   **Algorithm Pseudocode:**
    ```
    function detectConflicts(proposedAppointment):
      // 1. Fetch potentially conflicting events
      therapistId = proposedAppointment.therapistId
      startTime = proposedAppointment.startDateTime
      endTime = proposedAppointment.endDateTime

      existingAppointments = queryAppointments({
        therapistId: therapistId,
        status: "Confirmed",
        startTime: { $lte: endTime },
        endTime: { $gte: startTime }
      })

      // 2. Check for direct overlaps
      conflicts = []
      for each appt in existingAppointments:
        if (proposedAppointment.id != appt.id): // Don't compare against itself
          conflicts.push(appt.id)

      // 3. Check against therapist's general availability
      dayOfWeek = getDay(startTime)
      timeOfDay = getTime(startTime)
      isAvailable = checkAvailability(therapist.availability, dayOfWeek, timeOfDay)
      if not isAvailable:
        conflicts.push("TIME_OFF_CONFLICT")

      // 4. Check against external "busy" blocks (from Google Calendar)
      googleBusyBlocks = getGoogleBusyEvents(therapistId, startTime, endTime)
      if googleBusyBlocks overlaps with proposedAppointment:
        conflicts.push("EXTERNAL_CALENDAR_CONFLICT")

      return conflicts
    ```

---

## 8. Frontend and UI/UX

### 8.1. Velo Component Strategy

-   **Main Calendar View:** A **Repeater** or **Custom Element** will be used to render the calendar grid. A Custom Element offers more flexibility for complex interactions like drag-and-drop, but a Repeater is faster to implement for a static display.
-   **Appointment Details:** A **Box** element containing text fields will be used to display the details of a selected appointment. This will be populated dynamically.
-   **Filtering and Controls:** **Dropdown** elements for filtering by therapist and **Button** elements for actions like "Refresh" or "Sync All".
-   **Conflict Resolution:** A **Lightbox** will be used to display conflict details and provide administrators with options to resolve them (e.g., "Cancel New," "Reschedule Existing").

### 8.2. Core User Flows

-   **Admin Viewing Schedule:**
    1.  Admin lands on the scheduler page.
    2.  The frontend calls a backend function `getAggregatedCalendar(dateRange)`.
    3.  The backend fetches, normalizes, and merges data from all sources.
    4.  The frontend populates the calendar Repeater with the returned appointments, visually highlighting any with conflicts.
-   **Admin Resolving a Conflict:**
    1.  Admin clicks on a conflicting appointment.
    2.  A Lightbox opens, showing details of the overlapping appointments.
    3.  Admin chooses an action (e.g., "Cancel Conflicting Appointment").
    4.  The frontend calls a backend function `resolveConflict(action, appointmentIds)`.
    5.  The UI is refreshed to reflect the change.

---

## 9. Performance, Scalability, and Monitoring

A high-performance, reliable system is critical. The strategy is multi-layered, addressing backend, frontend, and operational concerns.

### 9.1. Caching Strategy

-   **Target Data:** Static or slowly-changing data from external APIs.
    -   **Therapist Profiles & Availability:** Cache using `wix-cache-backend` with a Time-to-Live (TTL) of **15 minutes**. Key by therapist ID.
    -   **Service Lists:** Cache using `wix-cache-backend` with a TTL of **1 hour**.
-   **Implementation:** Create a dedicated backend module `caching.jsw` that wraps `wix-cache-backend`. All data-fetching functions will first check this module for a valid cache entry before making an external API call.
-   **Cache Invalidation:** Implement a mechanism to manually invalidate the cache (e.g., an admin function `invalidateCache(key)`) for immediate updates.

### 9.2. API Throttling and Queueing

-   **Problem:** External APIs have strict rate limits. Direct, immediate calls risk exceeding these limits during high traffic or bulk operations.
-   **Solution:** Implement a **job queue** using a dedicated Wix Data Collection (`APIWriteQueue`).
    -   **Schema:** `jobId`, `targetSystem`, `payload`, `status (pending, processed, failed)`, `attempts`.
    -   **Workflow:**
        1.  Instead of a direct API call, backend functions will insert a job record into the `APIWriteQueue`.
        2.  A **scheduled job** (running every 1 minute via `jobs.config`) will query for `pending` jobs.
        3.  The job will process a small batch (e.g., 5-10 jobs) per run, making the actual external API calls. This naturally throttles the rate.
        4.  Implement a retry mechanism with exponential backoff for failed jobs.

### 9.3. Frontend Optimization

-   **Initial Load:** The main calendar view must load quickly.
    -   **Lazy Loading:** Initially, only load appointment data for the current week/month.
    -   **Skeleton UI:** Display a "skeleton" or ghost version of the calendar grid while the initial data is being fetched.
-   **Data Binding:** Use efficient data binding to update the calendar. For repeaters, only update the items that have changed rather than re-rendering the entire list.
-   **Debouncing:** Apply a debounce of **300ms** to user input on filter controls to prevent a flood of backend requests as the user types or selects options.

### 9.4. Monitoring and Alerting Strategy

-   **Key Performance Indicators (KPIs):**
    -   **API Latency:** P95 latency for all external API calls (e.g., `Zocdoc_GetAppointments_ms`).
    -   **Error Rate:** Percentage of failed external API calls and backend function executions.
    -   **Queue Depth:** Number of pending jobs in the `APIWriteQueue`.
-   **Implementation:**
    -   Use `wix-site-monitoring` to track these KPIs.
    -   **Custom Events:** From the backend, fire custom events like `wixSiteMonitoring.logCustom("Zocdoc_GetAppointments", { latency: 1200, success: true })`.
-   **Alerting Rules:**
    -   `CRITICAL`: If Error Rate > 5% for 10 minutes.
    -   `WARNING`: If P95 latency for `getAggregatedCalendar` > 2000ms for 5 minutes.
    -   `WARNING`: If `APIWriteQueue` depth > 50.

---

## 10. Testing and Quality Assurance Strategy

A multi-layered testing strategy will be implemented to ensure correctness, reliability, and regression prevention.

### 10.1. Unit Testing

-   **Framework:** Jest (run locally in a Node.js environment).
-   **Scope:** Backend modules (`.jsw` files) will be tested in isolation.
-   **Critical Test Targets:**
    -   `dataNormalization.jsw`: Test all transformer functions (e.g., `normalizeZocdocAppointment`) with mock API responses to ensure they produce the correct canonical object.
    -   `conflictDetection.jsw`: Test the `detectConflicts` function with various scenarios (direct overlaps, boundary conditions, time-off blocks).
    -   `permissions.jsw`: Test the logic that checks user roles and grants/denies access to actions.

### 10.2. Integration Testing

-   **Framework:** Velo's built-in backend testing capabilities.
-   **Scope:** Verify the interaction between different backend components.
-   **Priority Scenarios:**
    -   **API to Data:** Ensure that after a successful external API call, the transformed data is correctly inserted into the `Appointments` Wix Data Collection.
    -   **Permissions:** Test that a backend function correctly rejects a call from a user with insufficient permissions.
    -   **Cache Logic:** Verify that the caching module correctly stores and retrieves data, and that cache misses trigger a real API call.

### 10.3. End-to-End (E2E) Testing

-   **Framework:** Puppeteer or Playwright.
-   **Scope:** Simulate full user journeys in a dedicated staging environment that mirrors production.
-   **Critical User Journeys to Automate:**
    1.  **Admin Conflict Resolution:** Log in as admin -> view calendar -> identify a conflict -> click the conflict -> choose a resolution -> verify the calendar updates correctly.
    2.  **Therapist Google Sync:** Log in as therapist -> initiate Google Calendar sync -> complete OAuth flow -> verify that a new appointment created in the system appears on their Google Calendar.
    3.  **Basic Appointment Creation:** (As Admin) Create a new appointment -> verify it appears on the calendar with the correct details and no conflicts.

### 10.4. User Acceptance Testing (UAT)

-   **Framework:** A structured plan with defined scenarios and roles.
-   **Participants:** A select group of administrators and therapists.
-   **Process:**
    1.  Provide participants with a list of tasks to perform (e.g., "Schedule a follow-up for a patient," "Resolve the two conflicting appointments for Dr. Smith").
    2.  Participants will execute the tasks and report any bugs, usability issues, or confusing workflows via a feedback form.
    3.  The development team will address the feedback before the final production release.

---

## 11. Development Timeline & Milestones

| Phase                      | Milestone                                                                   | Key Dependencies                                    | Estimated Time |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | -------------- |
| **1. Architecture & Setup** | All API credentials obtained; Wix Collections created; project scaffolded.  | Access to all third-party developer portals.        | 2–3 weeks      |
| **2. Backend Integration** | All backend modules for external APIs are complete and can fetch data.      | Stable API documentation from third parties.        | 3–5 weeks      |
| **3. Core Logic Complete** | Conflict detection engine is functional; data normalization is complete.    | Phase 2 completion.                                 | 2–3 weeks      |
| **4. Frontend UI Complete**| Admin and therapist calendar views are built and connected to the backend.  | Phase 3 completion.                                 | 2–3 weeks      |
| **5. Alpha Version Ready** | The system is feature-complete and ready for internal testing (UAT).        | All prior phases complete.                          | 1–2 weeks      |
| **6. Staged Rollout**      | The application is deployed to a subset of users; monitoring is active.     | Successful UAT.                                     | 1–2 weeks      |

---

## 12. Future Enhancements

-   **Additional Scheduling Platforms:**
    -   **Impact:** High. Expands the system's utility to a wider range of clinics.
    -   **Effort:** Medium per integration. The modular design should make this straightforward.
-   **Advanced Analytics Dashboard:**
    -   **Impact:** High. Provides valuable insights into clinic utilization, no-show rates, and peak hours.
    -   **Effort:** Medium. Requires building a new page and backend aggregation queries.
-   **Automated Notifications (SMS/Email):**
    -   **Impact:** High. Improves patient and staff experience by providing timely reminders and updates.
    -   **Effort:** Medium. Requires integration with a third-party service like Twilio.
-   **Self-Serve Patient Portal:**
    -   **Impact:** Very High. Reduces administrative overhead by allowing patients to manage their own appointments.
    -   **Effort:** High. A significant undertaking that requires careful security and permissions modeling.

---

## 13. References

1.  Zocdoc for Developers - [https://api-docs.zocdoc.com/](https://api-docs.zocdoc.com/)
2.  SimplePractice Enterprise API - [https://www.simplepractice.com/press/simplepractice-enterprise-launches-api/](https://www.simplepractice.com/press/simplepractice-enterprise-launches-api/)
3.  Kareo API User Guide - [https://www.tebra.com/wp-content/uploads/2023/08/macra-open-api-documentation.pdf](https://www.tebra.com/wp-content/uploads/2023/08/macra-open-api-documentation.pdf)
4.  Athenahealth API Solutions - [https://docs.athenahealth.com/](https://docs.athenahealth.com/)
5.  Google Calendar API Overview - [https://developers.google.com/workspace/calendar/api/guides/overview](https://developers.google.com/workspace/calendar/api/guides/overview)
6.  Wix Velo: Authenticate Using OAuth - [https://dev.wix.com/docs/build-apps/develop-your-app/access/authentication/authenticate-using-oauth](https://dev.wix.com/docs/build-apps/develop-your-app/access/authentication/authenticate-using-oauth)
7.  Wix Velo: Site Monitoring - [https://www.wix.com/learn/tutorials/coding/how-to-use-the-site-monitoring-tool-to-track-events-and-errors](https://www.wix.com/learn/tutorials/coding/how-to-use-the-site-monitoring-tool-to-track-events-and-errors)
8.  Wix Velo: Backend Caching - [https://dev.wix.com/docs/velo/apis/wix-cache-backend/cache/introduction](https://dev.wix.com/docs/velo/apis/wix-cache-backend/cache/introduction)
