(function() {
    'use strict';

    const POLL_INTERVAL = 300; // ms
    const MAX_ATTEMPTS = 100; // ~30s

    let attempts = 0;
    const poller = setInterval(() => {
        attempts++;

        const btn = document.getElementById('videoButton');
        if (btn && btn.classList.contains('loaded')) {
            console.debug('[videoButton] Found and loaded:', btn);

            clearInterval(poller);

            // Do something with the button
            // Example: auto-click
            // btn.click();

        } else {
            //console.debug('[videoButton] Not ready yet...');
        }

        if (attempts >= MAX_ATTEMPTS) {
            clearInterval(poller);
            console.error('[videoButton] Timed out waiting for button.');
        }
    }, POLL_INTERVAL);
})();