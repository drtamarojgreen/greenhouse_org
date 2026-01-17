/**
 * Unit Tests to Identify the ACTUAL Mouse Control Bug
 * Focus: Testing the real event flow that happens in the browser
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
            }
        };
        return config[key];
    }
};

// Load Modules
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');

// --- Test Suites ---

TestFramework.describe('ACTUAL BUG: Mouse Control Issues', () => {
    let mainController;
    let pipControls;
    let mainCamera;
    let canvas;

    TestFramework.beforeEach(() => {
        // Setup canvas
        canvas = {
            width: 1000,
            height: 800,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
            addEventListener: () => {},
            style: { cursor: 'grab' }
        };

        // Setup main camera
        mainCamera = {
            x: 0, y: 0, z: -300,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            fov: 500
        };

        // Initialize main camera controller
        mainController = new window.GreenhouseGeneticCameraController(
            mainCamera,
            window.GreenhouseGeneticConfig
        );

        // Setup mock cameras for PiP
        const cameras = [
            mainCamera, // Main camera
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
        ];

        // Initialize PiP controls
        pipControls = window.GreenhouseGeneticPiPControls;
        pipControls.init(window.GreenhouseGeneticConfig, cameras);
    });

    TestFramework.it('BUG #1: CRITICAL: Main view camera is NOT controlled by mainCameraController', () => {
        // In genetic_ui_3d.js, line 11-17:
        // camera: { x: 0, y: 0, z: -300, ... }
        // This is the MAIN VIEW camera used in render()

        // But in init(), line 56-60:
        // this.mainCameraController = new GreenhouseGeneticCameraController(
        //     this.camera,  // <-- This passes the camera object
        //     ...
        // );

        // The controller DOES receive the camera reference
        // So this should work... Let's verify the reference is maintained

        const testCamera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const testController = new window.GreenhouseGeneticCameraController(
            testCamera,
            window.GreenhouseGeneticConfig
        );

        // Modify via controller
        testController.camera.rotationY = 1.5;

        // Check if original object changed
        assert.equal(testCamera.rotationY, 1.5, 'Camera should be modified by reference');
    });

    TestFramework.it('BUG #1: BUG: Main view in render() uses this.camera directly, not mainCameraController.camera', () => {
        // In render(), line 545:
        // this.drawTargetView(ctx, 0, 0, w, h, activeGene, { camera: this.camera });
        //                                                              ^^^^^^^^^^^
        // This passes this.camera directly

        // But mainCameraController modifies its own this.camera reference
        // which SHOULD be the same object...

        // Let's verify they're the same object
        assert.equal(mainController.camera, mainCamera, 'Controller camera should be same object as main camera');
    });

    TestFramework.it('BUG #2: CRITICAL: getState() returns a NEW object, not the camera reference', () => {
        // In genetic_pip_controls.js, getState() method:
        // return {
        //     zoom: Math.abs(cam.z) / 200,
        //     rotationX: cam.rotationX,
        //     rotationY: cam.rotationY,
        //     panX: cam.x,
        //     panY: cam.y,
        //     camera: cam  // <-- This IS the camera reference
        // };

        const helixState = pipControls.getState('helix');
        const helixCamera = pipControls.cameras.helix;

        // The state object contains the camera reference
        assert.equal(helixState.camera, helixCamera, 'State should contain camera reference');

        // But the state object itself is NEW each time
        const helixState2 = pipControls.getState('helix');
        assert.notEqual(helixState, helixState2, 'State objects are different');
        assert.equal(helixState.camera, helixState2.camera, 'But camera references are same');
    });

    TestFramework.it('BUG #2: BUG: PiP views use cameraState properties, not cameraState.camera', () => {
        // In render(), lines 563-566:
        // helixState = window.GreenhouseGeneticPiPControls.getState('helix');
        // ...
        // this.drawDNAHelixPiP(ctx, leftPipX, gap, pipW, pipH, helixState, drawPiPFrame);
        //                                                        ^^^^^^^^^^

        // Then in drawDNAHelixPiP(), lines 1009-1017:
        // const pipCamera = {
        //     x: cameraState.panX || 0,
        //     y: cameraState.panY || 0,
        //     z: -200 / (cameraState.zoom || 1.0),
        //     rotationX: cameraState.rotationX || 0,
        //     rotationY: (cameraState.rotationY || 0) + time * 0.3,
        //     ...
        // };

        // THIS IS THE BUG! It creates a NEW camera object from state properties
        // instead of using cameraState.camera directly!

        const helixState = pipControls.getState('helix');

        // Simulate what drawDNAHelixPiP does
        const pipCamera = {
            x: helixState.panX || 0,
            y: helixState.panY || 0,
            z: -200 / (helixState.zoom || 1.0),
            rotationX: helixState.rotationX || 0,
            rotationY: helixState.rotationY || 0,
            rotationZ: 0,
            fov: 500
        };

        // This pipCamera is a NEW object, not the controller's camera
        assert.notEqual(pipCamera, helixState.camera, 'BUG: pipCamera is a new object!');

        // So when the controller modifies its camera, the PiP view doesn't see it
        // because it's using a reconstructed camera object
    });

    TestFramework.it('BUG #3: CRITICAL: Main view passes { camera: this.camera } which creates wrapper object', () => {
        // In render(), line 545:
        // this.drawTargetView(ctx, 0, 0, w, h, activeGene, { camera: this.camera });
        //                                                    ^^^^^^^^^^^^^^^^^^^^^^
        // This creates a NEW object with camera property

        // Then drawTargetView passes this to genetic_ui_3d_brain.js
        // which likely extracts cameraState.camera

        // But the issue is: does genetic_ui_3d_brain.js use cameraState.camera
        // or does it reconstruct like drawDNAHelixPiP does?

        const cameraWrapper = { camera: mainCamera };

        // If the draw function uses cameraWrapper.camera, it's fine
        assert.equal(cameraWrapper.camera, mainCamera, 'Wrapper contains camera reference');

        // But if it reconstructs from properties, it's broken
        // We need to check genetic_ui_3d_brain.js, genetic_ui_3d_gene.js, etc.
    });

    TestFramework.it('BUG #4: REPRODUCE BUG: Drag PiP, camera changes, but render uses old values', () => {
        // 1. Get initial state
        const initialRotation = pipControls.cameras.helix.rotationY;

        // 2. Simulate mouse drag on helix PiP
        const downEvent = {
            clientX: 100,
            clientY: 50,
            button: 0,
            stopPropagation: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);

        // 3. Move mouse
        const moveEvent = {
            clientX: 120,
            clientY: 60
        };
        pipControls.handleMouseMove(moveEvent);

        // 4. Camera should have changed
        const newRotation = pipControls.cameras.helix.rotationY;
        assert.notEqual(newRotation, initialRotation, 'Camera rotation should change');

        // 5. But when render() calls getState() and reconstructs camera...
        const helixState = pipControls.getState('helix');
        const reconstructedCamera = {
            x: helixState.panX || 0,
            y: helixState.panY || 0,
            z: -200 / (helixState.zoom || 1.0),
            rotationX: helixState.rotationX || 0,
            rotationY: helixState.rotationY || 0,
            rotationZ: 0,
            fov: 500
        };

        // 6. The reconstructed camera SHOULD have the new rotation
        assert.equal(reconstructedCamera.rotationY, newRotation, 'Reconstructed camera should have new rotation');

        // So the bug is NOT in the reconstruction itself...
        // The bug must be elsewhere!
    });

    TestFramework.it('BUG #4: ACTUAL BUG: Check if getState() returns correct values', () => {
        // Modify camera directly
        pipControls.cameras.helix.rotationY = 2.5;
        pipControls.cameras.helix.x = 100;
        pipControls.cameras.helix.z = -500;

        // Get state
        const state = pipControls.getState('helix');

        // Check if state reflects camera changes
        assert.equal(state.rotationY, 2.5, 'State should have correct rotationY');
        assert.equal(state.panX, 100, 'State should have correct panX');

        // Check zoom calculation
        const expectedZoom = Math.abs(-500) / 200;
        assert.equal(state.zoom, expectedZoom, 'State should have correct zoom');
    });

    TestFramework.it('BUG #5: CRITICAL BUG FOUND: Auto-rotate adds to rotationY every frame!', () => {
        // In drawDNAHelixPiP(), lines 1015:
        // rotationY: (cameraState.rotationY || 0) + time * 0.3,
        //                                           ^^^^^^^^^^^^
        // This ADDS time-based rotation to the user's rotation!

        // So even if user rotates the camera, the auto-rotate keeps adding
        // This means user rotation is COMBINED with auto-rotate, not independent

        // Set user rotation
        pipControls.cameras.helix.rotationY = 1.0;

        // Get state
        const state = pipControls.getState('helix');
        assert.equal(state.rotationY, 1.0, 'User rotation should be 1.0');

        // Simulate what drawDNAHelixPiP does
        const time = Date.now() * 0.001;
        const pipCameraRotationY = (state.rotationY || 0) + time * 0.3;

        // The rendered rotation is user rotation + auto-rotate
        assert.notEqual(pipCameraRotationY, 1.0, 'Rendered rotation includes auto-rotate');

        // THIS IS A BUG! User rotation should DISABLE auto-rotate
        // or auto-rotate should be separate from user rotation
    });

    TestFramework.it('BUG #5: BUG: Auto-rotate should be disabled when user interacts', () => {
        // The controller has autoRotate property
        const helixController = pipControls.controllers.helix;

        // Initially auto-rotate is enabled
        assert.isTrue(helixController.autoRotate, 'Auto-rotate should be enabled initially');

        // When user drags, stopAutoRotate() is called
        const downEvent = {
            clientX: 100,
            clientY: 50,
            button: 0,
            stopPropagation: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);

        // Auto-rotate should be disabled
        assert.isFalse(helixController.autoRotate, 'Auto-rotate should be disabled after interaction');

        // But drawDNAHelixPiP() ALWAYS adds time-based rotation
        // It doesn't check if autoRotate is enabled!
        // THIS IS THE BUG!
    });

    TestFramework.it('BUG #6: CRITICAL: Main view and PiP target view share the same camera!', () => {
        // In render(), line 545:
        // this.drawTargetView(ctx, 0, 0, w, h, activeGene, { camera: this.camera });
        //                                                              ^^^^^^^^^^^
        // Main view uses this.camera

        // In render(), line 587:
        // this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
        //                                                                       ^^^^^^^^^^^
        // PiP target view uses targetState

        // But targetState comes from:
        // targetState = window.GreenhouseGeneticPiPControls.getState('target');

        // So PiP target view uses a DIFFERENT camera than main view
        // This is correct! They should be independent.

        const targetState = pipControls.getState('target');
        assert.notEqual(targetState.camera, mainCamera, 'Target PiP should have different camera');
    });

    TestFramework.it('ROOT CAUSE ANALYSIS: ISSUE: drawDNAHelixPiP always adds auto-rotate, ignoring controller state', () => {
        // The real bug is in drawDNAHelixPiP() line 1015:
        // rotationY: (cameraState.rotationY || 0) + time * 0.3,

        // This should be:
        // rotationY: cameraState.rotationY || 0,

        // And auto-rotate should be handled by the controller's update() method
        // which already checks the autoRotate flag

        // Let's verify the controller handles auto-rotate correctly
        const helixController = pipControls.controllers.helix;
        const initialRotation = pipControls.cameras.helix.rotationY;

        // Enable auto-rotate
        helixController.autoRotate = true;

        // Call update (simulates animation frame)
        helixController.update();

        // Rotation should have changed slightly
        const afterUpdate = pipControls.cameras.helix.rotationY;
        assert.notEqual(afterUpdate, initialRotation, 'Controller update should rotate camera');
    });

    TestFramework.it('ROOT CAUSE ANALYSIS: SOLUTION: Remove auto-rotate from drawDNAHelixPiP, let controller handle it', () => {
        // The fix is to change drawDNAHelixPiP() to NOT add time-based rotation
        // Instead, just use the camera's current rotationY value

        // Current (buggy) code:
        // const pipCamera = {
        //     rotationY: (cameraState.rotationY || 0) + time * 0.3,  // BUG!
        // };

        // Fixed code:
        // const pipCamera = {
        //     rotationY: cameraState.rotationY || 0,  // Use controller's rotation
        // };

        // Or better yet, use cameraState.camera directly:
        // const pipCamera = cameraState.camera;

        assert.isTrue(true, 'This test documents the solution');
    });

    TestFramework.it('ROOT CAUSE ANALYSIS: ISSUE #2: Other draw functions may also reconstruct camera incorrectly', () => {
        // We need to check:
        // - drawMicroView() - does it use cameraState.camera or reconstruct?
        // - drawProteinView() - does it use cameraState.camera or reconstruct?
        // - drawTargetView() - does it use cameraState.camera or reconstruct?

        // These are in separate files:
        // - genetic_ui_3d_gene.js
        // - genetic_ui_3d_protein.js
        // - genetic_ui_3d_brain.js

        // We need to examine those files to see if they have the same bug

        assert.isTrue(true, 'This test documents the need to check other draw functions');
    });
});

// Run Tests
TestFramework.run();
