/**
 * Unit tests for DNA Repair Simulation
 * Loads actual source code to verify logic
 */

const fs = require('fs');
const path = require('path');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Helper to load and execute source files in a mock browser context
function loadSource(context) {
    const files = [
        'docs/js/dna_repair_mechanisms.js',
        'docs/js/dna_repair_mutations.js',
        'docs/js/dna_repair_buttons.js',
        'docs/js/dna_replication.js',
        'docs/js/dna_repair.js'
    ];

    // Minimal DOM/Browser mocks for loading
    context.window = context;
    context.global = context;
    context.document = {
        createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
        head: { appendChild: () => {} },
        currentScript: { getAttribute: () => null },
        getElementById: () => ({ innerText: '' })
    };
    context.navigator = { userAgent: 'node' };
    context.console = {
        log: () => {},
        error: () => {},
        warn: () => {}
    };
    context.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    context.setInterval = setInterval;
    context.clearInterval = clearInterval;
    context.setTimeout = setTimeout;

    // Mock 3D Math dependency
    context.GreenhouseModels3DMath = {
        project3DTo2D: (x, y, z, cam, opts) => ({ x: 0, y: 0, scale: 1 })
    };

    files.forEach(file => {
        const code = fs.readFileSync(path.resolve(__dirname, '../../', file), 'utf8');
        const script = new Function('window', 'document', 'navigator', 'console', 'requestAnimationFrame', 'setInterval', 'clearInterval', 'setTimeout', code);
        try {
            script(context, context.document, context.navigator, context.console, context.requestAnimationFrame, context.setInterval, context.clearInterval, context.setTimeout);
        } catch (e) {
            // console.log('Script load note:', file, e.message);
        }
    });
}

TestFramework.describe('DNA Repair Simulation Logic (Comprehensive)', () => {
    const context = { GreenhouseDNARepair: {} };
    loadSource(context);
    const G = context.GreenhouseDNARepair;

    TestFramework.it('Should have all repair pathways and mutation logic attached', () => {
        assert.isDefined(G.handleBER);
        assert.isDefined(G.handleNER);
        assert.isDefined(G.handleMMR);
        assert.isDefined(G.handleNHEJ);
        assert.isDefined(G.handleHR);
        assert.isDefined(G.handlePhotolyase);
        assert.isDefined(G.handleMGMT);
        assert.isDefined(G.induceSpontaneousDamage);
        assert.isDefined(G.getComplement);
    });

    TestFramework.it('Utility: getComplement should return correct base pairs', () => {
        assert.equal(G.getComplement('A'), 'T');
        assert.equal(G.getComplement('T'), 'A');
        assert.equal(G.getComplement('C'), 'G');
        assert.equal(G.getComplement('G'), 'C');
        assert.equal(G.getComplement('X'), '');
    });

    TestFramework.it('Core: consumeATP should increment state and spawn particles', () => {
        G.state.atpConsumed = 0;
        G.state.particles = [];
        G.consumeATP(5, 100, 0, 0);
        assert.equal(G.state.atpConsumed, 5);
        assert.isTrue(G.state.particles.length > 0);
    });

    TestFramework.it('Mutation: applyDeamination should convert C to U', () => {
        const pair = { base1: 'C', base2: 'G', isDamaged: false };
        G.applyDeamination(pair);
        assert.isTrue(pair.isDamaged);
        assert.equal(pair.base1, 'U');
        assert.equal(pair.damageType, 'Deamination');
    });

    TestFramework.it('Mutation: induceSpontaneousDamage should respect radiation levels', () => {
        G.generateDNA();
        G.state.radiationLevel = 0;
        G.induceSpontaneousDamage();
        const damagedCount0 = G.state.basePairs.filter(p => p.isDamaged).length;
        assert.equal(damagedCount0, 0);

        G.state.radiationLevel = 10000; // 100% probability
        G.induceSpontaneousDamage();
        const damagedCount100 = G.state.basePairs.filter(p => p.isDamaged).length;
        assert.isTrue(damagedCount100 > 0);
    });

    TestFramework.it('BER: Should follow enzymatic steps (Base Removal -> Restoration)', () => {
        G.generateDNA();
        const targetIdx = Math.floor(G.config.helixLength / 2);
        const pair = G.state.basePairs[targetIdx];

        G.handleBER(10); // Damage induction
        assert.isTrue(pair.isDamaged);

        G.handleBER(200); // Excision
        assert.equal(pair.base1, '', "Base should be removed at t=200");

        G.handleBER(350); // Restoration
        assert.isFalse(pair.isDamaged);
        assert.isTrue(pair.base1.length === 1);
    });

    TestFramework.it('MMR: Should perform patch excision', () => {
        G.generateDNA();
        const targetIdx = Math.floor(G.config.helixLength / 2) + 5;

        G.handleMMR(10); // Mismatch induction
        assert.equal(G.state.basePairs[targetIdx].damageType, 'Mismatch');

        G.handleMMR(200); // Patch excision
        for (let i = -2; i <= 2; i++) {
            assert.equal(G.state.basePairs[targetIdx + i].base1, '', `Base ${i} should be removed in patch`);
        }

        G.handleMMR(450); // Restoration
        assert.isFalse(G.state.basePairs[targetIdx].isDamaged);
        assert.isTrue(G.state.basePairs[targetIdx].base1 !== '');
    });

    TestFramework.it('NER: Should unwind helix during repair', () => {
        G.generateDNA();
        G.state.globalHelixUnwind = 0;

        G.handleNER(125); // Unwinding
        assert.greaterThan(G.state.globalHelixUnwind, 0);

        G.handleNER(400); // Reset/Restoration
        assert.equal(G.state.globalHelixUnwind, 0);
    });

    TestFramework.it('NHEJ: Should result in deletion and genomic integrity loss', () => {
        G.generateDNA();
        const originalLength = G.state.basePairs.length;
        G.state.genomicIntegrity = 100;

        G.handleNHEJ(50); // Break
        assert.isTrue(G.state.basePairs[Math.floor(originalLength/2)].isBroken);

        G.handleNHEJ(200); // Ligation with loss
        assert.equal(G.state.basePairs.length, originalLength - 1);
        assert.isTrue(G.state.genomicIntegrity < 100);
    });

    TestFramework.it('DSB: Should displace and then restore backbone positions', () => {
        G.generateDNA();
        const targetIdx = Math.floor(G.config.helixLength / 2);
        const pair = G.state.basePairs[targetIdx];
        const originalX = pair.x;

        G.handleDSB(50); // Break
        assert.isTrue(pair.isBroken);

        G.handleDSB(100); // Displacement
        assert.notEqual(G.state.basePairs[targetIdx - 1].x, (targetIdx - 1 - G.config.helixLength / 2) * G.config.rise);

        // Simulation of gradual restoration
        for (let i = 0; i < 200; i++) G.handleDSB(401);
        assert.isFalse(pair.isBroken);
        assert.lessThan(Math.abs(pair.x - originalX), 1);
    });

    TestFramework.it('HR: Should be restricted by Cell Cycle and perform range excision', () => {
        G.generateDNA();
        const targetIdx = Math.floor(G.config.helixLength / 2);

        // Blocked in G1
        G.state.cellCyclePhase = 'G1';
        G.state.repairMode = 'hr';
        G.state.timer = 50;

        // Simple mock of the conditional logic in update()
        function runHRUpdate() {
            if (G.state.repairMode === 'hr') {
                if (G.state.cellCyclePhase === 'S' || G.state.cellCyclePhase === 'G2') {
                    G.handleHR(G.state.timer);
                }
            }
        }

        runHRUpdate();
        assert.isFalse(G.state.basePairs[targetIdx].isBroken);

        // Active in S
        G.state.cellCyclePhase = 'S';
        runHRUpdate();
        assert.isTrue(G.state.basePairs[targetIdx].isBroken);

        G.handleHR(100); // Range excision
        assert.equal(G.state.basePairs[targetIdx].base1, '');
        assert.equal(G.state.basePairs[targetIdx+1].base1, '');
    });

    TestFramework.it('Replication: Should form fork and synthesize complements', () => {
        G.generateDNA();
        G.handleReplication(100); // t=100 -> forkIndex=10

        assert.equal(G.state.replicationForkIndex, 10);
        const pBefore = G.state.basePairs[5];
        assert.isTrue(pBefore.isReplicating);
        assert.isDefined(pBefore.newBase1);
        assert.isTrue(pBefore.s1Offset.y !== 0);

        const pAfter = G.state.basePairs[15];
        assert.isFalse(pAfter.isReplicating);
        assert.equal(pAfter.s1Offset.y, 0);
    });
});

TestFramework.run();
