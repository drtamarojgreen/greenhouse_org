/**
 * @file tech.js
 * @description Client-side application for the /tech page, providing a dashboard for testing and development.
 * This script is loaded by greenhouse.js on the /tech page.
 */
(function() {
    // Ensure GreenhouseUtils is available
    if (!window.GreenhouseUtils) {
        console.error('TechApp: GreenhouseUtils not found. Aborting initialization.');
        return;
    }
    const GreenhouseUtils = window.GreenhouseUtils;

    /**
     * @class TechApp
     * @description Main class for the Tech Page testing application.
     */
    class TechApp {
        constructor() {
            this.appContainer = null;
            this.config = {};
            // The Velo functions are mocked here for client-side testing purposes.
            // The "Fetch Mock User" button will use this mock.
            this.veloFunctions = this.mockVeloFunctions();
        }

        /**
         * @function init
         * @description Initializes the application.
         */
        /**
         * @function loadCSS
         * @description Dynamically loads a CSS file.
         */
        async loadCSS(cssPath) {
            return new Promise((resolve, reject) => {
                const cssUrl = `${this.config.baseUrl || ''}css/${cssPath}`;
                if (document.querySelector(`link[href="${cssUrl}"]`)) {
                    return resolve();
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                link.onload = () => resolve();
                link.onerror = () => reject(new Error(`Failed to load CSS: ${cssUrl}`));
                document.head.appendChild(link);
            });
        }

        async init() {
            console.log('TechApp: Initializing...');
            // Wait for the data element to be populated by Velo code to avoid race conditions.
            this.waitForDataAndInit();
        }

        /**
         * @function waitForDataAndInit
         * @description Polls for the #dataTextElement and proceeds with initialization once it's ready.
         */
        waitForDataAndInit() {
            const maxWaitTime = 5000; // 5 seconds
            const pollInterval = 100; // 100 ms
            let elapsedTime = 0;
            console.log(`%cTechApp-Debug: Starting to poll for #dataTextElement. Max wait: ${maxWaitTime}ms.`, 'color: blue; font-weight: bold;');

            const poll = setInterval(async () => {
                elapsedTime += pollInterval;
                const dataElement = document.getElementById('dataTextElement');
                const content = dataElement ? dataElement.textContent : 'null';

                console.log(`%cTechApp-Debug: Polling... (${elapsedTime}ms). #dataTextElement content: "${content}"`, 'color: gray;');

                if (dataElement && content && content.trim() !== '{}' && content.trim() !== '') {
                    clearInterval(poll);
                    console.log('%cTechApp-Debug: #dataTextElement found and populated. Exiting poll.', 'color: green; font-weight: bold;');
                    await this.proceedWithInit();
                } else if (elapsedTime >= maxWaitTime) {
                    clearInterval(poll);
                    console.warn('%cTechApp-Debug: Timed out waiting for #dataTextElement. Exiting poll.', 'color: orange; font-weight: bold;');
                    await this.proceedWithInit();
                }
            }, pollInterval);
        }

        /**
         * @function proceedWithInit
         * @description The main initialization logic, called after data is confirmed or timeout occurs.
         */
        async proceedWithInit() {
            console.log('%cTechApp-Debug: ==> Entered proceedWithInit()', 'color: blue; font-weight: bold;');
            try {
                console.log('%cTechApp-Debug: 1. Reading initial data...', 'color: blue;');
                this.readInitialData();
                console.log('%cTechApp-Debug:    ...Done reading data. Config is:', 'color: blue;', this.config);

                console.log('%cTechApp-Debug: 2. Loading CSS...', 'color: blue;');
                await this.loadCSS('tech.css');
                console.log('%cTechApp-Debug:    ...CSS loaded.', 'color: blue;');

                const targetSelector = '#SITE_PAGES_TRANSITION_GROUP .wixui-section';
                console.log(`%cTechApp-Debug: 3. Waiting for app container with selector: "${targetSelector}"`, 'color: blue;');
                this.appContainer = await GreenhouseUtils.waitForElement(targetSelector);

                if (!this.appContainer) {
                    // This is a critical failure, so we throw to be caught by the catch block.
                    throw new Error('Application container not found after waiting.');
                }
                console.log('%cTechApp-Debug:    ...App container found:', 'color: green;', this.appContainer);

                console.log('%cTechApp-Debug: 4. Rendering dashboard...', 'color: blue;');
                this.renderDashboard();
                console.log('%cTechApp-Debug:    ...Dashboard rendered.', 'color: blue;');

                console.log('%cTechApp-Debug: 5. Attaching event listeners...', 'color: blue;');
                this.attachEventListeners();
                console.log('%cTechApp-Debug:    ...Event listeners attached.', 'color: blue;');

                console.log('%cTechApp-Debug: ==> Initialization complete.', 'color: green; font-weight: bold;');
                GreenhouseUtils.displaySuccess('Tech Test Dashboard Loaded Successfully.');

            } catch (error) {
                console.error('%cTechApp-Debug: ==> CRITICAL FAILURE in proceedWithInit()', 'color: red; font-weight: bold;', error);
                GreenhouseUtils.displayError('Failed to load Tech Test Dashboard.');
            }
        }


        /**
         * @function readInitialData
         * @description Reads initial data from the hidden data element populated by Velo page code.
         */
        readInitialData() {
            const dataElement = document.getElementById('dataTextElement');
            if (dataElement && dataElement.textContent && dataElement.textContent.trim() !== '{}' && dataElement.textContent.trim() !== '') {
                try {
                    this.config = JSON.parse(dataElement.textContent);
                    console.log('TechApp: Loaded initial data from Velo page code:', this.config);
                } catch (e) {
                    console.error('TechApp: Failed to parse initial data from #dataTextElement.', e);
                    this.config = { error: 'Failed to parse Velo data.' };
                }
            } else {
                console.warn('TechApp: #dataTextElement not found or empty after wait. Using default config.');
                this.config = { message: 'Running in client-only test mode.' };
            }
        }

        /**
         * @function renderDashboard
         * @description Renders the main testing dashboard UI.
         */
        renderDashboard() {
            // DO NOT clear the container's innerHTML. This causes React hydration errors on Wix.
            // Instead, create a dedicated element for the dashboard and append it.
            let dashboardContainer = document.getElementById('tech-dashboard-wrapper');
            if (dashboardContainer) {
                dashboardContainer.innerHTML = ''; // Clear previous dashboard if re-rendering
            } else {
                dashboardContainer = document.createElement('div');
                dashboardContainer.id = 'tech-dashboard-wrapper';
                this.appContainer.appendChild(dashboardContainer);
            }

            const dashboardHTML = `
                <div id="tech-dashboard" class="tech-dashboard-container">
                    <header class="tech-dashboard-header">
                        <h1>Client-Side Testing Dashboard</h1>
                        <p>A controlled environment for testing frontend components and utilities.</p>
                    </header>

                    <div class="test-case-grid">
                        <div class="test-case">
                            <h2>Initial Page Data</h2>
                            <p>Data loaded from #dataTextElement, populated by the Velo Page Code.</p>
                            <div class="output-box" id="velo-data-output">${JSON.stringify(this.config, null, 2)}</div>
                        </div>

                        <div class="test-case">
                            <h2>Test Case 1: Client-Side Data Fetch</h2>
                            <p>Simulates fetching mock data using a client-side mock function.</p>
                            <button id="fetch-mock-user-btn" class="tech-button">Fetch Mock User (Client-Side)</button>
                            <div class="output-box" id="mock-user-output"></div>
                        </div>

                        <div class="test-case">
                            <h2>Test Case 2: Utility Function Verification</h2>
                            <p>Tests a utility function from GreenhouseUtils.js (waitForElement).</p>
                            <button id="test-util-btn" class="tech-button">Test DOM Element Finder</button>
                            <div id="test-element-container"></div>
                            <div class="output-box" id="util-output"></div>
                        </div>

                        <div class="test-case">
                            <h2>Test Case 3: UI Notification</h2>
                            <p>Tests the rendering of a shared UI component (notification banner).</p>
                            <button id="render-notification-btn" class="tech-button">Render Notification Banner</button>
                            <div class="output-box" id="notification-output"></div>
                        </div>

                        <div class="test-case full-width-case">
                            <h2>Test Case 4: Load Models Prototype</h2>
                            <p>Loads a functional prototype of the /models page simulation into the container below.</p>
                            <button id="load-models-prototype-btn" class="tech-button">Load Models Prototype</button>
                            <div id="models-prototype-container" class="models-prototype-container"></div>
                        </div>
                    </div>
                </div>
            `;
            dashboardContainer.innerHTML = dashboardHTML;
        }

        /**
         * @function attachEventListeners
         * @description Attaches event listeners to the dashboard UI elements.
         */
        attachEventListeners() {
            document.getElementById('fetch-mock-user-btn').addEventListener('click', () => this.runTestCase1());
            document.getElementById('test-util-btn').addEventListener('click', () => this.runTestCase2());
            document.getElementById('render-notification-btn').addEventListener('click', () => this.runTestCase3());
            document.getElementById('load-models-prototype-btn').addEventListener('click', () => this.runTestCase4());
        }

        /**
         * @function runTestCase1
         * @description Executes the client-side data fetch test.
         */
        async runTestCase1() {
            const outputBox = document.getElementById('mock-user-output');
            outputBox.textContent = 'Fetching mock user data from client-side function...';
            try {
                const user = await this.veloFunctions.getMockUserData();
                outputBox.textContent = JSON.stringify(user, null, 2);
            } catch (error) {
                outputBox.textContent = `Error: ${error.message}`;
                console.error('TechApp: Test Case 1 Failed', error);
            }
        }

        /**
         * @function runTestCase2
         * @description Executes the utility function verification test.
         */
        async runTestCase2() {
            const outputBox = document.getElementById('util-output');
            const container = document.getElementById('test-element-container');
            outputBox.textContent = 'Testing GreenhouseUtils.waitForElement...';

            setTimeout(() => {
                const testEl = document.createElement('div');
                testEl.id = 'dynamic-test-element';
                testEl.textContent = 'This element was created dynamically.';
                container.appendChild(testEl);
            }, 500);

            try {
                const foundElement = await GreenhouseUtils.waitForElement('#dynamic-test-element', 2000);
                if (foundElement) {
                    outputBox.textContent = 'Success: GreenhouseUtils.waitForElement found the dynamically created element.';
                    foundElement.style.color = 'green';
                } else {
                    throw new Error('waitForElement resolved with a falsy value.');
                }
            } catch (error) {
                outputBox.textContent = `Failure: ${error.message}`;
                console.error('TechApp: Test Case 2 Failed', error);
            }
        }

        /**
         * @function runTestCase3
         * @description Executes the UI component rendering test.
         */
        runTestCase3() {
            const outputBox = document.getElementById('notification-output');
            outputBox.textContent = 'Displaying notification...';
            try {
                GreenhouseUtils.displayInfo('This is a test notification from the Tech Dashboard.', 5000);
                outputBox.textContent = 'Success: A notification banner should now be visible.';
            } catch (error) {
                outputBox.textContent = `Error: ${error.message}`;
                console.error('TechApp: Test Case 3 Failed', error);
            }
        }

        /**
         * @function runTestCase4
         * @description Loads and initializes the models prototype.
         */
        async runTestCase4() {
            const container = document.getElementById('models-prototype-container');
            const button = document.getElementById('load-models-prototype-btn');
            container.innerHTML = '<p>Loading models prototype scripts...</p>';
            button.disabled = true;

            try {
                // Get the base URL from the Greenhouse loader config
                const baseUrl = window.GreenhouseUtils.config.githubPagesBaseUrl || 'https://drtamarojgreen.github.io/greenhouse_org/';

                // Define attributes to pass to the models loader script
                const attributes = {
                    'base-url': baseUrl,
                    'target-selector-left': '#models-prototype-container'
                };

                // Set a global override for the models loader to find its attributes
                window._greenhouseModelsAttributes = {
                    baseUrl: baseUrl,
                    targetSelector: '#models-prototype-container'
                };

                // Load scripts sequentially as determined from models.js
                await GreenhouseUtils.loadScript('models_util.js', baseUrl);
                await GreenhouseUtils.loadScript('models_data.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_synapse.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_brain.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui_environment.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ui.js', baseUrl);
                await GreenhouseUtils.loadScript('models_ux.js', baseUrl);

                // Check if the final module is loaded and initialize it
                if (window.GreenhouseModelsUX) {
                    container.innerHTML = '<p>Scripts loaded. Initializing prototype...</p>';
                    window.GreenhouseModelsUX.init();
                    GreenhouseUtils.displaySuccess('Models prototype loaded successfully.');
                } else {
                    throw new Error("Models main module (GreenhouseModelsUX) failed to load.");
                }

            } catch (error) {
                container.innerHTML = `<p style="color: red;">Failed to load models prototype: ${error.message}</p>`;
                console.error('TechApp: Test Case 4 Failed', error);
                button.disabled = false;
            }
        }

        /**
         * @function mockVeloFunctions
         * @description Mocks functions for client-side testing.
         */
        mockVeloFunctions() {
            return {
                getMockUserData: () => {
                    console.log("TechApp: Using client-side mock 'getMockUserData' function.");
                    return Promise.resolve({
                        userId: "test-clientside-456",
                        role: "user",
                        preferences: { theme: "light" },
                        source: "Generated directly in client-side tech.js"
                    });
                }
            };
        }
    }

    // --- Main execution ---
    const app = new TechApp();
    app.init();

})();
