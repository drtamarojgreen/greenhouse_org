/**
 * @file test_stress_logic.js
 * @description Unit tests for Stress Dynamics simulation logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    currentScript: { getAttribute: () => '' },
    querySelector: () => ({ offsetWidth: 800, innerHTML: '', appendChild: () => {}, style: {}, getAttribute: () => '' }),
    createElement: () => ({
        style: {},
        appendChild: () => {},
        getContext: () => ({
            clearRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            moveTo: () => {},
            lineTo: () => {},
            fillRect: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            fillText: () => {}
        }),
        width: 800,
        height: 400
    })
};
global.performance = { now: () => Date.now() };
global.dispatchEvent = () => {};
global.addEventListener = () => {};
global.CustomEvent = class {};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// --- Load Dependencies ---
const utilsCorePath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
vm.runInThisContext(fs.readFileSync(utilsCorePath, 'utf8'));

const utilPath = path.join(__dirname, '../../docs/js/models_util.js');
vm.runInThisContext(fs.readFileSync(utilPath, 'utf8'));

const appPath = path.join(__dirname, '../../docs/js/stress.js');
vm.runInThisContext(fs.readFileSync(appPath, 'utf8'));

TestFramework.describe('Stress Simulation Logic (Unit)', () => {

    let App;

    TestFramework.beforeEach(() => {
        App = window.GreenhouseStressApp;
        App.init('#mock-container');
    });

    TestFramework.it('should initialize engine with correct default factors', () => {
        assert.equal(App.engine.state.factors.stressorIntensity, 0.3);
    });

    TestFramework.it('allostatic load should increase with sustained high stress', () => {
        const initialLoad = App.engine.state.metrics.allostaticLoad;
        App.engine.state.factors.stressorIntensity = 1.0;
        App.engine.state.factors.sleepRegularity = 0.0;

        // Run several ticks
        for(let i=0; i<500; i++) App.engine.update(i * 100);

        const finalLoad = App.engine.state.metrics.allostaticLoad;
        assert.greaterThan(finalLoad, initialLoad);
    });

    TestFramework.it('resilience reserve should decrease when allostatic load is high', () => {
        const initialReserve = App.engine.state.metrics.resilienceReserve;
        App.engine.state.metrics.allostaticLoad = 0.9;
        App.engine.state.factors.socialSupport = 0.0;
        App.engine.state.factors.sleepRegularity = 0.0;

        for(let i=0; i<500; i++) App.engine.update(i * 100);

        assert.lessThan(App.engine.state.metrics.resilienceReserve, initialReserve);
    });

    TestFramework.it('autonomic balance should shift towards sympathetic with high stress', () => {
        App.engine.state.factors.stressorIntensity = 1.0;
        App.engine.state.factors.copingSkill = 0.0;
        for(let i=0; i<100; i++) App.engine.update(i * 100);
        assert.greaterThan(App.engine.state.metrics.autonomicBalance, 0.8);
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
