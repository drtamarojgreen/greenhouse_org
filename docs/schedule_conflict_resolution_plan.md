# Schedule Conflict Resolution Plan

This document outlines the strategies and mechanisms for resolving scheduling conflicts within the Greenhouse Schedule Application.

## 1. Conflict Detection

Conflicts are detected when a proposed event (new or updated) overlaps in time with existing events. The detection process considers:
*   **Time Overlap:** Checks if the proposed event's start and end times intersect with any existing event's times.
*   **Participant Availability:** (Future enhancement) Checks if required participants are already booked for another event.
*   **Resource Availability:** (Future enhancement) Checks if required resources (e.g., rooms, equipment) are available.

## 2. Conflict Resolution Strategies

The application will support the following strategies for resolving detected conflicts:

### a. Notification (Default)
*   **Mechanism:** When a conflict is detected, the system will notify the user about the overlap.
*   **User Action:** The user will be presented with the conflicting events and can choose to proceed with the proposed event (ignoring the conflict), modify the proposed event, or cancel it.
*   **Use Case:** Suitable for non-critical events where minor overlaps are acceptable or require manual review.

### b. First-Come, First-Served (FCFS)
*   **Mechanism:** The event that was scheduled first (based on creation timestamp) takes precedence. The conflicting proposed event will be rejected or flagged for manual review.
*   **User Action:** The user will be informed that their proposed event conflicts with an existing one and cannot be scheduled as is. They will be prompted to reschedule.
*   **Use Case:** Simple and fair for general scheduling where no specific priorities are assigned.

### c. Priority-Based Resolution
*   **Mechanism:** Events can be assigned a priority level (e.g., High, Medium, Low). If a conflict occurs, the event with the higher priority takes precedence. The lower-priority event will be flagged for rescheduling or cancellation.
*   **User Action:** If the proposed event has higher priority, it will be scheduled, and the conflicting lower-priority event will be flagged. If the proposed event has lower priority, it will be rejected, and the user will be prompted to reschedule.
*   **Use Case:** Critical meetings, urgent tasks, or events involving high-level stakeholders.

### d. User Intervention / Manual Resolution
*   **Mechanism:** When a conflict is detected, the system will present a detailed view of all conflicting events to the user.
*   **User Action:** The user will be given options to:
    *   **Reschedule:** Modify the time of the proposed event or one of the conflicting events.
    *   **Cancel:** Cancel the proposed event or one of the conflicting events.
    *   **Ignore:** Proceed with the proposed event despite the conflict.
*   **Use Case:** Complex scenarios where automated resolution is not feasible or user discretion is required.

### e. Automated Rescheduling (Basic)
*   **Mechanism:** If a conflict is detected, the system will attempt to find the next available time slot for the proposed event that does not conflict with any existing events.
*   **User Action:** The user will be presented with the suggested alternative time slot and can choose to accept it or manually adjust.
*   **Use Case:** Simple events where flexibility in timing is possible.

## 3. API Endpoints for Conflict Management

*   `POST /api/events/propose`: Used to propose a new event or an update to an existing one. The backend will run conflict detection and return a response indicating conflicts (if any) and potential resolution options.
*   `POST /api/conflicts/resolve`: Used by the frontend to send the user's chosen resolution for a detected conflict.

## 4. Frontend Integration

The frontend will be responsible for:
*   Visually highlighting conflicting events.
*   Providing a user interface for selecting and applying conflict resolution strategies.
*   Communicating with the backend conflict management API endpoints.