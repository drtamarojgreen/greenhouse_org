/**
 * @file test_model_sync.js
 * @description Unit tests for GreenhouseBioStatus and inter-model synchronization.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
let lastEvent = null;
global.dispatchEvent = (event) => { lastEvent = event; };
global.CustomEvent = class { constructor(name, options) { this.name = name; this.detail = options ? options.detail : null; } };
global.document = {
    createElement: () => ({ getContext: () => ({}), appendChild: () => {}, style: {} }),
    querySelector: () => ({ appendChild: () => {}, innerHTML: '' })
};
global.navigator = { userAgent: 'node' };
global.console = console;
global.requestAnimationFrame = (cb) => {};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Load Dependencies
loadScript('models_util.js');
loadScript('inflammation_config.js');
loadScript('inflammation_app.js');
loadScript('stress_config.js');
loadScript('stress_app.js');

TestFramework.describe('GreenhouseBioStatus Synchronization', () => {

    TestFramework.beforeEach(() => {
        lastEvent = null;
        // Reset GreenhouseBioStatus
        window.GreenhouseBioStatus.stress = { load: 0.2, hpa: 0, autonomic: 0 };
        window.GreenhouseBioStatus.inflammation = { tone: 0, bbb: 1, microglia: 0 };
    });

    TestFramework.it('should update internal state and dispatch event on sync', () => {
        const stats = { tone: 0.5, bbb: 0.8 };
        window.GreenhouseBioStatus.sync('inflammation', stats);

        assert.equal(window.GreenhouseBioStatus.inflammation.tone, 0.5);
        assert.equal(window.GreenhouseBioStatus.inflammation.bbb, 0.8);
        assert.isNotNull(lastEvent);
        assert.equal(lastEvent.name, 'greenhouseBioUpdate');
        assert.deepEqual(lastEvent.detail.stats, stats);
    });

    TestFramework.it('should be called by InflammationApp updateModel', () => {
        const app = window.GreenhouseInflammationApp;
        const config = window.GreenhouseInflammationConfig;
        const engine = new window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: {
                tnfAlpha: 0.1, il10: 0.8, microgliaActivation: 0.05,
                bbbIntegrity: 0.95, neuroprotection: 0.9, stressBurden: 0.2
            },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);

        // Check if GreenhouseBioStatus was updated
        assert.greaterThan(window.GreenhouseBioStatus.inflammation.tone, 0);
        assert.equal(window.GreenhouseBioStatus.inflammation.bbb, engine.state.metrics.bbbIntegrity);
    });

    TestFramework.it('should allow models to influence each other via bridge', () => {
        // Inflammation model pulls stress.load from the bridge
        window.GreenhouseBioStatus.stress.load = 0.9; // High stress

        const app = window.GreenhouseInflammationApp;
        const config = window.GreenhouseInflammationConfig;
        const engine = new window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: { tnfAlpha: 0.1, stressBurden: 0, il10: 0.8, bbbIntegrity: 0.9, neuroprotection: 0.9, microgliaActivation: 0.05 },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);

        // stressBurden in inflammation model should have increased due to bridge
        assert.greaterThan(engine.state.metrics.stressBurden, 0);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
