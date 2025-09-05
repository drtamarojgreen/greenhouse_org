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
         * CSS selectors for the different views of the scheduling application.
         * These are specific to the Wix site structure and may need updating if the site changes.
         */
        selectors: {
            patient: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column',
            dashboard: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)',
            admin: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column'
        }
    };

    /**
     * @function loadScript
     * @description Asynchronously loads a script from a given URL and injects it into the page.
     * @param {string} url - The URL of the script to load.
     * @param {Object} [attributes={}] - An optional map of data attributes to set on the script element.
     */
    async function loadScript(url, attributes = {}) {
        try {
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
        } catch (error) {
            console.error(`Error loading script ${url}:`, error);
        }
    }

    // --- Main execution logic ---

    // Load the visual effects script on all pages.
    loadScript(`${config.githubPagesBaseUrl}js/effects.js`);

    // Check if the current page is the schedule page.
    if (window.location.pathname.includes(config.schedulePagePath)) {
        // Parse URL parameters to determine the view.
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view'); // e.g., 'dashboard' or 'admin'

        // Determine the correct selector, defaulting to the patient view.
        let targetSelector;
        if (view === 'dashboard' && config.selectors.dashboard) {
            targetSelector = config.selectors.dashboard;
        } else if (view === 'admin' && config.selectors.admin) {
            targetSelector = config.selectors.admin;
        } else {
            targetSelector = config.selectors.patient;
        }

        // Define the attributes to be passed to the scheduler script.
        const schedulerAttributes = {
            'target-selector': targetSelector,
            'base-url': config.githubPagesBaseUrl
        };

        // Load the scheduler script and pass the necessary data attributes to it.
        loadScript(`${config.githubPagesBaseUrl}js/scheduler.js`, schedulerAttributes);
    }
})();