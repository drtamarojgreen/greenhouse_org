window.GreenhouseUtils = (function () {
    /**
     * @description Configuration for shared utilities and application state.
     */
    const config = {
        /**
         * Timeout for waiting for elements and resources (in milliseconds)
         */
        loadTimeout: 15000,
        /**
         * Retry configuration for failed operations
         */
        retries: {
            maxAttempts: 3,
            delay: 1000
        },
        /**
         * DOM manipulation settings
         */
        dom: {
            insertionDelay: 2000,  // Delay before inserting into DOM (for Wix compatibility)
            observerTimeout: 10000
        }
    };

    /**
     * Application state management
     */
    const appState = {
        isInitialized: false,
        isLoading: false,
        currentView: null,
        currentAppInstance: null,
        targetElementLeft: null,
        targetElementRight: null,
        baseUrl: null,
        targetSelectorLeft: null,
        targetSelectorRight: null,
        loadedScripts: new Set(),
        errors: []
    };

    /**
     * @description The script element that is currently being executed.
     * This is used to retrieve configuration attributes from the loader script.
     * @type {HTMLScriptElement}
     */
    const currentExecutingScriptElement = document.currentScript;

    /**
     * @function displayMessage
     * @description Display a non-blocking notification
     * @param {string} message - The message text
     * @param {'error'|'success'|'info'} type - Message type
     * @param {number} duration - How long to show message (ms)
     */
    function displayMessage(message, type = 'error', duration = 5000) {
        console.debug(`[GreenhouseUtils] Showing ${type} message: "${message}"`);

        // Create container
        const notif = document.createElement('div');
        notif.className = `greenhouse-notification greenhouse-notification-${type}`;

        // Message span
        const messageSpan = document.createElement('span');
        messageSpan.className = 'greenhouse-notification-message';
        messageSpan.textContent = message;
        notif.appendChild(messageSpan);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'greenhouse-notification-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => removeNotification(notif);
        notif.appendChild(closeBtn);

        document.body.appendChild(notif);

        // Auto-remove after duration
        setTimeout(() => removeNotification(notif), duration);
    }

    /** Animate and remove notification */
    function removeNotification(notif) {
        notif.style.animation = 'slideOutRight 0.3s ease forwards';
        notif.addEventListener('animationend', () => notif.remove());
    }

    /**
     * @function waitForElement
     * @description Waits for an element to appear in the DOM, with fallback options.
     * @param {string|string[]} selectors - Primary selector or array of selectors to try.
     * @param {number} [timeout=15000] - Maximum time to wait in milliseconds.
     * @returns {Promise<Element>} Promise that resolves with the found element.
     */
    function waitForElement(selectors, timeout = config.loadTimeout) { // Use config.loadTimeout
        return new Promise((resolve, reject) => {
            const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

            // Check if element already exists
            for (const selector of selectorArray) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`GreenhouseUtils: Found element with selector: ${selector}`);
                    return resolve(element);
                }
            }

            console.log(`GreenhouseUtils: Waiting for element with selectors: ${selectorArray.join(', ')}`);

            const observer = new MutationObserver(() => {
                for (const selector of selectorArray) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`GreenhouseUtils: Element found with selector: ${selector}`);
                        observer.disconnect();
                        return resolve(element);
                    }
                }
            });

            // Observe changes to the entire document
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });

            // Set timeout
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element not found within ${timeout}ms. Tried selectors: ${selectorArray.join(', ')}`));
            }, timeout);
        });
    }

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script
     * @returns {boolean} True if configuration is valid
     */
    function validateConfiguration() {
        let scriptAttributes = {};
        // Try to get attributes from the current executing script element
        if (currentExecutingScriptElement) {
            scriptAttributes = {
                'target-selector-left': currentExecutingScriptElement.getAttribute('data-target-selector-left'),
                'target-selector-right': currentExecutingScriptElement.getAttribute('data-target-selector-right'),
                'base-url': currentExecutingScriptElement.getAttribute('data-base-url'),
                'view': currentExecutingScriptElement.getAttribute('data-view')
            };
        }

        // Fallback to global attributes if currentScript attributes are missing (e.g., for blob URLs)
        // This global variable is set by loadScript just before appending the script.
        const globalAttributes = window._greenhouseScriptAttributes || {};

        appState.targetSelectorLeft = scriptAttributes['target-selector-left'] || globalAttributes['target-selector-left'];
        appState.targetSelectorRight = scriptAttributes['target-selector-right'] || globalAttributes['target-selector-right'];
        appState.baseUrl = scriptAttributes['base-url'] || globalAttributes['base-url'];
        const view = scriptAttributes['view'] || globalAttributes['view'];

        if (!appState.targetSelectorLeft && view !== 'dashboard') { // targetSelectorLeft is required for patient/admin
            console.error('GreenhouseUtils: Missing required data-target-selector-left attribute for patient/admin view');
            return false;
        }
        if (!appState.targetSelectorLeft && !appState.targetSelectorRight && view === 'dashboard') { // Both required for dashboard
            console.error('GreenhouseUtils: Missing required data-target-selector-left or data-target-selector-right attributes for dashboard view');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('GreenhouseUtils: Missing required data-base-url attribute');
            return false;
        }

        // Ensure baseUrl ends with slash
        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'patient';

        console.log(`GreenhouseUtils: validateConfiguration - scriptAttributes:`, scriptAttributes);
        console.log(`GreenhouseUtils: validateConfiguration - globalAttributes:`, globalAttributes);
        console.log(`GreenhouseUtils: validateConfiguration - Determined View: ${view}, Target Left: ${appState.targetSelectorLeft}, Target Right: ${appState.targetSelectorRight}`);

        console.log(`GreenhouseUtils: Configuration validated - View: ${appState.currentView}, Target Left: ${appState.targetSelectorLeft}, Target Right: ${appState.targetSelectorRight}`);
        return true;
    }

    /**
     * @function loadScript
     * @description Dynamically loads a script from a given URL, injects it, and waits for it to execute.
     * @param {string} scriptName - The name of the script file (e.g., 'dashboard.js')
     * @param {string} baseUrl - The base URL for fetching assets.
     * @param {Object} [attributes={}] - An optional map of data attributes to set on the script element.
     * @returns {Promise<void>} A promise that resolves when the script has been successfully loaded and executed.
     */
    async function loadScript(scriptName, baseUrl, attributes = {}) {
        const timestamp = new Date().getTime();
        const scriptUrl = `${baseUrl}js/${scriptName}?t=${timestamp}`;
        if (appState.loadedScripts.has(scriptName)) {
            console.log(`GreenhouseUtils: Script ${scriptName} already loaded, skipping`);
            return Promise.resolve();
        }

        // Avoid re-adding the script if it already exists in DOM
        if (document.querySelector(`script[data-script-name="${scriptName}"]`)) {
            console.log(`GreenhouseUtils: Script ${scriptName} already in DOM`);
            appState.loadedScripts.add(scriptName);
            return Promise.resolve();
        }

        return new Promise(async (resolve, reject) => {
            const loadOperation = async () => {
                const response = await fetch(scriptUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.text();
            };

            try {
                const scriptText = await retryOperation(
                    loadOperation,
                    `Loading script ${scriptName}`
                );

                const scriptElement = document.createElement('script');
                scriptElement.dataset.scriptName = scriptName;
                scriptElement.dataset.loadedBy = 'greenhouse-scheduler';

                for (const [key, value] of Object.entries(attributes)) {
                    scriptElement.setAttribute(`data-${key}`, value);
                }

                // Temporarily store attributes globally for scripts loaded via blob URLs
                window._greenhouseScriptAttributes = attributes;
                console.log(`GreenhouseUtils: loadScript - Setting _greenhouseScriptAttributes for ${scriptName}:`, attributes);

                const blob = new Blob([scriptText], { type: 'text/javascript' });
                const objectUrl = URL.createObjectURL(blob);

                scriptElement.onload = () => {
                    // Use a small timeout to ensure the script's execution context is established
                    // before resolving the promise. This helps prevent race conditions where
                    // a subsequent script depends on globals defined in this script.
                    appState.loadedScripts.add(scriptName);
                    console.log(`GreenhouseUtils: Successfully loaded and executed script ${scriptName}`);
                    URL.revokeObjectURL(objectUrl);
                    resolve();
                };

                scriptElement.onerror = () => {
                    const error = new Error(`Failed to execute script ${scriptName}`);
                    console.error(`GreenhouseUtils: ${error.message}`);
                    URL.revokeObjectURL(objectUrl);
                    delete window._greenhouseScriptAttributes; // Clean up global variable
                    reject(error);
                };

                scriptElement.src = objectUrl;
                document.body.appendChild(scriptElement);

            } catch (error) {
                console.error(`GreenhouseUtils: Failed to load script ${scriptName}:`, error);
                delete window._greenhouseScriptAttributes; // Clean up global variable on error too
                reject(error);
            }
        });
    }

    /**
     * @function retryOperation
     * @description Retries an async operation with exponential backoff
     * @param {Function} operation - The async operation to retry
     * @param {string} operationName - Name for logging
     * @param {number} [maxAttempts=3] - Maximum retry attempts
     * @returns {Promise} Result of the operation
     */
    async function retryOperation(operation, operationName, maxAttempts = config.retries.maxAttempts) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`GreenhouseUtils: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`GreenhouseUtils: ${operationName} failed on attempt ${attempt}:`, error.message);

                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    console.log(`GreenhouseUtils: Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    /**
     * @function validateField
     * @description Validates a single form field based on its attributes (e.g., required, type).
     * It also handles displaying/hiding error messages.
     * @param {HTMLInputElement|HTMLSelectElement} field - The form field to validate.
     * @param {HTMLElement} errorElement - The element to display validation errors in.
     * @returns {boolean} True if the field is valid, false otherwise.
     */
    function validateField(field, errorElement) {
        let isValid = true;
        let errorMessage = '';

        // Check if required field is empty
        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`;
        }

        // Additional validation based on field type
        if (isValid && field.value.trim()) {
            switch (field.type) {
                case 'date':
                    const selectedDate = new Date(field.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        isValid = false;
                        errorMessage = 'Please select a future date.';
                    }
                    break;
                case 'time':
                    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timeRegex.test(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid time.';
                    }
                    break;
                // Add more validation types as needed (e.g., email, number)
            }
        }

        // Show/hide error message
        if (errorElement) {
            if (isValid) {
                errorElement.classList.add('greenhouse-hidden');
                field.classList.remove('greenhouse-form-error-input');
            } else {
                errorElement.textContent = errorMessage;
                errorElement.classList.remove('greenhouse-hidden');
                field.classList.add('greenhouse-form-error-input');
            }
        }

        return isValid;
    }

    /**
     * @function validateForm
     * @description Validates an entire form by iterating over its required fields.
     * It expects error elements to be associated with each field via a data-identifier.
     * @param {HTMLFormElement} form - The form element to validate.
     * @param {string} errorIdentifierPrefix - The prefix for data-identifier attributes of error elements (e.g., 'patient-app-error-').
     * @returns {boolean} True if the entire form is valid, false otherwise.
     */
    function validateForm(form, errorIdentifierPrefix) {
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;

        inputs.forEach(input => {
            const errorEl = form.querySelector(`[data-identifier="${errorIdentifierPrefix}${input.name}"]`);
            if (!validateField(input, errorEl)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    /**
     * @function observeAndReinitializeApplication
     * @description Observes the document body for removal of the application's container and triggers re-initialization.
     * @param {HTMLElement} container - The container element to monitor.
     * @param {string|null} selector - The CSS selector for the container (optional, used to find replacement if removal detected).
     * @param {Object} appInstance - The application instance (e.g., `G`).
     * @param {string} reinitFunctionName - The name of the initialization function on the app instance (e.g., 'initialize' or 'init').
     * @returns {MutationObserver} The observer instance.
     */
    function observeAndReinitializeApplication(container, selector, appInstance, reinitFunctionName = 'initialize') {
        if (!container) return null;

        // Clean up previous observer if it exists on the app instance
        if (appInstance._resilienceObserver) {
            appInstance._resilienceObserver.disconnect();
        }

        const observerCallback = (mutations) => {
            // Check if the container itself or a parent was removed
            const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n === container || (n.nodeType === 1 && n.contains(container))));

            if (wasRemoved) {
                console.log(`GreenhouseUtils: Application container removal detected for ${selector || 'unnamed container'}.`);

                if (appInstance.isRunning !== undefined) appInstance.isRunning = false;
                if (appInstance.stop) appInstance.stop();
                if (appInstance.stopSimulation) appInstance.stopSimulation();

                if (appInstance._resilienceObserver) {
                    appInstance._resilienceObserver.disconnect();
                }

                setTimeout(() => {
                    let newContainer = container.id ? document.getElementById(container.id) : null;
                    if (!newContainer && selector) {
                        newContainer = document.querySelector(selector);
                    }

                    if (newContainer && document.body.contains(newContainer)) {
                        console.log(`GreenhouseUtils: Re-initializing application via ${reinitFunctionName}...`);
                        if (typeof appInstance[reinitFunctionName] === 'function') {
                            // Call reinit using selector if available, or just container
                            // Standardizing: prefer calling with (container, selector) signature if supported, or just (container)
                            try {
                                appInstance[reinitFunctionName](newContainer, selector);
                            } catch (e) {
                                console.warn(`GreenhouseUtils: Failed to re-initialize with (container, selector), falling back to (container).`, e);
                                appInstance[reinitFunctionName](newContainer);
                            }
                        }
                    } else {
                        console.log('GreenhouseUtils: Re-init failed. Container not found.');
                    }
                }, 1000); // Wait for React/DOM to settle
            }
        };

        const observer = new MutationObserver(observerCallback);
        observer.observe(document.body, { childList: true, subtree: true });

        // Store observer on instance for cleanup
        appInstance._resilienceObserver = observer;
        return observer;
    }

    /**
     * @function startSentinel
     * @description Starts a polling interval to check if the application's critical elements (e.g., canvas) are still in the DOM.
     * @param {HTMLElement} container - The initial container element.
     * @param {string|null} selector - The CSS selector for the container.
     * @param {Object} appInstance - The application instance.
     * @param {string} reinitFunctionName - The name of the initialization function.
     * @param {string} criticalSelector - CSS selector for a critical child element to check (e.g., 'canvas').
     * @returns {number} The interval ID.
     */
    function startSentinel(container, selector, appInstance, reinitFunctionName = 'initialize', criticalSelector = 'canvas') {
        if (appInstance._sentinelInterval) clearInterval(appInstance._sentinelInterval);

        const intervalId = setInterval(() => {
            let currentContainer = container.id ? document.getElementById(container.id) : container;
            if ((!currentContainer || !document.body.contains(currentContainer)) && selector) {
                currentContainer = document.querySelector(selector);
            }

            const criticalElement = currentContainer ? currentContainer.querySelector(criticalSelector) : null;
            const isRunning = appInstance.isRunning !== undefined ? appInstance.isRunning : true;

            if (isRunning && (!currentContainer || !criticalElement || !document.body.contains(criticalElement))) {
                console.log(`GreenhouseUtils: Sentinel detected DOM loss for ${selector}. Re-initializing...`);

                if (appInstance.isRunning !== undefined) appInstance.isRunning = false;

                if (currentContainer && document.body.contains(currentContainer)) {
                    if (typeof appInstance[reinitFunctionName] === 'function') {
                        try {
                            appInstance[reinitFunctionName](currentContainer, selector);
                        } catch (e) {
                            appInstance[reinitFunctionName](currentContainer);
                        }
                    }
                } else if (selector) {
                    const newContainer = document.querySelector(selector);
                    if (newContainer && typeof appInstance[reinitFunctionName] === 'function') {
                        try {
                            appInstance[reinitFunctionName](newContainer, selector);
                        } catch (e) {
                            appInstance[reinitFunctionName](newContainer);
                        }
                    }
                }
            }
        }, 3000);

        appInstance._sentinelInterval = intervalId;
        return intervalId;
    }

    /**
     * @function renderModelsTOC
     * @description Renders the models table of contents at the bottom of the simulation.
     * @param {string} [targetSelector] - Optional selector for placement. If not provided, appends to the bottom of the body.
     */
    async function renderModelsTOC(targetSelector = null) {
        // Avoid rendering on local documentation/test HTML files as per user preference
        const isLocalHtml = window.location.pathname.endsWith('.html') ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (isLocalHtml) {
            console.log('[GreenhouseUtils] TOC rendering skipped on local/docs HTML file.');
            return;
        }

        console.log('[GreenhouseUtils] Preparing bottom navigation TOC...');

        const githubUrl = "https://drtamarojgreen.github.io/greenhouse_org/";

        // Load CSS if not present
        if (!document.querySelector('link[href*="models_toc.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${githubUrl}css/models_toc.css`;
            document.head.appendChild(link);
        }

        // Load JS if not present
        if (!window.GreenhouseModelsTOC) {
            try {
                await loadScript('models_toc.js', githubUrl);
            } catch (e) {
                console.error('[GreenhouseUtils] Failed to load models_toc.js', e);
                return;
            }
        }

        // Create or find the footer container
        let tocContainer = document.getElementById('greenhouse-models-footer-toc');
        if (!tocContainer) {
            tocContainer = document.createElement('div');
            tocContainer.id = 'greenhouse-models-footer-toc';
            tocContainer.className = 'models-toc-footer-section';

            // Add style block for the footer section
            if (!document.getElementById('greenhouse-footer-styles')) {
                const style = document.createElement('style');
                style.id = 'greenhouse-footer-styles';
                style.textContent = `
                    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
                    
                    .models-toc-footer-section {
                        display: block !important;
                        flex: 0 0 100% !important; /* Force full width in flexbox */
                        width: 100% !important;
                        grid-column: 1 / -1 !important; /* For Grid */
                        order: 9999 !important; /* Push to end in flexbox */
                        background: linear-gradient(to bottom, #000 0%, #0a100a 100%);
                        border-top: 2px solid #1a2a1a;
                        padding: 80px 20px;
                        margin-top: 50px;
                        position: relative;
                        z-index: 10; /* Lower z-index to avoid covering fixed UI */
                        min-height: 400px;
                        color: #fff;
                        box-shadow: 0 -30px 60px rgba(0, 0, 0, 0.6);
                        clear: both !important;
                    }
                    .models-toc-footer-section .models-toc-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        width: 100% !important;
                    }
                    .models-toc-footer-header {
                        text-align: center;
                        margin-bottom: 60px;
                    }
                    .models-toc-footer-header h2 {
                        font-family: 'Quicksand', sans-serif;
                        font-size: 2.8rem;
                        font-weight: 300;
                        color: #4ca1af;
                        letter-spacing: 2px;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                    }
                    .models-toc-footer-header .accent-line {
                        width: 80px;
                        height: 3px;
                        background: linear-gradient(to right, transparent, #4ca1af, transparent);
                        margin: 0 auto;
                    }
                    
                    /* Force scrolling if the app was previously locked */
                    html, body {
                        overflow-y: auto !important;
                        height: auto !important;
                        min-height: 100% !important;
                    }
                    
                    /* Dark Mode Theme Overrides for TOC Cards */
                    .models-toc-footer-section .model-toc-card {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        backdrop-filter: blur(12px);
                        transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                    }
                    .models-toc-footer-section .model-toc-card:hover {
                        background: rgba(255, 255, 255, 0.08);
                        border-color: #4ca1af;
                        transform: translateY(-12px);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(76, 161, 175, 0.2);
                    }
                    .models-toc-footer-section .model-toc-card h3 {
                        color: #4ca1af;
                        border-bottom-color: rgba(255, 255, 255, 0.05);
                        font-family: 'Quicksand', sans-serif;
                    }
                    .models-toc-footer-section .model-toc-card p {
                        color: #bbb;
                    }
                    .models-toc-footer-section .models-toc-intro {
                        display: none; /* Hide intro text in the footer/bottom view */
                    }
                `;
                document.head.appendChild(style);
            }

            // Add Footer Header
            const header = document.createElement('div');
            header.className = 'models-toc-footer-header';
            header.innerHTML = `
                <h2>Greenhouse Models</h2>
                <div class="accent-line"></div>
            `;
            tocContainer.appendChild(header);

            // Append to body after the main app container
            const mainApp = targetSelector ? document.querySelector(targetSelector) : null;
            if (mainApp && mainApp.parentNode) {
                const parent = mainApp.parentNode;

                // Force wrap for flex parents
                try {
                    const computedStyle = window.getComputedStyle(parent);
                    if (computedStyle.display.includes('flex')) {
                        parent.style.flexWrap = 'wrap';
                    }
                } catch (e) { }

                // Check if mainApp has no height (likely absolute/fixed)
                const mainHeight = mainApp.offsetHeight;
                if (mainHeight < 100) {
                    // If simulation doesn't take space, simulate some flow offset
                    tocContainer.style.marginTop = '600px';
                }

                // Insert after the main simulation container
                parent.insertBefore(tocContainer, mainApp.nextSibling);
            } else {
                document.body.appendChild(tocContainer);
            }
        }

        // Initialize the TOC component inside the new footer container
        if (window.GreenhouseModelsTOC) {
            window.GreenhouseModelsTOC.init({ target: tocContainer, baseUrl: githubUrl });
        }
    }

    /**
     * @function isMobileUser
     * @description Detects if the current device is mobile or the screen is narrow.
     */
    function isMobileUser() {
        const isNarrow = window.innerWidth <= 1024;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        return (isNarrow && hasTouch) || isMobileUA;
    }

    /**
     * @function fetchModelDescriptions
     * @description Fetches model metadata from the central XML repository.
     */
    async function fetchModelDescriptions() {
        const baseUrl = appState.baseUrl || "https://drtamarojgreen.github.io/greenhouse_org/";
        const xmlUrl = `${baseUrl}endpoints/model_descriptions.xml`;

        try {
            const response = await fetch(xmlUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            return Array.from(xmlDoc.querySelectorAll('model')).map(model => ({
                id: model.getAttribute('id'),
                title: model.querySelector('title').textContent,
                url: model.querySelector('url') ? model.querySelector('url').textContent : `/${model.getAttribute('id')}`
            }));
        } catch (e) {
            console.warn('[GreenhouseUtils] Failed to fetch model descriptions, using fallback', e);
            return [
                { id: 'genetic', title: 'Genetic Model', url: '/genetic' },
                { id: 'neuro', title: 'Neuro Model', url: '/neuro' },
                { id: 'pathway', title: 'Pathway Model', url: '/pathway' },
                { id: 'synapse', title: 'Synapse Model', url: '/synapse' }
            ];
        }
    }

    // Public API
    return {
        displayError: (msg, duration) => displayMessage(msg, 'error', duration),
        displaySuccess: (msg, duration) => displayMessage(msg, 'success', duration),
        displayInfo: (msg, duration) => displayMessage(msg, 'info', duration),
        waitForElement: waitForElement,
        appState: appState,
        validateConfiguration: validateConfiguration,
        loadScript: loadScript,
        config: config,
        retryOperation: retryOperation,
        validateField: validateField,
        validateForm: validateForm,
        observeAndReinitializeApplication: observeAndReinitializeApplication,
        startSentinel: startSentinel,
        renderModelsTOC: renderModelsTOC,
        isMobileUser: isMobileUser,
        fetchModelDescriptions: fetchModelDescriptions
    };
})();

// Register with dependency manager if available, otherwise emit ready event
if (window.GreenhouseDependencyManager) {
    window.GreenhouseDependencyManager.register('utils', window.GreenhouseUtils, {
        version: '1.2.0',
        description: 'Core utilities for Greenhouse applications',
        features: ['DOM manipulation', 'Script loading', 'Form validation', 'Notifications']
    });
    console.log('GreenhouseUtils: Registered with GreenhouseDependencyManager');
} else {
    // Fallback to direct event emission for backward compatibility
    window.dispatchEvent(new CustomEvent('greenhouse:utils-ready', {
        detail: {
            utils: window.GreenhouseUtils,
            timestamp: Date.now()
        }
    }));
    console.log('GreenhouseUtils: Ready event dispatched (fallback mode)');
}
