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
     * @constant {string} githubPagesBaseUrl - The base URL for fetching application assets.
     * This points to the GitHub Pages site where the application assets are hosted.
     */
    const githubPagesBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/';

    /**
     * @constant {string} schedulePagePath - The path segment that identifies the schedule page.
     * This is used to determine whether to load the scheduling application.
     */
    const schedulePagePath = '/schedule/';

    /**
     * @description The default CSS selector for the target element where the scheduler app will be rendered.
     * This can be overridden based on the view (e.g., dashboard, admin).
     * @type {string}
     */
    let targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column';

    /**
     * @function loadScript
     * @description Asynchronously loads a script from a given URL and injects it into the page.
     * @param {string} url - The URL of the script to load.
     * @param {string} [selector] - An optional CSS selector to be passed to the loaded script via a data attribute.
     */
    async function loadScript(url, selector) {
        try {
            // Fetch the script content from the provided URL.
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load script: ${url} - ${response.statusText}`);
            const scriptText = await response.text();

            // Create a new script element.
            const scriptElement = document.createElement('script');
            scriptElement.textContent = scriptText;

            // If a selector is provided, set it as a data attribute on the script element.
            // This allows the loaded script to know where to render its content.
            if (selector) {
                scriptElement.setAttribute('data-target-selector', selector);
            }

            // Append the script element to the body to execute it.
            document.body.appendChild(scriptElement);
        } catch (error) {
            console.error(`Error loading script ${url}:`, error);
        }
    }

    // --- Main execution logic ---

    // Load the visual effects script on all pages.
    loadScript(`${githubPagesBaseUrl}js/effects.js`);

    // Check if the current page is the schedule page.
    if (window.location.pathname.includes(schedulePagePath)) {
        // Parse URL parameters to determine the view.
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');

        // Adjust the target selector based on the view.
        if (view === 'dashboard') {
            targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)';
        } else if (view === 'admin') {
            targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column';
        }

        // Load the scheduler script and pass the target selector to it.
        loadScript(`${githubPagesBaseUrl}js/scheduler.js`, targetSelector);
    }
})();