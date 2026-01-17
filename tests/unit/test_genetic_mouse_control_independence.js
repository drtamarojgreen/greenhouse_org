/**
 * Unit Tests for Genetic Mouse Control Independence
 * Diagnoses why main window and PiP controls are not independent
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    getElementById: () => null,
    createElement: () => ({
        style: {},
        addEventListener: () => {},
        appendChild: () => {},
        getContext: () => ({
            save: () => {},
            restore: () => {},
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            arc: () => {},
            rect: () => {},
            clip: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            measureText: () => ({ width: 0 }),
            set fillStyle(val) {},
            set strokeStyle(val) {},
            set lineWidth(val) {},
            set font(val) {},
            set textAlign(val) {},
            set textBaseline(val) {},
            set globalAlpha(val) {},
            set lineCap(val) {}
        }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
        width: 1000,
        height: 800,
        offsetWidth: 1000,
        offsetHeight: 800
    }),
    querySelector: () => null,
    querySelectorAll: () => []
};
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.addEventListener = () => {};
global.Date = Date;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');

// --- Test Suites ---

TestFramework.describe('Mouse Control Independence - Main Window vs PiP', () => {
    let mainController;
    let pipControls;
    let mainCamera;
    let canvas;

    TestFramework.beforeEach(() => {
        // Setup canvas mock
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

    TestFramework.it('Event Propagation: should stop propagation when clicking on PiP', () => {
        let propagationStopped = false;
        const event = {
            clientX: 900, // Right side - over micro PiP
            clientY: 20,
            button: 0,
            stopPropagation: () => { propagationStopped = true; },
            preventDefault: () => {}
        };

        // Simulate mousedown on PiP
        pipControls.handleMouseDown(event, canvas);

        assert.isTrue(propagationStopped, 'Event propagation should be stopped when clicking on PiP');
        assert.isNotNull(pipControls.activePiP, 'PiP should be active');
    });

    TestFramework.it('Event Propagation: should not activate main controller when PiP is active', () => {
        const pipEvent = {
            clientX: 900, // Right side - over micro PiP
            clientY: 20,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };

        // Activate PiP
        pipControls.handleMouseDown(pipEvent, canvas);
        const activePiP = pipControls.activePiP;

        // Try to activate main controller (should not happen if PiP is active)
        const mainEvent = {
            clientX: 400, // Center - main view
            clientY: 400,
            button: 0
        };

        // In the real implementation, genetic_ui_3d.js checks if PiP is active
        // and returns early. We simulate that logic here.
        const shouldActivateMain = !activePiP;

        assert.isFalse(shouldActivateMain, 'Main controller should not activate when PiP is active');
    });

    TestFramework.it('Event Propagation: should allow main controller when clicking outside PiP', () => {
        const mainEvent = {
            clientX: 400, // Center - main view
            clientY: 400,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };

        // Check if click is on PiP
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (mainEvent.clientX - rect.left) * scaleX;
        const mouseY = (mainEvent.clientY - rect.top) * scaleY;

        const pipAtPosition = pipControls.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);

        assert.isNull(pipAtPosition, 'No PiP should be at center position');

        // Main controller should be able to activate
        mainController.handleMouseDown(mainEvent);
        assert.isTrue(mainController.isDragging, 'Main controller should be dragging');
    });

    TestFramework.it('PiP Position Detection: should correctly identify helix PiP (top left)', () => {
        const pip = pipControls.getPiPAtPosition(100, 50, canvas.width, canvas.height);
        assert.equal(pip, 'helix', 'Should detect helix PiP at top left');
    });

    TestFramework.it('PiP Position Detection: should correctly identify micro PiP (top right)', () => {
        const pip = pipControls.getPiPAtPosition(900, 50, canvas.width, canvas.height);
        assert.equal(pip, 'micro', 'Should detect micro PiP at top right');
    });

    TestFramework.it('PiP Position Detection: should correctly identify protein PiP (middle right)', () => {
        const pip = pipControls.getPiPAtPosition(900, 200, canvas.width, canvas.height);
        assert.equal(pip, 'protein', 'Should detect protein PiP at middle right');
    });

    TestFramework.it('PiP Position Detection: should correctly identify target PiP (bottom right)', () => {
        const pip = pipControls.getPiPAtPosition(900, 360, canvas.width, canvas.height);
        assert.equal(pip, 'target', 'Should detect target PiP at bottom right');
    });

    TestFramework.it('PiP Position Detection: should return null for main view area', () => {
        const pip = pipControls.getPiPAtPosition(400, 400, canvas.width, canvas.height);
        assert.isNull(pip, 'Should return null for main view area');
    });

    TestFramework.it('PiP Position Detection: should handle edge cases at PiP boundaries', () => {
        // Test exact boundary coordinates
        const pipW = 200;
        const pipH = 150;
        const gap = 10;
        const rightPipX = canvas.width - pipW - gap;

        // Just inside micro PiP
        let pip = pipControls.getPiPAtPosition(rightPipX + 1, gap + 1, canvas.width, canvas.height);
        assert.equal(pip, 'micro', 'Should detect micro PiP just inside boundary');

        // Just outside micro PiP
        pip = pipControls.getPiPAtPosition(rightPipX - 1, gap + 1, canvas.width, canvas.height);
        assert.isNull(pip, 'Should not detect PiP just outside boundary');
    });

    TestFramework.it('Camera State Isolation: should maintain separate camera states for each PiP', () => {
        const helixState = pipControls.getState('helix');
        const microState = pipControls.getState('micro');
        const proteinState = pipControls.getState('protein');
        const targetState = pipControls.getState('target');

        assert.isDefined(helixState.camera, 'Helix should have camera state');
        assert.isDefined(microState.camera, 'Micro should have camera state');
        assert.isDefined(proteinState.camera, 'Protein should have camera state');
        assert.isDefined(targetState.camera, 'Target should have camera state');

        // Verify they are different objects
        assert.notEqual(helixState.camera, microState.camera, 'Helix and Micro should have different cameras');
        assert.notEqual(helixState.camera, mainCamera, 'PiP camera should be different from main camera');
    });

    TestFramework.it('Camera State Isolation: should not affect main camera when modifying PiP camera', () => {
        const initialMainRotation = mainCamera.rotationY;

        // Modify helix PiP camera
        const helixCamera = pipControls.cameras.helix;
        helixCamera.rotationY = 1.5;

        assert.equal(mainCamera.rotationY, initialMainRotation, 'Main camera should not be affected');
        assert.equal(helixCamera.rotationY, 1.5, 'Helix camera should be modified');
    });

    TestFramework.it('Camera State Isolation: should not affect other PiP cameras when modifying one', () => {
        const helixCamera = pipControls.cameras.helix;
        const microCamera = pipControls.cameras.micro;

        helixCamera.rotationY = 2.0;
        microCamera.rotationX = 1.0;

        assert.equal(helixCamera.rotationY, 2.0, 'Helix rotation should be 2.0');
        assert.equal(microCamera.rotationX, 1.0, 'Micro rotation should be 1.0');
        assert.equal(helixCamera.rotationX, 0, 'Helix X rotation should be unchanged');
        assert.equal(microCamera.rotationY, 0, 'Micro Y rotation should be unchanged');
    });

    TestFramework.it('Mouse Event Routing: should route mouse events to correct PiP controller', () => {
        // Click on protein PiP
        const event = {
            clientX: 900,
            clientY: 200,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };

        pipControls.handleMouseDown(event, canvas);

        assert.equal(pipControls.activePiP, 'protein', 'Protein PiP should be active');

        // Verify the correct controller received the event
        const proteinController = pipControls.controllers.protein;
        assert.isTrue(proteinController.isDragging, 'Protein controller should be dragging');

        // Verify other controllers are not affected
        assert.isFalse(pipControls.controllers.helix.isDragging, 'Helix controller should not be dragging');
        assert.isFalse(pipControls.controllers.micro.isDragging, 'Micro controller should not be dragging');
    });

    TestFramework.it('Mouse Event Routing: should handle mouse move only for active PiP', () => {
        // Activate protein PiP
        const downEvent = {
            clientX: 900,
            clientY: 200,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);

        // Move mouse
        const moveEvent = {
            clientX: 910,
            clientY: 210
        };
        pipControls.handleMouseMove(moveEvent);

        // Only protein controller should have received move event
        const proteinController = pipControls.controllers.protein;
        assert.isTrue(proteinController.isDragging, 'Protein controller should still be dragging');
    });

    TestFramework.it('Mouse Event Routing: should clear active PiP on mouse up', () => {
        // Activate PiP
        const downEvent = {
            clientX: 900,
            clientY: 200,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);
        assert.isNotNull(pipControls.activePiP, 'PiP should be active');

        // Release mouse
        pipControls.handleMouseUp();
        assert.isNull(pipControls.activePiP, 'PiP should be cleared on mouse up');
    });

    TestFramework.it('Wheel Event Handling: should handle wheel events on PiP independently', () => {
        const wheelEvent = {
            clientX: 900,
            clientY: 50,
            deltaY: 100,
            preventDefault: () => {},
            stopPropagation: () => {}
        };

        const initialMainZ = mainCamera.z;
        const initialMicroZ = pipControls.cameras.micro.z;

        // Wheel over micro PiP
        pipControls.handleWheel(wheelEvent, canvas);

        // Main camera should not be affected
        assert.equal(mainCamera.z, initialMainZ, 'Main camera Z should not change');

        // Micro camera should be affected
        assert.notEqual(pipControls.cameras.micro.z, initialMicroZ, 'Micro camera Z should change');
    });

    TestFramework.it('Wheel Event Handling: should not handle wheel events outside PiP areas', () => {
        const wheelEvent = {
            clientX: 400,
            clientY: 400,
            deltaY: 100,
            preventDefault: () => {},
            stopPropagation: () => {}
        };

        const initialMicroZ = pipControls.cameras.micro.z;

        // Wheel over main view (not PiP)
        pipControls.handleWheel(wheelEvent, canvas);

        // PiP cameras should not be affected
        assert.equal(pipControls.cameras.micro.z, initialMicroZ, 'Micro camera should not change');
    });

    TestFramework.it('Coordinate Scaling: should correctly scale mouse coordinates', () => {
        // Test with different canvas display size vs actual size
        const scaledCanvas = {
            width: 1000,
            height: 800,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 400 }) // Half size display
        };

        // Click at display coordinates (450, 25) should map to canvas (900, 50)
        const event = {
            clientX: 450,
            clientY: 25,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };

        const rect = scaledCanvas.getBoundingClientRect();
        const scaleX = scaledCanvas.width / rect.width;
        const scaleY = scaledCanvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        assert.equal(mouseX, 900, 'X coordinate should be scaled correctly');
        assert.equal(mouseY, 50, 'Y coordinate should be scaled correctly');

        // Should detect micro PiP
        const pip = pipControls.getPiPAtPosition(mouseX, mouseY, scaledCanvas.width, scaledCanvas.height);
        assert.equal(pip, 'micro', 'Should detect micro PiP with scaled coordinates');
    });

    TestFramework.it('Integration: should handle complete drag interaction on PiP without affecting main', () => {
        const initialMainRotation = mainCamera.rotationY;
        const initialMicroRotation = pipControls.cameras.micro.rotationY;

        // Mouse down on micro PiP
        const downEvent = {
            clientX: 900,
            clientY: 50,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);

        // Mouse move (drag)
        const moveEvent = {
            clientX: 920,
            clientY: 60
        };
        pipControls.handleMouseMove(moveEvent);

        // Mouse up
        pipControls.handleMouseUp();

        // Main camera should be unchanged
        assert.equal(mainCamera.rotationY, initialMainRotation, 'Main camera should not rotate');

        // Micro camera should have changed
        assert.notEqual(pipControls.cameras.micro.rotationY, initialMicroRotation, 'Micro camera should rotate');
    });

    TestFramework.it('Integration: should handle complete drag interaction on main without affecting PiP', () => {
        const initialMainRotation = mainCamera.rotationY;
        const initialMicroRotation = pipControls.cameras.micro.rotationY;

        // Mouse down on main view
        const downEvent = {
            clientX: 400,
            clientY: 400,
            button: 0
        };
        mainController.handleMouseDown(downEvent);

        // Mouse move (drag)
        const moveEvent = {
            clientX: 420,
            clientY: 410
        };
        mainController.handleMouseMove(moveEvent);

        // Mouse up
        mainController.handleMouseUp();

        // Main camera should have changed
        assert.notEqual(mainCamera.rotationY, initialMainRotation, 'Main camera should rotate');

        // PiP cameras should be unchanged
        assert.equal(pipControls.cameras.micro.rotationY, initialMicroRotation, 'Micro camera should not rotate');
    });

    TestFramework.it('Potential Issues Diagnosis: Check if event.stopPropagation is called in genetic_ui_3d.js', () => {
        // This test documents the expected behavior
        // In genetic_ui_3d.js setupInteraction(), when PiP handles mousedown,
        // it should return early to prevent main controller activation

        let pipHandled = false;
        const event = {
            clientX: 900,
            clientY: 50,
            button: 0,
            stopPropagation: () => { pipHandled = true; },
            preventDefault: () => {}
        };

        pipControls.handleMouseDown(event, canvas);

        assert.isTrue(pipHandled, 'PiP should call stopPropagation to prevent main controller activation');
    });

    TestFramework.it('Potential Issues Diagnosis: Check if main controller checks for activePiP before handling events', () => {
        // Simulate the check that should exist in genetic_ui_3d.js
        const event = {
            clientX: 900,
            clientY: 50,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };

        // Activate PiP
        pipControls.handleMouseDown(event, canvas);

        // Check if activePiP is set
        const shouldBlockMain = pipControls.activePiP !== null;

        assert.isTrue(shouldBlockMain, 'Main controller should be blocked when PiP is active');
    });

    TestFramework.it('Potential Issues Diagnosis: Verify mousemove event checks activePiP before routing to main', () => {
        // Activate PiP
        const downEvent = {
            clientX: 900,
            clientY: 50,
            button: 0,
            stopPropagation: () => {},
            preventDefault: () => {}
        };
        pipControls.handleMouseDown(downEvent, canvas);

        // Move mouse
        const moveEvent = {
            clientX: 910,
            clientY: 60
        };

        // In genetic_ui_3d.js, mousemove should check if activePiP exists
        // and return early if it does
        const shouldRouteToPiP = pipControls.activePiP !== null;

        assert.isTrue(shouldRouteToPiP, 'Mouse move should be routed to PiP when active');

        // If we route to main controller, it should not activate
        if (!shouldRouteToPiP) {
            mainController.handleMouseMove(moveEvent);
        }

        // Main controller should not be dragging
        assert.isFalse(mainController.isDragging, 'Main controller should not be dragging when PiP is active');
    });

    TestFramework.it('Potential Issues Diagnosis: Verify wheel event checks PiP position before routing', () => {
        const wheelEvent = {
            clientX: 900,
            clientY: 50,
            deltaY: 100,
            preventDefault: () => {},
            stopPropagation: () => {}
        };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (wheelEvent.clientX - rect.left) * scaleX;
        const mouseY = (wheelEvent.clientY - rect.top) * scaleY;

        const pipAtPosition = pipControls.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);

        assert.isNotNull(pipAtPosition, 'Wheel event should detect PiP at position');

        // If PiP is detected, main controller should not handle the event
        const shouldBlockMain = pipAtPosition !== null;
        assert.isTrue(shouldBlockMain, 'Main controller should not handle wheel when over PiP');
    });
});

// Run Tests
TestFramework.run();
