/**
 * Unit Tests for Neuro Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.HTMLElement = class { };
global.document = {
    currentScript: {
        getAttribute: (attr) => {
            if (attr === 'data-base-url') return '/';
            if (attr === 'data-target-selector-left') return '.neuro-container';
            return null;
        }
    },
    querySelectorAll: (sel) => []
};

global.window.GreenhouseDependencyManager = {
    waitFor: () => Promise.resolve()
};

// --- Mocks ---
const mockUtils = {
    loadScript: async (name) => {
        mockUtils.loaded.push(name);
        if (name === 'neuro_app.js') global.window.GreenhouseNeuroApp = { init: () => { } };
        if (name === 'neuro_ga.js') global.window.NeuroGA = function () { };
        if (name === 'neuro_ui_3d_enhanced.js') global.window.GreenhouseNeuroUI3D = {};
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
        global.window._greenhouseNeuroAttributes = attributes;
    } else {
        delete global.window._greenhouseNeuroAttributes;
    }

    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Neuro Page Loader', () => {

    TestFramework.beforeEach(() => {
        mockUtils.loaded = [];
        delete global.window.GreenhouseNeuroApp;
        delete global.window.NeuroGA;
        delete global.window.GreenhouseNeuroUI3D;
    });

    TestFramework.it('should load all neuro dependencies', async () => {
        loadScript('neuro.js');

        // wait for async init
        await new Promise(resolve => setTimeout(resolve, 100));

        const expected = [
            'models_3d_math.js',
            'neuro_config.js',
            'neuro_camera_controls.js',
            'neuro_lighting.js',
            'neuro_ga.js',
            'neuro_ui_3d_geometry.js',
            'neuro_ui_3d_brain.js',
            'neuro_ui_3d_neuron.js',
            'neuro_ui_3d_synapse.js',
            'neuro_ui_3d_stats.js',
            'neuro_ui_3d_enhanced.js',
            'neuro_app.js'
        ];

        for (const script of expected) {
            assert.includes(mockUtils.loaded, script);
        }
    });

    TestFramework.it('should use pre-defined attributes if available', async () => {
        loadScript('neuro.js', { baseUrl: '/custom/', targetSelector: '.custom' });

        await new Promise(resolve => setTimeout(resolve, 50));

        assert.equal(global.window._greenhouseNeuroAttributes.baseUrl, '/custom/');
    });

});

TestFramework.run();
