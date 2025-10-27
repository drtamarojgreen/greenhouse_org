# Wix Velo Scheduler: Implementation Plan - Phase IV: Technical Architecture

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
