/**
 * @file test_inflammation_logic.js
 * @description Unit tests for the Neuroinflammation Model logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.dispatchEvent = () => {};
global.CustomEvent = class { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.document = {
    createElement: () => ({
        getContext: () => ({
            fillRect: () => {},
            fillText: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            measureText: () => ({ width: 0 })
        }),
        appendChild: () => {},
        style: {}
    }),
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: ''
    })
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

TestFramework.describe('GreenhouseInflammationApp Logic', () => {

    let app;
    let engine;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseInflammationApp;
        // Mock init to avoid canvas creation and loop start
        // We want to test updateModel directly
        const config = window.GreenhouseInflammationConfig;
        engine = new window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
            initialMetrics: { tnfAlpha: 10, il10: 5, microgliaActivation: 0.1, bbbIntegrity: 1.0, neuroprotection: 1.0, stressBurden: 0.15 },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });
        app.engine = engine;
        app.clock = new window.GreenhouseModelsUtil.DiurnalClock();
    });

    TestFramework.it('should increase tnfAlpha when pathogenActive is enabled', () => {
        const initialState = JSON.parse(JSON.stringify(engine.state));
        engine.state.factors.pathogenActive = 1;

        // Run update multiple times to see the trend (smoothing is applied)
        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.greaterThan(engine.state.metrics.tnfAlpha, initialState.metrics.tnfAlpha);
    });

    TestFramework.it('should decrease tnfAlpha when steroidsApp is enabled', () => {
        // First, set a high TNF alpha
        engine.state.metrics.tnfAlpha = 400;
        const stateBeforeTreatment = JSON.parse(JSON.stringify(engine.state));

        engine.state.factors.steroidsApp = 1;

        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.tnfAlpha, stateBeforeTreatment.metrics.tnfAlpha);
    });

    TestFramework.it('should improve il10 when cleanDiet and exerciseRegular are enabled', () => {
        const initialState = JSON.parse(JSON.stringify(engine.state));
        engine.state.factors.cleanDiet = 1;
        engine.state.factors.exerciseRegular = 1;

        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.greaterThan(engine.state.metrics.il10, initialState.metrics.il10);
    });

    TestFramework.it('should decrease bbbIntegrity when tnfAlpha is high', () => {
        engine.state.metrics.tnfAlpha = 500;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        // BBB damage is slow, might need many iterations or higher dt
        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.bbbIntegrity, initialState.metrics.bbbIntegrity);
    });

    TestFramework.it('should increase microgliaActivation with high tnfAlpha', () => {
        engine.state.metrics.tnfAlpha = 450;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.greaterThan(engine.state.metrics.microgliaActivation, initialState.metrics.microgliaActivation);
    });

    TestFramework.it('should calculate neuroprotection based on bbbIntegrity and il10', () => {
        engine.state.metrics.bbbIntegrity = 0.5;
        engine.state.metrics.il10 = 2;
        engine.state.metrics.microgliaActivation = 0.9;

        app.updateModel(engine.state, 1000/60);
        const lowProt = engine.state.metrics.neuroprotection;

        engine.state.metrics.bbbIntegrity = 1.0;
        engine.state.metrics.il10 = 50;
        engine.state.metrics.microgliaActivation = 0.1;

        app.updateModel(engine.state, 1000/60);
        const highProt = engine.state.metrics.neuroprotection;

        assert.greaterThan(highProt, lowProt);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
