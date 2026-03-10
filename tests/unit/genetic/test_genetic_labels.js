/**
 * Unit Tests for Genetic Labels
 */

const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

// --- Test Suites ---

TestFramework.describe('Genetic Labels', () => {
    const ui = window.GreenhouseGeneticUI3D;

    TestFramework.it('should assign grounded gene labels with increased frequency', () => {
        // Mock algo with population
        const mockNetwork = {
            nodes: Array.from({ length: 50 }, (_, i) => ({ id: i })),
            connections: [],
            fitness: 0.5
        };
        const mockAlgo = {
            bestNetwork: mockNetwork,
            generation: 1
        };

        ui.algo = mockAlgo;
        ui.brainShell = { vertices: [{x: 0, y: 0, z: 0}], faces: [] };

        // Mock Geometry module
        window.GreenhouseGeneticGeometry = {
            generateHelixPoints: (i, total, offset) => ({ x: 0, y: 0, z: 0, strandIndex: i % 2 }),
            initializeBrainShell: () => { },
            getRegionVertices: () => [0],
            generateProteinChain: () => ({ vertices: [] })
        };

        // Update data to trigger label assignment
        ui.updateData();

        // Check labels
        const genes = ui.neurons3D.filter(n => n.type === 'gene');
        const expectedGenes = [
            'BDNF', 'SLC6A4', 'DRD2', 'HTR2A', 'COMT', 'DISC1', 'NRG1', 'DAOA',
            'GRIN2A', 'GRIK2', 'HOMER1', 'NTRK2', 'SHANK3', 'OXTR', 'MAOA',
            'CHRNA7', 'GABRA1', 'SYP', 'MBP', 'APOE', 'TREM2', 'CACNA1C', 'FOXP2'
        ];

        // isGenotype is i < nodes.length / 2 (i < 25)
        // i % 5 === 0 -> i = 0, 5, 10, 15, 20

        assert.equal(genes[0].label, 'BDNF', 'Gene 0 should be BDNF');
        assert.equal(genes[1].label, 'SLC6A4', 'Gene 1 should be SLC6A4');
        assert.equal(genes[2].label, 'DRD2', 'Gene 2 should be DRD2');
        assert.equal(genes[3].label, 'HTR2A', 'Gene 3 should be HTR2A');
        assert.equal(genes[4].label, 'COMT', 'Gene 4 should be COMT');

        assert.isNotNull(genes[1].label, 'Gene 1 should now have a label');
        assert.isNotNull(genes[6].label, 'Gene 6 should now have a label');
    });

    TestFramework.it('should use translation function for active gene label', () => {
        const stats = window.GreenhouseGeneticStats;
        const util = window.GreenhouseModelsUtil;

        let translationCalled = false;
        const originalT = util.t;
        util.t = (k) => {
            if (k === 'COMT') translationCalled = true;
            return k;
        };

        const ctx = {
            measureText: () => ({ width: 0 }),
            fillText: () => { },
            set fillStyle(v) { },
            set font(v) { },
            set textAlign(v) { },
            canvas: { width: 800 }
        };

        const activeGene = { id: 1, label: 'COMT' };
        stats.drawOverlayInfo(ctx, 800, activeGene);

        assert.isTrue(translationCalled, 'Translation should be called for active gene label');

        util.t = originalT;
    });
});

// Run tests
TestFramework.run();
