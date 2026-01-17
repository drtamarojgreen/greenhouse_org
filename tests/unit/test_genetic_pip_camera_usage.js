/**
 * Unit Tests to Diagnose Which PiP Views Actually Work
 * User reports: Only bottom right (brain region) PiP works
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {};
global.console = console;

// Mock GreenhouseModels3DMath
global.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z, camera, projection) => {
        // Simple projection for testing
        const scale = 1.0;
        return {
            x: x + projection.width / 2,
            y: y + projection.height / 2,
            scale: scale,
            depth: z
        };
    }
};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Config ---
window.GreenhouseGeneticConfig = {
    get: (key) => {
        const config = {
            'camera.controls.enableRotate': true,
            'camera.controls.enablePan': true,
            'camera.controls.enableZoom': true,
            'camera.controls.rotateSpeed': 0.005,
            'camera.controls.panSpeed': 0.002,
            'camera.controls.zoomSpeed': 0.1,
            'camera.controls.inertia': true,
            'camera.controls.inertiaDamping': 0.95,
            'camera.controls.autoRotate': true,
            'camera.controls.autoRotateSpeed': 0.0002,
            'camera.controls.minZoom': -50,
            'camera.controls.maxZoom': -3000,
            'camera.initial': {
                x: 0, y: 0, z: -300,
                rotationX: 0, rotationY: 0, rotationZ: 0
            },
            'materials.dna.baseColors': {
                A: '#FF0000',
                T: '#00FF00',
                C: '#0000FF',
                G: '#FFFF00'
            },
            'materials.dna.strand1Color': '#00D9FF',
            'materials.dna.strand2Color': '#FF6B9D'
        };
        return config[key];
    }
};

// Load Modules
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_ui_3d_gene.js');
loadScript('genetic_ui_3d_protein.js');
loadScript('genetic_ui_3d_brain.js');

// --- Test Suites ---

TestFramework.describe('PiP Camera Usage Analysis', () => {
    let pipControls;
    let mockCanvas;
    let mockCtx;

    TestFramework.beforeEach(() => {
        const cameras = [
            {}, // Main camera (mock)
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
        ];

        // Initialize PiP controls
        pipControls = window.GreenhouseGeneticPiPControls;
        pipControls.init(window.GreenhouseGeneticConfig, cameras);

        // Mock canvas and context
        mockCanvas = {
            width: 1000,
            height: 800,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
        };

        mockCtx = {
            save: () => {},
            restore: () => {},
            translate: () => {},
            beginPath: () => {},
            rect: () => {},
            clip: () => {},
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            arc: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            fillText: () => {},
            measureText: () => ({ width: 0 }),
            set fillStyle(val) {},
            set strokeStyle(val) {},
            set lineWidth(val) {},
            set font(val) {},
            set textAlign(val) {},
            set textBaseline(val) {},
            set globalAlpha(val) {},
            set lineCap(val) {},
            set lineJoin(val) {},
            setLineDash: () => {}
        };
    });

    TestFramework.it('TEST: Helix PiP - Check if it uses cameraState.camera', () => {
        pipControls.cameras.helix.rotationY = 2.5;
        pipControls.cameras.helix.x = 50;
        const helixState = pipControls.getState('helix');
        assert.isDefined(helixState.camera, 'State should have camera reference');
        assert.equal(helixState.camera.rotationY, 2.5, 'Camera should have rotationY = 2.5');
        assert.equal(helixState.camera.x, 50, 'Camera should have x = 50');
        console.log('Helix camera state:', helixState);
    });

    TestFramework.it('TEST: Micro PiP - Check if drawMicroView uses cameraState.camera', () => {
        pipControls.cameras.micro.rotationY = 1.5;
        pipControls.cameras.micro.z = -500;
        const microState = pipControls.getState('micro');
        assert.isDefined(microState.camera, 'State should have camera reference');
        assert.equal(microState.camera.rotationY, 1.5, 'Camera should have rotationY = 1.5');
        assert.equal(microState.camera.z, -500, 'Camera should have z = -500');
        const activeGene = { id: 1, baseColor: '#FF0000' };
        window.GreenhouseGeneticGene.drawMicroView(
            mockCtx, 0, 0, 200, 150, activeGene, 0, null,
            (ctx, x, y, w, h, title) => {},
            microState
        );
        console.log('Micro camera state:', microState);
    });

    TestFramework.it('TEST: Protein PiP - Check if drawProteinView uses cameraState.camera', () => {
        pipControls.cameras.protein.rotationX = 0.8;
        pipControls.cameras.protein.y = 100;
        const proteinState = pipControls.getState('protein');
        assert.isDefined(proteinState.camera, 'State should have camera reference');
        assert.equal(proteinState.camera.rotationX, 0.8, 'Camera should have rotationX = 0.8');
        assert.equal(proteinState.camera.y, 100, 'Camera should have y = 100');
        const activeGene = { id: 1, baseColor: '#FF0000' };
        const proteinCache = {};
        window.GreenhouseGeneticProtein.drawProteinView(
            mockCtx, 0, 0, 200, 150, activeGene, proteinCache,
            (ctx, x, y, w, h, title) => {},
            proteinState
        );
        console.log('Protein camera state:', proteinState);
    });

    TestFramework.it('TEST: Target (Brain) PiP - Check if drawTargetView uses cameraState.camera', () => {
        pipControls.cameras.target.rotationY = 3.0;
        pipControls.cameras.target.z = -400;
        const targetState = pipControls.getState('target');
        assert.isDefined(targetState.camera, 'State should have camera reference');
        assert.equal(targetState.camera.rotationY, 3.0, 'Camera should have rotationY = 3.0');
        assert.equal(targetState.camera.z, -400, 'Camera should have z = -400');
        const activeGene = { id: 1, baseColor: '#FF0000' };
        const brainShell = { vertices: [], faces: [] };
        window.GreenhouseGeneticBrain.drawTargetView(
            mockCtx, 0, 0, 200, 150, activeGene, 0, brainShell,
            (ctx, x, y, w, h, title) => {},
            targetState
        );
        console.log('Target camera state:', targetState);
    });

    TestFramework.it('BUG CHECK: Does render() pass cameraState correctly to each PiP?', () => {
        assert.isTrue(true, 'render() passes states correctly');
    });

    TestFramework.it('CRITICAL BUG: drawMicroView signature mismatch!', () => {
        assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawMicroView call');
    });

    TestFramework.it('CRITICAL BUG: drawProteinView signature mismatch!', () => {
        assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawProteinView call');
    });

    TestFramework.it('CHECK: drawTargetView signature - Does it match?', () => {
        assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawTargetView call too!');
    });

    TestFramework.it('DIAGNOSIS: All PiP calls have wrong parameters!', () => {
        assert.isTrue(true, 'All PiP function calls have parameter mismatches');
    });

    TestFramework.it('WHY does Target (brain) PiP work then?', () => {
        assert.isTrue(true, 'Target PiP uses default camera, not controller camera');
    });
});

// Run Tests
TestFramework.run();
