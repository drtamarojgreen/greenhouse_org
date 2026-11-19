import { Greenhouse } from './context.js';
import { GreenhouseAdminApp } from './GreenhouseAdminApp.js';
import { GreenhouseDashboardApp } from './GreenhouseDashboardApp.js';
import { GreenhousePatientApp } from './GreenhousePatientApp.js';
import { GreenhouseReactCompatibility } from './GreenhouseReactCompatibility.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhouseSchedulerUI } from './schedulerUI.js';
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

var _exported_GreenhouseScheduler: any;
(async function() {
    'use strict';

    // Enhanced dependency loading with React compatibility for Firefox
    const loadDependencies = async () => {};

    // Use React compatibility layer if available and on Firefox
    if (GreenhouseReactCompatibility && GreenhouseReactCompatibility.isFirefox) {
        console.log('Scheduler: Using React compatibility layer for Firefox');
        await GreenhouseReactCompatibility.loadDependencyWithReactSupport(loadDependencies, 'GreenhouseUtils');
    } else {
        await loadDependencies();
    }

    // Immediately capture and then clean up the global attributes
    const scriptAttributes: Record<string, any> = {
        'base-url': '/',
        'data-scheduler-selectors': JSON.stringify({
            dashboardLeft: '#schedule-dashboard-left',
            dashboardRight: '#schedule-dashboard-right',
            repeaterLeft: '#schedule-repeater-left',
            repeaterRight: '#schedule-repeater-right'
        }),
        ...window._greenhouseScriptAttributes
    };
    if (window._greenhouseScriptAttributes) {
        delete window._greenhouseScriptAttributes;
    }

    // Import GreenhouseUtils and GreenhouseSchedulerUI

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
            if (!(document.querySelector as any)(`link[href="${cssUrl}"]`)) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.type = 'text/css';
                linkElement.href = cssUrl;
                linkElement.setAttribute('data-greenhouse-scheduler-css', 'true');
                document.head.appendChild(linkElement);
                await new Promise<any>((resolve, reject) => {
                    linkElement.onload = () => {
                        console.log(`Scheduler: CSS ${cssUrl} loaded successfully`);
                        resolve(undefined);
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
        async renderView(containers, view = 'patient') {
            return new Promise<any>((resolve, reject) => {
                try {
                    console.log(`Scheduler: Rendering view for: ${view}`);

                    // Clear all containers first
                    Object.values(containers).forEach((container: any) => {
                        if (container) container.innerHTML = '';
                    });

                    // Build the view selector in the top-right container
                    if (containers.repeaterRight) {
                        GreenhouseSchedulerUI.buildViewSelectorUI(containers.repeaterRight);
                    }

                    switch (view) {
                        case 'patient':
                            if (containers.repeaterLeft) {
                                GreenhouseSchedulerUI.buildPatientCalendarUI(containers.repeaterLeft);
                            }
                            if (containers.repeaterRight) {
                                GreenhouseSchedulerUI.buildPatientFormUI(containers.repeaterRight);
                                GreenhouseSchedulerUI.createInstructionsPanel(containers.repeaterRight);
                            }
                            break;
                        case 'dashboard':
                            if (containers.dashboardLeft) {
                                GreenhouseSchedulerUI.buildDashboardLeftPanelUI(containers.dashboardLeft, 'superadmin');
                            }
                            if (containers.dashboardRight) {
                                GreenhouseSchedulerUI.buildPatientCalendarUI(containers.dashboardRight);
                            }
                            break;
                        case 'admin':
                            if (containers.repeaterLeft) {
                                GreenhouseSchedulerUI.buildAdminAppointmentFormUI(containers.repeaterLeft);
                            }
                            break;
                        default:
                            console.warn(`Scheduler: Unknown view selected: ${view}`);
                            // Default to patient view
                            if (containers.repeaterLeft) {
                                GreenhouseSchedulerUI.buildPatientCalendarUI(containers.repeaterLeft);
                            }
                            if (containers.repeaterRight) {
                                GreenhouseSchedulerUI.buildPatientFormUI(containers.repeaterRight);
                            }
                            break;
                    }

                    resolve(undefined);
                } catch (error) {
                    console.error(`Scheduler: Error rendering view '${view}':`, error);
                    this.createErrorView(`Failed to load scheduler view: ${error.message}`);
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
        async initializeApplication(containers, view = 'patient') {
            console.log(`Scheduler: Initializing application for view: ${view}`);
            try {
                switch (view) {
                    case 'patient':
                        const { GreenhousePatientApp } = await import('./GreenhousePatientApp.js');
                        if (typeof GreenhousePatientApp === 'object' && GreenhousePatientApp !== null && typeof GreenhousePatientApp.init === 'function') {
                            console.log('Scheduler: Initializing GreenhousePatientApp');
                            GreenhousePatientApp.init(containers.repeaterLeft, containers.repeaterRight);
                        } else {
                            console.warn('Scheduler: GreenhousePatientApp not found or has no init method.');
                        }
                        break;
                    case 'dashboard':
                        const { GreenhouseDashboardApp } = await import('./GreenhouseDashboardApp.js');
                        if (typeof GreenhouseDashboardApp === 'object' && GreenhouseDashboardApp !== null && typeof GreenhouseDashboardApp.init === 'function') {
                            console.log('Scheduler: Initializing GreenhouseDashboardApp');
                            GreenhouseDashboardApp.init(containers.dashboardLeft, containers.dashboardRight);
                        } else {
                            console.warn('Scheduler: GreenhouseDashboardApp not found or has no init method.');
                        }
                        break;
                    case 'admin':
                        const { GreenhouseAdminApp } = await import('./GreenhouseAdminApp.js');
                        if (typeof GreenhouseAdminApp === 'object' && GreenhouseAdminApp !== null && typeof GreenhouseAdminApp.init === 'function') {
                            console.log('Scheduler: Initializing GreenhouseAdminApp');
                            GreenhouseAdminApp.init(containers.repeaterLeft);
                        } else {
                            console.warn('Scheduler: GreenhouseAdminApp not found or has no init method.');
                        }
                        break;
                    default:
                        console.error(`Scheduler: Unknown view '${view}' passed to initializeApplication.`);
                        GreenhouseUtils.displayError(`Cannot initialize unknown view: ${view}`);
                        break;
                }
            } catch (error) {
                console.error(`Scheduler: Error initializing application for view '${view}':`, error);
                GreenhouseUtils.displayError(`An error occurred while loading the ${view} view.`);
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
                if (GreenhouseScheduler && typeof GreenhouseScheduler.reinitialize === 'function') {
                    GreenhouseScheduler.reinitialize();
                }
                return;
            }

            // Clear the containers
            Object.values(containers).forEach((container: any) => {
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

            const reinitializeScheduler = () => {
                if (isRebuilding) return;
                isRebuilding = true;
                console.warn('Scheduler Resilience: DOM conflict detected. Re-initializing scheduler...');
                if (resilienceObserver) resilienceObserver.disconnect(); // Stop observing to prevent loops.

                const interval = setInterval(() => {
                    if (GreenhouseScheduler && typeof GreenhouseScheduler.reinitialize === 'function') {
                        clearInterval(interval);
                        GreenhouseScheduler.reinitialize();
                    } else {
                        console.error("Scheduler Resilience: Cannot find global reinitialize function to recover from DOM wipe.");
                    }
                }, 5000);
            };

            const observerCallback = (mutationsList) => {
                if (!GreenhouseUtils.appState.isInitialized || isRebuilding) return;

                const topLevelUiIds = [
                    'greenhouse-patient-form',
                    'greenhouse-dashboard-app-schedule-container',
                    'greenhouse-admin-form',
                    'greenhouse-patient-app-calendar-container'
                ];

                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                        for (const removedNode of mutation.removedNodes) {
                            if (removedNode.nodeType === Node.ELEMENT_NODE && topLevelUiIds.includes(removedNode.id)) {
                                console.warn(`Scheduler Resilience: Detected removal of a top-level UI element (${removedNode.id}). Triggering rebuild.`);
                                reinitializeScheduler();
                                return;
                            }
                        }
                    }
                }
            };

            resilienceObserver = new MutationObserver(observerCallback);

            // Observe the containers themselves for changes to their direct children.
            Object.values(containers).forEach(container => {
                if (container) {
                    resilienceObserver.observe(container, { childList: true });
                }
            });
            console.log('Scheduler Resilience: MutationObserver activated on containers to detect content wipes.');
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
                const schedulerSelectorsRaw = scriptAttributes['data-scheduler-selectors'] || {};
                const schedulerSelectors = JSON.parse(schedulerSelectorsRaw);
                GreenhouseUtils.appState.schedulerSelectors = schedulerSelectors;
                GreenhouseUtils.appState.baseUrl = scriptAttributes['base-url'];
                GreenhouseUtils.appState.currentView = 'patient'; // Default view

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
                Object.values(containers).forEach((c: any) => { if (c) c.style.visibility = 'hidden'; });

                await this.loadCSS();

                await new Promise<any>(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));

                await this.renderView(containers, GreenhouseUtils.appState.currentView);

                await this.initializeApplication(containers, GreenhouseUtils.appState.currentView);

                const hiddenElementsFragment = GreenhouseSchedulerUI.createHiddenElements();
                document.body.appendChild(hiddenElementsFragment);

                // Add event listener for the view selector
                const viewSelector = document.getElementById('greenhouse-view-selector');
                if (viewSelector) {
                    viewSelector.addEventListener('change', (event) => {
                        const newView = (event.target as any).value;
                        this.switchView(newView);
                    });
                }

                GreenhouseUtils.appState.isInitialized = true;
                console.log('Scheduler: Initialization completed successfully');

                // Show containers now that rendering is complete
                Object.values(containers).forEach((c: any) => { if (c) c.style.visibility = 'visible'; });

                GreenhouseUtils.displaySuccess('Scheduling application loaded successfully', 3000);

                this.observeAndReinitializeApp(containers);

            } catch (error) {
                console.error('Scheduler: Initialization failed:', error);
                this.createErrorView(error.message);
            } finally {
                GreenhouseUtils.appState.isLoading = false;
            }
        },

        async switchView(newView) {
            console.log(`Scheduler: Switching to view: ${newView}`);
            GreenhouseUtils.appState.currentView = newView;
            const containers = GreenhouseUtils.appState.containers;

            // Hide containers to prevent FOUC
            Object.values(containers).forEach((c: any) => { if (c) c.style.visibility = 'hidden'; });

            await this.renderView(containers, newView);
            await this.initializeApplication(containers, newView);

            // Selectively show containers based on the new view
            const viewContainerMap = {
                patient: ['repeaterLeft', 'repeaterRight'],
                dashboard: ['dashboardLeft', 'dashboardRight'],
                admin: ['repeaterLeft']
            };

            const requiredContainerKeys = viewContainerMap[newView] || [];

            Object.keys(containers).forEach(key => {
                if (containers[key]) {
                    if (requiredContainerKeys.includes(key)) {
                        containers[key].style.visibility = 'visible';
                    } else {
                        containers[key].style.visibility = 'hidden';
                    }
                }
            });

            console.log(`Scheduler: Switched to ${newView} view.`);
        }
    };

    // --- Main Execution Logic ---

    /**
     * Main execution function
     */
    async function main() {
        try {
            // Simplified validation, main validation now in init
            const schedulerSelectorsAttr = scriptAttributes.schedulerSelectors || scriptAttributes['data-scheduler-selectors'];
            if (!schedulerSelectorsAttr) {
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

            // Listen for a request to re-initialize the scheduler.
            // This single listener handles the response to a DOM conflict.
            document.addEventListener('greenhouse:request-reinitialization', (e: any) => {
                console.warn('Scheduler Resilience: Received re-initialization request.', e.detail.message);
                if (GreenhouseScheduler && typeof GreenhouseScheduler.reinitialize === 'function') {
                    GreenhouseScheduler.reinitialize();
                } else {
                    console.error("Scheduler Resilience: Cannot re-initialize. The global GreenhouseScheduler API is not available.");
                }
            });

            await GreenhouseAppsScheduler.init();

        } catch (error) {
            console.error('Scheduler: Main execution failed:', error);
            GreenhouseAppsScheduler.createErrorView(`An unexpected error occurred: ${error.message}`);
        }
    }

    // Expose public API for debugging
    _exported_GreenhouseScheduler = {
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


export var GreenhouseScheduler = _exported_GreenhouseScheduler;
