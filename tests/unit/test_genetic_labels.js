/**
 * Unit Tests for Genetic Labels
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    getElementById: () => ({
        addEventListener: () => { },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        width: 800,
        height: 600,
        appendChild: () => { },
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
            clip: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            createRadialGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        })
    }),
    createElement: () => ({
        addEventListener: () => { },
        style: {},
        appendChild: () => { },
        querySelector: () => null,
        getContext: () => ({})
    }),
    body: {
        appendChild: () => { }
    }
};
global.console = console;
global.requestAnimationFrame = (cb) => { };
global.addEventListener = () => { };
global.ResizeObserver = class { observe() { } };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('models_util.js');
loadScript('genetic_ui_3d_stats.js');
loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_ui_3d_gene.js');
loadScript('genetic_ui_3d_protein.js');
loadScript('genetic_ui_3d_brain.js');
loadScript('genetic_ui_3d_dna.js');
loadScript('genetic_ui_3d.js');

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
        const expectedGenes = ['BDNF', 'SLC6A4', 'DRD2', 'HTR2A', 'COMT', 'DISC1', 'NRG1', 'DAOA', 'GRIN2A', 'GRIK2', 'HOMER1', 'NTRK2', 'SHANK3'];

        // isGenotype is i < nodes.length / 2 (i < 25)
        // i % 5 === 0 -> i = 0, 5, 10, 15, 20

        assert.equal(genes[0].label, 'BDNF', 'Gene 0 should be BDNF');
        assert.equal(genes[5].label, 'SLC6A4', 'Gene 5 should be SLC6A4');
        assert.equal(genes[10].label, 'DRD2', 'Gene 10 should be DRD2');
        assert.equal(genes[15].label, 'HTR2A', 'Gene 15 should be HTR2A');
        assert.equal(genes[20].label, 'COMT', 'Gene 20 should be COMT');

        assert.isNull(genes[1].label, 'Gene 1 should not have a label');
        assert.isNull(genes[6].label, 'Gene 6 should not have a label');
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
