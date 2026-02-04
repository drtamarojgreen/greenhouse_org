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
    }
};

// Mock Config
window.GreenhouseGeneticConfig = {
    get: (path) => {
        if (path === 'materials.dna.baseColors') {
            return { A: 'red', T: 'blue', C: 'green', G: 'yellow' };
        }
        if (path === 'materials.dna') {
            return { metallic: 0.5, roughness: 0.5, emissive: false, emissiveIntensity: 1, alpha: 1 };
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
                    { x: 0, y: 0, z: 0, type: 1 },
                    { x: 10, y: 10, z: 10, type: 1 }
                ]
            }
        };
        const cameraState = {
            camera: { x: 0, y: 0, z: -150, rotationX: 0, rotationY: 0, fov: 400 }
        };

        proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);
        assert.isTrue(true); // Reached here
    });

    TestFramework.it('should generate protein if missing', () => {
        // Mock Geometry module
        window.GreenhouseGeneticGeometry = {
            generateProteinChain: (id) => ({ vertices: [{ x: 0, y: 0, z: 0, type: 0 }] })
        };

        const activeGene = { id: 2 };
        const proteinCache = {};
        const cameraState = {
            camera: { x: 0, y: 0, z: -150, rotationX: 0, rotationY: 0, fov: 400 }
        };

        proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);

        assert.isDefined(proteinCache[2]);
    });
});

TestFramework.describe('GreenhouseGeneticBrain', () => {
    const brainModule = window.GreenhouseGeneticBrain;
    const ctx = {
        save: () => { },
        restore: () => { },
        translate: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        fill: () => { },
        rect: () => { },
        clip: () => { },
        fillText: () => { },
        setLineDash: () => { },
        set fillStyle(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        set textAlign(v) { },
        set globalAlpha(v) { },
        set shadowBlur(v) { },
        set shadowColor(v) { }
    };

    TestFramework.it('should draw target view', () => {
        // Mock Models3DMath
        window.GreenhouseModels3DMath = {
            project3DTo2D: () => ({ x: 0, y: 0, scale: 1, depth: 0 }),
            calculateFaceNormal: () => ({ x: 0, y: 1, z: 0 }),
            applyDepthFog: (a) => a
        };

        const brainShell = {
            vertices: [{ x: 0, y: 0, z: 0 }],
            faces: [{ indices: [0, 0, 0], region: 'pfc' }],
            regions: { pfc: { color: 'rgba(255,0,0,1)', vertices: [0] } }
        };

        const cameraState = {
            camera: { x: 0, y: 0, z: -150, rotationX: 0, rotationY: 0, fov: 400 }
        };

        brainModule.drawTargetView(ctx, 0, 0, 200, 150, { region: 'pfc' }, 0, brainShell, null, cameraState);

        assert.isTrue(brainModule._drawTargetCallCount > 0);
    });
});

// Run Tests
TestFramework.run();
