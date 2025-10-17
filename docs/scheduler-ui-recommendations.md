# Scheduler UI Recommendations

This document outlines the recommended changes to the static scheduler UI to remove the "Fetch and Populate Schedule Data" button.

## 1. Summary of Changes

To remove the button, two files need to be modified:
-   `docs/js/schedulerUI.js`: To remove the button's HTML element creation.
-   `docs/js/GreenhouseDashboardApp.js`: To remove the event listener that gives the button its functionality.

## 2. File: `docs/js/schedulerUI.js`

This file is responsible for building the UI components. The code that creates the button should be removed.

**Action:** Delete the following code block from the `buildDashboardLeftPanelUI` function.

```javascript
if (view === 'superadmin') {
    // Button to fetch and populate data
    const fetchButton = document.createElement('button');
    fetchButton.id = 'greenhouse-fetch-schedule-data-btn';
    fetchButton.className = 'greenhouse-btn greenhouse-btn-primary';
    fetchButton.textContent = 'Fetch and Populate Schedule Data';
    fetchButton.setAttribute('data-identifier', 'fetch-schedule-data-btn');
    targetElement.appendChild(fetchButton);
}
```

## 3. File: `docs/js/GreenhouseDashboardApp.js`

This file handles the application logic for the dashboard. The code that attaches the click event listener to the button should be removed.

**Action:** Delete the following code block from the `init` function.

```javascript
// --- Manual Data Fetching Setup ---
// For development, data fetching is triggered manually. This ensures all UI elements
// are rendered and visible before any data is loaded, per user requirements.
const fetchButton = leftAppContainer.querySelector('[data-identifier="fetch-schedule-data-btn"]');
if (fetchButton) {
    fetchButton.addEventListener('click', triggerDataFetchAndPopulation);
} else {
    console.warn('GreenhouseDashboardApp: Fetch schedule data button not found.');
}
```
