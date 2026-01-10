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
            isInitialized: false,
            activePanel: null
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
            if (!container) {
                // This check is redundant if init succeeded, but good for safety.
                console.error(`AGENT_DEBUG: TOC container is not available.`);
                return;
            }

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

            // Render Model Buttons and Panels
            const models = xmlDoc.querySelectorAll('model');
            models.forEach(model => {
                const modelId = model.getAttribute('id');
                const title = model.querySelector('title').textContent;

                // Create Button
                const button = document.createElement('button');
                button.className = 'model-toc-button';
                button.textContent = title;
                button.setAttribute('aria-expanded', 'false');
                button.setAttribute('aria-controls', `panel-${modelId}`);
                button.dataset.modelId = modelId;

                // Create Panel
                const panel = document.createElement('div');
                panel.id = `panel-${modelId}`;
                panel.className = 'model-toc-panel';
                panel.setAttribute('role', 'region');

                const description = model.querySelector('description');
                Array.from(description.getElementsByTagName('paragraph')).forEach(p => {
                    const pElem = document.createElement('p');
                    pElem.textContent = p.textContent;
                    panel.appendChild(pElem);
                });

                container.appendChild(button);
                container.appendChild(panel);
            });
            console.log('AGENT_DEBUG: TOC component HTML has been rendered.');

            this.addEventListeners();
        },

        addEventListeners() {
            const container = this.container;
            if (!container) return; // Safety check

            container.addEventListener('click', (event) => {
                if (event.target.classList.contains('model-toc-button')) {
                    this.togglePanel(event.target);
                }
            });
            console.log('AGENT_DEBUG: TOC event listeners have been added.');
        },

        togglePanel(button) {
            const modelId = button.dataset.modelId;
            const panel = document.getElementById(`panel-${modelId}`);
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            // Close any currently active panel
            if (this.state.activePanel && this.state.activePanel !== panel) {
                const activeButton = document.querySelector(`[data-model-id="${this.state.activePanel.id.replace('panel-', '')}"]`);
                this.closePanel(activeButton, this.state.activePanel);
            }

            if (isExpanded) {
                this.closePanel(button, panel);
                this.state.activePanel = null;
            } else {
                this.openPanel(button, panel);
                this.state.activePanel = panel;
            }
        },

        openPanel(button, panel) {
            button.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
            panel.classList.add('open');
            // Set max-height for animation after a short delay to allow for CSS transition
            requestAnimationFrame(() => {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            });
        },

        closePanel(button, panel) {
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
            // Unset max-height to allow for CSS transition to 0
            panel.style.maxHeight = '';
            // The 'open' class is removed by the transitionend event listener below
            // to ensure the animation completes smoothly. But for reliability, we can also just remove it.
            // Let's rely on CSS transitions primarily.
            panel.classList.remove('open');
        }
    };

    window.GreenhouseModelsTOC = GreenhouseModelsTOC;
})();