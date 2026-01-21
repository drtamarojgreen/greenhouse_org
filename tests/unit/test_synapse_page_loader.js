/**
 * Unit Tests for Synapse Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    currentScript: null,
    querySelectorAll: (sel) => []
};

// --- Mocks ---
const mockUtils = {
    loadScript: async (name) => {
        mockUtils.loaded.push(name);
        if (name === 'synapse_app.js') global.window.GreenhouseSynapseApp = { init: () => { } };
        return Promise.resolve();
    },
    displayError: () => { },
    loaded: []
};
global.window.GreenhouseUtils = mockUtils;

// --- Helper to Load Script ---
function loadScript(filename, attributes = null) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');

    if (attributes) {
        global.window._greenhouseScriptAttributes = attributes;
    } else {
        delete global.window._greenhouseScriptAttributes;
    }

    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Synapse Page Loader', () => {

    TestFramework.beforeEach(() => {
        mockUtils.loaded = [];
        delete global.window.GreenhouseSynapseApp;
        delete global.window._greenhouseSynapseAttributes;
    });

    TestFramework.it('should load all synapse dependencies', async () => {
        loadScript('synapse.js', {
            'target-selector-left': '.synapse-container',
            'base-url': '/'
        });

        // wait for async loadDependencies and main
        await new Promise(resolve => setTimeout(resolve, 100));

        const expected = [
            'synapse_chemistry.js',
            'synapse_neurotransmitters.js',
            'synapse_sidebar.js',
            'synapse_tooltips.js',
            'synapse_controls.js',
            'synapse_analytics.js',
            'synapse_3d.js',
            'synapse_molecular.js',
            'synapse_app.js'
        ];

        for (const script of expected) {
            assert.includes(mockUtils.loaded, script);
        }
    });

    TestFramework.it('should fail if baseUrl is missing', async () => {
        loadScript('synapse.js', {
            'target-selector-left': '.synapse-container'
            // 'base-url' is missing
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(mockUtils.loaded.length, 0);
    });

});

TestFramework.run();
