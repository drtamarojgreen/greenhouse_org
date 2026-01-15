/**
 * Unit Tests for Genetic Page Loader
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
    querySelector: (sel) => {
        if (sel === '.genetic-container') return mockContainer;
        if (sel === '.loading-screen') return { style: {} };
        return null;
    },
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({
        style: {},
        classList: { add: () => { } },
        appendChild: () => { },
        querySelector: () => null
    })
};

const mockContainer = {
    querySelector: (sel) => {
        if (sel === '.loading-screen') return { style: {} };
        if (sel === '.simulation-container') return null;
        return null;
    },
    appendChild: () => { },
    classList: { contains: () => false }
};

global.MutationObserver = class {
    observe() { }
    disconnect() { }
};

global.fetch = async () => ({ ok: true, text: async () => '' });

// --- Mocks ---
const mockUtils = {
    loadScript: async (name) => {
        mockUtils.loaded.push(name);
        if (name === 'genetic_algo.js') global.window.GreenhouseGeneticAlgo = { init: () => { } };
        if (name === 'genetic_ui_3d.js') global.window.GreenhouseGeneticUI3D = { init: () => { }, updateData: () => { }, shouldEvolve: () => false };
        return Promise.resolve();
    },
    displayError: () => { },
    loaded: []
};
global.window.GreenhouseUtils = mockUtils;

// --- Helper to Load Script ---
function loadScript(filename, attributes = {}) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');

    // Setup script attributes
    global.window._greenhouseScriptAttributes = attributes;

    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Genetic Page Loader', () => {

    TestFramework.beforeEach(() => {
        mockUtils.loaded = [];
        delete global.window.GreenhouseGeneticAlgo;
        delete global.window.GreenhouseGeneticUI3D;
        delete global.window.GreenhouseGenetic;
    });

    TestFramework.it('should load all genetic dependencies', async () => {
        loadScript('genetic.js', {
            'data-genetic-selectors': JSON.stringify({ genetic: '.genetic-container' }),
            'base-url': '/'
        });

        // wait for async init
        await new Promise(resolve => setTimeout(resolve, 100));

        const expected = [
            'models_3d_math.js',
            'genetic_config.js',
            'genetic_camera_controls.js',
            'genetic_lighting.js',
            'genetic_pip_controls.js',
            'genetic_algo.js',
            'genetic_ui_3d_geometry.js',
            'genetic_ui_3d_dna.js',
            'genetic_ui_3d_gene.js',
            'genetic_ui_3d_chromosome.js',
            'genetic_ui_3d_protein.js',
            'genetic_ui_3d_brain.js',
            'genetic_ui_3d_stats.js',
            'genetic_ui_3d.js'
        ];

        for (const script of expected) {
            assert.includes(mockUtils.loaded, script);
        }
    });

    TestFramework.it('should abort if data-genetic-selectors is missing', async () => {
        loadScript('genetic.js', {
            'base-url': '/'
        });

        assert.equal(mockUtils.loaded.length, 0);
    });

    TestFramework.it('should define window.GreenhouseGenetic with reinitialize', async () => {
        loadScript('genetic.js', {
            'data-genetic-selectors': JSON.stringify({ genetic: '.genetic-container' }),
            'base-url': '/'
        });

        assert.isDefined(global.window.GreenhouseGenetic);
        assert.isFunction(global.window.GreenhouseGenetic.reinitialize);
    });

});

TestFramework.run();
