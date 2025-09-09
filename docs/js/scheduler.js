// Version: 0.0.2
/**
 * @file scheduler.js
 * @description This script contains the core functionality for the Greenhouse appointment scheduling application.
 * It is responsible for rendering the various scheduling views (patient, dashboard, admin) and handling
 * user interactions within those views.
 *
 * @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
 * when the scheduling application is needed. `greenhouse.js` passes the target selector for rendering
 * via a `data-target-selector` attribute on the script tag. This design allows the scheduler to be
 * a self-contained module that can be easily dropped into any page without requiring manual
 * configuration or initialization.
 *
 * @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
 * Invoked Function Expression (IIFE) to avoid polluting the global namespace. It also uses a
 * data-driven approach to receive information from the loader script, further decoupling the application
 * from the loader. This design is crucial for preventing conflicts with other scripts on the site,
 * which is known to be sensitive to global namespace pollution.
 */

(function() {
    'use strict';

    console.log("Loading Greenhouse Scheduler - Version 0.1.0");

    /**
     * @description Configuration for the scheduler application
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
            insertionDelay: 500,  // Delay before inserting into DOM (for Wix compatibility)
            observerTimeout: 10000
        }
    };

    /**
     * @description The script element that is currently being executed.
     * This is used to retrieve configuration attributes from the loader script.
     * @type {HTMLScriptElement}
     */
    const scriptElement = document.currentScript;

    /**
     * Application state management
     */
    const appState = {
        isInitialized: false,
        isLoading: false,
        currentView: null,
        currentAppInstance: null,
        targetElementLeft: null, // New: for left panel
        targetElementRight: null, // New: for right panel
        baseUrl: null,
        targetSelectorLeft: null, // New: for left panel
        targetSelectorRight: null, // New: for right panel
        loadedScripts: new Set(),
        errors: []
    };

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script
     * @returns {boolean} True if configuration is valid
     */
    function validateConfiguration() {
        appState.targetSelectorLeft = scriptElement?.getAttribute('data-target-selector-left');
        appState.targetSelectorRight = scriptElement?.getAttribute('data-target-selector-right');
        appState.baseUrl = scriptElement?.getAttribute('data-base-url');
        const view = scriptElement?.getAttribute('data-view');

        if (!appState.targetSelectorLeft && view !== 'dashboard') { // targetSelectorLeft is required for patient/admin
            console.error('Scheduler: Missing required data-target-selector-left attribute for patient/admin view');
            return false;
        }
        if (!appState.targetSelectorLeft && !appState.targetSelectorRight && view === 'dashboard') { // Both required for dashboard
            console.error('Scheduler: Missing required data-target-selector-left or data-target-selector-right attributes for dashboard view');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('Scheduler: Missing required data-base-url attribute');
            return false;
        }

        // Ensure baseUrl ends with slash
        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'patient';

        console.log(`Scheduler: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
        return true;
    }

    /**
     * @function waitForElement
     * @description Waits for an element to appear in the DOM
     * @param {string} selector - CSS selector for the element
     * @param {number} [timeout=10000] - Maximum time to wait in milliseconds
     * @returns {Promise<Element>} Promise that resolves with the found element
     */
    function waitForElement(selector, timeout = config.dom.observerTimeout) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Scheduler: Found target element immediately: ${selector}`);
                return resolve(element);
            }

            console.log(`Scheduler: Waiting for target element: ${selector}`);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    console.log(`Scheduler: Target element found: ${selector}`);
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Target element not found within ${timeout}ms: ${selector}`));
            }, timeout);
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
                console.log(`Scheduler: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Scheduler: ${operationName} failed on attempt ${attempt}:`, error.message);
                
                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    console.log(`Scheduler: Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    /**
     * @namespace GreenhouseAppsScheduler
     * @description The main object for the scheduling application
     */
    const GreenhouseAppsScheduler = {
        

        /**
         * @function loadScript
         * @description Dynamically loads a script with retry logic and caching
         * @param {string} scriptName - The name of the script file (e.g., 'dashboard.js')
         * @returns {Promise<void>}
         */
        async loadScript(scriptName) {
            // Check if script already loaded
            if (appState.loadedScripts.has(scriptName)) {
                console.log(`Scheduler: Script ${scriptName} already loaded, skipping`);
                return;
            }

            const loadOperation = async () => {
                const response = await fetch(`${appState.baseUrl}js/${scriptName}`);
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

                // Avoid re-adding the script if it already exists in DOM
                if (document.querySelector(`script[data-script-name="${scriptName}"]`)) {
                    console.log(`Scheduler: Script ${scriptName} already in DOM`);
                    appState.loadedScripts.add(scriptName);
                    return;
                }

                const scriptElement = document.createElement('script');
                scriptElement.dataset.scriptName = scriptName;
                scriptElement.dataset.loadedBy = 'greenhouse-scheduler';
                scriptElement.textContent = scriptText;
                document.body.appendChild(scriptElement);

                appState.loadedScripts.add(scriptName);
                console.log(`Scheduler: Successfully loaded script ${scriptName}`);

            } catch (error) {
                console.error(`Scheduler: Failed to load script ${scriptName}:`, error);
                throw error;
            }
        },

        /**
         * @function loadCSS
         * @description Loads and applies CSS with error handling
         * @returns {Promise<void>}
         */
        async loadCSS() {
            const cssUrl = `${appState.baseUrl}css/schedule.css`;

            // Check if schedule.css already loaded
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.type = 'text/css';
                linkElement.href = cssUrl;
                linkElement.setAttribute('data-greenhouse-scheduler-css', 'true');
                document.head.appendChild(linkElement);
                await new Promise((resolve, reject) => {
                    linkElement.onload = () => {
                        console.log(`Scheduler: CSS ${cssUrl} loaded successfully`);
                        resolve();
                    };
                    linkElement.onerror = (event) => {
                        console.error(`Scheduler: Failed to load CSS ${cssUrl}:`, event);
                        GreenhouseUtils.displayError(`Failed to load core scheduling styles.`);
                        reject(new Error(`Failed to load CSS: ${cssUrl}`));
                    };
                });
            } else {
                console.log(`Scheduler: CSS ${cssUrl} already loaded, skipping`);
            }

        },

        /**
         * @function renderView
         * @description Renders the appropriate view based on the current view state
         * @returns {Promise<DocumentFragment>} A promise that resolves with the DOM fragment for the view
         */
        async renderView() {
            console.log(`Scheduler: Rendering view: ${appState.currentView}`);

            let appDomFragment;

            try {
                switch (appState.currentView) {
                    case 'dashboard':
                        await this.loadScript('GreenhouseDashboardApp.js');
                        if (typeof GreenhouseDashboardApp === 'function') {
                            appState.currentAppInstance = GreenhouseDashboardApp(GreenhouseSchedulerUI);
                            // For dashboard, we build two fragments, one for each panel
                            const leftPanelFragment = GreenhouseSchedulerUI.buildDashboardLeftPanelUI();
                            const rightPanelFragment = GreenhouseSchedulerUI.buildDashboardRightPanelUI();
                            appDomFragment = { left: leftPanelFragment, right: rightPanelFragment }; // Return an object with both fragments
                        } else {
                            throw new Error('GreenhouseDashboardApp not found or not a function');
                        }
                        break;

                    case 'admin':
                        await this.loadScript('GreenhouseAdminApp.js');
                        if (typeof GreenhouseAdminApp === 'function') {
                            appState.currentAppInstance = GreenhouseAdminApp();
                            appDomFragment = appState.currentAppInstance.buildForm();
                        } else {
                            throw new Error('GreenhouseAdminApp not found or not a function');
                        }
                        break;

                    case 'patient':
                    default:
                        await this.loadScript('GreenhousePatientApp.js');
                        if (typeof GreenhousePatientApp === 'function') {
                            appState.currentAppInstance = GreenhousePatientApp();
                        }
                        // Build the patient UI regardless of whether the external script loaded
                        appDomFragment = GreenhouseSchedulerUI.buildPatientFormUI();
                        break;
                }

                if (!appDomFragment) {
                    throw new Error('Failed to create view DOM fragment');
                }

                return appDomFragment;

            } catch (error) {
                console.error(`Scheduler: Error rendering ${appState.currentView} view:`, error);
                return this.createErrorView(`Failed to load ${appState.currentView} view: ${error.message}`);
            }
        },

        /**
         * @function createErrorView
         * @description Creates an error view when rendering fails
         * @param {string} message - Error message to display
         * @returns {DocumentFragment}
         */
        createErrorView(message) {
            // Use GreenhouseUtils to display a prominent error message
            GreenhouseUtils.displayError(`Unable to Load Application: ${message}. Please refresh the page or contact support if the problem persists.`, 0); // 0 for sticky error

            // Return an empty fragment as GreenhouseUtils handles the display
            return document.createDocumentFragment();
        },

        /**
         * @function showSuccessMessage
         * @description Shows a success message to the user
         * @param {string} message - Success message to display
         */
        showSuccessMessage(message) {
            GreenhouseUtils.displaySuccess(message);
        },

        /**
         * @function showErrorMessage
         * @description Shows an error message to the user
         * @param {string} message - Error message to display
         */
        showErrorMessage(message) {
            GreenhouseUtils.displayError(message);
        },

        /**
         * @function showNotification
         * @description Shows a notification message with auto-dismiss
         * @param {string} message - Message to display
         * @param {string} type - Type of notification ('success', 'error', 'info')
         * @param {number} [duration=5000] - Auto-dismiss duration in milliseconds
         */
        showNotification(message, type = 'info', duration = 5000) {
            // Use GreenhouseUtils for notifications
            if (type === 'success') {
                GreenhouseUtils.displaySuccess(message, duration);
            } else if (type === 'error') {
                GreenhouseUtils.displayError(message, duration);
            } else {
                GreenhouseUtils.displayInfo(message, duration);
            }
        },

        /**
         * @function findOptimalContainer
         * @description Finds the best container for inserting the application
         * @param {Element} targetElement - The target element from the selector
         * @returns {Object} Container info with element and insertion strategy
         */
        findOptimalContainer(targetElement) {
            // Always use the target element directly as the container
            // This ensures the app is inserted into the specific column identified by greenhouse.js
            return {
                container: targetElement,
                strategy: 'target-direct',
                insertionMethod: 'prepend' // Prepend to ensure it's the first child
            };
        },

        /**
         * @function insertApplication
         * @description Inserts the application into the optimal container(s).
         * For dashboard view, it inserts into two separate target elements.
         * For other views, it inserts into a single target element.
         * @param {DocumentFragment|Object} appDomContent - The application DOM fragment or an object with left/right fragments.
         * @param {Element} targetElementLeft - The target element for the left panel.
         * @param {Element} [targetElementRight] - The target element for the right panel (optional, for dashboard).
         */
        insertApplication(appDomContent, targetElementLeft, targetElementRight = null) {
            console.log(`Scheduler: Inserting application for view: ${appState.currentView}`);

            if (appState.currentView === 'dashboard' && targetElementRight) {
                // Insert left panel content
                const leftAppContainer = document.createElement('section');
                leftAppContainer.id = 'greenhouse-app-container-left';
                leftAppContainer.className = 'greenhouse-app-container greenhouse-scheduler-left-panel';
                leftAppContainer.setAttribute('data-greenhouse-app', appState.currentView);
                leftAppContainer.appendChild(appDomContent.left);
                targetElementLeft.prepend(leftAppContainer);
                console.log('Scheduler: Left dashboard panel inserted into DOM');

                // Insert right panel content
                const rightAppContainer = document.createElement('section');
                rightAppContainer.id = 'greenhouse-app-container-right';
                rightAppContainer.className = 'greenhouse-app-container greenhouse-scheduler-right-panel';
                rightAppContainer.setAttribute('data-greenhouse-app', appState.currentView);
                rightAppContainer.appendChild(appDomContent.right);
                targetElementRight.prepend(rightAppContainer);
                console.log('Scheduler: Right dashboard panel inserted into DOM');

                return { left: leftAppContainer, right: rightAppContainer };
            } else {
                // For patient/admin views, or if dashboard but only one target, use existing logic
                const containerInfo = this.findOptimalContainer(targetElementLeft);
                
                console.log(`Scheduler: Using insertion strategy: ${containerInfo.strategy}`);

                const appContainer = document.createElement('section');
                appContainer.id = 'greenhouse-app-container';
                appContainer.className = 'greenhouse-app-container';
                appContainer.setAttribute('data-greenhouse-app', appState.currentView);
                appContainer.appendChild(appDomContent);

                switch (containerInfo.insertionMethod) {
                    case 'prepend':
                        containerInfo.container.prepend(appContainer);
                        break;
                    case 'append':
                        containerInfo.container.appendChild(appContainer);
                        break;
                    default:
                        containerInfo.container.prepend(appContainer);
                }

                console.log('Scheduler: Application inserted into DOM');
                return appContainer;
            }
        },

        /**
         * @function displayError
         * @description Displays a visible error message on the page using GreenhouseUtils
         * @param {string} message - The error message to display
         * @param {Element} [targetElement] - Element to insert error near (currently unused, as GreenhouseUtils handles global display)
         */
        displayError(message, targetElement = null) {
            GreenhouseUtils.displayError(`Greenhouse Scheduler Error: ${message}`);
            
            // Also log to console with more details
            console.error('Greenhouse Scheduler Error:', {
                message,
                targetSelectorLeft: appState.targetSelectorLeft,
                targetSelectorRight: appState.targetSelectorRight,
                baseUrl: appState.baseUrl,
                view: appState.currentView,
                errors: appState.errors
            });
        },

        /**
         * @function initializeApplication
         * @description Initializes the loaded application instance
         */
        initializeApplication() {
            try {
                if (appState.currentAppInstance && typeof appState.currentAppInstance.init === 'function') {
                    console.log('Scheduler: Initializing application instance');
                    appState.currentAppInstance.init();
                } else if (appState.currentAppInstance) {
                    console.log('Scheduler: Application instance loaded but has no init method');
                } else {
                    console.log('Scheduler: No application instance to initialize');
                }
            } catch (error) {
                console.error('Scheduler: Error initializing application instance:', error);
                this.showErrorMessage('Application loaded but failed to initialize properly.');
            }
        },

        /**
         * @function init
         * @description Main initialization function for the scheduler application
         * @param {string} targetSelectorLeft - The CSS selector for the left panel element
         * @param {string} [targetSelectorRight] - The CSS selector for the right panel element (optional, for dashboard)
         * @param {string} baseUrl - The base URL for fetching assets
         */
        async init(targetSelectorLeft, targetSelectorRight, baseUrl) {
            if (appState.isInitialized || appState.isLoading) {
                console.log('Scheduler: Already initialized or loading, skipping');
                return;
            }

            appState.isLoading = true;
            try {
                // Load utility script
                await this.loadScript('GreenhouseUtils.js');

                // Load main application logic
                await this.loadScript('GreenhousePatientApp.js');
                
                console.log('Scheduler: Starting initialization');

                // Set configuration
                appState.targetSelectorLeft = targetSelectorLeft;
                appState.targetSelectorRight = targetSelectorRight;
                appState.baseUrl = baseUrl;

                // Wait for target elements to be available
                appState.targetElementLeft = await waitForElement(targetSelectorLeft);
                if (targetSelectorRight) {
                    appState.targetElementRight = await waitForElement(targetSelectorRight);
                }

                // Load CSS first (non-blocking)
                this.loadCSS().catch(error => {
                    console.warn('Scheduler: CSS loading failed, continuing with fallback:', error);
                });

                // Load the main application logic
                await this.loadScript('GreenhousePatientApp.js').catch(error => {
                    console.warn('Scheduler: Patient app script failed to load:', error);
                });

                // Render the appropriate view
                const appDomFragment = await this.renderView();

                // Insert application into DOM with delay for Wix compatibility
                await new Promise(resolve => setTimeout(resolve, config.dom.insertionDelay));
                
                // Insert application into DOM
                if (appState.currentView === 'dashboard') {
                    this.insertApplication(appDomFragment, appState.targetElementLeft, appState.targetElementRight);
                } else {
                    this.insertApplication(appDomFragment, appState.targetElementLeft);
                }

                // Initialize the application instance
                this.initializeApplication();

                appState.isInitialized = true;
                console.log('Scheduler: Initialization completed successfully');

                // Show success notification
                this.showNotification('Scheduling application loaded successfully', 'success', 3000);

            } catch (error) {
                console.error('Scheduler: Initialization failed:', error);
                appState.errors.push(error);

                const errorMessage = error.message.includes('not found') 
                    ? `Target element "${targetSelectorLeft}" not found. Please check if the page has loaded completely.`
                    : `Failed to load the scheduling application: ${error.message}`;

                // Use createErrorView which now leverages GreenhouseUtils for display
                this.createErrorView(errorMessage);

            } finally {
                appState.isLoading = false;
            }
        }
    };

    // --- Main Execution Logic ---

    /**
     * Main execution function
     */
    async function main() {
        try {
            // Validate configuration from script attributes
            if (!validateConfiguration()) {
                console.error('Scheduler: Invalid configuration, cannot proceed');
                return;
            }

            // Add global error handler
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('greenhouse')) {
                    console.error('Scheduler: Global error caught:', event.error);
                    appState.errors.push(event.error);
                }
            });

            // Add unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Scheduler: Unhandled promise rejection:', event.reason);
                appState.errors.push(event.reason);
            });

            // Initialize the scheduler application
            await GreenhouseAppsScheduler.init(
                appState.targetSelectorLeft,
                appState.targetSelectorRight,
                appState.baseUrl
            );

        } catch (error) {
            console.error('Scheduler: Main execution failed:', error);
        }
    }

    // Expose public API for debugging
    window.GreenhouseScheduler = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => {
            appState.isInitialized = false;
            appState.isLoading = false;
            return main();
        },
        showNotification: GreenhouseAppsScheduler.showNotification.bind(GreenhouseAppsScheduler)
    };

    // Execute main function
    main();

})();
