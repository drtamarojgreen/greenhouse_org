// docs/js/models_toc.js

(function() {
    'use strict';

    async function fetchTocData() {
        try {
            const response = await fetch('models_toc.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching TOC data:', error);
            return [];
        }
    }

    function createTocButtons(tocData, container) {
        tocData.forEach(item => {
            const button = document.createElement('a');
            button.href = item.url;
            button.textContent = item.title;
            button.className = 'toc-button';
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Navigate to ${item.title}`);
            container.appendChild(button);
        });
    }

    async function init() {
        const tocContainer = document.getElementById('models-toc-container');
        if (!tocContainer) {
            console.error('TOC container not found.');
            return;
        }

        const tocData = await fetchTocData();
        createTocButtons(tocData, tocContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
