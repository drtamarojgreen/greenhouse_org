# Scheduler View Selection Analysis

This document details the investigation into why the scheduler application, in both its static JavaScript and Velo implementations, consistently defaults to the "patient" view, ignoring URL parameters or user selections.

## Root Cause Analysis

The root cause of the issue is a combination of a hardcoded default view and a "resilience" feature that misinterprets view switching as a DOM stability issue, leading to a reset.

### Static JavaScript Scheduler (`docs/js/scheduler.js`)

1.  **Hardcoded Default**: The `GreenhouseAppsScheduler.init` function contains the line `GreenhouseUtils.appState.currentView = 'patient';`, which explicitly sets the initial view to "patient" every time the scheduler is initialized, overriding any parameters passed from the loader (`greenhouse.js`).

2.  **Faulty Resilience Mechanism**:
    *   The `observeAndReinitializeApp` function sets up a `MutationObserver` to watch for changes in the scheduler's containers. This is intended to re-initialize the application if its UI elements are wiped from the DOM by external scripts.
    *   The `renderView` function, which is called when switching views (e.g., from "patient" to "dashboard"), starts by clearing the containers: `Object.values(containers).forEach(container => { if (container) container.innerHTML = ''; });`.
    *   This clearing action removes the top-level UI elements of the previous view (e.g., `#greenhouse-patient-app-calendar-container`).
    *   The `MutationObserver` detects this removal and incorrectly interprets it as a DOM conflict or content wipe.
    *   As seen in the logs (`Scheduler Resilience: Detected removal of a top-level UI element... Triggering rebuild.`), this triggers the `reinitializeScheduler` function.
    *   The re-initialization process starts from scratch, and due to the hardcoded default in the `init` function, it renders the "patient" view again.

This creates a loop where any attempt to switch away from the patient view is immediately undone by the resilience mechanism.

### Velo Implementation (`apps/frontend/schedule/Schedule.js`)

The Velo implementation exhibits a simpler, but equally effective, hardcoding of the default view.

1.  **Explicit View Management**: In the `initScheduler` function, the code explicitly manages the visibility of the different view containers:
    ```javascript
    const patientContainer = $w(schedulerState.uiElements.patientContainer);
    const dashboardContainer = $w(schedulerState.uiElements.dashboardContainer);
    const adminContainer = $w(schedulerState.uiElements.adminContainer);

    if (patientContainer.valid) patientContainer.expand();
    if (dashboardContainer.valid) dashboardContainer.collapse();
    if (adminContainer.valid) adminContainer.collapse();
    ```
    This ensures that, regardless of the previous state or URL parameters, the `patientContainer` is always made visible (`.expand()`) and the others are hidden (`.collapse()`) upon initialization.

## Conclusion

In both implementations, the default to the patient view is not an accident but a result of explicit logic in the initialization code. The static scheduler's issue is more complex due to the interaction with the `MutationObserver`, which creates a problematic feedback loop. The Velo scheduler's issue is a straightforward hardcoded initial state. To change this behavior, the initialization logic in both files would need to be modified to respect the incoming `view` parameter and the resilience logic in `scheduler.js` would need to be adjusted to differentiate between a deliberate view switch and an actual DOM wipe.
