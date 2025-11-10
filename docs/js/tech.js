/**
 * @file tech.js
 * @description Self-sufficient client-side application for the /tech page. This script waits for the
 * page structure to be ready, populates promotional text, and then creates a new section to render a testing dashboard.
 * It has no dependency on Velo page code.
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
            this.aboutStrip = null;
        }

        /**
         * Initializes the application by waiting for a key page element, then populating text,
         * creating a dashboard container, and rendering the UI.
         */
        async init() {
            console.log('TechApp: Initializing.');
            try {
                // Wait for Velo's data element and the main content strip to ensure the page is fully loaded.
                const dataElementSelector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1);';
                const aboutStripSelector = 'section.wixui-column-strip:nth-child(3)';

                const [dataElement, aboutStrip] = await Promise.all([
                    GreenhouseUtils.waitForElement(dataElementSelector, 7000),
                    GreenhouseUtils.waitForElement(aboutStripSelector, 7000)
                ]);

                if (!aboutStrip) {
                    throw new Error(`The main content strip did not appear in time. Selector: ${aboutStripSelector}`);
                }
                this.aboutStrip = aboutStrip;
                console.log('TechApp: Page content is ready.');

                if (dataElement) {
                    this.handleVeloData(dataElement);
                } else {
                    console.warn('TechApp: Velo data element not found.');
                }

                this.populateAboutStripText();
                this.createCanvasSection();
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
         * Parses and logs the data passed from the Velo backend.
         * @param {HTMLElement} dataElement The text element containing the JSON data.
         */
        handleVeloData(dataElement) {
            try {
                const data = JSON.parse(dataElement.textContent);
                console.log('TechApp: Received data from Velo backend.', data);
                GreenhouseUtils.displaySuccess('Successfully received Velo backend data.');
            } catch (error) {
                console.error('TechApp: Failed to parse Velo data.', error);
                GreenhouseUtils.displayError('Could not parse Velo backend data.');
            }
        }

        /**
         * Populates the four promotional text fields in the aboutStrip using the provided selectors.
         */
        populateAboutStripText() {
            console.log('TechApp: Populating about strip promotional text.');
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
                    console.warn(`TechApp: Could not find promotional text element with selector (index ${index + 1}).`);
                }
            });

            if (populatedCount > 0) {
                console.log(`TechApp: Successfully populated ${populatedCount} promotional text fields.`);
            }
        }

        /**
         * Creates and appends a new section with an HTML5 canvas to the aboutStrip.
         */
        createCanvasSection() {
            if (!this.aboutStrip) {
                console.warn('TechApp: aboutStrip element not found. Cannot create canvas section.');
                return;
            }
            console.log('TechApp: Creating and appending canvas section.');

            const canvasSection = document.createElement('section');
            canvasSection.id = 'tech-canvas-section';
            canvasSection.style.width = '100%';
            canvasSection.style.padding = '20px 0';
            canvasSection.style.backgroundColor = '#e0e0e0';
            canvasSection.style.textAlign = 'center';
            canvasSection.style.borderTop = '2px solid #cccccc';

            const title = document.createElement('h2');
            title.textContent = 'Canvas Test Area';
            title.style.marginBottom = '10px';
            canvasSection.appendChild(title);

            const canvas = document.createElement('canvas');
            canvas.id = 'tech-canvas';
            canvas.width = 500;
            canvas.height = 250;
            canvas.style.border = '1px solid black';
            canvas.style.backgroundColor = 'white';

            // Simple drawing on canvas to show it works
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgb(200, 0, 0)';
            ctx.fillRect(10, 10, 50, 50);
            ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
            ctx.fillRect(30, 30, 50, 50);

            canvasSection.appendChild(canvas);

            this.aboutStrip.appendChild(canvasSection);
            console.log('TechApp: Canvas section appended as a child of aboutStrip.');
        }

        /**
         * Inserts a new container for the dashboard right after the aboutStrip.
         */
        createDashboardContainer() {
            this.dashboardContainer = document.createElement('section');
            this.dashboardContainer.id = 'tech-dashboard-section';
            this.dashboardContainer.style.backgroundColor = '#f0f4f7';
            this.dashboardContainer.style.padding = '40px 0';

            this.aboutStrip.parentNode.insertBefore(this.dashboardContainer, this.aboutStrip.nextSibling);
            console.log('TechApp: Dashboard container created and inserted into the DOM.');
        }

        /**
         * Renders the dashboard UI inside the container using createElement.
         */
        renderDashboard() {
            const createElement = (tag, classNames = [], textContent = '') => {
                const el = document.createElement(tag);
                if (classNames.length) el.classList.add(...classNames);
                if (textContent) el.textContent = textContent;
                return el;
            };

            const dashboard = createElement('div', ['tech-dashboard-container']);
            dashboard.id = 'tech-dashboard';

            const header = createElement('header', ['tech-dashboard-header']);
            header.appendChild(createElement('h1', [], 'Client-Side Testing Dashboard'));
            header.appendChild(createElement('p', [], 'A controlled environment for testing frontend components and utilities.'));
            dashboard.appendChild(header);

            const grid = createElement('div', ['test-case-grid']);

            const testCase1 = createElement('div', ['test-case']);
            testCase1.appendChild(createElement('h2', [], 'Test Case 1: Client-Side Data Fetch'));
            testCase1.appendChild(createElement('p', [], 'Simulates fetching mock data using a client-side function.'));
            const btn1 = createElement('button', ['tech-button'], 'Fetch Mock User');
            btn1.id = 'fetch-mock-user-btn';
            testCase1.appendChild(btn1);
            const output1 = createElement('div', ['output-box']);
            output1.id = 'mock-user-output';
            testCase1.appendChild(output1);
            grid.appendChild(testCase1);

            const testCase2 = createElement('div', ['test-case', 'full-width-case']);
            testCase2.appendChild(createElement('h2', [], 'Test Case 2: Load Models Prototype'));
            testCase2.appendChild(createElement('p', [], 'Loads a functional prototype of the models page simulation below.'));
            const btn2 = createElement('button', ['tech-button'], 'Load Models Prototype');
            btn2.id = 'load-models-prototype-btn';
            testCase2.appendChild(btn2);
            const container2 = createElement('div', ['models-prototype-container']);
            container2.id = 'models-prototype-container';
            testCase2.appendChild(container2);
            grid.appendChild(testCase2);

            dashboard.appendChild(grid);

            this.dashboardContainer.innerHTML = '';
            this.dashboardContainer.appendChild(dashboard);
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
            const mockData = { userId: "test-clientside-789", source: "Generated in tech.js" };
            outputBox.textContent = JSON.stringify(mockData, null, 2);
        }

        /**
         * Test Case 2: Loads and initializes the models prototype.
         */
        async runTestCase2() {
            const container = document.getElementById('models-prototype-container');
            const button = document.getElementById('load-models-prototype-btn');

            const updateStatus = (message, isError = false) => {
                container.innerHTML = ''; // Clear previous content
                const p = document.createElement('p');
                p.textContent = message;
                if (isError) {
                    p.style.color = 'red';
                }
                container.appendChild(p);
            };

            updateStatus('Loading models prototype...');
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
                    updateStatus('Scripts loaded. Initializing prototype...');
                    window.GreenhouseModelsUX.init();
                    GreenhouseUtils.displaySuccess('Models prototype loaded.');
                } else {
                    throw new Error("GreenhouseModelsUX failed to load.");
                }
            } catch (error) {
                updateStatus(`Failed to load prototype: ${error.message}`, true);
                button.disabled = false;
            }
        }
    }

    const app = new TechApp();
    app.init();
})();
