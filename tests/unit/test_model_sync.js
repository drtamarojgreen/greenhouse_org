/**
 * @file test_model_sync.js
 * @description Unit tests for GreenhouseBioStatus and inter-model synchronization.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = () => {
    const mockWindow = {
        lastEvent: null,
        dispatchEvent: function(e) { this.lastEvent = e; },
        CustomEvent: class { constructor(n, o) { this.name = n; this.detail = o ? o.detail : null; } },
        navigator: { userAgent: 'node' },
        requestAnimationFrame: () => {}
    };

    const mockDocument = {
        createElement: () => ({ getContext: () => ({}), appendChild: () => {}, style: {} }),
        querySelector: () => ({ appendChild: () => {}, innerHTML: '' }),
        addEventListener: () => {}
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    const load = (name) => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', name), 'utf8');
        vm.runInContext(code, context);
    };

    ['models_util.js', 'inflammation_config.js', 'inflammation_app.js', 'stress_config.js', 'stress_app.js'].forEach(load);

    return context;
};

TestFramework.describe('GreenhouseBioStatus Synchronization', () => {

    TestFramework.it('should update internal state and dispatch event on sync', () => {
        const env = createEnv();
        env.GreenhouseBioStatus.stress = { load: 0.2, hpa: 0, autonomic: 0 };
        env.GreenhouseBioStatus.inflammation = { tone: 0, bbb: 1, microglia: 0 };

        const stats = { tone: 0.5, bbb: 0.8 };
        env.GreenhouseBioStatus.sync('inflammation', stats);

        assert.equal(env.GreenhouseBioStatus.inflammation.tone, 0.5);
        assert.equal(env.GreenhouseBioStatus.inflammation.bbb, 0.8);
        assert.isNotNull(env.lastEvent);
        assert.equal(env.lastEvent.name, 'greenhouseBioUpdate');
        assert.deepEqual(env.lastEvent.detail.stats, stats);
    });

    TestFramework.it('should be called by InflammationApp updateModel', () => {
        const env = createEnv();
        const app = env.GreenhouseInflammationApp;
        const config = env.GreenhouseInflammationConfig;
        const engine = new env.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: {
                tnfAlpha: 0.1, il10: 0.8, microgliaActivation: 0.05,
                bbbIntegrity: 0.95, neuroprotection: 0.9, stressBurden: 0.2
            },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);

        assert.greaterThan(env.GreenhouseBioStatus.inflammation.tone, 0);
        assert.equal(env.GreenhouseBioStatus.inflammation.bbb, engine.state.metrics.bbbIntegrity);
    });

    TestFramework.it('should allow models to influence each other via bridge', () => {
        const env = createEnv();
        env.GreenhouseBioStatus.stress.load = 0.9;

        const app = env.GreenhouseInflammationApp;
        const config = env.GreenhouseInflammationConfig;
        const engine = new env.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: { tnfAlpha: 0.1, stressBurden: 0, il10: 0.8, bbbIntegrity: 0.9, neuroprotection: 0.9, microgliaActivation: 0.05 },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);

        assert.greaterThan(engine.state.metrics.stressBurden, 0);
    });

    TestFramework.it('should be called by StressApp updateModel', () => {
        const env = createEnv();
        const app = env.GreenhouseStressApp;
        const config = env.GreenhouseStressConfig;
        const engine = new env.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: {
                allostaticLoad: 0.5, hpaSensitivity: 0.8, autonomicBalance: 0.5,
                hrv: 60, vagalTone: 0.6
            },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);

        assert.equal(env.GreenhouseBioStatus.stress.load, engine.state.metrics.allostaticLoad);
        assert.equal(env.GreenhouseBioStatus.stress.hpa, engine.state.metrics.hpaSensitivity);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
