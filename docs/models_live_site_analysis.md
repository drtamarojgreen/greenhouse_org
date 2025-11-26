# Analysis of Live Site Errors for the Models Page

This document breaks down the causes and recommended solutions for several JavaScript errors identified on the live version of the "Models" page at greenhousementalhealth.org.

---

## 1. `Greenhouse: GreenhouseUtils not found`

### Error Details

```
Greenhouse: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded before greenhouse.js.
```

### Cause

This is a script dependency and loading order issue. The main `greenhouse.js` script, which contains the core application logic, depends on utility functions defined in `GreenhouseUtils.js`. The error message indicates that `greenhouse.js` is being executed before `GreenhouseUtils.js` has been fully loaded and parsed by the browser. Consequently, when `greenhouse.js` attempts to call a function or access an object from `GreenhouseUtils`, it cannot find the definition and throws this error.

This is confirmed by the project's dependency loader, `docs/js/models.js`, which orchestrates the loading of all scripts for the models page. An incorrect sequence in this file is the direct cause.

### Recommendation

Ensure that `GreenhouseUtils.js` is loaded before any other script that depends on it.

1.  **Modify the Dependency Loader:** Open the `docs/js/models.js` file.
2.  **Verify Script Order:** Locate the `GreenhouseUtils.loadScript` calls.
3.  **Correct the Sequence:** Ensure that the line `GreenhouseUtils.loadScript('js/GreenhouseUtils.js', ...)` is placed before the lines that load other `greenhouse.js` scripts or any other scripts that rely on it. The correct order prevents execution race conditions.

---

## 2. `Uncaught TypeError: can't access property "value", document.getElementById(...) is null`

### Error Details

```
Uncaught TypeError: can't access property "value", document.getElementById(...) is null
    at resetSimulation (blob:...)
    at bindGeneralControls (blob:...)
    at bindSimulationControls (blob:...)
    at addConsentListeners (blob:...)
```

### Cause

This error occurs when a JavaScript function attempts to access a property (e.g., `.value`, `.innerHTML`) of an HTML element that does not exist in the Document Object Model (DOM) at the moment of execution. The `document.getElementById(...)` call returns `null`, and any attempt to access a property on `null` results in a `TypeError`.

The root cause is that the script is executing before the browser has finished parsing the full HTML document. The functions listed in the stack trace (`resetSimulation`, `bindGeneralControls`, etc.) are being called, but the elements they are trying to manipulate (e.g., `<input>`, `<button>`) have not been created yet.

### Recommendation

Defer script execution until after the DOM has been fully parsed and loaded.

1.  **Use `DOMContentLoaded` Event:** The most robust solution is to wrap the script's initialization logic within a `DOMContentLoaded` event listener. This guarantees that the code will only run after the entire DOM is ready.

    ```javascript
    document.addEventListener('DOMContentLoaded', (event) => {
        // All initialization code, including calls to bindSimulationControls()
        // and other functions that interact with the DOM, should be placed here.
    });
    ```

2.  **Check Script Placement:** As a secondary check, ensure that the `<script>` tags are placed just before the closing `</body>` tag in the HTML file. While modern approaches favor the `DOMContentLoaded` listener, this practice can also help mitigate the issue.

---

## 3. `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`

### Error Details

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://drtamarojgreen.github.io/greenhouse_org/images/brain.svg. (Reason: CORS request did not succeed).
```

### Cause

This error is a direct result of the browser's **Same-Origin Policy**, a critical security measure that prevents a web page from making requests to a different domain (origin) than the one that served the page.

In this case:
-   **Origin A:** `https://www.greenhousementalhealth.org` (where the web page is hosted)
-   **Origin B:** `https://drtamarojgreen.github.io` (where the `brain.svg` image is hosted)

The browser blocks the JavaScript running on Origin A from fetching the SVG from Origin B because the server at Origin B did not explicitly permit it by sending the correct **Cross-Origin Resource Sharing (CORS)** headers in its response (e.g., `Access-Control-Allow-Origin: https://www.greenhousementalhealth.org`). The `(Reason: CORS request did not succeed)` and `Status code: (null)` indicate the request was likely blocked by the browser before a successful network response was received, which is typical for CORS policy violations.

### Recommendation

The best practice is to eliminate the cross-origin request entirely.

1.  **Host the Asset Locally:** The most secure and reliable solution is to download the `brain.svg` file and host it on the same server as the main website.
    -   Place the `brain.svg` file within the project's own `images` directory (e.g., `docs/images/brain.svg`).
    -   Update the code that fetches the SVG to point to this local path (e.g., `/images/brain.svg`).

2.  **Avoid Cross-Origin Data Fetches for Static Assets:** By hosting all required assets on the same domain, you prevent CORS issues, improve loading performance (by reducing DNS lookups to external domains), and simplify dependency management. This is the standard and recommended approach for web development.
