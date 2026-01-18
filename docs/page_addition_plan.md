# Plan for Adding New Pages to the Greenhouse Mental Health Wix Platform

This document outlines the current architecture of the Greenhouse Mental Health Wix platform and provides a step-by-step guide for adding new pages with custom functionality.

## 1. Current Architecture Overview

The platform utilizes a hybrid architecture that combines the Wix website builder with custom JavaScript applications hosted on GitHub Pages. This approach allows for the rapid development of custom, interactive features that are not natively available in Wix.

### Key Components:

*   **Wix Website:** The primary website (`https://greenhousemd.org`) is built and hosted on Wix. It serves as the main entry point for users and provides the overall page structure and design.
*   **GitHub Pages:** Custom JavaScript and CSS assets are hosted on a separate GitHub Pages site. This allows for version control and a more flexible development workflow.
*   **Loader Script (`greenhouse.js`):** A single loader script is included on all pages of the Wix site. This script is responsible for determining the current page and loading the appropriate application assets.
*   **Application Core (`scheduler.js`):** This is the main script for the scheduling application. It is responsible for loading the correct view and injecting it into the Wix DOM.
*   **View Scripts (`dashboard.js`, `admin.js`, etc.):** These scripts are responsible for building the UI for specific views within an application.
*   **Wix Velo Backend:** The Velo backend provides data and services to the custom applications via HTTP functions. This allows for secure access to the website's database and other backend services.

### How it Works:

1.  A user navigates to a page on the Wix website.
2.  The `greenhouse.js` loader script is executed.
3.  The loader script checks the URL to determine which application to load.
4.  The appropriate application core script (e.g., `scheduler.js`) is dynamically loaded.
5.  The application core script then loads the necessary view scripts and CSS files.
6.  The view script builds the UI as an HTML string.
7.  The application core script injects the UI into a specific element in the Wix DOM.
8.  The application then communicates with the Velo backend to fetch data and perform actions.

## 2. Guide to Adding a New Page

The following is a step-by-step guide for adding a new page with custom functionality to the Wix platform.

### Step 1: Create the New Page in Wix

1.  In the Wix editor, create a new page.
2.  Give the page a descriptive name and a user-friendly URL.
3.  Add a container element to the page where you want the custom application to be injected. This can be a simple `div` or a more complex layout element.
4.  Give the container element a unique ID so that it can be targeted by the application's JavaScript.

### Step 2: Create the Necessary JavaScript and CSS Files

1.  In the `docs/js` directory, create a new JavaScript file for your application. This will be the main entry point for your new page's functionality.
2.  In the `docs/css` directory, create a new CSS file for your application. This file will contain all of the styles for your new page.

### Step 3: Update the Loader Script (`greenhouse.js`)

1.  Open the `docs/js/greenhouse.js` file.
2.  Add a new `else if` condition to the main logic block to check for the URL of your new page.
3.  Inside the new `else if` block, add the code to dynamically load your new application's JavaScript file. You can use the existing code for the scheduling application as a template.

### Step 4: Create a New View Script

1.  In the `docs/js` directory, create a new view script for your application. This script will be responsible for building the UI for your new page.
2.  The view script should expose a single function that returns the UI as an HTML string.
3.  You can use the existing view scripts (`dashboard.js`, `admin.js`) as a template.

### Step 5: Create New Backend Functions (if needed)

1.  If your new page needs to interact with the backend, you will need to create new Velo backend functions.
2.  In the `apps/wv/backend/` directory, create a new `.web.js` file for your new backend functions.
3.  Define your functions using the `export` keyword.
4.  You can then call these functions from your application's JavaScript using the `import` syntax.

