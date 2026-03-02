/**
 * @file test_serotonin_model_logic.js
 * @description Unit tests for Serotonin Structural Model logic.
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
        navigator: { userAgent: 'node' },
        performance: { now: () => Date.now() },
        requestAnimationFrame: () => { },
        addEventListener: () => { },
        document: {
            currentScript: { getAttribute: () => './' },
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
                    getContext: () => ({})
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
                        createRadialGradient: () => ({ addColorStop: () => { } }),
                        setLineDash: () => { }
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
            head: { appendChild: () => { } },
            addEventListener: () => { }
        },
        GreenhouseUtils: {
            loadScript: async () => { },
            observeAndReinitializeApplication: () => { },
            startSentinel: () => { },
            appState: { targetSelectorLeft: '#serotonin-app-container', baseUrl: './' }
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['models_3d_math.js', 'serotonin.js', 'serotonin_receptors.js', 'serotonin_kinetics.js', 'serotonin_signaling.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('Serotonin Model Logic (Unit)', () => {

    let env;
    let G;

    TestFramework.beforeEach(() => {
        env = createEnv();
        G = env.window.GreenhouseSerotonin;
    });

    TestFramework.it('should define core G object', () => {
        assert.isDefined(G);
    });

    TestFramework.describe('Structural Model', () => {
        TestFramework.it('should initialize with default receptors', () => {
            G.setupStructuralModel();
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
            G.setupStructuralModel();
            G.state.timer = 1000;
            G.Receptors.updateReceptorStates();
            const h1a = G.state.receptors.find(r => r.type === '5-HT1A');
            assert.isDefined(h1a.sodiumModulation);
        });

        TestFramework.it('should account for RNA editing in 5-HT2C', () => {
            G.setupStructuralModel();
            const h2c = G.state.receptors.find(r => r.type === '5-HT2C');
            assert.includes(['INI', 'VGV', 'VSV'], h2c.editedIsoform);
            assert.isNumber(h2c.couplingEfficiency);
        });
    });

    TestFramework.describe('Ligand Kinetics', () => {
        TestFramework.it('should spawn ligands correctly', () => {
            const initialCount = G.Kinetics.activeLigands.length;
            G.Kinetics.spawnLigand('Serotonin');
            assert.equal(G.Kinetics.activeLigands.length, initialCount + 1);
            assert.equal(G.Kinetics.activeLigands[initialCount].name, 'Serotonin');
        });
    });

    TestFramework.describe('Signaling Pathways', () => {
        TestFramework.it('should update secondary messengers', () => {
            G.Signaling.cAMP = 50;
            G.Signaling.updateSignaling();
            assert.lessThan(G.Signaling.cAMP, 50.1);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
