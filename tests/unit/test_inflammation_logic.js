const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

/**
 * Unit Test for Inflammation Model Logic
 */

// --- Mock Browser Environment ---
global.window = global;
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
            measureText: () => ({ width: 10 }),
            save: () => {},
            restore: () => {}
        }),
        appendChild: () => {},
        style: {}
    }),
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: '',
        offsetWidth: 1000,
        style: {}
    }),
    body: { appendChild: () => {} },
    currentScript: null
};
global.navigator = { userAgent: 'node' };
global.console = console;
global.requestAnimationFrame = (cb) => {};
global.addEventListener = () => {};
global.CustomEvent = class { constructor(name, options) { this.name = name; this.detail = options ? options.detail : null; } };
global.dispatchEvent = () => {};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('models_util.js');
loadScript('inflammation_config.js');
loadScript('inflammation_app.js');

TestFramework.describe('Inflammation Model Logic (Restored Metrics)', () => {
    let app;
    let engine;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseInflammationApp;
        app.init(document.querySelector('div'));
        engine = app.engine;
    });

    TestFramework.it('TNF-alpha should increase with pathogenic triggers', () => {
        engine.state.metrics.tnfAlpha = 0.1;
        const initialTnf = engine.state.metrics.tnfAlpha;

        // Activate triggers
        engine.state.factors.pathogenActive = 1;
        engine.state.factors.chronicStress = 1;

        // Disable protective factors to isolate trigger effect
        engine.state.factors.cleanDiet = 0;
        engine.state.factors.socialSupport = 0;
        engine.state.factors.exerciseRegular = 0;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.greaterThan(engine.state.metrics.tnfAlpha, initialTnf);
    });

    TestFramework.it('IL-10 should respond to exercise', () => {
        engine.state.metrics.il10 = 0.05;
        const initialIl10 = engine.state.metrics.il10;

        engine.state.factors.exerciseRegular = 1;
        engine.state.factors.cleanDiet = 0;
        engine.state.factors.socialSupport = 0;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.greaterThan(engine.state.metrics.il10, initialIl10);
    });

    TestFramework.it('Neuroprotection should decrease when TNF-alpha is high', () => {
        engine.state.metrics.tnfAlpha = 0.8;
        engine.state.metrics.il10 = 0.1;
        engine.state.metrics.neuroprotection = 0.9;
        const initialNeuro = engine.state.metrics.neuroprotection;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.lessThan(engine.state.metrics.neuroprotection, initialNeuro);
    });

    TestFramework.it('should verify Advanced Signaling Metrics', () => {
        engine.state.metrics.tnfAlpha = 0.8;
        engine.state.factors.pathogenActive = 1;

        app.updateModel(engine.state, 1000/60);

        assert.greaterThan(engine.state.metrics.tryptase, 0);
        assert.greaterThan(engine.state.metrics.atp, 0);
        assert.greaterThan(engine.state.metrics.ros, 0);
        assert.greaterThan(engine.state.metrics.nfkbActivation, 0);
    });

    TestFramework.it('should verify NLRP3 Inflammasome activation', () => {
        // NLRP3 is driven by ATP and ROS
        // Set factors to keep drive high
        engine.state.factors.leakyGut = 1;
        engine.state.factors.pathogenActive = 1;
        window.GreenhouseBioStatus.stress.load = 1.0;

        // Manual boost to metrics to speed up
        engine.state.metrics.stressBurden = 0.9;
        engine.state.metrics.tnfAlpha = 0.9;
        engine.state.metrics.microgliaActivation = 0.8;

        for (let i = 0; i < 100; i++) {
            app.updateModel(engine.state, 16);
        }

        assert.greaterThan(engine.state.metrics.nlrp3State, 0.5);
    });

    TestFramework.it('should verify Clinical Burden Impacts', () => {
        const initialState = JSON.parse(JSON.stringify(engine.state));

        engine.state.factors.agePreset = 1;
        engine.state.factors.comorbidityDiabetes = 1;

        app.updateModel(engine.state, 1000/60);
        const tnfWithBurden = engine.state.metrics.tnfAlpha;

        // Reset and run without burden
        engine.state.metrics.tnfAlpha = initialState.metrics.tnfAlpha;
        engine.state.factors.agePreset = 0;
        engine.state.factors.comorbidityDiabetes = 0;

        app.updateModel(engine.state, 1000/60);
        const tnfWithoutBurden = engine.state.metrics.tnfAlpha;

        assert.greaterThan(tnfWithBurden, tnfWithoutBurden);
    });

    TestFramework.it('should integrate Diurnal Clock', () => {
        app.clock.timeInHours = 12;
        app.updateModel(engine.state, 0); // dt = 0 to avoid time advancement
        assert.equal(engine.state.factors.timeOfDay, 12);

        app.clock.timeInHours = 18;
        app.updateModel(engine.state, 0);
        assert.equal(engine.state.factors.timeOfDay, 18);
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
