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
    head: {
        appendChild: () => {}
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
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.console = mockWindow.console;

// The models_ui.js script requires GreenhouseModelsUtil to be defined on the window.
// We'll create a mock for it.
window.GreenhouseModelsUtil = {
    createElement: (tagName, options = {}, textContent = '') => {
        const el = mockDocument.createElement(tagName);
        Object.assign(el, options);
        if (textContent) {
            el.textContent = textContent;
        }
        // A mock appendChild for chaining or other operations
        el.appendChild = (child) => {
            if (!el.children) {
                el.children = [];
            }
            el.children.push(child);
            return child;
        };
        // A mock append for multiple children
        el.append = (...nodes) => {
             if (!el.children) {
                el.children = [];
            }
            el.children.push(...nodes);
        }
        return el;
    }
};

// Load the actual models_ui.js content
const fs = require('fs');
const path = require('path');

// Because models_ui.js uses sub-modules, we need to load them first.
const synapseUIPath = path.resolve(__dirname, '../../../../../docs/js/models_ui_synapse.js');
const brainUIPath = path.resolve(__dirname, '../../../../../docs/js/models_ui_brain.js');
const environmentUIPath = path.resolve(__dirname, '../../../../../docs/js/models_ui_environment.js');
const modelsUIPath = path.resolve(__dirname, '../../../../../docs/js/models_ui.js');

// Mock sub-modules by defining their objects on the window
window.GreenhouseModelsUISynapse = {};
window.GreenhouseModelsUIBrain = {};
window.GreenhouseModelsUIEnvironment = {};


const modelsUICode = fs.readFileSync(modelsUIPath, 'utf8');
eval(modelsUICode); // The script attaches GreenhouseModelsUI to the mock `window`

const GreenhouseModelsUI = window.GreenhouseModelsUI;

async function runModelsUITests() {
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

    console.log('\n--- Running models_ui.js Tests ---');

    // Test 1: renderConsentScreen creates the correct elements
    function testRenderConsentScreen() {
        const targetElement = mockDocument.createElement('div');
        GreenhouseModelsUI.renderConsentScreen(targetElement);
        assert(targetElement.children.length === 1, 'renderConsentScreen should add one child to the target');
        const container = targetElement.children[0];
        assert(container.className === 'greenhouse-landing-container', 'Container should have the correct class');
        assert(container.children.length === 5, 'Container should have the correct number of children');
    }

    // Test 2: renderSimulationInterface creates the correct elements
    function testRenderSimulationInterface() {
        const targetElement = mockDocument.createElement('div');
        // Mock the getContext method for the canvas elements
        const mockCanvas = mockDocument.createElement('canvas');
        mockCanvas.getContext = () => ({
            fillRect: () => {},
            clearRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            arc: () => {},
            fill: () => {}
        });

        // Mock querySelector to return the mock canvas
        const originalQuerySelector = mockDocument.querySelector;
        mockDocument.querySelector = (selector) => {
            if (selector.startsWith('#canvas-')) {
                return mockCanvas;
            }
             if (selector.startsWith('#controls-')) {
                return mockDocument.createElement('div');
            }
            if (selector.startsWith('#metrics-')) {
                return mockDocument.createElement('div');
            }
            return null;
        };

        mockDocument.getElementById = (id) => {
            if (id.startsWith('canvas-')) {
                return mockCanvas;
            }
            return mockDocument.createElement('div');
        }

        GreenhouseModelsUI.state = {
             mainAppContainer: null // Ensure state is initialized
        };
        GreenhouseModelsUI.renderSimulationInterface(targetElement);

        assert(targetElement.children.length === 1, 'renderSimulationInterface should add one child to the target');
        const mainContainer = targetElement.children[0];
        assert(mainContainer.className === 'simulation-main-container', 'Main container should have the correct class');
        assert(GreenhouseModelsUI.canvases.synaptic, 'Synaptic canvas should be initialized');
        assert(GreenhouseModelsUI.canvases.network, 'Network canvas should be initialized');
        assert(GreenhouseModelsUI.canvases.environment, 'Environment canvas should be initialized');

        // Restore the original querySelector
        mockDocument.querySelector = originalQuerySelector;
        delete mockDocument.getElementById;
    }

    // Run all tests
    testRenderConsentScreen();
    testRenderSimulationInterface();

    console.log(`\n--- models_ui.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("models_ui.js tests failed.");
    }
}

module.exports = runModelsUITests;
