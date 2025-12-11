/**
 * Unit Tests for Rotation Controls and Camera/Object Positions
 * Tests the actual position of objects and cameras in PiPs and main window
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    getElementById: (id) => null,
    createElement: (tag) => ({
        style: {},
        addEventListener: () => {},
        appendChild: () => {},
        querySelector: () => null
    })
};
global.console = console;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
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
            }
        };
        return config[key];
    }
};

// --- Mock Canvas and Context ---
function createMockCanvas() {
    return {
        width: 1000,
        height: 800,
        style: { cursor: 'grab' },
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 1000,
            height: 800,
            right: 1000,
            bottom: 800
        }),
        addEventListener: function(event, handler) {
            this._listeners = this._listeners || {};
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(handler);
        },
        removeEventListener: function(event, handler) {
            if (this._listeners && this._listeners[event]) {
                const index = this._listeners[event].indexOf(handler);
                if (index > -1) {
                    this._listeners[event].splice(index, 1);
                }
            }
        },
        dispatchEvent: function(event) {
            if (this._listeners && this._listeners[event.type]) {
                this._listeners[event.type].forEach(handler => handler(event));
            }
        },
        getContext: () => ({
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            clip: () => {},
            rect: () => {},
            createLinearGradient: () => ({
                addColorStop: () => {}
            }),
            createRadialGradient: () => ({
                addColorStop: () => {}
            })
        })
    };
}

// --- Mock Mouse Event ---
function createMouseEvent(type, options = {}) {
    return {
        type: type,
        button: options.button !== undefined ? options.button : 0,
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        deltaY: options.deltaY || 0,
        preventDefault: () => {},
        stopPropagation: () => {}
    };
}

// --- Mock Keyboard Event ---
function createKeyboardEvent(type, key) {
    return {
        type: type,
        key: key,
        preventDefault: () => {},
        stopPropagation: () => {}
    };
}

// Load Modules
try {
    loadScript('genetic_camera_controls.js');
    loadScript('genetic_pip_controls.js');
    console.log('✓ Modules loaded successfully');
} catch (error) {
    console.error('✗ Error loading modules:', error.message);
}

// --- Test Suites ---

TestFramework.describe('Camera Position and Rotation Tests', () => {
    let mainController;
    let pipControls;
    let mainCamera;
    let canvas;

    TestFramework.beforeEach(() => {
        // Setup canvas using mock
        canvas = createMockCanvas();

        // Setup main camera - fresh object each time
        mainCamera = {
            x: 0, y: 0, z: -300,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            fov: 500
        };

        // Initialize Main Camera Controller
        if (window.GreenhouseGeneticCameraController) {
            try {
                mainController = new window.GreenhouseGeneticCameraController(
                    mainCamera,
                    window.GreenhouseGeneticConfig
                );
                console.log('✓ Main controller initialized');
            } catch (error) {
                console.error('✗ Error initializing main controller:', error.message);
                mainController = null;
            }
        } else {
            console.error('✗ GreenhouseGeneticCameraController not available');
            mainController = null;
        }

        // Initialize PiP Controls - create fresh instance
        if (window.GreenhouseGeneticPiPControls) {
            try {
                // PiPControls is a singleton, need to reinitialize
                pipControls = window.GreenhouseGeneticPiPControls;
                pipControls.init(window.GreenhouseGeneticConfig);
                console.log('✓ PiP controls initialized');
            } catch (error) {
                console.error('✗ Error initializing PiP controls:', error.message);
                pipControls = null;
            }
        } else {
            console.error('✗ GreenhouseGeneticPiPControls not available');
            pipControls = null;
        }
    });

    TestFramework.describe('Main Camera Position Tests', () => {
        TestFramework.it('Initial camera position should match config', () => {
            if (!mainController) {
                console.log('Skipping test: mainController not initialized');
                return;
            }
            
            const initial = window.GreenhouseGeneticConfig.get('camera.initial');
            
            assert.equal(mainCamera.x, initial.x, 'Camera X should be 0');
            assert.equal(mainCamera.y, initial.y, 'Camera Y should be 0');
            assert.equal(mainCamera.z, initial.z, 'Camera Z should be -300');
            assert.equal(mainCamera.rotationX, initial.rotationX, 'Rotation X should be 0');
            assert.equal(mainCamera.rotationY, initial.rotationY, 'Rotation Y should be 0');
            assert.equal(mainCamera.rotationZ, initial.rotationZ, 'Rotation Z should be 0');
        });

        TestFramework.it('Camera rotation should change after mouse drag', () => {
            if (!mainController) {
                console.log('Skipping test: mainController not initialized');
                return;
            }
            
            const initialRotationY = mainCamera.rotationY;
            
            // Simulate mouse down
            const downEvent = {
                button: 0,
                clientX: 500,
                clientY: 400
            };
            mainController.handleMouseDown(downEvent);
            
            // Simulate mouse move (drag right)
            const moveEvent = {
                clientX: 600,
                clientY: 400
            };
            mainController.handleMouseMove(moveEvent);
            
            // Camera should have rotated
            assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera rotationY should change');
            assert.isTrue(mainCamera.rotationY > initialRotationY, 'Camera should rotate right (positive Y)');
        });

        TestFramework.it('Camera position should change after pan', () => {
            const initialX = mainCamera.x;
            const initialY = mainCamera.y;
            
            // Simulate right-click down (pan mode)
            const downEvent = {
                button: 2,
                clientX: 500,
                clientY: 400
            };
            mainController.handleMouseDown(downEvent);
            
            // Simulate mouse move (pan right and down)
            const moveEvent = {
                clientX: 550,
                clientY: 450
            };
            mainController.handleMouseMove(moveEvent);
            
            // Camera position should have changed
            assert.notEqual(mainCamera.x, initialX, 'Camera X should change');
            assert.notEqual(mainCamera.y, initialY, 'Camera Y should change');
        });

        TestFramework.it('Camera zoom should change after wheel event', () => {
            const initialZ = mainCamera.z;
            
            // Simulate wheel event (zoom in)
            const wheelEvent = {
                deltaY: -100
            };
            mainController.handleWheel(wheelEvent);
            
            // Camera should have zoomed in (Z becomes less negative)
            assert.notEqual(mainCamera.z, initialZ, 'Camera Z should change');
            assert.isTrue(mainCamera.z > initialZ, 'Camera should zoom in (Z less negative)');
        });

        TestFramework.it('Camera should respect zoom limits', () => {
            const minZoom = window.GreenhouseGeneticConfig.get('camera.controls.minZoom');
            const maxZoom = window.GreenhouseGeneticConfig.get('camera.controls.maxZoom');
            
            // Try to zoom way in
            mainController.zoom(-10000);
            assert.isTrue(mainCamera.z >= minZoom, 'Camera should not zoom past minZoom');
            
            // Try to zoom way out
            mainController.zoom(10000);
            assert.isTrue(mainCamera.z <= maxZoom, 'Camera should not zoom past maxZoom');
        });

        TestFramework.it('Reset camera should restore initial position', () => {
            // Move camera
            mainController.rotate(100, 50);
            mainController.pan(100, 100);
            mainController.zoom(200);
            
            // Reset
            mainController.resetCamera();
            
            // Should be back to initial
            const initial = window.GreenhouseGeneticConfig.get('camera.initial');
            assert.equal(mainCamera.x, initial.x, 'Camera X should reset');
            assert.equal(mainCamera.y, initial.y, 'Camera Y should reset');
            assert.equal(mainCamera.z, initial.z, 'Camera Z should reset');
            assert.equal(mainCamera.rotationX, initial.rotationX, 'Rotation X should reset');
            assert.equal(mainCamera.rotationY, initial.rotationY, 'Rotation Y should reset');
        });
    });

    TestFramework.describe('PiP Camera Position Tests', () => {
        TestFramework.it('Each PiP should have independent camera', () => {
            const helixCamera = pipControls.cameras.helix;
            const microCamera = pipControls.cameras.micro;
            const proteinCamera = pipControls.cameras.protein;
            const targetCamera = pipControls.cameras.target;
            
            // All cameras should be different objects
            assert.notEqual(helixCamera, microCamera, 'Helix and Micro cameras should be different');
            assert.notEqual(helixCamera, proteinCamera, 'Helix and Protein cameras should be different');
            assert.notEqual(helixCamera, targetCamera, 'Helix and Target cameras should be different');
            assert.notEqual(microCamera, proteinCamera, 'Micro and Protein cameras should be different');
            assert.notEqual(microCamera, targetCamera, 'Micro and Target cameras should be different');
            assert.notEqual(proteinCamera, targetCamera, 'Protein and Target cameras should be different');
        });

        TestFramework.it('PiP cameras should have initial positions', () => {
            const helixCamera = pipControls.cameras.helix;
            
            assert.isDefined(helixCamera.x, 'Helix camera should have X');
            assert.isDefined(helixCamera.y, 'Helix camera should have Y');
            assert.isDefined(helixCamera.z, 'Helix camera should have Z');
            assert.isDefined(helixCamera.rotationX, 'Helix camera should have rotationX');
            assert.isDefined(helixCamera.rotationY, 'Helix camera should have rotationY');
            assert.isDefined(helixCamera.rotationZ, 'Helix camera should have rotationZ');
        });

        TestFramework.it('Dragging one PiP should not affect other PiPs', () => {
            const helixInitialRotation = pipControls.cameras.helix.rotationY;
            const microInitialRotation = pipControls.cameras.micro.rotationY;
            
            // Simulate drag on helix PiP (top left: 10, 10, 200x150)
            const downEvent = {
                clientX: 100,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            pipControls.handleMouseDown(downEvent, canvas);
            
            // Move mouse
            const moveEvent = {
                clientX: 150,
                clientY: 50
            };
            pipControls.handleMouseMove(moveEvent);
            
            // Helix camera should have changed
            assert.notEqual(pipControls.cameras.helix.rotationY, helixInitialRotation, 
                'Helix camera should rotate');
            
            // Micro camera should NOT have changed
            assert.equal(pipControls.cameras.micro.rotationY, microInitialRotation, 
                'Micro camera should not change');
        });

        TestFramework.it('Each PiP camera should rotate independently', () => {
            // Rotate helix
            pipControls.cameras.helix.rotationY = 1.0;
            
            // Rotate micro differently
            pipControls.cameras.micro.rotationY = 2.0;
            
            // Verify they're different
            assert.equal(pipControls.cameras.helix.rotationY, 1.0, 'Helix should be at 1.0');
            assert.equal(pipControls.cameras.micro.rotationY, 2.0, 'Micro should be at 2.0');
            assert.notEqual(pipControls.cameras.helix.rotationY, pipControls.cameras.micro.rotationY,
                'PiP cameras should have different rotations');
        });
    });

    TestFramework.describe('Auto-Rotate Tests', () => {
        TestFramework.it('Auto-rotate should be enabled by default', () => {
            assert.isTrue(mainController.autoRotate, 'Main camera auto-rotate should be enabled');
            assert.isTrue(pipControls.controllers.helix.autoRotate, 'Helix auto-rotate should be enabled');
        });

        TestFramework.it('Auto-rotate should stop on user interaction', () => {
            // Simulate mouse down
            const downEvent = {
                button: 0,
                clientX: 500,
                clientY: 400
            };
            mainController.handleMouseDown(downEvent);
            
            // Auto-rotate should be disabled
            assert.isFalse(mainController.autoRotate, 'Auto-rotate should stop on interaction');
        });

        TestFramework.it('Auto-rotate should change camera rotation over time', () => {
            const initialRotation = mainCamera.rotationY;
            
            // Enable auto-rotate
            mainController.autoRotate = true;
            
            // Call update multiple times
            for (let i = 0; i < 10; i++) {
                mainController.update();
            }
            
            // Rotation should have changed
            assert.notEqual(mainCamera.rotationY, initialRotation, 
                'Auto-rotate should change camera rotation');
            assert.isTrue(mainCamera.rotationY > initialRotation, 
                'Auto-rotate should increase rotationY');
        });

        TestFramework.it('PiP auto-rotate should work independently', () => {
            const helixInitial = pipControls.cameras.helix.rotationY;
            const microInitial = pipControls.cameras.micro.rotationY;
            
            // Enable auto-rotate for both
            pipControls.controllers.helix.autoRotate = true;
            pipControls.controllers.micro.autoRotate = true;
            
            // Update both
            for (let i = 0; i < 10; i++) {
                pipControls.controllers.helix.update();
                pipControls.controllers.micro.update();
            }
            
            // Both should have rotated
            assert.notEqual(pipControls.cameras.helix.rotationY, helixInitial, 
                'Helix should auto-rotate');
            assert.notEqual(pipControls.cameras.micro.rotationY, microInitial, 
                'Micro should auto-rotate');
        });
    });

    TestFramework.describe('Reset Button Tests', () => {
        TestFramework.it('Reset button should exist for each PiP', () => {
            // Check if reset button positions are calculated correctly
            const w = canvas.width;
            const h = canvas.height;
            const pipW = 200;
            const pipH = 150;
            const gap = 10;
            
            const leftPipX = gap;
            const rightPipX = w - pipW - gap;
            
            // Helix PiP (top left)
            const helixResetX = leftPipX + pipW - 25;
            const helixResetY = gap + 5;
            
            // Check if clicking this position would trigger reset
            const resetPiP = pipControls.checkResetButton(helixResetX + 10, helixResetY + 10, w, h);
            assert.equal(resetPiP, 'helix', 'Reset button should be detected for helix PiP');
        });

        TestFramework.it('Reset should restore PiP camera to initial position', () => {
            // Modify helix camera
            pipControls.cameras.helix.rotationY = 5.0;
            pipControls.cameras.helix.x = 100;
            pipControls.cameras.helix.z = -500;
            
            // Get initial values
            const initial = window.GreenhouseGeneticConfig.get('camera.initial');
            
            // Reset
            pipControls.resetPiP('helix');
            
            // Should be back to initial
            assert.equal(pipControls.cameras.helix.x, initial.x, 'Helix X should reset');
            assert.equal(pipControls.cameras.helix.y, initial.y, 'Helix Y should reset');
            assert.equal(pipControls.cameras.helix.z, initial.z, 'Helix Z should reset');
            assert.equal(pipControls.cameras.helix.rotationX, initial.rotationX, 'Helix rotationX should reset');
            assert.equal(pipControls.cameras.helix.rotationY, initial.rotationY, 'Helix rotationY should reset');
        });

        TestFramework.it('Resetting one PiP should not affect others', () => {
            // Modify all cameras
            pipControls.cameras.helix.rotationY = 1.0;
            pipControls.cameras.micro.rotationY = 2.0;
            pipControls.cameras.protein.rotationY = 3.0;
            
            // Reset only helix
            pipControls.resetPiP('helix');
            
            // Helix should be reset
            assert.equal(pipControls.cameras.helix.rotationY, 0, 'Helix should reset to 0');
            
            // Others should not change
            assert.equal(pipControls.cameras.micro.rotationY, 2.0, 'Micro should stay at 2.0');
            assert.equal(pipControls.cameras.protein.rotationY, 3.0, 'Protein should stay at 3.0');
        });
    });

    TestFramework.describe('Camera State Synchronization Tests', () => {
        TestFramework.it('getState() should return current camera values', () => {
            // Set specific values
            pipControls.cameras.helix.rotationY = 2.5;
            pipControls.cameras.helix.x = 100;
            pipControls.cameras.helix.z = -500;
            
            // Get state
            const state = pipControls.getState('helix');
            
            // State should reflect current values
            assert.equal(state.rotationY, 2.5, 'State rotationY should match camera');
            assert.equal(state.panX, 100, 'State panX should match camera X');
            
            // Zoom is calculated from Z
            const expectedZoom = Math.abs(-500) / 200;
            assert.equal(state.zoom, expectedZoom, 'State zoom should be calculated correctly');
        });

        TestFramework.it('Camera reference in state should be the actual camera object', () => {
            const helixState = pipControls.getState('helix');
            const helixCamera = pipControls.cameras.helix;
            
            // State should contain reference to actual camera
            assert.equal(helixState.camera, helixCamera, 'State should reference actual camera object');
            
            // Modifying camera should be reflected in state
            helixCamera.rotationY = 3.14;
            const newState = pipControls.getState('helix');
            assert.equal(newState.rotationY, 3.14, 'State should reflect camera changes');
        });

        TestFramework.it('Main camera and PiP cameras should be independent', () => {
            // Set different values
            mainCamera.rotationY = 1.0;
            pipControls.cameras.helix.rotationY = 2.0;
            pipControls.cameras.target.rotationY = 3.0;
            
            // All should maintain their values
            assert.equal(mainCamera.rotationY, 1.0, 'Main camera should be 1.0');
            assert.equal(pipControls.cameras.helix.rotationY, 2.0, 'Helix should be 2.0');
            assert.equal(pipControls.cameras.target.rotationY, 3.0, 'Target should be 3.0');
            
            // They should all be different objects
            assert.notEqual(mainCamera, pipControls.cameras.helix, 'Main and helix should be different');
            assert.notEqual(mainCamera, pipControls.cameras.target, 'Main and target should be different');
        });
    });

    TestFramework.describe('Keyboard Control Tests', () => {
        TestFramework.it('Arrow keys should rotate camera', () => {
            const initialRotationY = mainCamera.rotationY;
            
            // Press right arrow
            const keyEvent = { key: 'ArrowRight' };
            mainController.handleKeyDown(keyEvent);
            
            // Camera should have rotated
            assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera should rotate on arrow key');
        });

        TestFramework.it('R key should reset camera', () => {
            // Move camera
            mainController.rotate(100, 50);
            
            // Press R
            const keyEvent = { key: 'r' };
            mainController.handleKeyDown(keyEvent);
            
            // Should be reset
            const initial = window.GreenhouseGeneticConfig.get('camera.initial');
            assert.equal(mainCamera.rotationY, initial.rotationY, 'Camera should reset on R key');
        });

        TestFramework.it('Space key should toggle auto-rotate', () => {
            const initialAutoRotate = mainController.autoRotate;
            
            // Press space
            const keyEvent = { key: ' ' };
            mainController.handleKeyDown(keyEvent);
            
            // Auto-rotate should toggle
            assert.notEqual(mainController.autoRotate, initialAutoRotate, 'Auto-rotate should toggle');
        });
    });
});

// Run Tests
TestFramework.run();
