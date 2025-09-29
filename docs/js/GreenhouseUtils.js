window.GreenhouseUtils = (function() {
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
        const scriptUrl = `${baseUrl}js/${scriptName}`;
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


    // Public API
    return {
        displayError: (msg, duration) => displayMessage(msg, 'error', duration),
        displaySuccess: (msg, duration) => displayMessage(msg, 'success', duration),
        displayInfo: (msg, duration) => displayMessage(msg, 'info', duration),
        waitForElement: waitForElement,
        appState: appState, // Expose appState
        validateConfiguration: validateConfiguration, // Expose validateConfiguration
        loadScript: loadScript, // Expose loadScript
        config: config, // Expose config
        retryOperation: retryOperation, // Expose retryOperation
        validateField: validateField, // Expose form validation utility
        validateForm: validateForm,   // Expose form validation utility
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
