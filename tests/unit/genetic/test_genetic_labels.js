/**
 * Unit Tests for Genetic Labels
 */

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && (window.location.hostname || window.location.port);

const fs = !isBrowser ? require('fs') : null;
const path = !isBrowser ? require('path') : null;
const vm = !isBrowser ? require('vm') : null;
const { assert } = !isBrowser ? require('../../utils/assertion_library.js') : { assert: window.assert };
const TestFramework = !isBrowser ? require('../../utils/test_framework.js') : window.TestFramework;

// --- Mock Browser Environment ---
if (!isBrowser) {
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
}

// --- Helper to Load Scripts ---
function loadScript(filename) {
    if (isBrowser) {
        if (filename.includes('models_util.js') && window.GreenhouseModelsUtil) return;
        if (filename.includes('genetic_ui_3d_stats.js') && window.GreenhouseGeneticStats) return;
        if (filename.includes('genetic_config.js') && window.GreenhouseGeneticConfig) return;
        if (filename.includes('genetic_camera_controls.js') && window.GreenhouseGeneticCameraController) return;
        if (filename.includes('genetic_pip_controls.js') && window.GreenhouseGeneticPiPControls) return;
        if (filename.includes('genetic_ui_3d_gene.js') && window.GreenhouseGeneticUI3DGene) return;
        if (filename.includes('genetic_ui_3d_protein.js') && window.GreenhouseGeneticUI3DProtein) return;
        if (filename.includes('genetic_ui_3d_brain.js') && window.GreenhouseGeneticUI3DBrain) return;
        if (filename.includes('genetic_ui_3d_dna.js') && window.GreenhouseGeneticUI3DDNA) return;
        if (filename.includes('genetic_ui_3d.js') && window.GreenhouseGeneticUI3D) return;
    }
    if (!isBrowser) {
        const filePath = path.join(__dirname, '../../../docs/js', filename);
        const code = fs.readFileSync(filePath, 'utf8');
        vm.runInThisContext(code);
    }
}

// --- Load Dependencies ---
loadScript('models_util.js');
loadScript('genetic/genetic_ui_3d_stats.js');
loadScript('genetic/genetic_config.js');
loadScript('genetic/genetic_camera_controls.js');
loadScript('genetic/genetic_pip_controls.js');
loadScript('genetic/genetic_ui_3d_gene.js');
loadScript('genetic/genetic_ui_3d_protein.js');
loadScript('genetic/genetic_ui_3d_brain.js');
loadScript('genetic/genetic_ui_3d_dna.js');
loadScript('genetic/genetic_ui_3d.js');

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
if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
