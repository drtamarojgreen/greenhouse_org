function createElement(tag: string, attrs: Record<string, any> = {}, ...children: any[]): HTMLElement {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'className') el.className = String(v);
        else el.setAttribute(k, String(v));
    }
    for (const child of children) {
        if (child == null) continue;
        if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
        else if (child instanceof Node) el.appendChild(child);
    }
    return el;
}
import { Greenhouse } from './context.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// Version: 0.0.1
/**
 * @file books.js
 * @description This script contains the core functionality for the Greenhouse books application.
 * It is responsible for rendering the various book views and handling
 * user interactions within those views.
 *
 * @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
 * when the books application is needed. `greenhouse.js` passes the target selector for rendering
 * via a `data-target-selector` attribute on the script tag. This design allows the books app to be
 * a self-contained module that can be easily dropped into any page without requiring manual
 * configuration or initialization.
 *
 * @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
 * Invoked Function Expression (IIFE) to avoid polluting the global namespace. It also uses a
 * data-driven approach to receive information from the loader script, further decoupling the application
 * from the loader. This design is crucial for preventing conflicts with other scripts on the site,
 * which is known to be sensitive to global namespace pollution.
 */

var _exported_GreenhouseBooks: any;
(function() {
    'use strict';

    console.log("Loading Greenhouse Books - Version 0.1.0");

    /**
     * @description Configuration for the books application
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
    const appState: Record<string, any> = {
        isInitialized: false,
        isLoading: false,
        currentView: null,
        currentAppInstance: null,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        loadedScripts: new Set(),
        errors: [],
        hasCriticalError: false // New flag to track critical errors
    };

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script
     * @returns {boolean} True if configuration is valid
     */
    function validateConfiguration() {
        const globalAttributes = window._greenhouseScriptAttributes || {};

        // The books app uses a single target selector. We'll prioritize 'target-selector-left'.
        appState.targetSelector = globalAttributes['target-selector-left']
                                 || scriptElement?.getAttribute('data-target-selector-left')
                                 || scriptElement?.getAttribute('data-target-selector');

        appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');
        const view = globalAttributes['view'] || scriptElement?.getAttribute('data-view');

        // Fallback to GreenhouseUtils state if attributes are still missing
        if (!appState.targetSelector && GreenhouseUtils && GreenhouseUtils.appState) {
            appState.targetSelector = GreenhouseUtils.appState.targetSelectorLeft;
             console.log('Books: Falling back to GreenhouseUtils.appState.targetSelectorLeft');
        }
        if (!appState.baseUrl && GreenhouseUtils && GreenhouseUtils.appState) {
            appState.baseUrl = GreenhouseUtils.appState.baseUrl;
             console.log('Books: Falling back to GreenhouseUtils.appState.baseUrl');
        }

        if (!appState.targetSelector) {
            console.error('Books: Missing required data-target-selector attribute');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('Books: Missing required data-base-url attribute');
            return false;
        }

        // Ensure baseUrl ends with slash
        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

        console.log(`Books: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
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
                console.log(`Books: Found target element immediately: ${selector}`);
                return resolve(element);
            }

            console.log(`Books: Waiting for target element: ${selector}`);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    console.log(`Books: Target element found: ${selector}`);
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
                console.log(`Books: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Books: ${operationName} failed on attempt ${attempt}:`, error.message);
                
                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    console.log(`Books: Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    /**
     * @namespace GreenhouseAppsBooks
     * @description The main object for the books application
     */
        const GreenhouseAppsBooks: Record<string, any> = {
            /**
             * @function fetchAndDisplayBooks
             * @description Fetches book data from the backend and displays it in the #books-list element.
             */
            async fetchAndDisplayBooks() {
                const booksListElement = document.getElementById('books-list');
                if (!booksListElement) {
                    console.error("Books: #books-list element not found for displaying books.");
                    return;
                }

                while (booksListElement.firstChild) {
                    booksListElement.removeChild(booksListElement.firstChild);
                }
                booksListElement.appendChild(createElement('p', {}, 'Loading books...')); // Show loading state

                try {
                    // Use a relative path for the API call, assuming the server.js handles the routing
                    const response = await fetch('/_functions/getBooks'); 
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    const bookData = data.items; // Assuming the backend returns { items: [...] }

                    // Clear loading message and ensure the element is ready
                    while (booksListElement.firstChild) {
                        booksListElement.removeChild(booksListElement.firstChild);
                    }
                    
                    if (bookData && bookData.length > 0) {
                        bookData.forEach(book => {
                            const bookElement = createElement('div', { className: 'book' },
                                createElement('h3', { className: 'book-title' },
                                    createElement('a', { href: book.url, target: '_blank', rel: 'noopener noreferrer' }, book.title || 'Untitled Book')
                                ),
                                createElement('p', { className: 'book-author' }, `by ${book.author || 'Unknown Author'}`)
                            );
                            booksListElement.appendChild(bookElement);
                        });
                    } else {
                        booksListElement.appendChild(createElement('p', {}, 'No book recommendations available at this time.'));
                    }
                    this.observeBooksListElement(booksListElement); // Start observing after content is loaded
                } catch (error) {
                    console.error("Books: Error fetching books:", error);
                    // Display a less intrusive error message within the books list itself
                    while (booksListElement.firstChild) {
                        booksListElement.removeChild(booksListElement.firstChild);
                    }
                    booksListElement.appendChild(createElement('p', {}, `Failed to load books: ${error.message}. Please check the backend configuration.`));
                    this.showErrorMessage(`Failed to load books: ${error.message}`);
                    // Only show the critical overlay if it's a 404, and prevent re-initialization
                    if (error.message.includes('status: 404')) {
                        appState.hasCriticalError = true;
                        // Assuming displayCriticalErrorOverlay also uses createElement or is handled elsewhere
                        // For now, just logging as it's not defined in the provided snippet
                        console.error(`Books: Critical error overlay triggered: Failed to load books: ${error.message}`);
                    }
                }
            },

            /**
             * @function observeBooksListElement
             * @description Observes the #books-list element for removal and re-renders if it disappears.
             * @param {Element} elementToObserve - The #books-list element.
             */
            observeBooksListElement(elementToObserve) {
                if (!elementToObserve) return;

                const observer = new MutationObserver((mutations) => {
                    let wasRemoved = false;
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                            for (const removedNode of mutation.removedNodes) {
                                if (removedNode === elementToObserve) {
                                    wasRemoved = true;
                                    break;
                                }
                                if (removedNode.contains && removedNode.contains(elementToObserve)) {
                                    wasRemoved = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (wasRemoved) {
                        console.warn('Books: #books-list element was removed from DOM. Attempting to re-render.');
                        observer.disconnect(); // Disconnect old observer
                        // Re-initialize the app, which will re-render and re-fetch
                        appState.isInitialized = false;
                        appState.isLoading = false;
                        main(); 
                    }
                });

                // Observe the parent element for changes to its children
                if (elementToObserve.parentElement) {
                    observer.observe(elementToObserve.parentElement, { childList: true, subtree: true });
                    console.log('Books: Started observing #books-list element for changes.');
                } else {
                    console.warn('Books: Cannot observe #books-list element, no parent found.');
                }
            },

                    };

        // --- Main Execution Logic ---

        /**
         * Main execution function
         */
        async function main() {
            try {
                // If a critical error has occurred, prevent further re-initialization attempts
                if (appState.hasCriticalError) {
                    console.error('Books: Critical error detected, preventing re-initialization.');
                    return;
                }

                // Validate configuration from script attributes
                if (!validateConfiguration()) {
                    console.error('Books: Invalid configuration, cannot proceed');
                    return;
                }

                // Add global error handler
                window.addEventListener('error', (event) => {
                    if (event.filename && event.filename.includes('greenhouse')) {
                        console.error('Books: Global error caught:', event.error);
                        appState.errors.push(event.error);
                    }
                });

                // Add unhandled promise rejection handler
                window.addEventListener('unhandledrejection', (event) => {
                    console.error('Books: Unhandled promise rejection:', event.reason);
                    appState.errors.push(event.reason);
                });

                // Initialize the books application
                await GreenhouseAppsBooks.init(appState.targetSelector, appState.baseUrl);

            } catch (error) {
                console.error('Books: Main execution failed:', error);
            }
        }

        // Add CSS animations
        const animationCSS = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;

        const animationStyle = createElement('style', { 'data-greenhouse-animations': 'true' }, animationCSS);
        document.head.appendChild(animationStyle);

        // Expose public API for debugging
        _exported_GreenhouseBooks = {
            getState: () => ({ ...appState }),
            getConfig: () => ({ ...config }),
            reinitialize: () => {
                appState.isInitialized = false;
                appState.isLoading = false;
                return main();
            },
            showNotification: GreenhouseAppsBooks.showNotification ? GreenhouseAppsBooks.showNotification.bind(GreenhouseAppsBooks) : () => {}
        };

        // Execute main function
        main();

    })();


export var GreenhouseBooks = _exported_GreenhouseBooks;
