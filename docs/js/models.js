// docs/js/models.js
// REFACTORED Loader for the Models Table of Contents page.

(function () {
    'use strict';

    const tocConfig = {
        containerSelector: '#models-app-container',
        manifestUrl: 'js/models_toc.json' // Path to the JSON manifest
    };

    /**
     * Fetches the Table of Contents data from the JSON manifest.
     * @returns {Promise<Array>} A promise that resolves with the TOC data array.
     */
    async function fetchTocData() {
        try {
            const response = await fetch(tocConfig.manifestUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Models TOC: Failed to fetch or parse manifest.', error);
            return null;
        }
    }

    /**
     * Renders the list of model buttons into the container.
     * @param {HTMLElement} container - The element to render the buttons into.
     * @param {Array} tocData - The array of data from the manifest.
     */
    function renderToc(container, tocData) {
        if (!tocData) {
            container.innerHTML = '<p class="error-message">Failed to load model list. Please try again later.</p>';
            return;
        }

        container.innerHTML = ''; // Clear loading spinner
        const list = document.createElement('div');
        list.className = 'toc-button-list';

        tocData.forEach(item => {
            // 3. Style the buttons using the app's design system
            const button = document.createElement('a');
            button.href = item.url;
            button.className = 'toc-button';
            button.id = `toc-btn-${item.id}`;

            // 4. Add ARIA attributes for screen-reader support
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Navigate to ${item.title}`);

            button.innerHTML = `
                <h3 class="toc-button-title">${item.title}</h3>
                <p class="toc-button-description">${item.description}</p>
            `;
            
            // 2. Add click handlers (handled by the 'href' attribute)
            list.appendChild(button);
        });

        container.appendChild(list);
    }

    /**
     * Main function to initialize the TOC page.
     */
    async function main() {
        console.log('Models TOC: Initializing.');
        const container = document.querySelector(tocConfig.containerSelector);
        if (!container) {
            console.error(`Models TOC: Container "${tocConfig.containerSelector}" not found.`);
            return;
        }

        const tocData = await fetchTocData();
        renderToc(container, tocData);
    }

    // --- Main Execution Logic ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
