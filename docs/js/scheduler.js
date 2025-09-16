/**
 * @file scheduler.js
 * @description This script contains the core functionality for the Greenhouse appointment scheduling application.
 * It is responsible for orchestrating the loading of UI and app-specific logic based on the current view.
 *
 * @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
 * when the scheduling application is needed. `greenhouse.js` passes the target selectors for rendering
 * via `data-target-selector-left` and `data-target-selector-right` attributes on the script tag.
 * This design allows the scheduler to be a self-contained module that can be easily dropped into any page
 * without requiring manual configuration or initialization.
 *
 * @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
 * Invoked Function Expression (IIFE) to avoid polluting the global namespace. It relies on `GreenhouseUtils.js`
 * for shared utilities and `schedulerUI.js` for all UI creation. App-specific logic is loaded dynamically.
 */

(function() {
    'use strict';

    // Import GreenhouseUtils and GreenhouseSchedulerUI
    const GreenhouseUtils = window.GreenhouseUtils;
    const GreenhouseSchedulerUI = window.GreenhouseSchedulerUI;

    if (!GreenhouseUtils) {
        console.error('Scheduler: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded before scheduler.js.');
        return;
    }
    if (!GreenhouseSchedulerUI) {
        console.error('Scheduler: GreenhouseSchedulerUI not found. Ensure schedulerUI.js is loaded before scheduler.js.');
        return;
    }

    console.log("Loading Greenhouse Scheduler - Version 0.1.1"); // Updated version

    /**
     * @namespace GreenhouseAppsScheduler
     * @description The main object for the scheduling application
     */
    const GreenhouseAppsScheduler = {
        
        /**
         * @function loadCSS
         * @description Loads and applies CSS with error handling
         * @returns {Promise<void>}
         */
        async loadCSS() {
            const cssUrl = `${GreenhouseUtils.appState.baseUrl}css/schedule.css`;

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
         * @description Renders the appropriate view by calling `schedulerUI.js` to build and attach UI elements.
         * It then loads the corresponding app-specific script.
         * @param {HTMLElement} leftAppContainer - The main DOM element for the left panel.
         * @param {HTMLElement} [rightAppContainer] - The main DOM element for the right panel (optional, for dashboard).
         * @returns {Promise<void>} A promise that resolves when the view is rendered and app script loaded.
         */
        async renderView(leftAppContainer, rightAppContainer = null) {
            return new Promise((resolve, reject) => {
                console.log(`Scheduler: Rendering view: ${GreenhouseUtils.appState.currentView}`);

                try {
                    // --- BEGIN: Display All Views (Temporary for Development) ---
                    // As per user request, all scheduler UI components are displayed by default
                    // until the application is completely developed and authorization checks are in place.
                    // This ensures all elements are visible for testing and development purposes.
                    console.log('Scheduler: Rendering ALL UI components for development purposes.');

                    // Dashboard UI
                    GreenhouseSchedulerUI.buildDashboardLeftPanelUI(leftAppContainer, 'superadmin');
                    if (rightAppContainer) {
                        GreenhouseSchedulerUI.buildDashboardRightPanelUI(rightAppContainer);
                    }

                    // Patient UI
                    GreenhouseSchedulerUI.buildPatientFormUI(leftAppContainer);
                    if (rightAppContainer) {
                        GreenhouseSchedulerUI.createInstructionsPanel(rightAppContainer);
                        GreenhouseSchedulerUI.buildPatientCalendarUI(rightAppContainer);
                    }

                    // Admin UI
                    GreenhouseSchedulerUI.buildAdminFormUI(leftAppContainer);
                    // --- END: Display All Views (Temporary for Development) ---

                    resolve(); // Resolve the promise when UI rendering is complete
                } catch (error) {
                    console.error(`Scheduler: Error rendering all views:`, error);
                    this.createErrorView(`Failed to load all scheduler views: ${error.message}`);
                    reject(error); // Reject the promise on error
                }
            });
        },

        /**
         * @function createErrorView
         * @description Creates an error view when rendering fails
         * @param {string} message - Error message to display
         */
        createErrorView(message) {
            GreenhouseUtils.displayError(`Unable to Load Application: ${message}. Please refresh the page or contact support if the problem persists.`, 0); // 0 for sticky error
        },

        /**
         * @function initializeApplication
         * @description Initializes all loaded application instances, passing the main application containers.
         * This function is modified to initialize all known scheduler apps for development purposes.
         * @param {Element} [leftAppContainer] - The main DOM element for the left panel.
         * @param {Element} [rightAppContainer] - The main DOM element for the right panel (optional, for dashboard).
         */
        async initializeApplication(leftAppContainer, rightAppContainer = null) {
            console.log('Scheduler: Initializing ALL application instances for development purposes.');
            try {
                // Load all app scripts
                await Promise.all([
                    GreenhouseUtils.loadScript('GreenhouseDashboardApp.js', GreenhouseUtils.appState.baseUrl),
                    GreenhouseUtils.loadScript('GreenhousePatientApp.js', GreenhouseUtils.appState.baseUrl),
                    GreenhouseUtils.loadScript('GreenhouseAdminApp.js', GreenhouseUtils.appState.baseUrl)
                ]);

                // Initialize Dashboard App
                if (typeof GreenhouseDashboardApp === 'object' && GreenhouseDashboardApp !== null && typeof GreenhouseDashboardApp.init === 'function') {
                    console.log('Scheduler: Initializing GreenhouseDashboardApp');
                    GreenhouseDashboardApp.init(leftAppContainer, rightAppContainer);
                } else {
                    console.warn('Scheduler: GreenhouseDashboardApp not found or has no init method.');
                }

                // Initialize Patient App
                if (typeof GreenhousePatientApp === 'object' && GreenhousePatientApp !== null && typeof GreenhousePatientApp.init === 'function') {
                    console.log('Scheduler: Initializing GreenhousePatientApp');
                    GreenhousePatientApp.init(leftAppContainer, rightAppContainer);
                } else {
                    console.warn('Scheduler: GreenhousePatientApp not found or has no init method.');
                }

                // Initialize Admin App
                if (typeof GreenhouseAdminApp === 'object' && GreenhouseAdminApp !== null && typeof GreenhouseAdminApp.init === 'function') {
                    console.log('Scheduler: Initializing GreenhouseAdminApp');
                    GreenhouseAdminApp.init(leftAppContainer, rightAppContainer);
                } else {
                    console.warn('Scheduler: GreenhouseAdminApp not found or has no init method.');
                }

            } catch (error) {
                console.error('Scheduler: Error initializing one or more application instances:', error);
                GreenhouseUtils.displayError('One or more scheduler applications failed to initialize properly.');
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
            if (GreenhouseUtils.appState.isInitialized || GreenhouseUtils.appState.isLoading) {
                console.log('Scheduler: Already initialized or loading, skipping');
                return;
            }

            GreenhouseUtils.appState.isLoading = true;
            try {
                console.log('Scheduler: Starting initialization');

                // Set configuration
                GreenhouseUtils.appState.targetSelectorLeft = targetSelectorLeft;
                GreenhouseUtils.appState.targetSelectorRight = targetSelectorRight;
                GreenhouseUtils.appState.baseUrl = baseUrl;
                // Set currentView to a generic value as all views are rendered by default for development.
                GreenhouseUtils.appState.currentView = 'all'; 

                // Wait for target elements to be available
                GreenhouseUtils.appState.targetElementLeft = await GreenhouseUtils.waitForElement(targetSelectorLeft, GreenhouseUtils.config.dom.observerTimeout);
                if (targetSelectorRight) {
                    GreenhouseUtils.appState.targetElementRight = await GreenhouseUtils.waitForElement(targetSelectorRight, GreenhouseUtils.config.dom.observerTimeout);
                }

                // Load CSS first (non-blocking)
                this.loadCSS().catch(error => {
                    console.warn('Scheduler: CSS loading failed, continuing with fallback:', error);
                });

                // Insert application into DOM with delay for Wix compatibility
                await new Promise(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));
                
                // Create main application containers
                let leftAppContainer = document.createElement('section');
                leftAppContainer.id = 'greenhouse-app-container-left';
                leftAppContainer.className = 'greenhouse-app-container greenhouse-scheduler-left-panel';
                leftAppContainer.setAttribute('data-greenhouse-app', GreenhouseUtils.appState.currentView);
                
                let rightAppContainer = null;
                if (GreenhouseUtils.appState.targetSelectorRight) { // Only create right container if a right target selector exists
                    rightAppContainer = document.createElement('section');
                    rightAppContainer.id = 'greenhouse-app-container-right';
                    rightAppContainer.className = 'greenhouse-app-container greenhouse-scheduler-right-panel';
                    rightAppContainer.setAttribute('data-greenhouse-app', GreenhouseUtils.appState.currentView);
                }

                // Render ALL views by calling schedulerUI to build and attach to these containers
                await this.renderView(leftAppContainer, rightAppContainer);

                // Append the main application containers to the Wix-provided target elements
                GreenhouseUtils.appState.targetElementLeft.prepend(leftAppContainer);
                console.log('Scheduler: Left panel container inserted into DOM');
                if (rightAppContainer) {
                    GreenhouseUtils.appState.targetElementRight.prepend(rightAppContainer);
                    console.log('Scheduler: Right panel container inserted into DOM');
                }

                // Initialize ALL application instances, passing the main application containers
                await this.initializeApplication(leftAppContainer, rightAppContainer);

                // Create and append hidden elements (like modals) to the body
                const hiddenElementsFragment = GreenhouseSchedulerUI.createHiddenElements();
                document.body.appendChild(hiddenElementsFragment);
                console.log('Scheduler: Hidden elements (modals) appended to body.');


                GreenhouseUtils.appState.isInitialized = true;
                console.log('Scheduler: Initialization completed successfully');

                // Show success notification
                GreenhouseUtils.displaySuccess('Scheduling application loaded successfully', 3000);

            } catch (error) {
                console.error('Scheduler: Initialization failed:', error);
                GreenhouseUtils.appState.errors.push(error);

                const errorMessage = error.message.includes('not found') 
                    ? `Target element "${targetSelectorLeft}" not found. Please check if the page has loaded completely.`
                    : `Failed to load the scheduling application: ${error.message}`;

                this.createErrorView(errorMessage);

            } finally {
                GreenhouseUtils.appState.isLoading = false;
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
            try {
                if (!GreenhouseUtils.validateConfiguration()) {
                    console.error('Scheduler: Invalid configuration, cannot proceed');
                    GreenhouseAppsScheduler.createErrorView('Invalid application configuration. Please ensure all required attributes are present.');
                    return;
                }
            } catch (configError) {
                console.error('Scheduler: Error during configuration validation:', configError);
                GreenhouseAppsScheduler.createErrorView(`Configuration validation failed: ${configError.message}`);
                return;
            }

            // Add global error handler
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('greenhouse')) {
                    console.error('Scheduler: Global error caught:', event.error);
                    GreenhouseUtils.appState.errors.push(event.error);
                }
            });

            // Add unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Scheduler: Unhandled promise rejection:', event.reason);
                GreenhouseUtils.appState.errors.push(event.reason);
            });

            // Initialize the scheduler application
            try {
                await GreenhouseAppsScheduler.init(
                    GreenhouseUtils.appState.targetSelectorLeft,
                    GreenhouseUtils.appState.targetSelectorRight,
                    GreenhouseUtils.appState.baseUrl
                );
            } catch (initError) {
                console.error('Scheduler: Error during application initialization:', initError);
                GreenhouseAppsScheduler.createErrorView(`Application initialization failed: ${initError.message}`);
                return;
            }

        } catch (error) {
            console.error('Scheduler: Main execution failed:', error);
            GreenhouseAppsScheduler.createErrorView(`An unexpected error occurred during main execution: ${error.message}`);
        }
    }

    // Expose public API for debugging
    window.GreenhouseScheduler = {
        getState: () => ({ ...GreenhouseUtils.appState }),
        getConfig: () => ({ ...GreenhouseUtils.config }),
        reinitialize: () => {
            GreenhouseUtils.appState.isInitialized = false;
            GreenhouseUtils.appState.isLoading = false;
            return main();
        },
        // showNotification: GreenhouseAppsScheduler.showNotification.bind(GreenhouseAppsScheduler) // Removed, use GreenhouseUtils directly
    };

    // Execute main function
    main();

})();
