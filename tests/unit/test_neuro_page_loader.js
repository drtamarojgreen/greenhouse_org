/**
 * Unit Tests for Neuro Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = () => {
    const mockWindow = {
        _greenhouseNeuroAttributes: null,
        GreenhouseDependencyManager: { waitFor: () => Promise.resolve() }
    };

    const mockDocument = {
        currentScript: {
            getAttribute: (attr) => {
                if (attr === 'data-base-url') return '/';
                if (attr === 'data-target-selector-left') return '.neuro-container';
                return null;
            }
        },
        querySelectorAll: (sel) => [],
        getElementById: (id) => ({ innerHTML: '' }),
        querySelector: (sel) => null
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    context.GreenhouseUtils = {
        loaded: [],
        loadScript: async function(name) {
            this.loaded.push(name);
            if (name === 'neuro_app.js') context.GreenhouseNeuroApp = { init: () => { } };
            if (name === 'neuro_ga.js') context.NeuroGA = function () { };
            if (name === 'neuro_ui_3d.js') context.GreenhouseNeuroUI3D = {};
            return Promise.resolve();
        },
        displayError: () => { },
        renderModelsTOC: () => { }
    };

    context.loadMain = (attrs = null) => {
        if (attrs) context._greenhouseNeuroAttributes = attrs;
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js/neuro.js'), 'utf8');
        vm.runInContext(code, context);
    };

    return context;
};

// --- Test Suite ---

TestFramework.describe('Neuro Page Loader', () => {

    TestFramework.it('should load all neuro dependencies', async () => {
        const env = createEnv();
        env.loadMain();

        // wait for async init
        await new Promise(resolve => setTimeout(resolve, 100));

        const expected = [
            'models_lang.js',
            'models_util.js',
            'models_3d_math.js',
            'brain_mesh_realistic.js',
            'neuro_config.js',
            'neuro_camera_controls.js',
            'neuro_synapse_camera_controls.js',
            'neuro_lighting.js',
            'neuro_adhd_data.js',
            'neuro_ga.js',
            'neuro_ui_3d_geometry.js',
            'neuro_ui_3d_brain.js',
            'neuro_ui_3d_neuron.js',
            'neuro_ui_3d_synapse.js',
            'neuro_ui_3d_stats.js',
            'neuro_ui_3d.js',
            'neuro_controls.js',
            'neuro_app.js'
        ];

        for (const script of expected) {
            assert.includes(env.GreenhouseUtils.loaded, script);
        }
    });

    TestFramework.it('should use pre-defined attributes if available', async () => {
        const env = createEnv();
        env.loadMain({ baseUrl: '/custom/', targetSelector: '.custom' });

        await new Promise(resolve => setTimeout(resolve, 50));

        assert.equal(env._greenhouseNeuroAttributes.baseUrl, '/custom/');
    });

});

TestFramework.run();
