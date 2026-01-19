// docs/js/models_toc.js

(function () {
    'use strict';

    const GreenhouseModelsTOC = {
        config: {
            xmlPath: 'endpoints/model_descriptions.xml',
            // Default target selector, only used if no target is provided in init.
            target: '#models-toc-container'
        },
        state: {
            isInitialized: false
        },
        // The resolved DOM element where the TOC will be rendered.
        container: null,

        init(options = {}) {
            const target = options.target || this.config.target;
            let container;

            if (typeof target === 'string') {
                container = document.querySelector(target);
            } else if (target instanceof HTMLElement) {
                container = target;
            }

            if (!container) {
                console.error('AGENT_DEBUG: TOC target container could not be found in the DOM.');
                return;
            }

            // Automatic Class Attachment: Ensure the styles in models_toc.css are applied regardless of the ID.
            container.classList.add('models-toc-container');

            // Clear container for a clean render and store the reference.
            container.innerHTML = '';
            this.container = container;

            console.log('AGENT_DEBUG: TOC init() started.');
            this.fetchDataAndRender();
            this.state.isInitialized = true;
        },

        async fetchDataAndRender() {
            try {
                // Adjust the base URL based on the main app's state if available
                const baseUrl = window.GreenhouseModelsUX ? window.GreenhouseModelsUX.state.baseUrl : './';

                const response = await fetch(`${baseUrl}${this.config.xmlPath}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                console.log('AGENT_DEBUG: Successfully fetched and parsed model_descriptions.xml.');

                this.renderComponent(xmlDoc);
            } catch (error) {
                console.error('AGENT_DEBUG: Error fetching or parsing XML for TOC:', error);
                if (this.container) {
                    this.container.innerHTML = '<p>Error loading model descriptions. Please try again later.</p>';
                }
            }
        },

        renderComponent(xmlDoc) {
            const container = this.container;
            if (!container) return;

            // Render Intro
            const intro = xmlDoc.querySelector('intro');
            if (intro) {
                const introDiv = document.createElement('div');
                introDiv.className = 'models-toc-intro';

                Array.from(intro.getElementsByTagName('paragraph')).forEach(p => {
                    const pElem = document.createElement('p');
                    pElem.textContent = p.textContent;
                    introDiv.appendChild(pElem);
                });
                container.appendChild(introDiv);
            }

            // Create Grid for Models
            const grid = document.createElement('div');
            grid.className = 'models-toc-grid';
            container.appendChild(grid);

            const models = xmlDoc.querySelectorAll('model');
            models.forEach(model => {
                const modelId = model.getAttribute('id');
                const title = model.querySelector('title').textContent;
                const url = model.querySelector('url') ? model.querySelector('url').textContent : `/${modelId}`;

                // Create Card
                const card = document.createElement('div');
                card.className = 'model-toc-card';

                // Title Section
                const titleElem = document.createElement('h3');
                titleElem.textContent = title;
                card.appendChild(titleElem);

                // Description Container
                const descContainer = document.createElement('div');
                descContainer.className = 'description-container';
                descContainer.style.flex = '1';

                const description = model.querySelector('description');
                const firstPara = description.getElementsByTagName('paragraph')[0];
                if (firstPara) {
                    const pElem = document.createElement('p');
                    pElem.textContent = firstPara.textContent;
                    descContainer.appendChild(pElem);
                }
                card.appendChild(descContainer);

                // Actions Section (Buttons)
                const actionGroup = document.createElement('div');
                actionGroup.className = 'button-group';

                // Launch Button
                const launchLink = document.createElement('a');

                // Use the URL as provided in the XML (clean URLs)
                const path = url.startsWith('/') ? url : '/' + url;
                const canonicalBase = 'https://greenhousemhd.org';
                launchLink.href = canonicalBase + path;

                launchLink.className = 'greenhouse-btn greenhouse-btn-primary';
                launchLink.textContent = 'Launch Simulation';

                actionGroup.appendChild(launchLink);
                card.appendChild(actionGroup);

                grid.appendChild(card);
            });
            console.log('AGENT_DEBUG: TOC rendered with card layout and class-based fix.');
            this.addEventListeners();
        },

        addEventListeners() {
            // Placeholder for future interactions
            console.log('AGENT_DEBUG: TOC dynamic interactions ready.');
        }
    };

    window.GreenhouseModelsTOC = GreenhouseModelsTOC;
})();
