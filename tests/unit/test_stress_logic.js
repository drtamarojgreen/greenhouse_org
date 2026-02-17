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
        // Disable protective factors for a clean test
        engine.state.factors.psych_support = 0;
        engine.state.factors.bio_bdnf = 0;
        engine.state.factors.bio_gaba = 0;

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

    TestFramework.it('should verify Diurnal Phase Logic', () => {
        // Mock clock to a specific time
        app.clock.timeInHours = 8; // Morning
        app.updateModel(engine.state, 1000/60);
        const morningCortisol = engine.state.metrics.cortisolLevels;

        app.clock.timeInHours = 23; // Night
        app.updateModel(engine.state, 1000/60);
        const nightCortisol = engine.state.metrics.cortisolLevels;

        // Morning cortisol (CAR) should be generally higher than night
        // Note: Simulation uses smoothing, so we might need multiple updates
        for(let i=0; i<100; i++) {
            app.clock.timeInHours = 8;
            app.updateModel(engine.state, 1000/60);
        }
        const morningStable = engine.state.metrics.cortisolLevels;

        for(let i=0; i<100; i++) {
            app.clock.timeInHours = 23;
            app.updateModel(engine.state, 1000/60);
        }
        const nightStable = engine.state.metrics.cortisolLevels;

        assert.greaterThan(morningStable, nightStable);
    });

    TestFramework.it('should verify Stepped-Care Escalation', () => {
        // Setup initial conditions
        const resetState = () => {
            for (let id in engine.state.factors) engine.state.factors[id] = 0;
            for (let id in engine.state.metrics) engine.state.metrics[id] = 0.5;
            engine.state.metrics.allostaticLoad = 0.8;
            engine.state.metrics.autonomicBalance = 0.4;
            engine.state.history.cumulativeLoad = 0;
            engine.state.factors.stress_interv_relapse_prev = 1;
            // Also need these for damping to be non-zero
            engine.state.factors.stress_interv_adherence = 1;
            engine.state.factors.stress_system_access = 1;
            engine.state.factors.stress_system_capacity = 1;
        };

        // Scenario 1: With Stepped Care
        resetState();
        engine.state.factors.stress_system_stepped_care = 1;
        app.updateModel(engine.state, 1000/60);
        const balanceWithSteppedCare = engine.state.metrics.autonomicBalance;

        // Reset and Scenario 2: Without Stepped Care
        resetState();
        engine.state.factors.stress_system_stepped_care = 0;
        app.updateModel(engine.state, 1000/60);
        const balanceWithoutSteppedCare = engine.state.metrics.autonomicBalance;

        assert.lessThan(balanceWithSteppedCare, balanceWithoutSteppedCare);
    });

    TestFramework.it('should verify Crisis Pathway spike', () => {
        engine.state.metrics.allostaticLoad = 0.9;
        engine.state.factors.stress_system_crisis_plan = 0;

        const initialState = JSON.parse(JSON.stringify(engine.state));
        app.updateModel(engine.state, 1000/60);
        const spikeBalance = engine.state.metrics.autonomicBalance;

        engine.state.factors.stress_system_crisis_plan = 1;
        engine.state.metrics.autonomicBalance = initialState.metrics.autonomicBalance;
        app.updateModel(engine.state, 1000/60);
        const safeBalance = engine.state.metrics.autonomicBalance;

        assert.greaterThan(spikeBalance, safeBalance);
    });

    TestFramework.it('should verify Risk Monitoring activation', () => {
        engine.state.factors.stress_system_risk_monitor = 1;
        engine.state.metrics.allostaticLoad = 0.95;

        app.updateModel(engine.state, 1000/60);
        assert.isTrue(engine.state.history.riskAlertActive);

        engine.state.metrics.allostaticLoad = 0.5;
        app.updateModel(engine.state, 1000/60);
        assert.isFalse(engine.state.history.riskAlertActive);
    });

    TestFramework.it('should verify Gut Health Efficiency impact', () => {
        engine.state.factors.gutHealth = 0; // Poor gut health
        engine.state.factors.env_noise = 1; // Some stressor

        app.updateModel(engine.state, 1000/60);
        const poorGutDopamine = engine.state.metrics.dopamineLevels;

        engine.state.factors.gutHealth = 1;
        // Reset metrics to baseline for comparison
        engine.state.metrics.dopamineLevels = 100;

        app.updateModel(engine.state, 1000/60);
        const goodGutDopamine = engine.state.metrics.dopamineLevels;

        assert.greaterThan(goodGutDopamine, poorGutDopamine);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
