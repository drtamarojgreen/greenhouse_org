# /tech/ Page Implementation Plan

## 1. Purpose of the /tech/ Page

The `/tech/` page (`https://greenhousementalhealth.org/tech/`) will serve as a dedicated, isolated environment for rigorously testing complex integrations with the Wix platform. This page is designed to function as a pre-production sandbox, enabling thorough validation of new features and integrations before their deployment to other live, public-facing pages. Its primary objectives are:

*   **Safe Experimentation:** To provide a secure space for developing and testing novel Velo-based functionalities and integrations without any risk of impacting the stability, performance, or user experience of existing production website components.
*   **Isolation and Debugging:** To offer a controlled environment specifically tailored for debugging and refining intricate interactions. This includes complex data flows between frontend Velo code, custom backend Velo functions, and various external services, allowing for precise identification and resolution of issues.
*   **Accelerated Iteration:** To facilitate a significantly faster development cycle for new features. By having a dedicated, self-contained testing ground, developers can rapidly iterate on designs, logic, and integrations, reducing the time from concept to validated implementation.
*   **Stakeholder Demonstration:** To enable clear and effective demonstrations of new functionalities to project stakeholders. This allows for early feedback and ensures alignment with requirements in a live, yet fully isolated, Wix environment.
*   **Adherence to Standards:** To ensure that all new integrations meet the project's stringent standards for functionality, performance, security, and cross-browser compatibility before wider release.

## 2. Integration Strategy: Hybrid Approach

To achieve a flexible and powerful testing environment, the `/tech/` page will employ a **hybrid integration strategy**. This approach combines the strengths of the **Wix Velo-native environment** with the versatility of **externally injected JavaScript applications**, managed by the project's central loader script (`greenhouse.js`).

This dual strategy provides significant advantages:

*   **Comprehensive Testing Capabilities:** By using both Velo and external scripts, we can test a wider range of integrations. Velo is ideal for interacting with Wix-specific elements and backend functions, while external scripts are better suited for complex DOM manipulation, leveraging third-party libraries, or implementing functionalities not easily achievable within the Velo sandbox.
*   **Architectural Consistency:** The Velo-native components will follow the established patterns used by other complex applications like the scheduler (`apps/frontend/schedule/Schedule.js`). The external script injection will leverage the existing `greenhouse.js` loader, ensuring that the new page integrates seamlessly into the project's established asset loading pipeline.
*   **Clear Separation of Concerns:** Velo code (`Tech.js`) will be responsible for page-level logic, event handling on Wix elements, and communication with the Velo backend. The injected script (`tech.js`) will handle fine-grained DOM manipulation within specific containers and execute test-specific logic that requires direct browser API access.

## 3. Implementation Details

The implementation is divided into two primary components: the Velo-native code running within the Wix editor and the external JavaScript/CSS assets injected by the central loader.

### 3.1. Frontend Velo Code (`apps/frontend/tech/Tech.js`)

A new Velo JavaScript file will be created to encapsulate the frontend logic specific to the `/tech/` testing page. This file will adhere to established project naming conventions, mirroring patterns seen in `Books.js`, `News.js`, etc.

*   **File Path:** `/home/tamarojgreen/development/LLM/greenhouse_org/apps/frontend/tech/Tech.js`
*   **Core Structure and Conventions:** The file will be structured as a standard Velo module, utilizing the `$w.onReady` function to ensure all page elements are loaded before any code execution. It will be responsible for managing the state of the `/tech/` page and interacting with Wix-specific APIs.

    ```javascript
    // apps/frontend/tech/Tech.js

    /**
     * @file Tech.js
     * @description Velo frontend code for the /tech/ testing and integration page.
     * This script handles interactions with Wix elements and coordinates with injected
     * external scripts for advanced testing scenarios.
     */

    $w.onReady(function () {
        console.log("Velo code for /tech/ page is ready.");

        // --- Placeholder for Velo-based UI element event listeners ---
        // Example: $w('#testButton').onClick(() => { ... });

        // --- Placeholder for logic to communicate with backend Velo functions ---

        // --- Placeholder for logic to interact with the externally injected tech.js script ---
    });
    ```

*   **UI Interaction:** All interactions with native Wix UI elements will be managed exclusively through the `$w` API. Elements will be assigned unique, semantically meaningful IDs in the Wix editor, which will be referenced in this script.

### 3.2. Backend Velo Functions (`apps/wv/backend/*.web.js`)

Should the complex integrations require server-side processing, new Velo backend functions will be developed. These functions are essential for tasks such as securely interacting with external APIs (especially those requiring API keys or secrets), performing complex data transformations, or implementing secure data access logic.

*   **File Path:** New `.web.js` files will be created within the `/home/tamarojgreen/development/LLM/greenhouse_org/apps/wv/backend/` directory. The naming of these files will be descriptive of their function (e.g., `testExternalAPI.web.js`, `processTestData.web.js`).
*   **Core Structure and Exposure:** These backend files will expose their functionalities using the `export function functionName()` or `export const functionName = webMethod(...)` syntax, making them callable from the frontend Velo code.
*   **Security Mandates:** All backend functions will strictly adhere to the project's security guidelines, as detailed in `docs/scheduler_permissions_backend.md` and `docs/scheduler_security_implementation.md`. This includes rigorous input validation, proper authentication, and robust role-based access control (RBAC) for any sensitive operations, ensuring that data and functionality are protected.
*   **Error Handling:** Each backend function will incorporate comprehensive `try...catch` blocks to gracefully handle potential errors. Meaningful and informative error messages will be returned to the frontend, aiding in debugging and providing clear feedback during testing.

### 3.3. External Script Injection

The central loader, `greenhouse.js`, will be updated to recognize the `/tech/` page and inject the necessary JavaScript and CSS files. This allows for advanced DOM manipulation and styling that is managed outside of the Wix Velo environment.

#### 3.3.1. Central Loader Modifications (`docs/js/greenhouse.js`)

The `greenhouse.js` script will be modified to support the new page.

*   **Configuration Updates:**
    1.  A new path constant, `techPagePath: '/tech/'`, will be added to the `config` object.
    2.  A new selector, `tech: '#SOME_WIX_CONTAINER_ID'`, will be added to the `config.selectors` object. **Note:** The user will need to provide the actual ID of a container element on the `/tech/` page for this selector to function correctly.

*   **New Loader Function:** A new asynchronous function, `loadTechApplication`, will be created. This function will be modeled on existing loaders like `loadBooksApplication` and will be responsible for calling the `loadApplication` utility.

*   **Initialization Logic:** The main `initialize` function will be updated with a new `else if` condition to check for `techPagePath` in the URL and call `loadTechApplication` when it matches.

#### 3.3.2. Page-Specific Script (`docs/js/tech.js`)

This file will contain the client-side JavaScript for the `/tech/` page's testing functionalities.

*   **File Path:** `docs/js/tech.js`
*   **Purpose:** To execute test logic, manipulate the DOM within its designated container, and interact with non-Wix browser APIs.
*   **Initial Structure:** The script will be initialized with a standard IIFE (Immediately Invoked Function Expression) to prevent global namespace pollution and will include logic to verify its successful execution.

    ```javascript
    // docs/js/tech.js

    (function() {
        /**
         * @file tech.js
         * @description Client-side script for the /tech/ integration page.
         * This script is loaded by greenhouse.js and handles advanced test logic.
         */
        console.log("tech.js: Script loaded successfully.");

        const GreenhouseUtils = window.GreenhouseUtils;
        if (!GreenhouseUtils) {
            console.error('tech.js: GreenhouseUtils not found.');
            return;
        }

        const scriptTag = document.currentScript;
        const targetSelector = scriptTag.getAttribute('target-selector-left');

        if (!targetSelector) {
            console.error('tech.js: Target selector not found. The application cannot be initialized.');
            return;
        }

        console.log(`tech.js: Initializing application in target selector: ${targetSelector}`);

        // --- Placeholder for test implementation logic ---
        // This is where code to set up test scenarios, add UI elements dynamically,
        // and report results will be implemented.
    })();
    ```

#### 3.3.3. Page-Specific Stylesheet (`docs/css/tech.css`)

This file will provide custom styles for the elements and components on the `/tech/` page.

*   **File Path:** `docs/css/tech.css`
*   **Purpose:** To ensure a consistent and clear visual presentation for test elements, which may be dynamically generated or require styling that is distinct from the main site theme.
*   **Initial Structure:** The stylesheet will be initialized with a rule to define the primary test container.

    ```css
    /* docs/css/tech.css */

    /**
     * Styles for the /tech/ integration testing page.
     */

    .tech-container {
        border: 2px dashed #00bfff; /* Deep sky blue */
        padding: 20px;
        background-color: #f0f8ff; /* Alice blue */
        min-height: 300px;
        font-family: 'Courier New', Courier, monospace;
    }

    .tech-log {
        font-size: 14px;
        color: #333;
    }
    ```

## 4. User Actions (Outside of Gemini's Control)

The following critical steps must be performed manually by the user within the Wix editor to set up and utilize the `/tech/` page:

1.  **Create the `/tech/` Page:** A new page must be created within the Wix editor. Its URL path should be explicitly set to `/tech` to match the intended access route.
2.  **Add UI Elements:** Essential UI elements (e.g., buttons, text fields, display areas) must be added to the newly created `/tech/` page. Each of these elements *must* be assigned a unique, semantically descriptive ID (e.g., `testButton`, `testOutputText`, `integrationInput`) that directly corresponds to the selectors used in the `Tech.js` frontend Velo code.
3.  **Copy Frontend Velo Code:** The entire content of the generated `Tech.js` file (located at `/home/tamarojgreen/development/LLM/greenhouse_org/apps/frontend/tech/Tech.js`) must be copied and pasted into the "Page Code" section of the `/tech/` page within the Wix editor.
4.  **Deploy Backend Velo Functions (if applicable):** If any new backend `.web.js` files are created to support the integrations, these files must be deployed to the Wix Velo backend environment.
5.  **Publish Site:** After all changes are made and verified in the Wix editor, the site must be published to make the `/tech/` page and its associated functionalities live and accessible for testing.

## 5. Planned Enhancements for the /tech/ Page

The `/tech/` page is envisioned as a dynamic and highly adaptable testing platform. Future enhancements will focus on increasing its utility, automation capabilities, and diagnostic features:

1.  **Dynamic Test Case Loading:** Implement a robust mechanism that allows for the dynamic loading of various test scenarios or integration configurations. These configurations could be sourced from a Wix Data Collection, an external JSON file, or even defined via URL parameters. This flexibility will enable testers to execute diverse integration tests without requiring direct code modifications.
2.  **Real-time Feedback Dashboard:** Develop a compact, interactive dashboard directly on the `/tech/` page. This dashboard will provide real-time feedback on the execution of integration tests, displaying critical metrics such as success/failure status, response times for API calls, and detailed logs of test steps and outcomes.
3.  **User Role Simulation:** Introduce intuitive UI controls that allow for the simulation of different user roles (e.g., "Administrator," "Patient," "Guest"). This feature will enable comprehensive testing of permission-based integrations and access control logic directly within the page, ensuring that only authorized users can access specific functionalities.
4.  **Automated Test Triggering:** Explore and implement options for programmatically triggering integration tests on the `/tech/` page. This could involve setting up webhooks, scheduled jobs, or API endpoints that initiate test sequences, thereby enabling automated regression testing and continuous integration.
5.  **Visual Regression Testing Integration:** Integrate the `/tech/` page with a visual regression testing tool (e.g., Playwright with image comparison capabilities). This will allow for the automatic detection of any unintended visual changes or UI discrepancies introduced by new integrations, ensuring a consistent user experience.
6.  **Performance Monitoring:** Implement advanced client-side performance monitoring using browser APIs (e.g., `PerformanceObserver`). This will track the impact of new integrations on key performance indicators such as page load times, script execution durations, and overall responsiveness, providing crucial data for optimization.
7.  **Enhanced Error Logging and Reporting:** Develop a sophisticated error handling and reporting mechanism. This will involve logging detailed error information (including stack traces, context, and user actions) to a centralized logging service (e.g., Google Cloud Logging, Sentry). This will significantly streamline the debugging process and improve the overall reliability of the testing environment.