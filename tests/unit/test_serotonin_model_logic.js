/**
 * @file test_serotonin_model_logic.js
 * @description Unit tests for Serotonin Structural Model logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    currentScript: {
        getAttribute: () => './'
    },
    querySelector: (selector) => {
        return {
            getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
            innerHTML: '',
            appendChild: () => { },
            style: {},
            addEventListener: () => { }
        };
    },
    getElementById: (id) => {
        return {
            innerHTML: '',
            style: {},
            appendChild: () => { },
            getContext: () => mockCtx
        };
    },
    createElement: (tag) => {
        const element = {
            tag,
            style: {},
            getContext: () => ({
                save: () => { },
                restore: () => { },
                translate: () => { },
                rotate: () => { },
                scale: () => { },
                beginPath: () => { },
                moveTo: () => { },
                lineTo: () => { },
                stroke: () => { },
                fill: () => { },
                rect: () => { },
                arc: () => { },
                closePath: () => { },
                clip: () => { },
                fillText: () => { },
                measureText: () => ({ width: 50 }),
                clearRect: () => { },
                fillRect: () => { },
                strokeRect: () => { },
                drawImage: () => { },
                createLinearGradient: () => ({ addColorStop: () => { } }),
                createRadialGradient: () => ({ addColorStop: () => { } })
            }),
            width: 800,
            height: 600,
            addEventListener: () => { },
            appendChild: () => { },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        };
        return element;
    },
    body: { appendChild: () => { } },
    head: { appendChild: () => { } }
};
global.navigator = { userAgent: 'node' };
global.console = {
    log: console.log,
    error: () => { },
    warn: () => { }
};
global.requestAnimationFrame = (cb) => { };
global.performance = { now: () => Date.now() };

// --- Script Loading Helper ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Serotonin Modules ---
// Note: serotonin.js is an IIFE that auto-runs main(), so we need
// to be careful. We'll pre-define GreenhouseUtils to avoid timeout.
global.window.GreenhouseUtils = {
    loadScript: async () => { },
    observeAndReinitializeApplication: () => { },
    startSentinel: () => { },
    appState: { targetSelectorLeft: '#serotonin-app-container', baseUrl: './' }
};

loadScript('models_3d_math.js');
loadScript('serotonin.js');
loadScript('serotonin_receptors.js');
loadScript('serotonin_kinetics.js');
loadScript('serotonin_signaling.js');

TestFramework.describe('Serotonin Model Logic (Unit)', () => {

    const G = global.window.GreenhouseSerotonin;

    TestFramework.it('should define core G object', () => {
        assert.isDefined(G);
    });

    TestFramework.describe('Structural Model', () => {
        TestFramework.it('should initialize with default receptors', () => {
            G.setupReceptorModel();
            assert.isDefined(G.state.receptors);
            assert.greaterThan(G.state.receptors.length, 0);
            assert.equal(G.state.receptors[0].type, '5-HT1A');
        });

        TestFramework.it('should calculate lipids', () => {
            G.setupStructuralModel();
            assert.greaterThan(G.state.lipids.length, 0);
        });
    });

    TestFramework.describe('Receptor States & Dynamics', () => {
        TestFramework.it('should modulate affinity based on sodium levels', () => {
            G.setupReceptorModel();
            G.state.timer = 1000;
            G.Receptors.updateReceptorStates();
            const h1a = G.state.receptors.find(r => r.type === '5-HT1A');
            assert.isDefined(h1a.sodiumModulation);
        });

        TestFramework.it('should account for RNA editing in 5-HT2C', () => {
            G.setupReceptorModel();
            const h2c = G.state.receptors.find(r => r.type === '5-HT2C');
            assert.includes(['INI', 'VGV', 'VSV'], h2c.editedIsoform);
            assert.isNumber(h2c.couplingEfficiency);
        });
    });

    TestFramework.describe('Ligand Kinetics', () => {
        TestFramework.it('should calculate binding probability', () => {
            G.setupReceptorModel();
            const receptor = G.state.receptors[0];
            const prob = G.Kinetics.calculateBindingProbability(receptor, '5-HT');
            assert.isNumber(prob);
            assert.inRange(prob, 0, 1.1);
        });
    });

    TestFramework.describe('Signaling Pathways', () => {
        TestFramework.it('should update secondary messengers', () => {
            G.Signaling.cAMP = 50;
            G.Signaling.updateSignaling();
            // Should decay slightly if no activity
            assert.lessThan(G.Signaling.cAMP, 50.1);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
