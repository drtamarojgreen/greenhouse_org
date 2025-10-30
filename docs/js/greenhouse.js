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
    // Import GreenhouseUtils
    const GreenhouseUtils = window.GreenhouseUtils;
    if (!GreenhouseUtils) {
        console.error('Greenhouse: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded before greenhouse.js.');
        return;
    }

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
         * The path segment that identifies the videos page.
         */
        videosPagePath: '/videos/',
        /**
         * The path segment that identifies the news page.
         */
        newsPagePath: '/news/',
        /**
         * The path segment that identifies the models page.
         */
        modelsPagePath: '/models/',
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
            patientRight: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)', // Generic right column selector
            dashboardLeft: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column', // First column for schedule/conflicts
            dashboardRight: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)', // Second column for calendar
            admin: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column',
            books: '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section', // User-specified selector for books
            videos: '.wixui-repeater', // Selector for the videos repeater
            news: '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column', // Reverting to a generic column selector
            models: '#SITE_PAGES_TRANSITION_GROUP', // A general selector for the main content area
            repeaterContainer: '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div:nth-child(1) > section.wixui-section',
            repeaterLeft: '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div:nth-child(1) > section.wixui-section > div:nth-child(2) > div > section > div.V5AUxf > div:nth-child(1)',
            repeaterRight: '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div:nth-child(1) > section.wixui-section > div:nth-child(2) > div > section > div.V5AUxf > div:nth-child(2)'
        },
        /**
         * Fallback selectors to try if primary selectors fail.
         */
        fallbackSelectors: {
            patient: '.wixui-column-strip__column:first-child',
            patientRight: '.wixui-column-strip__column:nth-child(2)', // Fallback for patient instructions
            dashboardLeft: '.wixui-column-strip__column:first-child',
            dashboardRight: '.wixui-column-strip__column:nth-child(2)',
            admin: '.wixui-column-strip__column:last-child',
            books: 'section.wixui-section', // Fallback to a more general section if the specific one isn't found
            videos: '.wixui-column-strip__column:first-child', // Fallback to a generic column selector
            news: '.wixui-column-strip__column:first-child', // Reverting to a generic column selector
            models: 'main' // Fallback to the main element
        }
    };

    /**
     * @function loadApplication
     * @description Generic function to load an application.
     * @param {string} appName - The name of the application (e.g., 'scheduler', 'books').
     * @param {string} scriptName - The main script file for the application (e.g., 'scheduler.js').
     * @param {string|string[]} mainSelector - The primary CSS selector(s) for the application's main container.
     * @param {string|string[]} [fallbackSelector] - Optional fallback CSS selector(s).
     * @param {string} [uiScriptName] - Optional UI script file (e.g., 'schedulerUI.js').
     * @param {string} [viewParam='default'] - The URL parameter for the view (e.g., 'dashboard' for scheduler).
     * @param {string} [rightPanelSelector] - Optional selector for a right panel (e.g., for dashboard view).
     * @param {string} [rightPanelFallbackSelector] - Optional fallback selector for a right panel.
     * @param {object} [extraAttributes={}] - Optional object of extra data attributes to add to the script tag.
     */
    async function loadApplication(appName, scriptName, mainSelector, fallbackSelector, uiScriptName = null, viewParam = 'default', rightPanelSelector = null, rightPanelFallbackSelector = null, extraAttributes = {}) {
        try {
            console.log(`Greenhouse: Initializing ${appName} application`);
            
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view') || viewParam;
            
            console.log(`Greenhouse: Loading ${appName} for view: ${view}`);

            let selectorsToTryLeft = Array.isArray(mainSelector) ? [...mainSelector] : [mainSelector];
            if (fallbackSelector) {
                selectorsToTryLeft.push(...(Array.isArray(fallbackSelector) ? fallbackSelector : [fallbackSelector]));
            }

            let targetSelectorLeft = null;
            let targetSelectorRight = null;

            // Determine target selectors based on whether a right panel is expected
            if (rightPanelSelector) {
                let selectorsToTryRight = Array.isArray(rightPanelSelector) ? [...rightPanelSelector] : [rightPanelSelector];
                if (rightPanelFallbackSelector) {
                    selectorsToTryRight.push(...(Array.isArray(rightPanelFallbackSelector) ? rightPanelFallbackSelector : [rightPanelFallbackSelector]));
                }

                // Wait for both left and right target elements
                const [targetElementLeft, targetElementRight] = await Promise.all([
                    GreenhouseUtils.waitForElement(selectorsToTryLeft, config.elementWaitTimeout),
                    GreenhouseUtils.waitForElement(selectorsToTryRight, config.elementWaitTimeout)
                ]);

                // Find the actual selector that matched for both
                targetSelectorLeft = selectorsToTryLeft.find(selector => document.querySelector(selector));
                targetSelectorRight = selectorsToTryRight.find(selector => document.querySelector(selector));

            } else {
                // For single-panel applications, only wait for the left target element
                const targetElement = await GreenhouseUtils.waitForElement(selectorsToTryLeft, config.elementWaitTimeout);
                targetSelectorLeft = selectorsToTryLeft.find(selector => document.querySelector(selector));
            }

            const appAttributes = {
                'target-selector-left': targetSelectorLeft,
                'target-selector-right': targetSelectorRight, // Will be null if not a two-panel app
                'base-url': config.githubPagesBaseUrl,
                'view': view,
                ...extraAttributes
            };

            if (uiScriptName) {
                await GreenhouseUtils.loadScript(uiScriptName, config.githubPagesBaseUrl);
            }
            await GreenhouseUtils.loadScript(scriptName, config.githubPagesBaseUrl, appAttributes);
            
        } catch (error) {
            console.error(`Greenhouse: Failed to load ${appName} application:`, error);
        }
    }

    /**
     * @function loadSchedulerApplication
     * @description Loads the scheduler application.
     * As per user request, this function now loads all scheduler UI elements by default for development.
     * The 'view' parameter is no longer used to conditionally load UI components here,
     * but is still passed to `scheduler.js` for potential future use in app-specific logic.
     */
    async function loadSchedulerApplication() {
        console.log(`Greenhouse: Loading scheduler application (displaying all views for development).`);

        const schedulerSelectors = {
            dashboardLeft: config.selectors.dashboardLeft,
            dashboardRight: config.selectors.dashboardRight,
            repeaterLeft: config.selectors.repeaterLeft,
            repeaterRight: config.selectors.repeaterRight
        };

        const extraAttributes = {
            'data-scheduler-selectors': JSON.stringify(schedulerSelectors)
        };

        // The mainSelector and rightPanelSelector are now just for finding *any* valid container to start.
        // The real work is done in scheduler.js with the full set of selectors.
        const mainSelector = [config.selectors.dashboardLeft, config.selectors.repeaterLeft];
        const fallbackSelector = config.fallbackSelectors.dashboardLeft;
        const rightPanelSelector = [config.selectors.dashboardRight, config.selectors.repeaterRight];
        const rightPanelFallbackSelector = config.fallbackSelectors.dashboardRight;

        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view') || 'all';

        await loadApplication(
            'scheduler',
            'scheduler.js',
            mainSelector,
            fallbackSelector,
            'schedulerUI.js',
            view,
            rightPanelSelector,
            rightPanelFallbackSelector,
            extraAttributes
        );
    }

    /**
     * @function loadBooksApplication
     * @description Loads the books application after ensuring the target element exists.
     */
    async function loadBooksApplication() {
        await loadApplication(
            'books',
            'books.js',
            config.selectors.books,
            config.fallbackSelectors.books
        );
    }

    /**
     * @function loadVideosApplication
     * @description Loads the videos application after ensuring the target element exists.
     */
    async function loadVideosApplication() {
        await loadApplication(
            'videos',
            'videos.js',
            config.selectors.videos,
            config.fallbackSelectors.videos
        );
    }

    /**
     * @function loadNewsApplication
     * @description Loads the news application after ensuring the target element exists.
     */
    async function loadNewsApplication() {
        await loadApplication(
            'news',
            'news.js',
            config.selectors.news,
            config.fallbackSelectors.news
        );
    }

    /**
     * @function loadModelsApplication
     * @description Loads the models application.
     */
    async function loadModelsApplication() {
        try {
            console.log('Greenhouse: Initializing models application');

            // First, load the specific CSS for the models page
            await GreenhouseUtils.loadStylesheet('css/model.css', config.githubPagesBaseUrl);

            // Then, wait for the target element to be available
            const targetElement = await GreenhouseUtils.waitForElement([config.selectors.models, config.fallbackSelectors.models], config.elementWaitTimeout);
            const targetSelector = targetElement ? (document.querySelector(config.selectors.models) ? config.selectors.models : config.fallbackSelectors.models) : null;

            if (!targetSelector) {
                throw new Error('Models application container not found');
            }

            // Now, load the main script for the models application
            await GreenhouseUtils.loadScript('js/models.js', config.githubPagesBaseUrl);

            // Finally, initialize the application
            if (window.GreenhouseModels && typeof window.GreenhouseModels.init === 'function') {
                window.GreenhouseModels.init(targetSelector);
            } else {
                console.error('Greenhouse: GreenhouseModels.init function not found after loading script.');
            }

        } catch (error) {
            console.error('Greenhouse: Failed to load models application:', error);
        }
    }

    /**
     * @function initialize
     * @description Main initialization function that runs when the DOM is ready.
     */
    async function initialize() {
        console.log('Greenhouse: Initializing application loader');
        
        // Load the visual effects script on all pages (no need to wait for specific elements)
        GreenhouseUtils.loadScript('effects.js', config.githubPagesBaseUrl);

        // Check if the current page is the schedule page.
        if (window.location.pathname.includes(config.schedulePagePath)) {
            await loadSchedulerApplication();
        } else if (window.location.pathname.includes(config.booksPagePath)) {
            await loadBooksApplication();
        } else if (window.location.pathname.includes(config.videosPagePath)) {
            //await loadVideosApplication();


            
        } else if (window.location.pathname.includes(config.newsPagePath)) {
            await loadNewsApplication();
        } else if (window.location.pathname.includes(config.modelsPagePath)) {
            await loadModelsApplication();
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
