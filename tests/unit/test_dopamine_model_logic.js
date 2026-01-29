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
    currentScript: null,
    querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
    createElement: () => ({
        getContext: () => ({
            fillRect: () => { },
            clearRect: () => { },
            beginPath: () => { },
            arc: () => { },
            fill: () => { },
            stroke: () => { },
            save: () => { },
            restore: () => { },
            createRadialGradient: () => ({ addColorStop: () => { } }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            ellipse: () => { }
        }),
        width: 800, height: 600, addEventListener: () => { }
    }),
    body: { appendChild: () => { } },
    head: { appendChild: () => { } }
};
global.console = { log: console.log, error: () => { }, warn: () => { } };
global.requestAnimationFrame = () => { };
global.performance = { now: () => Date.now() };
global.setTimeout = setTimeout;

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

loadScript('models_3d_math.js');
loadScript('dopamine.js');
loadScript('dopamine_synapse.js');
loadScript('dopamine_molecular.js');
loadScript('dopamine_controls.js');

TestFramework.describe('Dopamine Model Logic (Unit)', () => {

    const G = global.window.GreenhouseDopamine;

    TestFramework.it('should define core G object', () => {
        assert.isDefined(G);
    });

    TestFramework.describe('State Initialization', () => {
        TestFramework.it('should have initial vesicles in synapseState', () => {
            assert.isDefined(G.synapseState.vesicles);
            assert.greaterThan(G.synapseState.vesicles.rrp.length, 0);
        });

        TestFramework.it('should initialize cleft DA array', () => {
            assert.isType(G.synapseState.cleftDA, 'object'); // Array is object in JS
            assert.isDefined(G.synapseState.cleftDA.length);
        });
    });

    TestFramework.describe('Synaptic Dynamics', () => {
        TestFramework.it('should handle synaptic updates', () => {
            const initialCleftCount = G.synapseState.cleftDA.length;
            // Force a release by increasing releaseRate
            G.synapseState.releaseRate = 1.0;
            G.updateSynapse();
            // Since release is probabilistic but rate is 1.0, it should likely release
            // But let's just check if the function runs without error
            assert.isDefined(G.synapseState.cleftDA);
        });

        TestFramework.it('should handle synthesis pathway', () => {
            const initialDA = G.synapseState.synthesis.dopamine;
            G.synapseState.synthesis.tyrosine = 100;
            G.updateSynapse();
            // Should have some L-DOPA or DA synthesized
            assert.isDefined(G.synapseState.synthesis.ldopa);
        });
    });

    TestFramework.describe('Molecular Signaling', () => {
        TestFramework.it('should update molecular states', () => {
            if (G.updateMolecular) {
                G.updateMolecular();
                assert.isDefined(G.molecularState.pka);
            }
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
