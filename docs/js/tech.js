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
        async init() {
            try {
                console.log('TechApp: Initializing...');
                const targetSelector = '#SITE_PAGES_TRANSITION_GROUP .wixui-section';
                this.appContainer = await GreenhouseUtils.waitForElement(targetSelector);

                if (!this.appContainer) {
                    throw new Error('TechApp: Application container not found.');
                }

                this.readInitialData();
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
         * @function readInitialData
         * @description Reads initial data from the hidden data element populated by Velo page code.
         */
        readInitialData() {
            const dataElement = document.getElementById('dataTextElement');
            if (dataElement && dataElement.textContent) {
                try {
                    this.config = JSON.parse(dataElement.textContent);
                    console.log('TechApp: Loaded initial data from Velo page code:', this.config);
                } catch (e) {
                    console.error('TechApp: Failed to parse initial data from #dataTextElement.', e);
                    this.config = { error: 'Failed to parse Velo data.' };
                }
            } else {
                console.warn('TechApp: #dataTextElement not found or empty. Using default config.');
                this.config = { message: 'Running in client-only test mode.' };
            }
        }

        /**
         * @function renderDashboard
         * @description Renders the main testing dashboard UI.
         */
        renderDashboard() {
            this.appContainer.innerHTML = `
                <div id="tech-dashboard" style="padding: 20px; font-family: Arial, sans-serif;">
                    <h1 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Tech Page Testing Dashboard</h1>

                    <div class="test-case">
                        <h2>Initial Page Data</h2>
                        <p>Data loaded from #dataTextElement (populated by Velo Page Code).</p>
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
                </div>
                <style>
                    .test-case { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                    .tech-button { background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
                    .tech-button:hover { background-color: #0056b3; }
                    .output-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 10px; margin-top: 10px; min-height: 30px; white-space: pre-wrap; font-family: monospace; }
                </style>
            `;
        }

        /**
         * @function attachEventListeners
         * @description Attaches event listeners to the dashboard UI elements.
         */
        attachEventListeners() {
            document.getElementById('fetch-mock-user-btn').addEventListener('click', () => this.runTestCase1());
            document.getElementById('test-util-btn').addEventListener('click', () => this.runTestCase2());
            document.getElementById('render-notification-btn').addEventListener('click', () => this.runTestCase3());
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
