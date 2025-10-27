# Wix Velo Scheduler: Implementation Plan - Phase VII: Core Logic Implementation

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
