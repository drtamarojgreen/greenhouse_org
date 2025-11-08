/**
 * @file tech.js
 * @description Client-side application for the /tech page. This script waits for Velo code
 * to prepare the page, populates promotional text, and then creates a new section to render a testing dashboard.
 */
(function() {
    if (!window.GreenhouseUtils) {
        console.error('TechApp: GreenhouseUtils not found. Aborting initialization.');
        return;
    }
    const GreenhouseUtils = window.GreenhouseUtils;

    class TechApp {
        constructor() {
            this.dashboardContainer = null;
            this.config = {};
            this.veloFunctions = this.mockVeloFunctions();
        }

        /**
         * Initializes the application by waiting for Velo data, populating text, creating a dashboard container,
         * and rendering the UI.
         */
        async init() {
            console.log('TechApp: Initializing...');
            try {
                await this.waitForVeloData();
                this.readInitialData();

                const baseUrl = window.GreenhouseUtils.config.githubPagesBaseUrl;
                await this.loadCSS(baseUrl);

                this.populateAboutStripText();
                this.createDashboardContainer();
                this.renderDashboard();
                this.attachEventListeners();

                console.log('TechApp: Initialization complete.');
                GreenhouseUtils.displaySuccess('Tech Test Dashboard Loaded Successfully.');
            } catch (error) {
                console.error('TechApp: Initialization failed.', error);
                GreenhouseUtils.displayError('Failed to load Tech Test Dashboard.');
            }
        }

        /**
         * Uses a MutationObserver to wait until the #dataTextElement is added to the DOM by Velo.
         * This is a reliable method to resolve the race condition.
         */
        waitForVeloData() {
            return new Promise((resolve, reject) => {
                const elementId = 'dataTextElement';
                console.log(`TechApp: Watching for #${elementId} to be added to the DOM...`);

                const existingElement = document.getElementById(elementId);
                if (existingElement) {
                    console.log(`TechApp: #${elementId} already exists.`);
                    return resolve(existingElement);
                }

                const timeout = 7000; // 7 seconds
                const timer = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timed out after ${timeout}ms waiting for #${elementId}.`));
                }, timeout);

                const observer = new MutationObserver((mutationsList, obs) => {
                    if (document.getElementById(elementId)) {
                        clearTimeout(timer);
                        obs.disconnect();
                        console.log(`TechApp: #${elementId} was added to the DOM.`);
                        resolve(document.getElementById(elementId));
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });
            });
        }

        /**
         * Reads and parses the initial configuration from the Velo data element.
         */
        readInitialData() {
            const dataElement = document.getElementById('dataTextElement');
            try {
                this.config = JSON.parse(dataElement.textContent);
                console.log('TechApp: Loaded initial data from Velo:', this.config);
            } catch (e) {
                console.error('TechApp: Failed to parse initial data from #dataTextElement.', e);
                this.config = { error: 'Failed to parse Velo data.' };
            }
        }

        /**
         * Dynamically loads the stylesheet for the dashboard.
         */
        async loadCSS(baseUrl) {
            if (!baseUrl) {
                console.warn('TechApp: Base URL not found, cannot load CSS.');
                return;
            }
            const cssUrl = `${baseUrl}css/tech.css`;
            return new Promise((resolve, reject) => {
                if (document.querySelector(`link[href="${cssUrl}"]`)) return resolve();
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                link.onload = () => {
                    console.log('TechApp: Stylesheet loaded successfully.');
                    resolve();
                };
                link.onerror = () => reject(new Error(`Failed to load CSS: ${cssUrl}`));
                document.head.appendChild(link);
            });
        }

        /**
         * Populates the four promotional text fields in the aboutStrip using the provided selectors.
         */
        populateAboutStripText() {
            console.log('TechApp: Populating about strip promotional text...');
            const promoTexts = [
                {
                    selector: 'section.wixui-column-strip:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1) > span:nth-child(1)',
                    text: "Component Testing Sandbox: Interactively test client-side JavaScript modules, from utility functions to complex UI components, in a controlled and isolated environment."
                },
                {
                    selector: 'section.wixui-column-strip:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1) > span:nth-child(1)',
                    text: "Velo Backend Simulation: Develop and debug frontend logic with predictable mock data served directly from the page's Velo code, eliminating the need for a live backend."
                },
                {
                    selector: 'section.wixui-column-strip:nth-child(3) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1) > span:nth-child(1)',
                    text: "Dynamic Module Loading: Verify the seamless integration of dynamically loaded applications, such as the Models Prototype, ensuring all dependencies are met and execution is flawless."
                },
                {
                    selector: 'section.wixui-column-strip:nth-child(3) > div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1) > span:nth-child(1)',
                    text: "Live DOM Interaction: Safely manipulate and inspect the live page structure, perfect for developing DOM-sensitive utilities and ensuring compatibility with the Wix platform."
                }
            ];

            let populatedCount = 0;
            promoTexts.forEach((promo, index) => {
                const element = document.querySelector(promo.selector);
                if (element) {
                    element.textContent = promo.text;
                    populatedCount++;
                } else {
                    console.warn(`TechApp: Could not find promotional text element with selector ${index + 1}: ${promo.selector}`);
                }
            });

            if (populatedCount > 0) {
                console.log(`TechApp: Successfully populated ${populatedCount} promotional text fields.`);
            }
        }

        /**
         * Finds the specified 'aboutStrip' and inserts a new container for the dashboard right after it.
         */
        createDashboardContainer() {
            const aboutStripSelector = 'section.wixui-column-strip:nth-child(3)';
            const aboutStrip = document.querySelector(aboutStripSelector);
            if (!aboutStrip) {
                throw new Error(`Could not find the aboutStrip element with selector: ${aboutStripSelector}`);
            }

            this.dashboardContainer = document.createElement('section');
            this.dashboardContainer.id = 'tech-dashboard-section';
            this.dashboardContainer.style.backgroundColor = '#f0f4f7';
            this.dashboardContainer.style.padding = '40px 0';

            aboutStrip.parentNode.insertBefore(this.dashboardContainer, aboutStrip.nextSibling);
            console.log('TechApp: Dashboard container created and inserted into the DOM.');
        }

        /**
         * Renders the dashboard UI inside the container.
         */
        renderDashboard() {
            this.dashboardContainer.innerHTML = `
                <div id="tech-dashboard" class="tech-dashboard-container">
                    <header class="tech-dashboard-header">
                        <h1>Client-Side Testing Dashboard</h1>
                        <p>A controlled environment for testing frontend components and utilities.</p>
                    </header>
                    <div class="test-case-grid">
                        <div class="test-case">
                            <h2>Initial Page Data</h2>
                            <p>Data from #dataTextElement, populated by Velo.</p>
                            <div class="output-box" id="velo-data-output">${JSON.stringify(this.config, null, 2)}</div>
                        </div>
                        <div class="test-case">
                            <h2>Test Case 1: Client-Side Data Fetch</h2>
                            <p>Simulates fetching mock data using a client-side function.</p>
                            <button id="fetch-mock-user-btn" class="tech-button">Fetch Mock User (Client-Side)</button>
                            <div class="output-box" id="mock-user-output"></div>
                        </div>
                        <div class="test-case full-width-case">
                            <h2>Test Case 2: Load Models Prototype</h2>
                            <p>Loads a functional prototype of the /models page simulation below.</p>
                            <button id="load-models-prototype-btn" class="tech-button">Load Models Prototype</button>
                            <div id="models-prototype-container" class="models-prototype-container"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Attaches event listeners to the dashboard UI elements.
         */
        attachEventListeners() {
            document.getElementById('fetch-mock-user-btn').addEventListener('click', () => this.runTestCase1());
            document.getElementById('load-models-prototype-btn').addEventListener('click', () => this.runTestCase2());
        }

        /**
         * Test Case 1: Executes the client-side data fetch test.
         */
        async runTestCase1() {
            const outputBox = document.getElementById('mock-user-output');
            outputBox.textContent = 'Fetching...';
            try {
                const user = await this.veloFunctions.getMockUserData();
                outputBox.textContent = JSON.stringify(user, null, 2);
            } catch (error) {
                outputBox.textContent = `Error: ${error.message}`;
            }
        }

        /**
         * Test Case 2: Loads and initializes the models prototype.
         */
        async runTestCase2() {
            const container = document.getElementById('models-prototype-container');
            const button = document.getElementById('load-models-prototype-btn');
            container.innerHTML = '<p>Loading models prototype...</p>';
            button.disabled = true;

            try {
                const baseUrl = window.GreenhouseUtils.config.githubPagesBaseUrl || 'https://drtamarojgreen.github.io/greenhouse_org/';
                window._greenhouseModelsAttributes = { baseUrl, targetSelector: '#models-prototype-container' };

                await GreenhouseUtils.loadScript('models_util.js', baseUrl);
                await GreenhouseUtils.loadScript('models_data.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_synapse.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_brain.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_environment.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ux.js', baseUrl);

                if (window.GreenhouseModelsUX) {
                    container.innerHTML = '<p>Scripts loaded. Initializing prototype...</p>';
                    window.GreenhouseModelsUX.init();
                    GreenhouseUtils.displaySuccess('Models prototype loaded.');
                } else {
                    throw new Error("GreenhouseModelsUX failed to load.");
                }
            } catch (error) {
                container.innerHTML = `<p style="color: red;">Failed to load prototype: ${error.message}</p>`;
                button.disabled = false;
            }
        }

        mockVeloFunctions() {
            return {
                getMockUserData: () => Promise.resolve({
                    userId: "test-clientside-456",
                    source: "Generated in client-side tech.js"
                })
            };
        }
    }

    const app = new TechApp();
    app.init();
})();
