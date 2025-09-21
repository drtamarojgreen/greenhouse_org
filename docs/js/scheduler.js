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

    let resilienceObserver = null; // For resilience against DOM wipes

    console.log("Loading Greenhouse Scheduler - Version 0.1.2"); // Updated version

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
         * @description Renders the UI components into their designated containers.
         * @param {object} containers - An object containing the four container elements.
         * @returns {Promise<void>} A promise that resolves when the view is rendered.
         */
        async renderView(containers) {
            return new Promise((resolve, reject) => {
                try {
                    console.log('Scheduler: Rendering custom UI layout as per user instructions.');

                    // Clear all containers first
                    Object.values(containers).forEach(container => {
                        if (container) container.innerHTML = '';
                    });

                    // dashboardLeft: Weekly Calendar
                    if (containers.dashboardLeft) {
                        GreenhouseSchedulerUI.buildDashboardLeftPanelUI(containers.dashboardLeft, 'superadmin');
                    }

                    // dashboardRight: Monthly Calendar
                    if (containers.dashboardRight) {
                        GreenhouseSchedulerUI.buildPatientCalendarUI(containers.dashboardRight);
                    }

                    // repeaterLeft: Conflict Form
                    if (containers.repeaterLeft) {
                        GreenhouseSchedulerUI.buildAdminFormUI(containers.repeaterLeft);
                    }

                    // repeaterRight: Patient Form + any other UI components
                    if (containers.repeaterRight) {
                        GreenhouseSchedulerUI.buildPatientFormUI(containers.repeaterRight);
                        GreenhouseSchedulerUI.createInstructionsPanel(containers.repeaterRight);
                    }

                    resolve();
                } catch (error) {
                    console.error(`Scheduler: Error rendering views:`, error);
                    this.createErrorView(`Failed to load scheduler views: ${error.message}`);
                    reject(error);
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
         * @description Initializes all loaded application instances, passing the correct containers to each.
         * @param {object} containers - An object containing the four container elements.
         */
        async initializeApplication(containers) {
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
                    // Pass the admin containers
                    GreenhouseDashboardApp.init(containers.dashboardLeft, containers.dashboardRight);
                } else {
                    console.warn('Scheduler: GreenhouseDashboardApp not found or has no init method.');
                }

                // Initialize Patient App
                if (typeof GreenhousePatientApp === 'object' && GreenhousePatientApp !== null && typeof GreenhousePatientApp.init === 'function') {
                    console.log('Scheduler: Initializing GreenhousePatientApp');
                    // Pass the patient containers
                    GreenhousePatientApp.init(containers.repeaterLeft, containers.repeaterRight);
                } else {
                    console.warn('Scheduler: GreenhousePatientApp not found or has no init method.');
                }

                // Initialize Admin App
                if (typeof GreenhouseAdminApp === 'object' && GreenhouseAdminApp !== null && typeof GreenhouseAdminApp.init === 'function') {
                    console.log('Scheduler: Initializing GreenhouseAdminApp');
                    // Pass the admin right container (where the admin form is)
                    GreenhouseAdminApp.init(containers.dashboardRight);
                } else {
                    console.warn('Scheduler: GreenhouseAdminApp not found or has no init method.');
                }

            } catch (error) {
                console.error('Scheduler: Error initializing one or more application instances:', error);
                GreenhouseUtils.displayError('One or more scheduler applications failed to initialize properly.');
            }
        },

        /**
         * @function rebuildUI
         * @description Re-initialization function to be called by the MutationObserver.
         */
        async rebuildUI() {
            console.warn('Scheduler Resilience: Rebuilding UI due to DOM changes.');
            const containers = GreenhouseUtils.appState.containers;

            if (!containers || Object.values(containers).some(c => !c)) {
                console.error('Scheduler Resilience: Cannot rebuild UI, one or more containers not found.');
                if (window.GreenhouseScheduler && typeof window.GreenhouseScheduler.reinitialize === 'function') {
                    window.GreenhouseScheduler.reinitialize();
                }
                return;
            }

            // Clear the containers
            Object.values(containers).forEach(container => {
                if (container) container.innerHTML = '';
            });

            try {
                await this.renderView(containers);
                await this.initializeApplication(containers);
                console.log('Scheduler Resilience: UI rebuilt successfully.');
            } catch (error) {
                console.error('Scheduler Resilience: Error rebuilding UI:', error);
                this.createErrorView('Failed to rebuild the scheduler UI after a DOM change.');
            }
        },

        /**
         * @function observeAndReinitializeApp
         * @description Uses a MutationObserver to detect if the app's containers are removed from the DOM.
         * @param {object} containers - An object containing the four container elements.
         */
        observeAndReinitializeApp(containers) {
            let isRebuilding = false;

            const reinitializeScheduler = async () => {
                if (isRebuilding) return;
                isRebuilding = true;
                console.warn('Scheduler Resilience: Application container removed. Re-initializing...');
                if (resilienceObserver) resilienceObserver.disconnect();

                setTimeout(async () => {
                    await this.rebuildUI();
                    this.observeAndReinitializeApp(GreenhouseUtils.appState.containers);
                    isRebuilding = false;
                }, 100);
            };

            const observerCallback = (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // Check if any of our containers are no longer in the document
                        if (Object.values(containers).some(c => c && !document.body.contains(c))) {
                            reinitializeScheduler();
                            return;
                        }
                    }
                }
            };

            resilienceObserver = new MutationObserver(observerCallback);

            // Observe the parent of each container
            Object.values(containers).forEach(container => {
                if (container && container.parentElement) {
                    resilienceObserver.observe(container.parentElement, { childList: true, subtree: false });
                }
            });
            console.log('Scheduler Resilience: MutationObserver activated.');
        },

        /**
         * @function init
         * @description Main initialization function for the scheduler application.
         */
        async init() {
            if (resilienceObserver) {
                resilienceObserver.disconnect();
            }

            if (GreenhouseUtils.appState.isInitialized || GreenhouseUtils.appState.isLoading) {
                console.log('Scheduler: Already initialized or loading, skipping');
                return;
            }

            GreenhouseUtils.appState.isLoading = true;
            try {
                console.log('Scheduler: Starting initialization');

                // Set configuration from data attributes
                const scriptAttributes = document.currentScript.dataset || window._greenhouseScriptAttributes || {};
                const schedulerSelectors = JSON.parse(scriptAttributes.schedulerSelectors || '{}');
                GreenhouseUtils.appState.schedulerSelectors = schedulerSelectors;
                GreenhouseUtils.appState.baseUrl = scriptAttributes.baseUrl || window._greenhouseScriptAttributes.baseUrl;
                GreenhouseUtils.appState.currentView = scriptAttributes.view || window._greenhouseScriptAttributes.view || 'all';

                // Wait for all container elements to be available
                const [dashboardLeft, dashboardRight, repeaterLeft, repeaterRight] = await Promise.all([
                    GreenhouseUtils.waitForElement(schedulerSelectors.dashboardLeft, GreenhouseUtils.config.dom.observerTimeout),
                    GreenhouseUtils.waitForElement(schedulerSelectors.dashboardRight, GreenhouseUtils.config.dom.observerTimeout),
                    GreenhouseUtils.waitForElement(schedulerSelectors.repeaterLeft, GreenhouseUtils.config.dom.observerTimeout),
                    GreenhouseUtils.waitForElement(schedulerSelectors.repeaterRight, GreenhouseUtils.config.dom.observerTimeout)
                ]).catch(err => {
                    console.error("Scheduler: One or more containers not found.", err);
                    throw new Error("Required scheduler containers not found in the DOM.");
                });

                const containers = { dashboardLeft, dashboardRight, repeaterLeft, repeaterRight };
                GreenhouseUtils.appState.containers = containers;

                // Hide containers to prevent FOUC
                Object.values(containers).forEach(c => { if (c) c.style.visibility = 'hidden'; });

                await this.loadCSS();

                await new Promise(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));

                await this.renderView(containers);

                await this.initializeApplication(containers);

                const hiddenElementsFragment = GreenhouseSchedulerUI.createHiddenElements();
                document.body.appendChild(hiddenElementsFragment);

                GreenhouseUtils.appState.isInitialized = true;
                console.log('Scheduler: Initialization completed successfully');

                // Show containers now that rendering is complete
                Object.values(containers).forEach(c => { if (c) c.style.visibility = 'visible'; });

                GreenhouseUtils.displaySuccess('Scheduling application loaded successfully', 3000);

                this.observeAndReinitializeApp(containers);

            } catch (error) {
                console.error('Scheduler: Initialization failed:', error);
                this.createErrorView(error.message);
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
            // Simplified validation, main validation now in init
            if (!document.currentScript.dataset.schedulerSelectors) {
                console.error('Scheduler: Missing data-scheduler-selectors attribute.');
                return;
            }

            // Add global error handlers
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('greenhouse')) {
                    console.error('Scheduler: Global error caught:', event.error);
                }
            });
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Scheduler: Unhandled promise rejection:', event.reason);
            });

            await GreenhouseAppsScheduler.init();

        } catch (error) {
            console.error('Scheduler: Main execution failed:', error);
            GreenhouseAppsScheduler.createErrorView(`An unexpected error occurred: ${error.message}`);
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
        }
    };

    // Execute main function
    main();

})();
