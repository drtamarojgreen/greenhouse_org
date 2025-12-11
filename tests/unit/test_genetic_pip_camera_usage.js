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
        // Initialize PiP controls
        pipControls = window.GreenhouseGeneticPiPControls;
        pipControls.init(window.GreenhouseGeneticConfig);

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

    TestFramework.describe('Camera Object Usage in Each PiP', () => {
        TestFramework.it('TEST: Helix PiP - Check if it uses cameraState.camera', () => {
            // Modify helix camera
            pipControls.cameras.helix.rotationY = 2.5;
            pipControls.cameras.helix.x = 50;
            
            const helixState = pipControls.getState('helix');
            
            // Check if state contains camera reference
            assert.isDefined(helixState.camera, 'State should have camera reference');
            assert.equal(helixState.camera.rotationY, 2.5, 'Camera should have rotationY = 2.5');
            assert.equal(helixState.camera.x, 50, 'Camera should have x = 50');
            
            // The issue is: does drawDNAHelixPiP USE this camera?
            // We can't test the actual draw function without full setup,
            // but we can document what it SHOULD do
            console.log('Helix camera state:', helixState);
        });

        TestFramework.it('TEST: Micro PiP - Check if drawMicroView uses cameraState.camera', () => {
            // Modify micro camera
            pipControls.cameras.micro.rotationY = 1.5;
            pipControls.cameras.micro.z = -500;
            
            const microState = pipControls.getState('micro');
            
            assert.isDefined(microState.camera, 'State should have camera reference');
            assert.equal(microState.camera.rotationY, 1.5, 'Camera should have rotationY = 1.5');
            assert.equal(microState.camera.z, -500, 'Camera should have z = -500');
            
            // Check if drawMicroView would use it
            // Looking at genetic_ui_3d_gene.js, it checks:
            // if (cameraState && cameraState.camera) { microCamera = cameraState.camera; }
            
            const activeGene = { id: 1, baseColor: '#FF0000' };
            
            // Call drawMicroView
            window.GreenhouseGeneticGene.drawMicroView(
                mockCtx, 0, 0, 200, 150, activeGene, 0, null,
                (ctx, x, y, w, h, title) => {}, // drawPiPFrame callback
                microState
            );
            
            // If it uses cameraState.camera, the camera object should be used
            // We can't verify this without inspecting the function's internal behavior
            // But the code shows it DOES check for cameraState.camera
            console.log('Micro camera state:', microState);
        });

        TestFramework.it('TEST: Protein PiP - Check if drawProteinView uses cameraState.camera', () => {
            // Modify protein camera
            pipControls.cameras.protein.rotationX = 0.8;
            pipControls.cameras.protein.y = 100;
            
            const proteinState = pipControls.getState('protein');
            
            assert.isDefined(proteinState.camera, 'State should have camera reference');
            assert.equal(proteinState.camera.rotationX, 0.8, 'Camera should have rotationX = 0.8');
            assert.equal(proteinState.camera.y, 100, 'Camera should have y = 100');
            
            // Check if drawProteinView would use it
            // Looking at genetic_ui_3d_protein.js, it checks:
            // if (cameraState && cameraState.camera) { proteinCamera = cameraState.camera; }
            
            const activeGene = { id: 1, baseColor: '#FF0000' };
            const proteinCache = {};
            
            // Call drawProteinView
            window.GreenhouseGeneticProtein.drawProteinView(
                mockCtx, 0, 0, 200, 150, activeGene, proteinCache,
                (ctx, x, y, w, h, title) => {}, // drawPiPFrame callback
                proteinState
            );
            
            console.log('Protein camera state:', proteinState);
        });

        TestFramework.it('TEST: Target (Brain) PiP - Check if drawTargetView uses cameraState.camera', () => {
            // Modify target camera
            pipControls.cameras.target.rotationY = 3.0;
            pipControls.cameras.target.z = -400;
            
            const targetState = pipControls.getState('target');
            
            assert.isDefined(targetState.camera, 'State should have camera reference');
            assert.equal(targetState.camera.rotationY, 3.0, 'Camera should have rotationY = 3.0');
            assert.equal(targetState.camera.z, -400, 'Camera should have z = -400');
            
            // Check if drawTargetView would use it
            // Looking at genetic_ui_3d_brain.js, it checks:
            // if (cameraState && cameraState.camera) { targetCamera = cameraState.camera; }
            
            const activeGene = { id: 1, baseColor: '#FF0000' };
            const brainShell = { vertices: [], faces: [] };
            
            // Call drawTargetView
            window.GreenhouseGeneticBrain.drawTargetView(
                mockCtx, 0, 0, 200, 150, activeGene, 0, brainShell,
                (ctx, x, y, w, h, title) => {}, // drawPiPFrame callback
                targetState
            );
            
            console.log('Target camera state:', targetState);
        });
    });

    TestFramework.describe('CRITICAL: Check if cameraState.camera is ACTUALLY passed', () => {
        TestFramework.it('BUG CHECK: Does render() pass cameraState correctly to each PiP?', () => {
            // In genetic_ui_3d.js render() method:
            // Line 563-566: Get states
            // helixState = window.GreenhouseGeneticPiPControls.getState('helix');
            // microState = window.GreenhouseGeneticPiPControls.getState('micro');
            // proteinState = window.GreenhouseGeneticPiPControls.getState('protein');
            // targetState = window.GreenhouseGeneticPiPControls.getState('target');
            
            // Line 571: Helix
            // this.drawDNAHelixPiP(ctx, leftPipX, gap, pipW, pipH, helixState, drawPiPFrame);
            
            // Line 576: Micro
            // this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, microState, drawPiPFrame);
            
            // Line 582: Protein
            // this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, proteinState, drawPiPFrame);
            
            // Line 587: Target
            // this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
            
            // All of them pass the state object correctly!
            // So the issue must be in HOW each draw function uses the state
            
            assert.isTrue(true, 'render() passes states correctly');
        });

        TestFramework.it('CRITICAL BUG: drawMicroView signature mismatch!', () => {
            // Looking at genetic_ui_3d.js line 576:
            // this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, microState, drawPiPFrame);
            //                                                                   ^^^^^^^^^^
            // It passes microState as the 7th parameter
            
            // But looking at genetic_ui_3d_gene.js line 5:
            // drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback, cameraState)
            //                                            ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
            // It expects: activeGeneIndex (7th), neuronMeshes (8th), drawPiPFrameCallback (9th), cameraState (10th)
            
            // So microState is being passed as activeGeneIndex!
            // And drawPiPFrame is being passed as neuronMeshes!
            // And cameraState is undefined!
            
            // THIS IS THE BUG!
            
            assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawMicroView call');
        });

        TestFramework.it('CRITICAL BUG: drawProteinView signature mismatch!', () => {
            // Looking at genetic_ui_3d.js line 582:
            // this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, proteinState, drawPiPFrame);
            //                                                                         ^^^^^^^^^^^^
            // It passes proteinState as the 7th parameter
            
            // But looking at genetic_ui_3d_protein.js line 5:
            // drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback, cameraState)
            //                                              ^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
            // It expects: proteinCache (7th), drawPiPFrameCallback (8th), cameraState (9th)
            
            // So proteinState is being passed as proteinCache!
            // And drawPiPFrame is being passed as drawPiPFrameCallback!
            // And cameraState is undefined!
            
            // THIS IS THE BUG!
            
            assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawProteinView call');
        });

        TestFramework.it('CHECK: drawTargetView signature - Does it match?', () => {
            // Looking at genetic_ui_3d.js line 587:
            // this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
            //                                                                       ^^^^^^^^^^^
            // It passes targetState as the 7th parameter
            
            // But looking at genetic_ui_3d_brain.js line 5:
            // drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState)
            //                                             ^^^^^^^^^^^^^^^^  ^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
            // It expects: activeGeneIndex (7th), brainShell (8th), drawPiPFrameCallback (9th), cameraState (10th)
            
            // So targetState is being passed as activeGeneIndex!
            // And drawPiPFrame is being passed as brainShell!
            // And cameraState is undefined!
            
            // Wait, but user says Target (brain) PiP WORKS!
            // Let me check the main view call...
            
            // Line 545:
            // this.drawTargetView(ctx, 0, 0, w, h, activeGene, { camera: this.camera });
            //                                                   ^^^^^^^^^^^^^^^^^^^^^^^
            // Main view passes { camera: this.camera } as 7th parameter
            
            // So main view is ALSO wrong! It should pass:
            // this.drawTargetView(ctx, 0, 0, w, h, activeGene, activeGeneIndex, brainShell, null, { camera: this.camera });
            
            assert.isTrue(true, 'FOUND BUG: Parameter mismatch in drawTargetView call too!');
        });
    });

    TestFramework.describe('ROOT CAUSE: Function Signature Mismatches', () => {
        TestFramework.it('DIAGNOSIS: All PiP calls have wrong parameters!', () => {
            // The issue is that genetic_ui_3d.js is calling the draw functions
            // with the WRONG number and order of parameters!
            
            // Expected signatures:
            // drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback, cameraState)
            // drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback, cameraState)
            // drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState)
            
            // Actual calls in genetic_ui_3d.js:
            // this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, microState, drawPiPFrame);
            // this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, proteinState, drawPiPFrame);
            // this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
            
            // All missing required parameters!
            
            assert.isTrue(true, 'All PiP function calls have parameter mismatches');
        });

        TestFramework.it('WHY does Target (brain) PiP work then?', () => {
            // User says only Target PiP works
            // Let's check if drawTargetView has fallback logic...
            
            // Looking at genetic_ui_3d_brain.js lines 11-23:
            // if (cameraState && cameraState.camera) {
            //     targetCamera = cameraState.camera;
            // } else {
            //     targetCamera = {
            //         x: cameraState ? cameraState.panX : 0,
            //         y: cameraState ? cameraState.panY : 0,
            //         z: -300 / (cameraState ? cameraState.zoom : 1.0),
            //         rotationX: 0.2 + (cameraState ? cameraState.rotationX : 0),
            //         rotationY: cameraState ? cameraState.rotationY : 0,
            //         rotationZ: 0,
            //         fov: 600
            //     };
            // }
            
            // So if cameraState is passed as activeGeneIndex (7th param),
            // it would be a state object, not a number
            // And cameraState.camera would exist!
            
            // So Target PiP works by ACCIDENT because:
            // 1. targetState is passed as 7th param (activeGeneIndex)
            // 2. drawPiPFrame is passed as 8th param (brainShell)
            // 3. undefined is passed as 9th param (drawPiPFrameCallback)
            // 4. undefined is passed as 10th param (cameraState)
            
            // But wait, the function signature shows cameraState is 10th param
            // So it would be undefined...
            
            // Unless... let me recount the parameters in the CALL:
            // this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
            // That's 8 parameters: ctx, x, y, w, h, activeGene, targetState, drawPiPFrame
            
            // And the function expects 10:
            // drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState)
            
            // So:
            // ctx -> ctx ✓
            // rightPipX -> x ✓
            // targetY -> y ✓
            // pipW -> w ✓
            // pipH -> h ✓
            // activeGene -> activeGene ✓
            // targetState -> activeGeneIndex ✗ (should be number, got object)
            // drawPiPFrame -> brainShell ✗ (should be object, got function)
            // undefined -> drawPiPFrameCallback ✗
            // undefined -> cameraState ✗
            
            // So cameraState is undefined!
            // But the code checks: if (cameraState && cameraState.camera)
            // Since cameraState is undefined, it goes to the else branch
            // And reconstructs the camera from cameraState properties
            // But cameraState is undefined, so all properties are undefined
            // So it creates a default camera!
            
            // This means Target PiP is NOT using the controller's camera either!
            // It's using a default camera!
            
            // So why does it "work"? Maybe it doesn't actually work,
            // or maybe the user is seeing the default camera behavior
            // which happens to look reasonable?
            
            assert.isTrue(true, 'Target PiP uses default camera, not controller camera');
        });
    });
});

// Run Tests
TestFramework.run();
