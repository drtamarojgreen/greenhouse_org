// docs/js/models.js

(async function () {
    'use strict';
    console.log('Models App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        console.log('Models App: loadDependencies started.');
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                console.log('Models App: GreenhouseUtils loaded via dependency manager');
            } catch (error) {
                console.error('Models App: Failed to load GreenhouseUtils via dependency manager:', error.message);
            }
        } else {
            // Fallback to a polling mechanism if the dependency manager is not available
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 240; // 12 seconds
                const interval = setInterval(() => {
                    if (window.GreenhouseUtils) {
                        clearInterval(interval);
                        resolve();
                    } else if (attempts++ >= maxAttempts) {
                        clearInterval(interval);
                        console.error('Models App: GreenhouseUtils not available after 12 second timeout');
                        reject(new Error('GreenhouseUtils load timeout'));
                    }
                }, 50);
            });
        }
        GreenhouseUtils = window.GreenhouseUtils;
    };

    const captureScriptAttributes = () => {
        if (window._greenhouseModelsAttributes) {
            console.log('Models App: Using pre-defined attributes.');
            return true;
        }
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            console.error('Models App: Could not find current script element to capture attributes.');
            return false;
        }
        window._greenhouseModelsAttributes = {
            baseUrl: scriptElement.getAttribute('data-base-url'),
            targetSelector: scriptElement.getAttribute('data-target-selector-left')
        };
        return true;
    };

    async function main() {
        console.log('Models App: main() started.');
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl } = window._greenhouseModelsAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load the new modules sequentially
            await GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await GreenhouseUtils.loadScript('models_data.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_synapse.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_brain.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment_overlay.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment_hovers.js', baseUrl);
            await GreenhouseUtils.loadScript('data_adapter.js', baseUrl);
            await GreenhouseUtils.loadScript('environment_config.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment_background.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment_medication.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment_therapy.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment.js', baseUrl);
            
            // Load 3D modules
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_3d.js', baseUrl);
            
            await GreenhouseUtils.loadScript('models_ui.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ux.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhouseModelsData && window.GreenhouseModelsUI && window.GreenhouseModelsUX) {
                console.log('Models App: All modules loaded successfully.');
                // Initialize the data adapter with the correct base URL
                await window.GreenhouseDataAdapter.init(baseUrl);

                // Kick off the application by initializing the UX module
                GreenhouseModelsUX.init();
            } else {
                throw new Error("One or more application modules failed to load.");
            }

        } catch (error) {
            console.error('Models App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load simulation components: ${error.message}`);
            }
        }
    }

    const ModelsTOC = {
        xmlPath: 'endpoints/model_descriptions.xml',
        containerSelector: '#models-toc-container',
        container: null,

        init() {
            this.container = document.querySelector(this.containerSelector);
            if (!this.container) {
                console.error('ModelsTOC: Container not found.');
                return;
            }
            this.loadXML();
        },

        loadXML() {
            fetch(this.xmlPath)
                .then(response => response.text())
                .then(str => new DOMParser().parseFromString(str, "text/xml"))
                .then(data => this.render(data))
                .catch(error => console.error('Error loading XML:', error));
        },

        render(xmlDoc) {
            const introData = xmlDoc.querySelector('intro');
            const modelsData = xmlDoc.querySelectorAll('model');
            this.createIntroSection(introData);
            this.createModelSections(modelsData);
        },

        createIntroSection(introData) {
            const introSection = document.createElement('div');
            introSection.className = 'models-toc-intro';
            introData.querySelectorAll('paragraph').forEach(p => {
                const pElement = document.createElement('p');
                pElement.textContent = p.textContent;
                introSection.appendChild(pElement);
            });
            this.container.appendChild(introSection);
        },

        createModelSections(modelsData) {
            modelsData.forEach(model => {
                const modelId = model.getAttribute('id');
                const title = model.querySelector('title').textContent;
                const button = document.createElement('button');
                button.className = 'model-toc-button';
                button.textContent = title;
                button.setAttribute('aria-expanded', 'false');
                button.setAttribute('aria-controls', `panel-${modelId}`);
                button.addEventListener('click', this.togglePanel.bind(this));
                this.container.appendChild(button);
                const panel = document.createElement('div');
                panel.className = 'model-toc-panel';
                panel.id = `panel-${modelId}`;
                model.querySelector('description').querySelectorAll('paragraph').forEach(p => {
                    const pElement = document.createElement('p');
                    pElement.textContent = p.textContent;
                    panel.appendChild(pElement);
                });
                this.container.appendChild(panel);
            });
        },

        togglePanel(event) {
            const button = event.currentTarget;
            const panelId = button.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', !isExpanded);
            button.classList.toggle('active');
            panel.classList.toggle('open');
        },
    };

    // --- Main Execution Logic ---
    main();
    ModelsTOC.init();

    // Expose a reinitialization function on the global scope
    window.GreenhouseModels = {
        reinitialize: () => {
            if (window.GreenhouseModelsUX) {
                console.log('Models App: Re-initializing from global scope.');
                window.GreenhouseModelsUX.reinitialize();
            }
        }
    };

})();
