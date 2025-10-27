# Wix Velo Scheduler: Implementation Plan - Phase VI: Authentication and Security

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
