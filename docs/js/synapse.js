// docs/js/synapse.js
// Entry Point for Synapse Simulation Application
// For consistency with other pages, this script forwards to synapse_app.js
// which contains the master application logic and dependency loader.

(async function () {
    'use strict';

    // Check if GreenhouseUtils is already loaded (it should be)
    if (window.GreenhouseUtils) {
        const script = document.currentScript;
        const baseUrl = script ? script.getAttribute('data-base-url') : null;

        // Pass attributes through to synapse_app.js
        const attributes = {
            'data-target-selector-left': script ? script.getAttribute('data-target-selector-left') : null,
            'data-base-url': baseUrl
        };

        await window.GreenhouseUtils.loadScript('synapse_app.js', baseUrl || '', attributes);
    } else {
        // Fallback polling if Utils not yet on window
        const interval = setInterval(() => {
            if (window.GreenhouseUtils) {
                clearInterval(interval);
                const script = document.querySelector('script[src*="synapse.js"]');
                const baseUrl = script ? script.getAttribute('data-base-url') : null;
                window.GreenhouseUtils.loadScript('synapse_app.js', baseUrl || '');
            }
        }, 50);
        setTimeout(() => clearInterval(interval), 12000);
    }
})();
