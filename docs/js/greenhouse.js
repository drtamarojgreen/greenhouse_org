// greenhouse.js

(function() {
    const githubPagesBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/';
    const schedulePagePath = '/schedule/'; // Adjust if the path is different on the live site
    let targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column';

    // Function to load and execute a script by injecting its content
    async function loadScript(url, callback) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load script: ${url} - ${response.statusText}`);
            const scriptText = await response.text();

            const scriptElement = document.createElement('script');
            scriptElement.textContent = scriptText;
            // Append to head for scripts that might define global functions or variables early
            // or to body for scripts that interact with DOM after it's mostly parsed.
            // For now, appending to body as app.js and scheduler.js interact with DOM.
            document.body.appendChild(scriptElement);

            if (callback) {
                callback();
            }
        } catch (error) {
            // console.error(`Error loading script ${url}:`, error);
        }
    }

    // --- Main execution logic ---

    // Load effects.js on all pages
    loadScript(`${githubPagesBaseUrl}js/effects.js`); // Updated path

    // Check if it's the schedule page and load scheduler.js conditionally
    if (window.location.pathname.includes(schedulePagePath)) {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');

        if (view === 'dashboard') {
            targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)';
        } else if (view === 'admin') {
            targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column';
        }

        loadScript(`${githubPagesBaseUrl}js/scheduler.js`, () => { // Updated path
            // Once scheduler.js is loaded, call its main function
            // It should now expose loadScheduleApp globally
            if (typeof window.loadScheduleApp === 'function') {
                window.loadScheduleApp(targetSelector, githubPagesBaseUrl);
            } else {
                console.error('loadScheduleApp function not found in scheduler.js.');
            }
        });
    }
})();