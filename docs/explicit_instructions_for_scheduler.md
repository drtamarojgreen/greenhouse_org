# Explicit Instructions for Scheduler Application Development


###########################################################################

# Explicit Instructions for Scheduler Application Development

This document outlines the strict architectural and implementation guidelines for the Greenhouse scheduler application, based on direct feedback.

## Core Workflow

The application must adhere to the following workflow:
`scheduler -> schedulerUI -> admin, patient, dashboard apps`

## Role of `schedulerUI.js`

*   `schedulerUI.js` is solely responsible for creating *all* UI elements and attaching them to the DOM. This is its explicit and only purpose regarding UI construction.
*   No initial rendering logic is outside of `schedulerUI.js`.

*   **`schedulerUI.js` will render the UI elements (create them and attach them to the DOM), assigning them appropriate IDs.**
*   **`schedulerUI.js` will also add `data-identifier` attributes to each element that is intended to be populated by the other apps.**

*   Rendering logic that currently resides in other apps will be moved to SchedulerUI making the most use of GreenhouseUtils.

*   The elements will be created with `document.createElement` and then added to their respective `leftPanel` and `rightPanel`. Based on the permissions access from the data fetch certain elements will be hidden.

*   `document.getElementById` will be used to identify the left and right panels and will be based off of an `onReady` listener.

## DOM Element Access

*   `scheduler.js` will be responsible for finding the initial Wix-provided target elements and passing them to `schedulerUI.js` for initial UI attachment.

*   **Other JavaScript files (e.g., `GreenhouseDashboardApp.js`) will fetch data and then add this data to the rendered elements by using `document.getElementById` to locate them.**

## Utility Functions

*   **The `appState`, `validateConfiguration`, and `loadScript` functions (and their related `config` properties if necessary) will be moved from `scheduler.js` to `GreenhouseUtils.js`.**
*   The `waitForElement` function should be centralized in `GreenhouseUtils.js`. (Note: While this is a general principle, for `scheduler.js` specifically, `waitForElement` is to be kept for now as per current instructions).

## Task Scope

*   Focus exclusively on resolving the loading and rendering issues (calendar appearing/disappearing, "Target element not found" errors).
*   Halt all work before attempting any solution for the URL trailing slash issue (Phase 3).

## Final File Structure and Responsibilities (According to Standards)

### `greenhouse.js`
*   **Responsibility**: Main application loader.
*   Loads `GreenhouseUtils.js` (ensuring `waitForElement` is available globally).
*   Loads `schedulerUI.js`.
*   Loads `scheduler.js`.
*   Identifies the current page and calls the appropriate `load*Application` function.
*   Uses `GreenhouseUtils.waitForElement` to find initial Wix-provided target columns.

### `scheduler.js`
*   **Responsibility**: Orchestrates the scheduler application.
*   Receives target selectors/elements from `greenhouse.js`.
*   Uses `GreenhouseUtils.waitForElement` (or its local `waitForElement` for now) to ensure top-level Wix-provided target elements are stable.
*   **Calls `schedulerUI.js` functions to create and attach the entire scheduler UI** (including main containers and all inner elements with IDs) into the provided target elements.
*   Waits for the rendering of `schedulerUI` to complete.
*   `scheduler.js` calls the `init` method of `GreenhouseDashboardApp.js` (or `GreenhousePatientApp.js`, `GreenhouseAdminApp.js`), passing it references to the *main application containers* (e.g., `leftAppContainer`, `rightAppContainer`) that were created by `schedulerUI.js`.
*   **Will use `GreenhouseUtils.appState`, `GreenhouseUtils.validateConfiguration`, and `GreenhouseUtils.loadScript` for its internal operations.**

### `schedulerUI.js`
*   **Responsibility**: **All UI creation, attachment, and update logic.**
*   Contains functions like `buildDashboardLeftPanelUI(targetElement)` and `buildDashboardRightPanelUI(targetElement)` that:
    *   Accept a `targetElement` (e.g., `leftAppContainer`, `rightAppContainer` from `scheduler.js`).
    *   Create *all* necessary inner UI elements (e.g., `scheduleContainer`, `conflictResolutionDiv`, `calendarContainer`, tables, buttons, etc.).
    *   **Assign appropriate IDs to these created elements.**
    *   **Add `data-identifier` attributes to each element that is intended to be populated by the other apps.**
    *   *Append these created elements directly to the `targetElement`*.
    *   Return references to these newly created inner elements (e.g., `scheduleContainer`, `ulConflictList`, `calendarContainer`) so `scheduler.js` can pass them to the app-specific logic.
*   **Does NOT contain `renderCalendar`, `renderWeekly`, `renderConflicts` functions for data population.** These functions will reside in the app-specific scripts.

### `GreenhouseDashboardApp.js` (and other app-specific scripts)
*   **Responsibility**: Application-specific logic (data fetching, event handling, business logic) and **all data population/update logic for its UI elements.**
*   Its `init` method will accept direct references to the *main application containers* (e.g., `leftAppContainer`, `rightAppContainer`) from `scheduler.js`.
*   Stores these references locally.
*   Performs data fetching.
*   **Will have its own `populateCalendar(year, month)`, `populateWeekly(appointments, serviceTypes)`, and `populateConflicts(conflicts)` functions.**
*   **These `populate*` functions will use `document.getElementById` (or `document.querySelector` with `data-identifier` attributes) to find the specific UI elements (e.g., `greenhouse-dashboard-app-schedule-container`) that were created by `schedulerUI.js` and directly update their content with fetched data.**
*   **Will NOT call `schedulerUI.js` for data population or updates after the initial UI build.**

### FINAL RESOLUTION ###
This section discusses the broader implications and challenges arising from accessing a Google Model (like Gemini) through an Anthropic Extension (like the one powering this interaction) designed for Microsoft's Visual Studio Code environment. It aims to identify specific points in the workflow where these architectural layers introduce friction or opportunities for mediation.

### Architectural Layers:

1.  **Google Model (Gemini):** The core AI capability, providing natural language understanding, generation, and other cognitive functions.
2.  **Anthropic Extension:** An intermediary layer, likely a VS Code extension, that facilitates communication with the underlying LLM. This extension acts as a client to the Google Model's API.
3.  **Visual Studio Code Environment:** The IDE itself, providing the user interface, editor, and extension host.
4.  **User's Operating System (Windows 11):** The underlying platform on which VS Code and its extensions run.

### Friction Points and Challenges:

1.  **API Compatibility and Abstraction:**
    *   **Friction:** The Anthropic Extension must translate VS Code's requests and user input into a format compatible with the Google Model's API. This involves mapping data structures, handling authentication, and managing API rate limits. Any mismatch or incomplete abstraction can lead to errors or unexpected behavior.
    *   **Mediation:** The extension needs robust API client libraries and a well-defined abstraction layer that can gracefully handle differences between the Anthropic extension's internal model and the Google Model's API. This includes error handling, retry mechanisms, and clear documentation for developers.

2.  **Performance and Latency:**
    *   **Friction:** Each layer introduces overhead. Requests from VS Code go through the extension, then to the Google Model's API (potentially over the network), and the response travels back through the same path. This multi-hop communication can lead to noticeable latency, especially for complex queries or real-time interactions.
    *   **Mediation:**
        *   **Caching:** The extension could implement caching for frequently requested or stable responses.
        *   **Asynchronous Operations:** Ensuring all communication is asynchronous to prevent UI blocking.
        *   **Optimized Network Calls:** Minimizing payload size and using efficient protocols.
        *   **Streaming:** For long-form generation, streaming responses back to the user as they are generated can improve perceived performance.

3.  **Security and Data Privacy:**
    *   **Friction:** Data (code, prompts, user input) flows through multiple vendors (Microsoft, Anthropic, Google). Ensuring data privacy, compliance with regulations (e.g., GDPR, HIPAA), and secure transmission across these boundaries is critical. Each layer represents a potential point of vulnerability.
    *   **Mediation:**
        *   **End-to-End Encryption:** Secure communication channels between all components.
        *   **Data Minimization:** Only sending necessary data to the LLM.
        *   **Clear Data Policies:** Transparent policies from all vendors regarding data handling, storage, and usage.
        *   **Access Control:** Robust authentication and authorization mechanisms at each API boundary.

4.  **User Experience and Consistency:**
    *   **Friction:** The user interacts with the Anthropic Extension, but the underlying intelligence is from Google. Discrepancies in model behavior, output format, or feature sets between what the extension *expects* and what the Google Model *provides* can lead to a confusing or inconsistent user experience.
    *   **Mediation:**
        *   **Standardized Output:** The extension should normalize the Google Model's output to present a consistent interface to the user.
        *   **Feature Alignment:** The extension's features should be designed to align with the capabilities of the Google Model, with clear communication to the user about any limitations.
        *   **Feedback Mechanisms:** Allowing users to report issues or provide feedback on model performance.

5.  **Configuration and Management:**
    *   **Friction:** Managing API keys, model versions, and specific parameters for the Google Model through an Anthropic Extension can be complex. Users might need to configure settings in multiple places or deal with conflicting configurations.
    *   **Mediation:**
        *   **Centralized Configuration:** The extension should provide a unified interface for configuring all LLM-related settings.
        *   **Sensible Defaults:** Pre-configured settings that work well out-of-the-box.
        *   **Version Management:** Clear mechanisms for specifying and updating the underlying Google Model version.

6.  **Error Handling and Debugging:**
    *   **Friction:** When an error occurs, it could originate from any layer: the VS Code environment, the Anthropic Extension's logic, the network, or the Google Model's API. Pinpointing the source of the error and providing actionable feedback to the user or developer can be challenging.
    *   **Mediation:**
        *   **Detailed Logging:** Comprehensive logging at each layer to trace requests and responses.
        *   **Standardized Error Codes:** Consistent error codes and messages across the Google Model API and the Anthropic Extension.
        *   **Debugging Tools:** The extension could offer debugging features to inspect the data flow and API calls.

7.  **Cost Management:**
    *   **Friction:** Using a powerful LLM like Gemini incurs costs. Without proper mediation, an extension could inadvertently lead to high API usage and unexpected billing for the user.
    *   **Mediation:**
        *   **Usage Monitoring:** The extension could provide tools for users to monitor their API usage.
        *   **Cost Controls:** Options to set usage limits or receive warnings when approaching thresholds.
        *   **Optimized Prompts:** Guiding users to formulate efficient prompts to minimize token usage.

In summary, while accessing a powerful LLM like Gemini through an Anthropic Extension in VS Code offers significant benefits, careful consideration and robust mediation are required at each architectural layer to ensure a performant, secure, and user-friendly experience. The extension plays a crucial role in abstracting away the complexities and potential friction points of this cross-platform integration.
