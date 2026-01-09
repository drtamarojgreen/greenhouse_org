// docs/js/models_toc.js

(function() {
    'use strict';

    const ModelsTOC = {
        xmlPath: 'endpoints/model_descriptions.xml',
        containerId: 'models-toc-container',
        container: null,

        init() {
            // The main application container must be available before we can initialize.
            const mainAppContainer = document.querySelector(window._greenhouseModelsAttributes.targetSelector);
            if (!mainAppContainer) {
                console.error('ModelsTOC: Main application container not found. Initialization will be deferred.');
                return;
            }

            // Create and inject the TOC container right after the main app container.
            const tocContainer = document.createElement('div');
            tocContainer.id = this.containerId;
            // Use insertAdjacentElement for a slightly cleaner injection
            mainAppContainer.insertAdjacentElement('afterend', tocContainer);
            this.container = tocContainer;

            this.loadXML();
        },

        loadXML() {
            // Construct the full path using the base URL from the global attributes.
            const fullXmlPath = `${window._greenhouseModelsAttributes.baseUrl}/${this.xmlPath}`;
            fetch(fullXmlPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(str => new DOMParser().parseFromString(str, "text/xml"))
                .then(data => {
                    // Check for parser errors
                    const parserError = data.querySelector('parsererror');
                    if (parserError) {
                        throw new Error(`XML Parsing Error: ${parserError.textContent}`);
                    }
                    this.render(data);
                })
                .catch(error => console.error('ModelsTOC: Error loading or parsing XML:', error));
        },

        render(xmlDoc) {
            // Clear previous content in case of re-initialization
            this.container.innerHTML = '';

            const introData = xmlDoc.querySelector('intro');
            const modelsData = xmlDoc.querySelectorAll('model');

            if (introData) {
                this.createIntroSection(introData);
            }
            if (modelsData.length > 0) {
                this.createModelSections(modelsData);
            }
        },

        createIntroSection(introData) {
            const introSection = document.createElement('div');
            introSection.className = 'models-toc-intro';

            introData.querySelectorAll('paragraph').forEach(p => {
                const pElement = document.createElement('p');
                pElement.textContent = p.textContent.trim();
                introSection.appendChild(pElement);
            });

            this.container.appendChild(introSection);
        },

        createModelSections(modelsData) {
            const fragment = document.createDocumentFragment();
            modelsData.forEach(model => {
                const modelId = model.getAttribute('id');
                const title = model.querySelector('title').textContent;

                const button = document.createElement('button');
                button.className = 'model-toc-button';
                button.textContent = title;
                button.setAttribute('aria-expanded', 'false');
                button.setAttribute('aria-controls', `panel-${modelId}`);
                button.addEventListener('click', this.togglePanel.bind(this));

                fragment.appendChild(button);

                const panel = document.createElement('div');
                panel.className = 'model-toc-panel';
                panel.id = `panel-${modelId}`;
                // Hide panel by default for progressive disclosure and animation
                panel.style.maxHeight = '0';
                panel.style.overflow = 'hidden';

                model.querySelector('description').querySelectorAll('paragraph').forEach(p => {
                    const pElement = document.createElement('p');
                    pElement.textContent = p.textContent.trim();
                    panel.appendChild(pElement);
                });
                fragment.appendChild(panel);
            });
            this.container.appendChild(fragment);
        },

        togglePanel(event) {
            const button = event.currentTarget;
            const panelId = button.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            button.setAttribute('aria-expanded', !isExpanded);
            button.classList.toggle('active');

            if (panel) {
                if (isExpanded) {
                    panel.style.maxHeight = '0';
                    panel.classList.remove('open');
                } else {
                    // Set max-height to its scroll height for a smooth CSS transition
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                    panel.classList.add('open');
                }
            }
        },
    };

    // Expose the ModelsTOC object to the global scope to be used by other scripts.
    window.GreenhouseModelsTOC = ModelsTOC;

})();
