/**
 * Unit Tests for Models Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = () => {
    const mockWindow = {
        innerWidth: 800, innerHeight: 600,
        navigator: { userAgent: 'Node' },
        performance: performance,
        addEventListener: () => {},
        requestAnimationFrame: (cb) => setTimeout(cb, 16)
    };

    const mockDocument = {
        currentScript: { getAttribute: (a) => a === 'data-base-url' ? '/' : null },
        getElementById: () => ({
            addEventListener: () => {},
            getContext: () => ({
                save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
                beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
                rect: () => {}, clip: () => {}, fillText: () => {}, measureText: () => ({ width: 0 }),
                createLinearGradient: () => ({ addColorStop: () => {} }), clearRect: () => {}, fillRect: () => {}, strokeRect: () => {}
            }),
            width: 800, height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        }),
        createElement: () => ({ getContext: () => ({}) }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} }
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    context.GreenhouseUtils = {
        loadedScripts: new Set(),
        loadScript: async function(name) {
            this.loadedScripts.add(name);
            const code = fs.readFileSync(path.join(__dirname, '../../../../docs/js', name), 'utf8');
            vm.runInContext(code, context);
            if (name === 'models_data.js') context.GreenhouseModelsData = {};
            if (name === 'models_ui.js') context.GreenhouseModelsUI = {};
            if (name === 'models_ux.js') context.GreenhouseModelsUX = { init: () => {}, reinitialize: () => {} };
            if (name === 'data_adapter.js') context.GreenhouseDataAdapter = { init: () => {} };
            return Promise.resolve();
        }
    };

    context.GreenhouseDependencyManager = { waitFor: () => Promise.resolve(), register: () => {} };

    context.loadMain = () => {
        const code = fs.readFileSync(path.join(__dirname, '../../../../docs/js/models.js'), 'utf8');
        vm.runInContext(code, context);
    };

    return context;
};

// --- Test Suites ---

TestFramework.describe('Models Page Loader', () => {

    TestFramework.it('should load all dependent scripts', async () => {
        const env = createEnv();
        env.loadMain();

        // Allow async operations within models.js to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        const expectedScripts = [
            'models_util.js',
            'models_data.js',
            'models_ui_synapse.js',
            'models_ui_brain.js',
            'models_ui_environment_overlay.js',
            'models_ui_environment_hovers.js',
            'data_adapter.js',
            'environment_config.js',
            'models_ui_environment_background.js',
            'models_ui_environment_medication.js',
            'models_ui_environment_therapy.js',
            'models_ui_environment.js',
            'models_3d_math.js',
            'models_ui_3d.js',
            'models_ui.js',
            'models_ux.js'
        ];

        for (const script of expectedScripts) {
            assert.isTrue(env.GreenhouseUtils.loadedScripts.has(script), `Script ${script} should have been loaded`);
        }
    });

    TestFramework.it('should define GreenhouseModels with a reinitialize function', async () => {
        const env = createEnv();
        env.loadMain();
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.isDefined(env.GreenhouseModels, 'GreenhouseModels should be defined on the window object');
        assert.isFunction(env.GreenhouseModels.reinitialize, 'GreenhouseModels.reinitialize should be a function');
    });

});

// Run the tests
TestFramework.run();