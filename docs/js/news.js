// Version: 0.0.1
/**
 * @file news.js
 * @description This script contains the core functionality for the Greenhouse news application.
 * It is responsible for rendering the various news views and handling
 * user interactions within those views.
 *
 * @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
 * when the news application is needed. `greenhouse.js` passes the target selector for rendering
 * via a `data-target-selector` attribute on the script tag. This design allows the news app to be
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

    console.log("Loading Greenhouse News - Version 0.1.0");

    /**
     * @description Configuration for the news application
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
        },
        /**
         * API endpoint for fetching news.
         * This will likely need to be configured to call the backend `getNews.web.js`.
         */
        api: {
            getNews: '/_functions/getNews' // Placeholder, actual path might vary
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
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        loadedScripts: new Set(),
        errors: []
    };

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script
     * @returns {boolean} True if configuration is valid
     */
    function validateConfiguration() {
        appState.targetSelector = scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = scriptElement?.getAttribute('data-base-url');
        const view = scriptElement?.getAttribute('data-view');

        if (!appState.targetSelector) {
            console.error('News: Missing required data-target-selector attribute');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('News: Missing required data-base-url attribute');
            return false;
        }

        // Ensure baseUrl ends with slash
        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

        console.log(`News: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
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
                console.log(`News: Found target element immediately: ${selector}`);
                return resolve(element);
            }

            console.log(`News: Waiting for target element: ${selector}`);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    console.log(`News: Target element found: ${selector}`);
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
                console.log(`News: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`News: ${operationName} failed on attempt ${attempt}:`, error.message);
                
                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    console.log(`News: Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    /**
     * @namespace GreenhouseAppsNews
     * @description The main object for the news application
     */
    const GreenhouseAppsNews = {
        

        /**
         * @function loadScript
         * @description Dynamically loads a script with retry logic and caching
         * @param {string} scriptName - The name of the script file (e.g., 'newsUI.js')
         * @returns {Promise<void>}
         */
        async loadScript(scriptName) {
            // Check if script already loaded
            if (appState.loadedScripts.has(scriptName)) {
                console.log(`News: Script ${scriptName} already loaded, skipping`);
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
                    console.log(`News: Script ${scriptName} already in DOM`);
                    appState.loadedScripts.add(scriptName);
                    return;
                }

                const scriptElement = document.createElement('script');
                scriptElement.dataset.scriptName = scriptName;
                scriptElement.dataset.loadedBy = 'greenhouse-news';
                scriptElement.textContent = scriptText;
                document.body.appendChild(scriptElement);

                appState.loadedScripts.add(scriptName);
                console.log(`News: Successfully loaded script ${scriptName}`);

            } catch (error) {
                console.error(`News: Failed to load script ${scriptName}:`, error);
                throw error;
            }
        },

        /**
         * @function loadCSS
         * @description Loads and applies CSS with error handling
         * @returns {Promise<void>}
         */
        async loadCSS() {
            const loadOperation = async () => {
                const response = await fetch(`${appState.baseUrl}css/news.css`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.text();
            };

            try {
                const cssText = await retryOperation(loadOperation, 'Loading CSS');

                // Check if CSS already loaded
                if (document.querySelector('style[data-greenhouse-news-css]')) {
                    console.log('News: CSS already loaded');
                    return;
                }

                const styleElement = document.createElement('style');
                styleElement.setAttribute('data-greenhouse-news-css', 'true');
                styleElement.textContent = cssText;
                document.head.appendChild(styleElement);

                console.log('News: CSS loaded successfully');

            } catch (error) {
                console.warn('News: Failed to load CSS, using fallback styles:', error);
                this.loadFallbackCSS();
            }
        },

        /**
         * @function loadFallbackCSS
         * @description Loads minimal fallback CSS if main CSS fails
         */
        loadFallbackCSS() {
            const fallbackCSS = `
                .greenhouse-layout-container { display: flex; flex-wrap: wrap; gap: 20px; }
                .greenhouse-news-item { flex: 1; min-width: 300px; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                .greenhouse-news-title { font-weight: bold; margin-bottom: 10px; }
                .greenhouse-news-date { font-size: 0.8em; color: #666; margin-bottom: 10px; }
                .greenhouse-loading-spinner { display: flex; align-items: center; gap: 10px; }
            `;

            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-greenhouse-news-fallback-css', 'true');
            styleElement.textContent = fallbackCSS;
            document.head.appendChild(styleElement);
        },

        /**
         * @function fetchNews
         * @description Fetches news data from the backend.
         * @returns {Promise<Array>} A promise that resolves with an array of news objects.
         */
        async fetchNews() {
            try {
                console.log('News: Fetching news from API');
                // Assuming the API endpoint is relative to the current domain for Wix backend functions
                const response = await fetch(config.api.getNews);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('News: Successfully fetched news:', data);
                return data;
            } catch (error) {
                console.error('News: Failed to fetch news:', error);
                this.showErrorMessage('Failed to load news. Please try again later.');
                return [];
            }
        },

        /**
         * @function renderView
         * @description Renders the appropriate view based on the current view state
         * @returns {Promise<DocumentFragment>} A promise that resolves with the DOM fragment for the view
         */
        async renderView() {
            console.log(`News: Rendering view: ${appState.currentView}`);

            let appDomFragment;

            try {
                appDomFragment = this.createDefaultNewsView();
                const newsListContainer = appDomFragment.querySelector('#news-list');

                if (newsListContainer) {
                    const newsItems = await this.fetchNews();
                    this.displayNews(newsItems, newsListContainer);
                }

                if (!appDomFragment) {
                    throw new Error('Failed to create view DOM fragment');
                }

                return appDomFragment;

            } catch (error) {
                console.error(`News: Error rendering ${appState.currentView} view:`, error);
                return this.createErrorView(`Failed to load ${appState.currentView} view: ${error.message}`);
            }
        },

        /**
         * @function createDefaultNewsView
         * @description Creates a default view for the news application.
         * @returns {DocumentFragment}
         */
        createDefaultNewsView() {
            const fragment = document.createDocumentFragment();
            const newsDiv = document.createElement('div');
            newsDiv.className = 'greenhouse-news-view';
            newsDiv.innerHTML = `
                <div class="greenhouse-news-content">
                    <h2>Greenhouse News</h2>
                    <p>Stay up-to-date with the latest news from Greenhouse Mental Health!</p>
                    <div id="news-list" class="greenhouse-layout-container">
                        <!-- News will be loaded here -->
                        <p>Loading news...</p>
                    </div>
                </div>
            `;
            fragment.appendChild(newsDiv);
            return fragment;
        },

        /**
         * @function displayNews
         * @description Displays the fetched news items in the specified container.
         * @param {Array} newsItems - An array of news objects.
         * @param {Element} container - The DOM element to display news in.
         */
        displayNews(newsItems, container) {
            container.innerHTML = ''; // Clear "Loading news..."
            if (newsItems && newsItems.length > 0) {
                newsItems.forEach(item => {
                    const newsItem = document.createElement('div');
                    newsItem.className = 'greenhouse-news-item';
                    newsItem.innerHTML = `
                        <h3 class="greenhouse-news-title">${item.title || 'Untitled News'}</h3>
                        <p class="greenhouse-news-date">${item.date ? new Date(item.date).toLocaleDateString() : ''}</p>
                        <p>${item.description || ''}</p>
                        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">Read More</a>` : ''}
                    `;
                    container.appendChild(newsItem);
                });
            } else {
                container.innerHTML = '<p>No news found at this time.</p>';
            }
        },

        /**
         * @function createErrorView
         * @description Creates an error view when rendering fails
         * @param {string} message - Error message to display
         * @returns {DocumentFragment}
         */
        createErrorView(message) {
            const fragment = document.createDocumentFragment();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'greenhouse-error-view';
            errorDiv.innerHTML = `
                <div class="greenhouse-error-content">
                    <h2>Unable to Load Application</h2>
                    <p>${message}</p>
                    <p>Please refresh the page or contact support if the problem persists.</p>
                    <button onclick="window.location.reload()" class="greenhouse-btn greenhouse-btn-primary">
                        Refresh Page
                    </button>
                </div>
            `;
            fragment.appendChild(errorDiv);
            return fragment;
        },

        /**
         * @function showSuccessMessage
         * @description Shows a success message to the user
         * @param {string} message - Success message to display
         */
        showSuccessMessage(message) {
            this.showNotification(message, 'success');
        },

        /**
         * @function showErrorMessage
         * @description Shows an error message to the user
         * @param {string} message - Error message to display
         */
        showErrorMessage(message) {
            this.showNotification(message, 'error');
        },

        /**
         * @function showNotification
         * @description Shows a notification message with auto-dismiss
         * @param {string} message - Message to display
         * @param {string} type - Type of notification ('success', 'error', 'info')
         * @param {number} [duration=5000] - Auto-dismiss duration in milliseconds
         */
        showNotification(message, type = 'info', duration = 5000) {
            // Remove any existing notifications
            const existingNotifications = document.querySelectorAll('.greenhouse-notification');
            existingNotifications.forEach(notification => notification.remove());

            const notification = document.createElement('div');
            notification.className = `greenhouse-notification greenhouse-notification-${type}`;
            notification.setAttribute('role', 'alert');
            notification.innerHTML = `
                <div class="greenhouse-notification-content">
                    <span class="greenhouse-notification-message">${message}</span>
                    <button class="greenhouse-notification-close" type="button" aria-label="Close notification">&times;</button>
                </div>
            `;

            // Position at top of viewport
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: Arial, sans-serif;
                animation: slideInRight 0.3s ease-out;
            `;

            // Apply type-specific styles
            switch (type) {
                case 'success':
                    notification.style.backgroundColor = '#d4edda';
                    notification.style.color = '#155724';
                    notification.style.border = '1px solid #c3e6cb';
                    break;
                case 'error':
                    notification.style.backgroundColor = '#f8d7da';
                    notification.style.color = '#721c24';
                    notification.style.border = '1px solid #f5c6cb';
                    break;
                default:
                    notification.style.backgroundColor = '#d1ecf1';
                    notification.style.color = '#0c5460';
                    notification.style.border = '1px solid #bee5eb';
            }

            document.body.appendChild(notification);

            // Add close functionality
            const closeBtn = notification.querySelector('.greenhouse-notification-close');
            const removeNotification = () => {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            };

            closeBtn.addEventListener('click', removeNotification);

            // Auto-dismiss
            if (duration > 0) {
                setTimeout(removeNotification, duration);
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
         * @description Inserts the application into the optimal container
         * @param {DocumentFragment} appDomFragment - The application DOM fragment
         * @param {Element} targetElement - The target element
         */
        insertApplication(appDomFragment, targetElement) {
            const containerInfo = this.findOptimalContainer(targetElement);
            
            console.log(`News: Using insertion strategy: ${containerInfo.strategy}`);

            // Create the main app container
            const appContainer = document.createElement('section');
            appContainer.id = 'greenhouse-app-container';
            appContainer.className = 'greenhouse-app-container';
            appContainer.setAttribute('data-greenhouse-app', appState.currentView);
            appContainer.style.cssText = `
                width: 100%;
                position: relative;
                padding: 20px;
                box-sizing: border-box;
                background: #fff;
            `;

            // Add the application content to the container
            appContainer.appendChild(appDomFragment);

            // Insert using the determined strategy
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

            console.log('News: Application inserted into DOM');
            return appContainer;
        },

        /**
         * @function displayError
         * @description Displays a visible error message on the page
         * @param {string} message - The error message to display
         * @param {Element} [targetElement] - Element to insert error near
         */
        displayError(message, targetElement = null) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'greenhouse-app-error';
            errorDiv.className = 'greenhouse-app-error';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.style.cssText = `
                color: #721c24;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                padding: 15px;
                margin: 20px;
                border-radius: 4px;
                text-align: center;
                font-family: Arial, sans-serif;
                z-index: 10000;
                position: relative;
            `;
            
            errorDiv.innerHTML = `
                <strong>Greenhouse News Error:</strong><br>
                ${message}
                <br><br>
                <button onclick="window.location.reload()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            `;

            if (targetElement) {
                targetElement.prepend(errorDiv);
            } else {
                document.body.insertAdjacentElement('afterbegin', errorDiv);
            }

            // Also log to console with more details
            console.error('Greenhouse News Error:', {
                message,
                targetSelector: appState.targetSelector,
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
                    console.log('News: Initializing application instance');
                    appState.currentAppInstance.init();
                } else if (appState.currentAppInstance) {
                    console.log('News: Application instance loaded but has no init method');
                } else {
                    console.log('News: No application instance to initialize');
                }
            } catch (error) {
                console.error('News: Error initializing application instance:', error);
                this.showErrorMessage('Application loaded but failed to initialize properly.');
            }
        },

        /**
         * @function init
         * @description Main initialization function for the news application
         * @param {string} targetSelector - The CSS selector for the element to load the app into
         * @param {string} baseUrl - The base URL for fetching assets
         */
        async init(targetSelector, baseUrl) {
            if (appState.isInitialized || appState.isLoading) {
                console.log('News: Already initialized or loading, skipping');
                return;
            }

            appState.isLoading = true;
            try {
                // Load utility script (if needed, for now assuming not)
                // await this.loadScript('GreenhouseUtils.js');
                
                console.log('News: Starting initialization');

                // Set configuration
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;

                // Wait for target element to be available
                appState.targetElement = await waitForElement(targetSelector);

                // Load CSS first (non-blocking)
                this.loadCSS().catch(error => {
                    console.warn('News: CSS loading failed, continuing with fallback:', error);
                });

                // Render the appropriate view
                const appDomFragment = await this.renderView();

                // Insert application into DOM with delay for Wix compatibility
                await new Promise(resolve => setTimeout(resolve, config.dom.insertionDelay));
                
                const appContainer = this.insertApplication(appDomFragment, appState.targetElement);

                // Initialize the application instance (if any specific news app logic is needed)
                this.initializeApplication();

                appState.isInitialized = true;
                console.log('News: Initialization completed successfully');

                // Show success notification
                this.showNotification('News application loaded successfully', 'success', 3000);

            } catch (error) {
                console.error('News: Initialization failed:', error);
                appState.errors.push(error);

                const errorMessage = error.message.includes('not found') 
                    ? `Target element "${targetSelector}" not found. Please check if the page has loaded completely.`
                    : `Failed to load the news application: ${error.message}`;

                this.displayError(errorMessage, appState.targetElement);
                this.showErrorMessage('Failed to load news application');

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
                console.error('News: Invalid configuration, cannot proceed');
                return;
            }

            // Add global error handler
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('greenhouse')) {
                    console.error('News: Global error caught:', event.error);
                    appState.errors.push(event.error);
                }
            });

            // Add unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('News: Unhandled promise rejection:', event.reason);
                appState.errors.push(event.reason);
            });

            // Initialize the news application
            await GreenhouseAppsNews.init(appState.targetSelector, appState.baseUrl);

        } catch (error) {
            console.error('News: Main execution failed:', error);
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

    const animationStyle = document.createElement('style');
    animationStyle.setAttribute('data-greenhouse-animations', 'true');
    animationStyle.textContent = animationCSS;
    document.head.appendChild(animationStyle);

    // Expose public API for debugging
    window.GreenhouseNews = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => {
            appState.isInitialized = false;
            appState.isLoading = false;
            return main();
        },
        showNotification: GreenhouseAppsNews.showNotification.bind(GreenhouseAppsNews)
    };

    // Execute main function
    main();

})();
