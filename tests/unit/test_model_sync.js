/**
 * @file test_model_sync.js
 * @description Unit tests for GreenhouseBioStatus and inter-model synchronization.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    let lastEvent = null;
    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        dispatchEvent: (event) => { lastEvent = event; },
        CustomEvent: class { constructor(name, options) { this.name = name; this.detail = options ? options.detail : null; } },
        document: {
            createElement: () => ({ getContext: () => ({}), appendChild: () => {}, style: {} }),
            querySelector: () => ({ appendChild: () => {}, innerHTML: '' })
        },
        navigator: { userAgent: 'node' },
        requestAnimationFrame: (cb) => {}
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['models_util.js', 'inflammation_config.js', 'inflammation_app.js', 'stress_config.js', 'stress_app.js'];
    scripts.forEach(s => {
        const p = path.join(__dirname, '../../docs/js', s);
        vm.runInContext(fs.readFileSync(p, 'utf8'), context);
    });

    return { context, getLastEvent: () => lastEvent };
};

TestFramework.describe('GreenhouseBioStatus Synchronization', () => {
    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();
        env.context.window.GreenhouseBioStatus.stress = { load: 0.2, hpa: 0, autonomic: 0 };
        env.context.window.GreenhouseBioStatus.inflammation = { tone: 0, bbb: 1, microglia: 0 };
    });

    TestFramework.it('should update internal state and dispatch event on sync', () => {
        const stats = { tone: 0.5, bbb: 0.8 };
        env.context.window.GreenhouseBioStatus.sync('inflammation', stats);

        assert.equal(env.context.window.GreenhouseBioStatus.inflammation.tone, 0.5);
        assert.equal(env.context.window.GreenhouseBioStatus.inflammation.bbb, 0.8);
        const lastEvent = env.getLastEvent();
        assert.isNotNull(lastEvent);
        assert.equal(lastEvent.name, 'greenhouseBioUpdate');
        assert.deepEqual(lastEvent.detail.stats, stats);
    });

    TestFramework.it('should be called by InflammationApp updateModel', () => {
        const app = env.context.window.GreenhouseInflammationApp;
        const config = env.context.window.GreenhouseInflammationConfig;
        const engine = new env.context.window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: {
                tnfAlpha: 0.1, il10: 0.8, microgliaActivation: 0.05,
                bbbIntegrity: 0.95, neuroprotection: 0.9, stressBurden: 0.2
            },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);
        assert.greaterThan(env.context.window.GreenhouseBioStatus.inflammation.tone, 0);
        assert.equal(env.context.window.GreenhouseBioStatus.inflammation.bbb, engine.state.metrics.bbbIntegrity);
    });

    TestFramework.it('should allow models to influence each other via bridge', () => {
        env.context.window.GreenhouseBioStatus.stress.load = 0.9;
        const app = env.context.window.GreenhouseInflammationApp;
        const config = env.context.window.GreenhouseInflammationConfig;
        const engine = new env.context.window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: { tnfAlpha: 0.1, stressBurden: 0, il10: 0.8, bbbIntegrity: 0.9, neuroprotection: 0.9, microgliaActivation: 0.05 },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });

        app.updateModel(engine.state, 1000/60);
        assert.greaterThan(engine.state.metrics.stressBurden, 0);
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
