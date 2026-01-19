/**
 * Unit Tests for RNA Page Models
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
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
                measureText: () => ({ width: 0 }),
                clearRect: () => { },
                fillRect: () => { },
                strokeRect: () => { },
                setLineDash: () => { },
                setTransform: () => { },
                quadraticCurveTo: () => { }
            }),
            width: 800,
            height: 600,
            addEventListener: () => { },
            appendChild: () => { },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        };
        return element;
    },
    body: {
        appendChild: () => { }
    },
    head: {
        appendChild: () => { }
    }
};
global.addEventListener = () => { };
global.console = {
    log: console.log,
    error: () => {},
    warn: () => {}
};
global.requestAnimationFrame = (cb) => { };
const originalSetTimeout = global.setTimeout;
global.setTimeout = (cb, delay) => {
    if (delay > 0) {
        // Do nothing for scheduled timeouts in tests to avoid infinite loops
        return;
    }
    return originalSetTimeout(cb, delay);
};
global.Date = {
    now: () => 1000000
};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('rna_repair_atp.js');
loadScript('rna_repair_enzymes.js');
loadScript('rna_repair_physics.js');
loadScript('rna_repair.js');
loadScript('rna_legend.js');
loadScript('rna_display.js');

// --- Test Suites ---

TestFramework.describe('RNA Page Models (Comprehensive)', () => {

    TestFramework.describe('RNAAtpManager', () => {
        let atpManager;

        TestFramework.beforeEach(() => {
            atpManager = new window.Greenhouse.RNAAtpManager(100);
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

        TestFramework.it('should not consume more than available', () => {
            const success = atpManager.consume(150);
            assert.isFalse(success);
            assert.equal(atpManager.atp, 100);
        });

        TestFramework.it('should regenerate ATP over time', () => {
            atpManager.atp = 50;
            atpManager.update(16); // 1 tick
            assert.greaterThan(atpManager.atp, 50);
            assert.lessThan(atpManager.atp, 51);
        });

        TestFramework.it('should calculate kinetics factor based on ATP levels', () => {
            atpManager.atp = 100;
            assert.equal(atpManager.getKineticsFactor(), 1.0);
            atpManager.atp = 50;
            assert.equal(atpManager.getKineticsFactor(), 0.5);
            atpManager.atp = 0;
            assert.equal(atpManager.getKineticsFactor(), 0.2); // Minimum factor
        });
    });

    TestFramework.describe('RNAEnzymeFactory & Specific Enzymes', () => {
        TestFramework.it('should create correct enzyme types', () => {
            const ligase = window.Greenhouse.RNAEnzymeFactory.create('Ligase', 0, 0, 0);
            assert.equal(ligase.name, 'Ligase');
            assert.isTrue(ligase instanceof window.Greenhouse.RNABaseEnzyme);

            const alkB = window.Greenhouse.RNAEnzymeFactory.create('AlkB', 0, 0, 0);
            assert.equal(alkB.name, 'AlkB');
            assert.equal(alkB.costPerTick, 0.15);
        });

        TestFramework.it('AlkB should demethylate base on completion', () => {
            const alkB = window.Greenhouse.RNAEnzymeFactory.create('AlkB', 0, 0, 0);
            const mockBase = { damaged: true, damageType: 'Methylation', flash: 0 };
            alkB.complete(mockBase);
            assert.isFalse(mockBase.damaged);
            assert.isNull(mockBase.damageType);
            assert.equal(mockBase.flash, 1.2);
        });

        TestFramework.it('RtcB should connect base on completion', () => {
            const rtcB = window.Greenhouse.RNAEnzymeFactory.create('RtcB', 0, 0, 0);
            const mockBase = { connected: false, flash: 0 };
            rtcB.complete(mockBase);
            assert.isTrue(mockBase.connected);
            assert.equal(mockBase.flash, 1.5);
        });

        TestFramework.it('Enzyme should approach target then repair', () => {
            const atpManager = new window.Greenhouse.RNAAtpManager(100);
            const enzyme = window.Greenhouse.RNAEnzymeFactory.create('Ligase', 0, 100, 100);
            const targetBase = { x: 0, y: 0 };

            // Approach
            enzyme.update(16, targetBase, atpManager);
            assert.lessThan(enzyme.x, 100);
            assert.lessThan(enzyme.y, 100);
            assert.equal(enzyme.state, 'approaching');

            // Set enzyme close to target
            enzyme.x = 2;
            enzyme.y = 2;
            enzyme.update(16, targetBase, atpManager);
            assert.equal(enzyme.state, 'repairing');
            // Mock ATP manager to return 1.0 kinetics factor
            const mockAtp = { getKineticsFactor: () => 1.0, consume: () => true };
            enzyme.update(16, targetBase, mockAtp);
            assert.greaterThan(enzyme.progress, 0);
        });
    });

    TestFramework.describe('RNARepairSimulation', () => {
        let simulation;
        let mockCanvas;

        TestFramework.beforeEach(() => {
            mockCanvas = document.createElement('canvas');
            // Prevent animation loop in tests
            const originalAnimate = window.Greenhouse.RNARepairSimulation.prototype.animate;
            window.Greenhouse.RNARepairSimulation.prototype.animate = () => { };

            simulation = new window.Greenhouse.RNARepairSimulation(mockCanvas);

            // Restore for other potential uses, though usually not needed in unit tests
            window.Greenhouse.RNARepairSimulation.prototype.animate = originalAnimate;

            // Also prevent scheduleDamage from starting timeouts
            simulation.scheduleDamage = () => { };
        });

        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(simulation);
            assert.isTrue(simulation.isRunning);
            assert.equal(simulation.rnaStrand.length, 40);
            assert.equal(simulation.enzymes.length, 0);
            assert.isDefined(simulation.atpManager);
            assert.isDefined(simulation.ribosome);
            assert.isDefined(simulation.foldingEngine);
            assert.isDefined(simulation.environmentManager);
            assert.equal(simulation.bgParticles.length, 20);
        });

        TestFramework.it('should have 5\' cap (G) and Poly-A tail', () => {
            simulation.rnaStrand = [];
            simulation.createRnaStrand();
            assert.equal(simulation.rnaStrand[0].type, 'G', "First base should be G (5' Cap)");
            const lastTen = simulation.rnaStrand.slice(-10);
            assert.isTrue(lastTen.every(b => b.type === 'A'), "Last 10 bases should be A (Poly-A Tail)");
        });

        TestFramework.it('should move ribosome and stall at damage', () => {
            simulation.ribosome.index = 0;
            simulation.ribosome.progress = 0;

            // Base 0 is connected and not damaged
            simulation.update(16);
            assert.greaterThan(simulation.ribosome.progress, 0);
            assert.isFalse(simulation.ribosome.stalled);

            // Break base 1
            simulation.rnaStrand[1].connected = false;
            simulation.ribosome.index = 1;
            simulation.update(16);
            assert.isTrue(simulation.ribosome.stalled);
        });

        TestFramework.it('should trigger surveillance decay on ribosome stall', () => {
            simulation.ribosome.index = 5;
            simulation.rnaStrand[5].connected = false;
            simulation.enzymes = [];

            // Stall for > 15s (simulate with dt)
            simulation.update(16000);

            const hasUPF1 = simulation.enzymes.some(e => e.name === 'UPF1/Exosome');
            assert.isTrue(hasUPF1);
        });

        TestFramework.it('should finish repair', () => {
            const targetIndex = 5;
            simulation.rnaStrand[targetIndex].connected = false;
            simulation.spawnEnzyme('Ligase', targetIndex);
            const enzyme = simulation.enzymes[0];

            // Teleport to target
            enzyme.x = simulation.rnaStrand[targetIndex].x;
            enzyme.y = simulation.rnaStrand[targetIndex].y;
            enzyme.state = 'repairing';
            enzyme.progress = 0.99;

            simulation.update(16);

            assert.isTrue(simulation.rnaStrand[targetIndex].connected);
            assert.equal(enzyme.state, 'leaving');
            assert.greaterThan(simulation.particles.length, 0);
        });
    });

    TestFramework.describe('RNAPhysics & Folding', () => {
        TestFramework.it('Folding engine should transition strength', () => {
            const folding = new window.Greenhouse.RNAFoldingEngine();
            folding.targetStrength = 1.0;
            folding.foldingStrength = 0;
            folding.update(16);
            assert.greaterThan(folding.foldingStrength, 0);
        });

        TestFramework.it('Environment should calculate multipliers', () => {
            const env = new window.Greenhouse.RNAEnvironmentManager();
            env.ph = 7.4;
            assert.equal(env.getDamageMultiplier(), 1.0);
            env.ph = 8.4;
            assert.greaterThan(env.getDamageMultiplier(), 1.0);

            env.temperature = 37.0;
            assert.equal(env.getNoiseMultiplier(), 1.0);
            env.temperature = 47.0;
            assert.greaterThan(env.getNoiseMultiplier(), 1.0);
        });
    });
});

// Run the tests
TestFramework.run().then(results => {
    if (results.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
});
