console.log("FILE LOADED");
/**
 * @file test_inflammation_logic.js
 * @description Unit tests for Neuroinflammation simulation logic.
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
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };
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

const appPath = path.join(__dirname, '../../docs/js/inflammation.js');
vm.runInThisContext(fs.readFileSync(appPath, 'utf8'));

TestFramework.describe('Inflammation Simulation Logic (Unit)', () => {

    let App;

    TestFramework.beforeEach(() => {
        App = window.GreenhouseInflammationApp;
        App.init('#mock-container');
    });

    TestFramework.it('should initialize engine with correct default factors', () => {
        assert.equal(App.engine.state.factors.immuneTrigger, 0.2);
        assert.equal(App.engine.state.factors.sleepQuality, 0.8);
    });

    TestFramework.it('inflammatory tone should increase with high immune trigger', () => {
        const initialTone = App.engine.state.metrics.inflammatoryTone;
        App.engine.state.factors.immuneTrigger = 1.0;
        App.engine.state.factors.sleepQuality = 0.1;

        // Run several ticks
        for(let i=0; i<100; i++) App.engine.update(i * 100);

        const finalTone = App.engine.state.metrics.inflammatoryTone;
        assert.greaterThan(finalTone, initialTone);
    });

    TestFramework.it('signaling efficiency should drop when inflammation is high', () => {
        App.engine.state.factors.immuneTrigger = 1.0;
        App.engine.state.factors.stressLoad = 1.0;
        App.engine.state.factors.sleepQuality = 0.0;

        // Run enough ticks for tone to rise AND efficiency to drop
        for(let i=0; i<500; i++) App.engine.update(i * 100);

        assert.greaterThan(App.engine.state.metrics.inflammatoryTone, 0.7);
        assert.lessThan(App.engine.state.metrics.signalingEfficiency, 0.6);
    });

    TestFramework.it('recovery momentum should be high with good sleep and low inflammation', () => {
        App.engine.state.factors.sleepQuality = 1.0;
        App.engine.state.metrics.inflammatoryTone = 0.1;
        for(let i=0; i<100; i++) App.engine.update(i * 100);
        assert.greaterThan(App.engine.state.metrics.recoveryMomentum, 0.7);
    });
});

console.log("Starting tests...");
TestFramework.run().then(results => {
    console.log("Tests finished.");
    process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
    console.error("Test run error:", err);
    process.exit(1);
});
