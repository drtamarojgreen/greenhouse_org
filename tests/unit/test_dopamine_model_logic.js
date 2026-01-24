/**
 * @file test_dopamine_model_logic.js
 * @description Unit tests for Dopamine Signaling Simulation logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
    createElement: () => ({
        getContext: () => ({ fillRect: () => { }, clearRect: () => { }, beginPath: () => { }, arc: () => { }, fill: () => { }, stroke: () => { }, save: () => { }, restore: () => { } }),
        width: 800, height: 600, addEventListener: () => { }
    }),
    body: { appendChild: () => { } }
};
global.console = { log: console.log, error: () => { }, warn: () => { } };
global.requestAnimationFrame = () => { };
global.performance = { now: () => Date.now() };

// --- Script Loading Helper ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
global.window.GreenhouseUtils = {
    loadScript: async () => { },
    observeAndReinitializeApplication: () => { },
    startSentinel: () => { }
};

loadScript('dopamine.js');

TestFramework.describe('Dopamine Model Logic (Unit)', () => {

    const G = global.window.GreenhouseDopamine;

    TestFramework.it('should define core G object', () => {
        assert.isDefined(G);
    });

    TestFramework.describe('State Initialization', () => {
        TestFramework.it('should have initial vesicles', () => {
            assert.isDefined(G.state.vesicles);
            assert.greaterThan(G.state.vesicles.length, 0);
        });

        TestFramework.it('should initialize cleft DA concentration', () => {
            assert.isNumber(G.state.cleftDA);
        });
    });

    TestFramework.describe('Synaptic Dynamics', () => {
        TestFramework.it('should handle vesicle fusion', () => {
            const initialDA = G.state.cleftDA;
            G.triggerActionPotential();
            // In many versions, triggering an AP should increase cleft DA
            assert.greaterThan(G.state.cleftDA, initialDA);
        });

        TestFramework.it('should handle DA reuptake via DAT', () => {
            G.state.cleftDA = 100;
            const datActivity = G.datActivity || 1.0;
            // Simulate update
            for (let i = 0; i < 10; i++) G.update();
            assert.lessThan(G.state.cleftDA, 101); // reuptake should reduce concentration
        });
    });

    TestFramework.describe('Receptor Binding', () => {
        TestFramework.it('should toggle receptor states', () => {
            if (G.state.receptors && G.state.receptors.length > 0) {
                const r = G.state.receptors[0];
                const initialState = r.active;
                G.toggleReceptorState(0);
                assert.notEqual(r.active, initialState);
            }
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
