/**
 * Unit Tests for RNA Page Models
 */

/**
 * @file test_rna_page.js
 * @description Unit tests for RNA Page Models
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');
const { createEnv, loadScript } = require('../utils/test_env_factory.js');

TestFramework.describe('RNA Page Models (Comprehensive)', () => {
    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();

        // Mock setTimeout to avoid infinite loops in simulation tests
        const originalSetTimeout = env.window.setTimeout;
        env.window.setTimeout = (cb, delay) => {
            if (delay > 0) return;
            return originalSetTimeout(cb, delay);
        };

        loadScript(env, 'docs/js/rna_repair_atp.js');
        loadScript(env, 'docs/js/rna_repair_enzymes.js');
        loadScript(env, 'docs/js/rna_repair_physics.js');
        loadScript(env, 'docs/js/rna_repair.js');
        loadScript(env, 'docs/js/rna_legend.js');
        loadScript(env, 'docs/js/rna_display.js');
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
            const ligase = env.window.Greenhouse.RNAEnzymeFactory.create('Ligase', 0, 0, 0);
            assert.equal(ligase.name, 'Ligase');
            assert.isTrue(ligase instanceof env.window.Greenhouse.RNABaseEnzyme);

            const alkB = env.window.Greenhouse.RNAEnzymeFactory.create('AlkB', 0, 0, 0);
            assert.equal(alkB.name, 'AlkB');
            assert.equal(alkB.costPerTick, 0.15);
        });

        TestFramework.it('AlkB should demethylate base on completion', () => {
            const alkB = env.window.Greenhouse.RNAEnzymeFactory.create('AlkB', 0, 0, 0);
            const mockBase = { damaged: true, damageType: 'Methylation', flash: 0 };
            alkB.complete(mockBase);
            assert.isFalse(mockBase.damaged);
            assert.isNull(mockBase.damageType);
            assert.equal(mockBase.flash, 1.2);
        });

        TestFramework.it('RtcB should connect base on completion', () => {
            const rtcB = env.window.Greenhouse.RNAEnzymeFactory.create('RtcB', 0, 0, 0);
            const mockBase = { connected: false, flash: 0 };
            rtcB.complete(mockBase);
            assert.isTrue(mockBase.connected);
            assert.equal(mockBase.flash, 1.5);
        });

        TestFramework.it('Enzyme should approach target then repair', () => {
            const atpManager = new env.window.Greenhouse.RNAAtpManager(100);
            const enzyme = env.window.Greenhouse.RNAEnzymeFactory.create('Ligase', 0, 100, 100);
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
            mockCanvas = env.document.createElement('canvas');
            // Prevent animation loop in tests
            const originalAnimate = env.window.Greenhouse.RNARepairSimulation.prototype.animate;
            env.window.Greenhouse.RNARepairSimulation.prototype.animate = () => { };

            simulation = new env.window.Greenhouse.RNARepairSimulation(mockCanvas);

            // Restore for other potential uses, though usually not needed in unit tests
            env.window.Greenhouse.RNARepairSimulation.prototype.animate = originalAnimate;

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
            simulation.ribosome.stallTimer = 0;

            // Update with small dt, should not trigger yet
            simulation.update(1000);
            assert.isTrue(simulation.ribosome.stalled);
            assert.equal(simulation.ribosome.stallTimer, 1000);
            assert.equal(simulation.enzymes.length, 0);

            // Stall for > 15s (simulate with dt)
            simulation.update(15000);

            const upf1Enzyme = simulation.enzymes.find(e => e.name === 'UPF1/Exosome');
            assert.isDefined(upf1Enzyme);
            assert.equal(upf1Enzyme.state, 'decaying');
            assert.equal(simulation.ribosome.stallTimer, 0, "Stall timer should reset after trigger");
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
            const folding = new env.window.Greenhouse.RNAFoldingEngine();
            folding.targetStrength = 1.0;
            folding.foldingStrength = 0;
            folding.update(16);
            assert.greaterThan(folding.foldingStrength, 0);
        });

        TestFramework.it('Folding engine should calculate offsets', () => {
            const folding = new env.window.Greenhouse.RNAFoldingEngine();
            folding.foldingStrength = 1.0;
            const totalBases = 40;
            const mid = Math.floor(totalBases / 2);

            const offsetMid = folding.getFoldingOffset(mid, totalBases);
            assert.equal(offsetMid.x, 0); // sin(0) = 0
            assert.equal(offsetMid.y, 0); // (cos(0)-1)*40 = 0

            const offsetSide = folding.getFoldingOffset(mid + 3, totalBases);
            assert.notEqual(offsetSide.x, 0);
            assert.notEqual(offsetSide.y, 0);
        });

        TestFramework.it('Environment should calculate multipliers', () => {
            const envManager = new env.window.Greenhouse.RNAEnvironmentManager();
            envManager.ph = 7.4;
            assert.equal(envManager.getDamageMultiplier(), 1.0);
            envManager.ph = 8.4;
            assert.greaterThan(envManager.getDamageMultiplier(), 1.0);

            envManager.temperature = 37.0;
            assert.equal(envManager.getNoiseMultiplier(), 1.0);
            envManager.temperature = 47.0;
            assert.greaterThan(envManager.getNoiseMultiplier(), 1.0);
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
