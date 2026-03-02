/**
 * Unit Tests for RNA Page Models
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    // If running in harness with pre-initialized state
    if (typeof window !== 'undefined' && window.Greenhouse && window.Greenhouse.rnaSimulation) {
        return window;
    }

    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: (cb, delay) => {
            if (delay > 0) return; // Skip scheduled timeouts in tests
            return setTimeout(cb, delay);
        },
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => 1000000 },
        Date: { now: () => 1000000 },
        requestAnimationFrame: (cb) => { },
        document: {
            querySelector: (selector) => {
                if (selector === '#rna-container') {
                    return {
                        getBoundingClientRect: () => ({ width: 800, height: 600 }),
                        innerHTML: '',
                        appendChild: () => { }
                    };
                }
                return null;
            },
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                style: {},
                getContext: () => ({
                    save: () => { }, restore: () => { }, translate: () => { },
                    rotate: () => { }, scale: () => { }, beginPath: () => { },
                    moveTo: () => { }, lineTo: () => { }, stroke: () => { },
                    fill: () => { }, rect: () => { }, arc: () => { },
                    closePath: () => { }, clip: () => { }, fillText: () => { },
                    measureText: () => ({ width: 0 }), clearRect: () => { },
                    fillRect: () => { }, strokeRect: () => { }, setLineDash: () => { },
                    setTransform: () => { }, quadraticCurveTo: () => { }
                }),
                width: 800, height: 600,
                addEventListener: () => { }, appendChild: () => { },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
            }),
            body: { appendChild: () => { } },
            head: { appendChild: () => { } }
        },
        addEventListener: () => { }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['rna_repair_atp.js', 'rna_repair_enzymes.js', 'rna_repair_physics.js', 'rna_repair.js', 'rna_legend.js', 'rna_display.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('RNA Page Models (Comprehensive)', () => {

    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();
    });

    TestFramework.describe('RNAAtpManager', () => {
        let atpManager;

        TestFramework.beforeEach(() => {
            atpManager = new env.window.Greenhouse.RNAAtpManager(100);
        });

        TestFramework.it('should initialize with 100 ATP', () => {
            assert.equal(atpManager.atp, 100);
        });

        TestFramework.it('should consume ATP', () => {
            const success = atpManager.consume(30);
            assert.isTrue(success);
            assert.equal(atpManager.atp, 70);
            assert.equal(atpManager.atpConsumed, 30);
        });

        TestFramework.it('should calculate kinetics factor based on ATP levels', () => {
            atpManager.atp = 100;
            assert.equal(atpManager.getKineticsFactor(), 1.0);
            atpManager.atp = 50;
            assert.equal(atpManager.getKineticsFactor(), 0.5);
            atpManager.atp = 0;
            assert.equal(atpManager.getKineticsFactor(), 0.2);
        });
    });

    TestFramework.describe('RNAEnzymeFactory & Specific Enzymes', () => {
        TestFramework.it('should create correct enzyme types', () => {
            const ligase = env.window.Greenhouse.RNAEnzymeFactory.create('Ligase', 0, 0, 0);
            assert.equal(ligase.name, 'Ligase');
            assert.isTrue(ligase instanceof env.window.Greenhouse.RNABaseEnzyme);
        });

        TestFramework.it('AlkB should demethylate base on completion', () => {
            const alkB = env.window.Greenhouse.RNAEnzymeFactory.create('AlkB', 0, 0, 0);
            const mockBase = { damaged: true, damageType: 'Methylation', flash: 0 };
            alkB.complete(mockBase);
            assert.isFalse(mockBase.damaged);
        });
    });

    TestFramework.describe('RNARepairSimulation', () => {
        let simulation;

        TestFramework.beforeEach(() => {
            const mockCanvas = env.document.createElement('canvas');
            const originalAnimate = env.window.Greenhouse.RNARepairSimulation.prototype.animate;
            env.window.Greenhouse.RNARepairSimulation.prototype.animate = () => { };
            simulation = new env.window.Greenhouse.RNARepairSimulation(mockCanvas);
            env.window.Greenhouse.RNARepairSimulation.prototype.animate = originalAnimate;
            simulation.scheduleDamage = () => { };
        });

        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(simulation);
            assert.isTrue(simulation.isRunning);
            assert.equal(simulation.rnaStrand.length, 40);
        });
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
