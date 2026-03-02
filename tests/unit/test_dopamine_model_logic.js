/**
 * @file test_dopamine_model_logic.js
 * @description Unit tests for Dopamine Signaling Simulation logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => Date.now() },
        requestAnimationFrame: () => { },
        document: {
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
        },
        GreenhouseUtils: {
            loadScript: async () => { },
            observeAndReinitializeApplication: () => { },
            startSentinel: () => { }
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['models_3d_math.js', 'dopamine.js', 'dopamine_synapse.js', 'dopamine_molecular.js', 'dopamine_controls.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('Dopamine Model Logic (Unit)', () => {

    let env;
    let G;

    TestFramework.beforeEach(() => {
        env = createEnv();
        G = env.window.GreenhouseDopamine;
    });

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
            G.synapseState.releaseRate = 1.0;
            G.updateSynapse();
            assert.isDefined(G.synapseState.cleftDA);
        });

        TestFramework.it('should handle synthesis pathway', () => {
            G.synapseState.synthesis.tyrosine = 100;
            G.updateSynapse();
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

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
