# Appointment Scheduler Application (Prototype)

This directory contains a prototype for a standalone appointment scheduler application. It is intended to provide a unified calendar view and allow users to schedule appointments.

**IMPORTANT:** This is a non-functional prototype for demonstration purposes. The backend uses a temporary, in-memory data store, meaning all created events will be lost when the server restarts.

## 1. Application Overview

-   **Backend:** A simple, native Node.js server that provides a REST API for managing events. It does not have any external dependencies.
-   **Frontend:** A basic vanilla JavaScript, HTML, and CSS single-page application that consumes the backend API.

## 2. Setup and Execution

To run this application, you only need to have Node.js installed.

### Start the Server

From within this directory (`apps/frontend/schedule`), run the following command to start the local development server:

```bash
npm start
```

The server will start on `http://localhost:3000`. You can access the application by opening this URL in your web browser.

## 3. Integration with Wix

This application is designed to be run on a separate hosting provider and integrated into the main Wix website (`greenhousementalhealth.org`).

The recommended integration method is to embed the hosted application into a Wix page using an **HTML iframe**.

### Example Iframe Code:

```html
<!-- Add an HTML Embed element on your Wix page and use similar code -->
<iframe
  src="https://your-hosted-scheduler-app-url.com"
  width="100%"
  height="800px"
  style="border:none;"
  title="Appointment Scheduler">
</iframe>
```

You will need to replace `https://your-hosted-scheduler-app-url.com` with the actual URL where this application is deployed.
