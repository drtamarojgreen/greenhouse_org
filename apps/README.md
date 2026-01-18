# Greenhouse Mental Health Applications

This directory contains applications and services designed to be integrated with the main Greenhouse for Mental Health website (`greenhousemd.org`), which is built on the Wix platform.

There are two main types of applications in this repository:

## 1. Velo Backend Services (`wv/`)

The `apps/wv/` directory contains backend HTTP functions (.web.js files) for Wix Velo. These services provide functionality for features like FAQs, guides, quizzes, and more.

These services are not standalone applications. Their code must be manually added to the **Backend** section of your Wix site editor.

For detailed instructions on how to perform this integration, please see the comprehensive guide:
-   [**Website Integration Guide**](../docs/website_integration.md)

> **Note:** The public-facing documentation for these endpoints, which was intended to be hosted at `https://github.io/drtamarojgreen/endpoints`, is not currently active. Please refer to the Velo code and the integration guide for now.

## 2. Appointment Scheduler (`frontend/schedule/`)

The `apps/frontend/schedule/` directory contains a **prototype** of a standalone appointment scheduling application.

This application must be hosted on its own server and can then be embedded into the Wix website using an iframe.

For detailed information on the application's status, setup, and integration, please see its local `README.md` file:
-   [**Scheduler Application README**](./frontend/schedule/README.md)
