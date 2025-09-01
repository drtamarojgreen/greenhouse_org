# Conflict Resolution Strategy

This document outlines the process for handling scheduling conflicts within the Event Scheduler application.

## 1. Overview

When a user attempts to create or update an event, the system must check if the proposed time slot conflicts with any existing events across all integrated services. The goal is to provide clear feedback to the user about any conflicts, allowing them to make an informed decision.

## 2. API Behavior

The conflict detection is handled by the `/api/events/propose` endpoint.

-   **Request:** The frontend sends a `POST` request to `/api/events/propose` with the full proposed event object (including title, date, time, service, etc.).
-   **Success (No Conflict):** If there are no time overlaps, the API returns a `200 OK` status with a message indicating that no conflicts were detected.
-   **Conflict Detected:** If the proposed event's time overlaps with one or more existing events, the API returns a `409 Conflict` status. The JSON body of the response contains detailed information about the conflict.

### Conflict Response Body Example

```json
{
  "message": "Proposed event conflicts with existing events.",
  "proposedEvent": {
    "id": 10,
    "title": "New Team Meeting",
    "date": "2025-10-26",
    "time": "14:00",
    "platform": "Zoom",
    "start": "2025-10-26T14:00:00.000Z",
    "end": "2025-10-26T15:00:00.000Z",
    "serviceId": "serviceA"
  },
  "conflicts": [
    {
      "type": "time_overlap",
      "proposedEvent": { ... },
      "conflictingEvent": {
        "id": 3,
        "title": "Doctor's Appointment",
        "date": "2025-10-26",
        "time": "14:30",
        "platform": "Google Meet",
        "start": "2025-10-26T14:30:00.000Z",
        "end": "2025-10-26T15:30:00.000Z",
        "serviceId": "serviceB"
      }
    }
  ]
}
```
*Note: In the example above, `proposedEvent` within the `conflicts` array is truncated for brevity but would contain the full proposed event object.*

## 3. Frontend UI Flow

The frontend is responsible for presenting the conflict information to the user in a clear and understandable way.

1.  When the user clicks "Add Event" or "Update Event", the application first calls the `/api/events/propose` endpoint.
2.  If the response status is `409 Conflict`, the application does not proceed with creating or updating the event.
3.  Instead, it parses the JSON response body and displays a **modal dialog**.
4.  The modal dialog lists the details of the conflicting event(s), including their title, date, time, and the service they belong to.
5.  The user can close the modal to return to the form and choose a different time for their event.

This approach ensures that users are never able to create a scheduling conflict and are given immediate, specific feedback about why their request could not be completed.
