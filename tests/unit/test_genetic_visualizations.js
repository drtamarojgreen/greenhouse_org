/**
 * Unit Tests for Genetic Visualizations (DNA, Protein, Brain)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    createElement: () => ({}),
    getElementById: () => ({})
};
global.console = console;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Dependencies ---
// Mock GreenhouseModels3DMath
window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z, camera, projection) => {
        // Simple mock projection: just return x, y with scale 1
        return { x: x + projection.width / 2, y: y + projection.height / 2, scale: 1, depth: z };
    },
    calculateFaceNormal: () => ({ x: 0, y: 1, z: 0 }),
    applyDepthFog: (a) => a
};

// Mock Config
window.GreenhouseGeneticConfig = {
    get: (path) => {
        if (path === 'materials.dna.baseColors') {
            return { A: 'red', T: 'blue', C: 'green', G: 'yellow' };
        }
        return null;
    }
};

// Load Modules
loadScript('genetic_ui_3d_dna.js');
loadScript('genetic_ui_3d_protein.js');
loadScript('genetic_ui_3d_brain.js');

// --- Test Suites ---

TestFramework.describe('GreenhouseGeneticDNA', () => {
    const dna = window.GreenhouseGeneticDNA;
    const ctx = {
        save: () => { },
        restore: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        fill: () => { },
        arc: () => { },
        rect: () => { },
        clip: () => { },
        fillText: () => { },
        createLinearGradient: () => ({ addColorStop: () => { } }),
        createRadialGradient: () => ({ addColorStop: () => { } }),
        set fillStyle(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        set lineCap(v) { },
        set lineJoin(v) { },
        set font(v) { },
        set textAlign(v) { },
        set textBaseline(v) { },
        set globalAlpha(v) { },
        set lineDashOffset(v) { },
        setLineDash: () => { }
    };

    TestFramework.it('should draw macro view', () => {
        const neurons = [
            { id: 1, type: 'gene', x: 10, y: 10, z: 0, strand: 0, baseColor: 'red' },
            { id: 2, type: 'gene', x: 20, y: 20, z: 0, strand: 1, baseColor: 'blue' }
        ];
        const camera = { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0 };
        const projection = { width: 800, height: 600 };

        const projected = dna.drawMacroView(ctx, 800, 600, camera, projection, neurons, 0, null);

        assert.isDefined(projected);
        assert.equal(projected.length, 2);
    });

    TestFramework.it('should draw connections', () => {
        const neurons = [
            { id: 1, type: 'gene', x: 10, y: 10, z: 0, strand: 0 },
            { id: 2, type: 'gene', x: 20, y: 20, z: 0, strand: 1 }, // Base pair
            { id: 3, type: 'gene', x: 10, y: 30, z: 0, strand: 0 }, // Next in strand 0
            { id: 4, type: 'gene', x: 20, y: 40, z: 0, strand: 1 }  // Next in strand 1
        ];

        // We can't easily assert drawing calls without a spy, but we can ensure it runs without error
        dna.drawConnections(ctx, neurons, {}, { width: 800, height: 600 });
        assert.isTrue(true); // Reached here
    });
});

TestFramework.describe('GreenhouseGeneticProtein', () => {
    const proteinModule = window.GreenhouseGeneticProtein;
    const ctx = {
        save: () => { },
        restore: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        fill: () => { },
        arc: () => { },
        rect: () => { },
        fillRect: () => { },
        translate: () => { },
        fillText: () => { },
        set fillStyle(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        set lineCap(v) { },
        set lineJoin(v) { },
        set font(v) { },
        set textAlign(v) { }
    };

    TestFramework.it('should draw protein view', () => {
        const activeGene = { id: 1, proteinMode: 'ribbon' };
        const proteinCache = {
            1: {
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 10, y: 10, z: 10 }
                ]
            }
        };
        const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

        proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);
        assert.isTrue(true); // Reached here
    });

    TestFramework.it('should generate protein if missing', () => {
        // Mock Geometry module
        window.GreenhouseGeneticGeometry = {
            generateProteinChain: (id) => ({ vertices: [{ x: 0, y: 0, z: 0 }] })
        };

        const activeGene = { id: 2 };
        const proteinCache = {};
        const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

        proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);

        assert.isDefined(proteinCache[2]);
    });

    TestFramework.it('should draw GPCR signaling view for GPCR genes', () => {
        const activeGene = { id: 3, label: 'DRD2' };
        const proteinCache = {};
        const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

        // Mock localization if needed
        window.GreenhouseModelsUtil = { t: (k) => k };
        window.GreenhouseGeneticGeometry = {
            generateCylinderMesh: () => ({ vertices: [], faces: [] }),
            generateSphereMesh: () => ({ vertices: [], faces: [] })
        };

        proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);
        assert.isTrue(true); // Reached here
    });
});

TestFramework.describe('GreenhouseGeneticBrain', () => {
    const brainModule = window.GreenhouseGeneticBrain;
    const ctx = {
        save: () => { },
        restore: () => { },
        translate: () => { },
        beginPath: () => { },
        rect: () => { },
        clip: () => { },
        fillText: () => { },
        arc: () => { },
        stroke: () => { },
        moveTo: () => { },
        lineTo: () => { },
        fill: () => { },
        set fillStyle(v) { },
        set textAlign(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        setLineDash: () => { }
    };

    TestFramework.it('should draw target view', () => {
        // Mock NeuroBrain if used, but here it uses its own drawBrainShell
        const brainShell = {
            vertices: [{ x: 0, y: 0, z: 0 }],
            faces: [{ indices: [0, 0, 0] }],
            regions: { pfc: { color: 'rgba(0,0,0,0)' } }
        };
        const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

        // Ensure drawBrainShell runs without error
        brainModule.drawTargetView(ctx, 0, 0, 200, 150, { region: 'pfc' }, 0, brainShell, null, cameraState);

        assert.isTrue(true); // Reached here without crash
    });
});

// Run Tests
TestFramework.run();
