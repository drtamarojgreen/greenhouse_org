// Mocking the DOM for testing purposes
const mockDocument = {
    body: {
        appendChild: () => {},
        removeChild: () => {},
    },
    createElement: (tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            id: '',
            className: '',
            textContent: '',
            style: {},
            dataset: {},
            attributes: {},
            children: [],
            classList: {
                add: function(cls) { this.className += ` ${cls}`; },
                remove: function(cls) { this.className = this.className.replace(` ${cls}`, ''); },
                contains: function(cls) { return this.className.includes(cls); }
            },
            appendChild: function(child) { this.children.push(child); },
            setAttribute: function(name, value) { this.attributes[name] = value; },
            getAttribute: function(name) { return this.attributes[name]; },
            addEventListener: () => {},
            removeEventListener: () => {},
        };
        return element;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => {
        if (id === 'consent-checkbox') {
            const el = mockDocument.createElement('input');
            el.checked = false;
            return el;
        }
        if (id === 'start-simulation-btn') {
            const el = mockDocument.createElement('button');
            el.disabled = true;
            return el;
        }
        return null;
    }
};

// Mock window object
const mockWindow = {
    document: mockDocument,
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    },
    _greenhouseModelsAttributes: {
        targetSelector: '#test-target',
        baseUrl: 'http://localhost/'
    },
    GreenhouseUtils: {
        waitForElement: async (selector) => {
            return mockDocument.createElement('div');
        },
        displayError: () => {},
        config: {
            dom: {
                insertionDelay: 0
            }
        }
    },
    GreenhouseModelsData: {
        loadData: async () => {},
        transformNotesToSimulationInput: () => ({}),
        state: {}
    },
    GreenhouseModelsUI: {
        init: () => {},
        loadCSS: async () => {},
        renderConsentScreen: () => {},
        renderSimulationInterface: () => {},
        drawSynapticView: () => {},
        drawNetworkView: () => {},
        drawEnvironmentView: () => {}
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.console = mockWindow.console;

// Load the actual models_ux.js content
const fs = require('fs');
const path = require('path');
const modelsUXPath = path.resolve(__dirname, '../../../../../docs/js/models_ux.js');
const modelsUXCode = fs.readFileSync(modelsUXPath, 'utf8');
eval(modelsUXCode); // The script attaches GreenhouseModelsUX to the mock `window`

const GreenhouseModelsUX = window.GreenhouseModelsUX;

async function runModelsUXTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            passed++;
            console.log(`PASS: ${message}`);
        } else {
            failed++;
            console.error(`FAIL: ${message}`);
        }
    }

    console.log('\n--- Running models_ux.js Tests ---');

    // Test 1: init calls initialize
    async function testInit() {
        let initializeCalled = false;
        GreenhouseModelsUX.initialize = async () => {
            initializeCalled = true;
        };
        GreenhouseModelsUX.init();
        assert(initializeCalled, 'init should call initialize');
    }

    // Test 2: initialize sets up the consent screen
    async function testInitialize() {
        let renderConsentScreenCalled = false;
        let addConsentListenersCalled = false;

        GreenhouseModelsUX.getConfiguration = () => true; // Mock getConfiguration to return true
        GreenhouseModelsUI.renderConsentScreen = () => {
            renderConsentScreenCalled = true;
        };
        GreenhouseModelsUX.addConsentListeners = () => {
            addConsentListenersCalled = true;
        };

        await GreenhouseModelsUX.initialize();
        assert(renderConsentScreenCalled, 'initialize should call renderConsentScreen');
        assert(addConsentListenersCalled, 'initialize should call addConsentListeners');
    }

    // Run all tests
    await testInit();
    await testInitialize();

    console.log(`\n--- models_ux.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("models_ux.js tests failed.");
    }
}

module.exports = runModelsUXTests;
