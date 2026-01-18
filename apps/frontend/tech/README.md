# Tech Page

This directory contains the frontend code for the **Tech** page.

---

## How it works

The `Tech.js` file provides initial configuration data to the client-side application via a hidden text element.

### Key Features:

-   **Initial Data Population**: Injects a JSON object containing source information and a timestamp into the page.
-   **Data Bridge**: Uses the `#dataTextElement` to pass configuration data to `docs/js/tech.js`.

### Velo Elements Used:

-   `$w("#dataTextElement")`: A text element used to hold the initial JSON data for the client-side script.
