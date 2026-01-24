/**
 * Unit Tests for Models Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    currentScript: {
        getAttribute: (attr) => {
            if (attr === 'data-base-url') {
                return 'http://localhost:8080/';
            }
            return null;
        }
    },
    getElementById: () => ({
        addEventListener: () => { },
        getContext: () => ({
            save: () => { },
            restore: () => { },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            rect: () => { },
            clip: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        }),
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    }),
    createElement: () => ({
        getContext: () => ({})
    })
};
global.addEventListener = () => { };
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// --- Mocks ---
const mockGreenhouseUtils = {
    loadedScripts: new Set(),
    loadScript: async function(scriptName) {
        this.loadedScripts.add(scriptName);
        loadScript(scriptName);
        // Simulate loading by creating mock objects
        if (scriptName === 'models_data.js') {
            global.window.GreenhouseModelsData = {};
        }
        if (scriptName === 'models_ui.js') {
            global.window.GreenhouseModelsUI = {};
        }
        if (scriptName === 'models_ux.js') {
            global.window.GreenhouseModelsUX = {
                init: () => {},
                reinitialize: () => {}
            };
        }
         if (scriptName === 'data_adapter.js') {
            global.window.GreenhouseDataAdapter = {
                init: () => {}
            };
        }
        return Promise.resolve();
    }
};

global.window.GreenhouseDependencyManager = {
    waitFor: () => Promise.resolve(),
    register: () => {}
};

global.window.GreenhouseUtils = mockGreenhouseUtils;


// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const startTime = performance.now();
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
    const duration = performance.now() - startTime;
    if (TestFramework.ResourceReporter) {
        TestFramework.ResourceReporter.recordScript(filePath, duration);
    }
}

// --- Test Suites ---

TestFramework.describe('Models Page Loader', () => {

    TestFramework.beforeEach(() => {
        // Reset mocks before each test
        mockGreenhouseUtils.loadedScripts.clear();
        delete global.window.GreenhouseModels;
        delete global.window.GreenhouseModelsData;
        delete global.window.GreenhouseModelsUI;
        delete global.window.GreenhouseModelsUX;
        delete global.window.GreenhouseDataAdapter;
    });

    TestFramework.it('should load all dependent scripts', async () => {
        await loadScript('models.js');

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
            assert.isTrue(mockGreenhouseUtils.loadedScripts.has(script), `Script ${script} should have been loaded`);
        }
    });

    TestFramework.it('should define GreenhouseModels with a reinitialize function', async () => {
        await loadScript('models.js');
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.isDefined(global.window.GreenhouseModels, 'GreenhouseModels should be defined on the window object');
        assert.isFunction(global.window.GreenhouseModels.reinitialize, 'GreenhouseModels.reinitialize should be a function');
    });

});

// Run the tests
TestFramework.run();