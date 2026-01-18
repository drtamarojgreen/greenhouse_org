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
        'docs/js/dna_repair.js'
    ];

    // Minimal DOM/Browser mocks for loading
    context.window = context;
    context.global = context;
    context.document = {
        createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
        head: { appendChild: () => {} },
        currentScript: { getAttribute: () => null }
    };
    context.navigator = { userAgent: 'node' };
    context.console = console;
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

TestFramework.describe('DNA Repair Simulation Logic (Source Verified)', () => {
    const context = { GreenhouseDNARepair: {} };
    loadSource(context);
    const G = context.GreenhouseDNARepair;

    TestFramework.it('Should have all repair pathways attached from mechanisms.js', () => {
        assert.isDefined(G.handleBER);
        assert.isDefined(G.handleNER);
        assert.isDefined(G.handleMMR);
        assert.isDefined(G.handleNHEJ);
        assert.isDefined(G.handleHR);
        assert.isDefined(G.handlePhotolyase);
    });

    TestFramework.it('NHEJ should result in deletion and mutation (Source Logic)', () => {
        // Initialize state using source generateDNA
        G.config.helixLength = 60;
        G.config.rise = 14;
        G.generateDNA();

        G.state.repairMode = 'nhej';
        G.state.atpConsumed = 0;
        G.state.mutationCount = 0;
        G.state.genomicIntegrity = 100;

        const targetIdx = Math.floor(G.config.helixLength / 2);

        G.handleNHEJ(50);
        assert.equal(G.state.atpConsumed, 10);
        assert.isTrue(G.state.basePairs[targetIdx].isBroken);

        G.handleNHEJ(200);
        assert.equal(G.state.atpConsumed, 30);
        assert.equal(G.state.basePairs.length, 59);
        assert.equal(G.state.mutationCount, 1);
        assert.equal(G.state.genomicIntegrity, 95);
    });

    TestFramework.it('NER should involve helix unwinding (Source Logic)', () => {
        G.generateDNA();
        G.state.globalHelixUnwind = 0;

        G.handleNER(125);
        assert.isTrue(G.state.globalHelixUnwind > 0);

        G.handleNER(400);
        assert.equal(G.state.globalHelixUnwind, 0);
    });

    TestFramework.it('Photolyase should repair without excision (Source Logic)', () => {
        G.generateDNA();
        const targetIdx = Math.floor(G.config.helixLength / 2) - 10;
        const originalBase = G.state.basePairs[targetIdx].base1;

        G.handlePhotolyase(10);
        assert.isTrue(G.state.basePairs[targetIdx].isDamaged);

        G.handlePhotolyase(200);
        assert.isFalse(G.state.basePairs[targetIdx].isDamaged);
        assert.equal(G.state.basePairs[targetIdx].base1, originalBase, "Base should not be excised");
    });
});

TestFramework.run();
