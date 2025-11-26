# Live Site Error Analysis: Greenhouse Models

This document analyzes critical errors identified on the live version of the Greenhouse Models page and provides recommendations for resolving them.

## 1. Error: `Greenhouse: GreenhouseUtils not found`

**Full Error:** `Greenhouse: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded before greenhouse.js.`

### Cause

This error indicates a **script loading dependency violation**. The `greenhouse.js` script, which depends on utility functions defined in `GreenhouseUtils.js`, is being executed *before* `GreenhouseUtils.js` has been fully loaded and parsed by the browser. The browser processes `<script>` tags in the order they appear in the HTML, and if a script requires a dependency, that dependency must be loaded first.

### Recommendations

1.  **Verify Script Order:** The most direct solution is to ensure that the `<script>` tag for `GreenhouseUtils.js` is placed before the `<script>` tag for `greenhouse.js` in the `models.html` file.

    ```html
    <!-- Correct order -->
    <script src="js/GreenhouseUtils.js"></script>
    <script src="js/greenhouse.js"></script>
    ```

2.  **Use Asynchronous Loading with Callbacks:** For more complex scenarios with many scripts, consider implementing a script loader that uses callbacks or promises to enforce execution order. This prevents blocking the rendering of the page while scripts are being downloaded.

    ```javascript
    // Example of a simple script loader in GreenhouseUtils.js
    GreenhouseUtils.loadScript = function(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    };

    // Usage
    GreenhouseUtils.loadScript('js/greenhouse.js', function() {
        // Code to run after greenhouse.js is loaded
    });
    ```

## 2. Error: `Uncaught TypeError: can't access property "value", document.getElementById(...) is null`

**Full Error:**
`Uncaught TypeError: can't access property "value", document.getElementById(...) is null`
`    resetSimulation blob:https://www.greenhousementalhealth.org/...`
`    bindGeneralControls blob:https://www.greenhousementalhealth.org/...`
`    ...`

### Cause

This error occurs when a JavaScript function attempts to access a property (like `.value`) of an HTML element that it could not find in the Document Object Model (DOM). The `document.getElementById(...)` call returned `null`, indicating that at the moment the script was executed, no element with the specified ID was present in the DOM.

This is almost always a **timing issue**. The JavaScript code is running before the HTML document has been fully parsed and the corresponding DOM elements have been created. This is common when scripts are placed in the `<head>` of an HTML document without a mechanism to delay their execution.

### Recommendations

1.  **Move Scripts to the End of the `<body>`:** The simplest and most effective solution is to move all `<script>` tags from the `<head>` to just before the closing `</body>` tag. This ensures the entire DOM is parsed and ready before any scripts that manipulate it are executed.

    ```html
    <body>
      <!-- All page content -->
      ...
      <script src="js/GreenhouseUtils.js"></script>
      <script src="js/greenhouse.js"></script>
      <!-- Other scripts -->
    </body>
    </html>
    ```

2.  **Use the `DOMContentLoaded` Event Listener:** If moving scripts is not feasible, wrap the initialization code in an event listener that waits for the `DOMContentLoaded` event. This event fires once the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.

    ```javascript
    document.addEventListener('DOMContentLoaded', function() {
        // All your initialization code here, e.g., bindGeneralControls()
        bindGeneralControls();
        bindSimulationControls();
    });
    ```

## 3. Error: `Cross-Origin Request Blocked` (CORS)

**Full Error:** `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://drtamarojgreen.github.io/greenhouse_org/images/brain.svg. (Reason: CORS request did not succeed).`

Associated Error: `Error loading or parsing brain SVG: TypeError: NetworkError when attempting to fetch resource.`

### Cause

This error is a security measure enforced by web browsers called the **Same-Origin Policy**. It prevents a web page from making requests to a different domain (origin) than the one that served the page. In this case, the page at `greenhousementalhealth.org` is trying to fetch an SVG image from `drtamarojgreen.github.io`.

The browser blocks this request because the server at `drtamarojgreen.github.io` did not include the necessary **Cross-Origin Resource Sharing (CORS)** headers in its response. These headers are required to explicitly permit the cross-origin request.

### Recommendations

1.  **Host the Asset on the Same Origin (Best Practice):** The most secure and reliable solution is to host the `brain.svg` file on the same domain as the web page. Move the SVG file to the `greenhousementalhealth.org` server (e.g., in an `/images` directory) and update the URL in the code to point to this local resource. This completely avoids the cross-origin issue.

    ```javascript
    // Change from:
    const imageUrl = 'https://drtamarojgreen.github.io/greenhouse_org/images/brain.svg';

    // To:
    const imageUrl = '/images/brain.svg'; // Or the correct local path
    ```

2.  **Enable CORS on the Remote Server (If you control it):** If you have administrative control over the `drtamarojgreen.github.io` server (in this case, via GitHub Pages settings or server configuration), you can configure it to send the appropriate CORS headers. The server must respond with a header like this to allow requests from your domain:

    ```
    Access-Control-Allow-Origin: https://www.greenhousementalhealth.org
    ```

    For a public resource like an image, you could also use a wildcard, although this is less secure:

    ```
    Access-Control-Allow-Origin: *
    ```
    Given that this is a GitHub Pages site, configuring CORS might be complex or not possible, making the first recommendation (hosting the asset locally) far more practical.
