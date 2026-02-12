/**
 * @file test_stress_logic.js
 * @description Unit tests for the Stress Dynamics Model logic.
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
loadScript('stress_config.js');
loadScript('stress_app.js');

TestFramework.describe('GreenhouseStressApp Logic', () => {

    let app;
    let engine;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseStressApp;
        const config = window.GreenhouseStressConfig;
        engine = new window.GreenhouseModelsUtil.SimulationEngine({
            initialFactors: config.factors.reduce((acc, f) => {
                acc[f.id] = f.defaultValue;
                return acc;
            }, {}),
            initialMetrics: {
                allostaticLoad: 0.15,
                autonomicBalance: 0.4,
                resilienceReserve: 0.9,
                hpaSensitivity: 1.0,
                hrv: 65,
                vagalTone: 0.7
            },
            updateFn: (state, dt) => app.updateModel(state, dt)
        });
        app.engine = engine;
        app.clock = new window.GreenhouseModelsUtil.DiurnalClock();
    });

    TestFramework.it('should increase allostaticLoad with environmental stressors', () => {
        // Disable all factors first to have a clean slate
        for (let id in engine.state.factors) {
            engine.state.factors[id] = 0;
        }
        engine.state.metrics.allostaticLoad = 0.15;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        // Enable many stressors
        engine.state.factors.env_noise = 1;
        engine.state.factors.env_air = 1;
        engine.state.factors.env_heat = 1;
        engine.state.factors.env_urban = 1;
        engine.state.factors.env_commute = 1;

        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.greaterThan(engine.state.metrics.allostaticLoad, initialState.metrics.allostaticLoad);
    });

    TestFramework.it('should decrease resilienceReserve when allostaticLoad is high', () => {
        engine.state.metrics.allostaticLoad = 0.8;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.resilienceReserve, initialState.metrics.resilienceReserve);
    });

    TestFramework.it('should improve resilienceReserve with social support', () => {
        engine.state.metrics.allostaticLoad = 0.2;
        // Mocking socialSupport factor as used in app.js
        engine.state.factors.socialSupport = 1;

        const initialState = JSON.parse(JSON.stringify(engine.state));

        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.greaterThan(engine.state.metrics.resilienceReserve, initialState.metrics.resilienceReserve);
    });

    TestFramework.it('should affect hpaSensitivity based on allostaticLoad', () => {
        engine.state.metrics.allostaticLoad = 0.9;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.hpaSensitivity, initialState.metrics.hpaSensitivity);
    });

    TestFramework.it('should calculate hrv based on autonomicBalance', () => {
        // High autonomicBalance (sympathetic) should lead to lower HRV
        engine.state.metrics.autonomicBalance = 1.2;
        app.updateModel(engine.state, 1000/60);
        const lowHrv = engine.state.metrics.hrv;

        engine.state.metrics.autonomicBalance = 0.1;
        app.updateModel(engine.state, 1000/60);
        const highHrv = engine.state.metrics.hrv;

        assert.greaterThan(highHrv, lowHrv);
    });

    TestFramework.it('should decrease serotoninLevels with high allostaticLoad', () => {
        engine.state.metrics.allostaticLoad = 0.8;
        engine.state.metrics.serotoninLevels = 100;

        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.serotoninLevels, 100);
    });

    TestFramework.it('should be influenced by genetic factors like fkbp5Variant', () => {
        engine.state.factors.fkbp5Variant = 1;
        const initialState = JSON.parse(JSON.stringify(engine.state));

        for(let i=0; i<10; i++) {
            app.updateModel(engine.state, 1000/60);
        }

        assert.lessThan(engine.state.metrics.hpaSensitivity, initialState.metrics.hpaSensitivity);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
