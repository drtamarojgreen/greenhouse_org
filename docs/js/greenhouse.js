/**
 * @file greenhouse.js
 * @description This script is the central loader for all Greenhouse applications intended to be embedded on
 * the Greenhouse Mental Health website (https://greenhousementalhealth.org). It is designed to be a single,
 * lightweight entry point that can be included in the site's header or footer.
 *
 * @integration This script is intended to be loaded on all pages of the Greenhouse Mental Health website.
 * It detects the presence of specific application containers (e.g., for the scheduler) and
 * dynamically loads the necessary application scripts and styles. This approach avoids the need to
 * manually add application-specific scripts to each page, simplifying deployment and maintenance.
 *
 * @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
 * Invoked Function Expression (IIFE) to avoid polluting the global namespace. It also uses a
 * data-driven approach to pass information to the loaded applications, further decoupling the loader
 * from the applications themselves. This design is crucial for preventing conflicts with other scripts
 * on the site, which is known to be sensitive to global namespace pollution.
 */

(function() {
    /**
     * @description Configuration for the Greenhouse application loader.
     */
    const config = {
        /**
         * The base URL for fetching application assets from the GitHub Pages site.
         */
        githubPagesBaseUrl: 'https://drtamarojgreen.github.io/greenhouse_org/',
        /**
         * The path segment that identifies the schedule page.
         */
        schedulePagePath: '/schedule/',
        /**
         * The path segment that identifies the books page.
         */
        booksPagePath: '/books/',
        /**
         * Timeout for waiting for elements to appear (in milliseconds).
         */
        elementWaitTimeout: 15000,
        /**
         * CSS selectors for the different views of the scheduling application.
         * These are specific to the Wix site structure and may need updating if the site changes.
         */
        selectors: {
            patient: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column',
            dashboard: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)',
            admin: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column',
            books: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column' // Assuming similar structure to patient view for now
        },
        /**
         * Fallback selectors to try if primary selectors fail.
         */
        fallbackSelectors: {
            patient: '.wixui-column-strip__column:first-child',
            dashboard: '.wixui-column-strip__column:nth-child(2)',
            admin: '.wixui-column-strip__column:last-child',
            books: '.wixui-column-strip__column:first-child' // Assuming similar fallback to patient view for now
        }
    };

    /**
     * @function waitForElement
     * @description Waits for an element to appear in the DOM, with fallback options.
     * @param {string|string[]} selectors - Primary selector or array of selectors to try.
     * @param {number} [timeout=15000] - Maximum time to wait in milliseconds.
     * @returns {Promise<Element>} Promise that resolves with the found element.
     */
    function waitForElement(selectors, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
            
            // Check if element already exists
            for (const selector of selectorArray) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`Greenhouse: Found element with selector: ${selector}`);
                    return resolve(element);
                }
            }
            
            console.log(`Greenhouse: Waiting for element with selectors: ${selectorArray.join(', ')}`);
            
            const observer = new MutationObserver(() => {
                for (const selector of selectorArray) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`Greenhouse: Element found with selector: ${selector}`);
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
     * @function loadScript
     * @description Asynchronously loads a script from a given URL and injects it into the page.
     * @param {string} url - The URL of the script to load.
     * @param {Object} [attributes={}] - An optional map of data attributes to set on the script element.
     */
    async function loadScript(url, attributes = {}) {
        try {
            console.log(`Greenhouse: Loading script from ${url}`);
            
            // Fetch the script content from the provided URL.
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load script: ${url} - ${response.statusText}`);
            const scriptText = await response.text();

            // Create a new script element.
            const scriptElement = document.createElement('script');
            scriptElement.textContent = scriptText;

            // Set any data attributes passed in the attributes object.
            for (const [key, value] of Object.entries(attributes)) {
                scriptElement.setAttribute(`data-${key}`, value);
            }

            // Append the script element to the body to execute it.
            document.body.appendChild(scriptElement);
            console.log(`Greenhouse: Successfully loaded script from ${url}`);
        } catch (error) {
            console.error(`Greenhouse: Error loading script ${url}:`, error);
        }
    }

    /**
     * @function loadSchedulerApplication
     * @description Loads the scheduler application after ensuring the target element exists.
     */
    async function loadSchedulerApplication() {
        try {
            console.log('Greenhouse: Initializing scheduler application');
            
            // Parse URL parameters to determine the view.
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view') || 'dashboard'; // Default to dashboard
            
            console.log(`Greenhouse: Loading scheduler for view: ${view}`);

            // Determine the correct selectors to try
            let selectorsToTry = [];
            
            if (view === 'patient' && config.selectors.patient) {
                selectorsToTry.push(config.selectors.patient);
                if (config.fallbackSelectors.patient) {
                    selectorsToTry.push(config.fallbackSelectors.patient);
                }
            } else if (view === 'admin' && config.selectors.admin) {
                selectorsToTry.push(config.selectors.admin);
                if (config.fallbackSelectors.admin) {
                    selectorsToTry.push(config.fallbackSelectors.admin);
                }
            } else {
                selectorsToTry.push(config.selectors.dashboard);
                if (config.fallbackSelectors.dashboard) {
                    selectorsToTry.push(config.fallbackSelectors.dashboard);
                }
            }

            // Wait for the target element to be available
            const targetElement = await waitForElement(selectorsToTry);
            const targetSelector = selectorsToTry.find(selector => document.querySelector(selector));

            // Define the attributes to be passed to the scheduler script.
            const schedulerAttributes = {
                'target-selector': targetSelector,
                'base-url': config.githubPagesBaseUrl,
                'view': view
            };

            // Load the scheduler script and pass the necessary data attributes to it.
            await loadScript(`${config.githubPagesBaseUrl}js/scheduler.js`, schedulerAttributes);
            
        } catch (error) {
            console.error('Greenhouse: Failed to load scheduler application:', error);
        }
    }

    /**
     * @function loadBooksApplication
     * @description Loads the books application after ensuring the target element exists.
     */
    async function loadBooksApplication() {
        try {
            console.log('Greenhouse: Initializing books application');
            
            // Parse URL parameters to determine the view.
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view') || 'default'; // Default to 'default' view for books
            
            console.log(`Greenhouse: Loading books for view: ${view}`);

            // Determine the correct selectors to try
            let selectorsToTry = [];
            
            // For books, we'll use the 'books' selector regardless of a specific 'view' parameter for now
            if (config.selectors.books) {
                selectorsToTry.push(config.selectors.books);
                if (config.fallbackSelectors.books) {
                    selectorsToTry.push(config.fallbackSelectors.books);
                }
            } else {
                // Fallback if no specific books selector is defined
                selectorsToTry.push('.wixui-column-strip__column:first-child');
            }

            // Wait for the target element to be available
            const targetElement = await waitForElement(selectorsToTry);
            const targetSelector = selectorsToTry.find(selector => document.querySelector(selector));

            // Define the attributes to be passed to the books script.
            const booksAttributes = {
                'target-selector': targetSelector,
                'base-url': config.githubPagesBaseUrl,
                'view': view
            };

            // Load the books script and pass the necessary data attributes to it.
            await loadScript(`${config.githubPagesBaseUrl}js/books.js`, booksAttributes);
            
        } catch (error) {
            console.error('Greenhouse: Failed to load books application:', error);
        }
    }

    /**
     * @function initialize
     * @description Main initialization function that runs when the DOM is ready.
     */
    async function initialize() {
        console.log('Greenhouse: Initializing application loader');
        
        // Load the visual effects script on all pages (no need to wait for specific elements)
        loadScript(`${config.githubPagesBaseUrl}js/effects.js`);

        // Check if the current page is the schedule page.
        if (window.location.pathname.includes(config.schedulePagePath)) {
            await loadSchedulerApplication();
        } else if (window.location.pathname.includes(config.booksPagePath)) {
            await loadBooksApplication();
        }
    }

    // --- Main execution logic ---
    
    // Wait for DOM to be ready, then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM is already ready, but give Wix a moment to finish rendering
        setTimeout(initialize, 1000);
    }

})();
