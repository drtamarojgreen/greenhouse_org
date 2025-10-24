# Scheduler Application Design Plan (As-Built)

**Status: This document reflects the current, implemented design of the scheduler and supersedes any previous plans, especially those referring to a React-based implementation.**

## 1. Project Goal

To create a functional appointment scheduler within the Greenhouse for Mental Health's Wix site, allowing patients to request appointments and administrators to manage schedules and conflicts.

## 2. Implemented Features

The current application is built on Wix's Velo platform and includes a parallel static JavaScript implementation. It provides the following core features:

*   **Three-View System:** A single-page application with distinct views for Patients, Administrators (Dashboard), and detailed Admin editing.
*   **Patient Appointment Requests:** A form for patients to submit requests for new appointments.
*   **Patient Appointment Management:** Patients can view, edit, and delete their existing appointments.
*   **Backend Conflict Detection:** A backend Velo function (`proposeAppointment`) checks for scheduling conflicts before an appointment is created.
*   **Admin Dashboard:** A view for administrators to see a weekly schedule and a list of outstanding conflicts.

## 3. Technical Stack (As-Built)

*   **Frontend (Primary):** Velo, which is a Wix-specific framework using JavaScript, page elements, and backend communication. The main logic is in `apps/frontend/schedule/Schedule.js`.
*   **Frontend (Static):** A parallel implementation using vanilla JavaScript, intended to be embedded in any HTML page. The core files are `docs/js/scheduler.js`, `docs/js/schedulerUI.js`, and the `*App.js` modules.
*   **Backend:** Velo Web Modules (in `apps/wv/backend/`), which are Node.js-like functions that provide the application's API.
*   **Database:** Wix Data Collections, which are a proprietary NoSQL-like database integrated into the Wix platform.

## 4. High-Level Architecture

The system is designed as a client-server application running entirely within the Wix ecosystem.

-   The **frontend** (either the Velo page or the static JS) is responsible for building the UI and capturing user input.
-   The **backend** Velo functions are responsible for all business logic, including data validation, conflict checking, and all interactions with the database.
-   The frontend communicates with the backend via asynchronous `fetch` calls to the `/_functions/` endpoints.

This architecture ensures that all sensitive logic and data access are secured on the server side.
