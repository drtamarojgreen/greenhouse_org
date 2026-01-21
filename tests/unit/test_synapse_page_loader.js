/**
 * Unit Tests for Synapse Page Loader Logic
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.addEventListener = () => { };

// Mock MutationObserver
global.MutationObserver = class {
    constructor(callback) {}
    observe(node, options) {}
    disconnect() {}
};

global.document = {
    currentScript: { getAttribute: (name) => {
        if (name === 'data-base-url') return '/';
        if (name === 'data-target-selector-left') return '#synapse-container';
        return null;
    }},
    querySelector: (sel) => {
        if (sel === '#synapse-container') return mockContainer;
        return null;
    },
    querySelectorAll: (sel) => [],
    createElement: (tag) => {
        return { tagName: tag.toUpperCase(), style: {}, appendChild: () => {}, getContext: () => ({}) };
    },
    head: { appendChild: () => {} }
};

const mockContainer = {
    innerHTML: '',
    style: {},
    appendChild: () => {},
    dataset: {}
};

global.window.GreenhouseSynapseApp = {
    init: () => { }
};

let loadedScripts = [];
global.window.GreenhouseUtils = {
    loadScript: (name) => {
        loadedScripts.push(name);
        return Promise.resolve();
    },
    waitForElement: () => Promise.resolve(mockContainer)
};

// --- Helper to Load Script ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Synapse Page Loader', () => {

    TestFramework.beforeEach(() => {
        loadedScripts = [];
        delete global.window.GreenhouseSynapseApp; // Force reload
    });

    TestFramework.it('should load all synapse dependencies via main()', () => {
        loadScript('synapse_app.js');

        // Wait for the async main() IIFE to complete (simulated by checking in next tick or with a small delay if needed)
        // In this specific framework, we'll just check after a small timeout
        return new Promise((resolve) => {
            setTimeout(() => {
                assert.includes(loadedScripts, 'synapse_chemistry.js');
                assert.includes(loadedScripts, 'synapse_3d.js');
                assert.includes(loadedScripts, 'synapse_molecular.js');
                resolve();
            }, 100);
        });
    });

});

TestFramework.run();
