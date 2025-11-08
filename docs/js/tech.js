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
                // Wait for the main "about" strip to be present in the DOM. This is our signal the page is ready.
                const aboutStripSelector = 'section.wixui-column-strip:nth-child(3)';
                this.aboutStrip = await GreenhouseUtils.waitForElement(aboutStripSelector, 7000);
                if (!this.aboutStrip) {
                    throw new Error(`The main content strip did not appear in time. Selector: ${aboutStripSelector}`);
                }
                console.log('TechApp: Page content is ready.');

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
    }

    const app = new TechApp();
    app.init();
})();
