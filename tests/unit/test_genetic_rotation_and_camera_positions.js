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

        // Initialize PiP Controls
        if (window.GreenhouseGeneticPiPControls) {
            pipControls = window.GreenhouseGeneticPiPControls;
            const cameras = [
                mainCamera,
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
            ];
            pipControls.init(window.GreenhouseGeneticConfig, cameras);
        }
    });

    TestFramework.it('Initial camera position should match config', () => {
        const initial = window.GreenhouseGeneticConfig.get('camera.initial');
        assert.equal(mainCamera.x, initial.x, 'Camera X should be 0');
        assert.equal(mainCamera.y, initial.y, 'Camera Y should be 0');
        assert.equal(mainCamera.z, initial.z, 'Camera Z should be -300');
        assert.equal(mainCamera.rotationX, initial.rotationX, 'Rotation X should be 0');
        assert.equal(mainCamera.rotationY, initial.rotationY, 'Rotation Y should be 0');
        assert.equal(mainCamera.rotationZ, initial.rotationZ, 'Rotation Z should be 0');
    });

    TestFramework.it('Camera rotation should change after mouse drag', () => {
        const initialRotationY = mainCamera.rotationY;
        const downEvent = { button: 0, clientX: 500, clientY: 400 };
        mainController.handleMouseDown(downEvent);
        const moveEvent = { clientX: 600, clientY: 400 };
        mainController.handleMouseMove(moveEvent);
        assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera rotationY should change');
        assert.isTrue(mainCamera.rotationY > initialRotationY, 'Camera should rotate right (positive Y)');
    });

    TestFramework.it('Camera position should change after pan', () => {
        const initialX = mainCamera.x;
        const initialY = mainCamera.y;
        const downEvent = { button: 2, clientX: 500, clientY: 400 };
        mainController.handleMouseDown(downEvent);
        const moveEvent = { clientX: 550, clientY: 450 };
        mainController.handleMouseMove(moveEvent);
        assert.notEqual(mainCamera.x, initialX, 'Camera X should change');
        assert.notEqual(mainCamera.y, initialY, 'Camera Y should change');
    });

    TestFramework.it('Camera zoom should change after wheel event', () => {
        const initialZ = mainCamera.z;
        const wheelEvent = { deltaY: -100 };
        mainController.handleWheel(wheelEvent);
        assert.notEqual(mainCamera.z, initialZ, 'Camera Z should change');
        assert.isTrue(mainCamera.z > initialZ, 'Camera should zoom in (Z less negative)');
    });

    TestFramework.it('Camera should respect zoom limits', () => {
        const minZoom = window.GreenhouseGeneticConfig.get('camera.controls.minZoom');
        const maxZoom = window.GreenhouseGeneticConfig.get('camera.controls.maxZoom');
        mainController.zoom(-10000);
        assert.isTrue(mainCamera.z >= minZoom, 'Camera should not zoom past minZoom');
        mainController.zoom(10000);
        assert.isTrue(mainCamera.z <= maxZoom, 'Camera should not zoom past maxZoom');
    });

    TestFramework.it('Reset camera should restore initial position', () => {
        mainController.rotate(100, 50);
        mainController.pan(100, 100);
        mainController.zoom(200);
        mainController.resetCamera();
        const initial = window.GreenhouseGeneticConfig.get('camera.initial');
        assert.equal(mainCamera.x, initial.x, 'Camera X should reset');
        assert.equal(mainCamera.y, initial.y, 'Camera Y should reset');
        assert.equal(mainCamera.z, initial.z, 'Camera Z should reset');
        assert.equal(mainCamera.rotationX, initial.rotationX, 'Rotation X should reset');
        assert.equal(mainCamera.rotationY, initial.rotationY, 'Rotation Y should reset');
    });

    TestFramework.it('Each PiP should have independent camera', () => {
        const helixCamera = pipControls.cameras.helix;
        const microCamera = pipControls.cameras.micro;
        assert.notEqual(helixCamera, microCamera, 'Helix and Micro cameras should be different');
    });

    TestFramework.it('PiP cameras should have initial positions', () => {
        const helixCamera = pipControls.cameras.helix;
        assert.isDefined(helixCamera.x, 'Helix camera should have X');
    });

    TestFramework.it('Dragging one PiP should not affect other PiPs', () => {
        const helixInitialRotation = pipControls.cameras.helix.rotationY;
        const microInitialRotation = pipControls.cameras.micro.rotationY;
        const downEvent = { clientX: 100, clientY: 50, button: 0, stopPropagation: () => {} };
        pipControls.handleMouseDown(downEvent, canvas);
        const moveEvent = { clientX: 150, clientY: 50 };
        pipControls.handleMouseMove(moveEvent);
        assert.notEqual(pipControls.cameras.helix.rotationY, helixInitialRotation, 'Helix camera should rotate');
        assert.equal(pipControls.cameras.micro.rotationY, microInitialRotation, 'Micro camera should not change');
    });

    TestFramework.it('Each PiP camera should rotate independently', () => {
        pipControls.cameras.helix.rotationY = 1.0;
        pipControls.cameras.micro.rotationY = 2.0;
        assert.equal(pipControls.cameras.helix.rotationY, 1.0, 'Helix should be at 1.0');
        assert.equal(pipControls.cameras.micro.rotationY, 2.0, 'Micro should be at 2.0');
    });

    TestFramework.it('Auto-rotate should be enabled by default', () => {
        assert.isTrue(mainController.autoRotate, 'Main camera auto-rotate should be enabled');
        assert.isTrue(pipControls.controllers.helix.autoRotate, 'Helix auto-rotate should be enabled');
    });

    TestFramework.it('Auto-rotate should stop on user interaction', () => {
        const downEvent = { button: 0, clientX: 500, clientY: 400 };
        mainController.handleMouseDown(downEvent);
        assert.isFalse(mainController.autoRotate, 'Auto-rotate should stop on interaction');
    });

    TestFramework.it('Auto-rotate should change camera rotation over time', () => {
        const initialRotation = mainCamera.rotationY;
        mainController.autoRotate = true;
        for (let i = 0; i < 10; i++) mainController.update();
        assert.notEqual(mainCamera.rotationY, initialRotation, 'Auto-rotate should change camera rotation');
    });

    TestFramework.it('PiP auto-rotate should work independently', () => {
        const helixInitial = pipControls.cameras.helix.rotationY;
        const microInitial = pipControls.cameras.micro.rotationY;
        pipControls.controllers.helix.autoRotate = true;
        pipControls.controllers.micro.autoRotate = true;
        for (let i = 0; i < 10; i++) {
            pipControls.controllers.helix.update();
            pipControls.controllers.micro.update();
        }
        assert.notEqual(pipControls.cameras.helix.rotationY, helixInitial, 'Helix should auto-rotate');
        assert.notEqual(pipControls.cameras.micro.rotationY, microInitial, 'Micro should auto-rotate');
    });

    TestFramework.it('Reset button should exist for each PiP', () => {
        const w = canvas.width;
        const h = canvas.height;
        const resetPiP = pipControls.checkResetButton(w - 210 + 200 - 25 + 10, 10 + 5 + 10, w, h);
        assert.equal(resetPiP, 'micro', 'Reset button should be detected for micro PiP');
    });

    TestFramework.it('Reset should restore PiP camera to initial position', () => {
        pipControls.cameras.helix.rotationY = 5.0;
        pipControls.resetPiP('helix');
        const initial = window.GreenhouseGeneticConfig.get('camera.initial');
        assert.equal(pipControls.cameras.helix.rotationY, initial.rotationY, 'Helix rotationY should reset');
    });

    TestFramework.it('Resetting one PiP should not affect others', () => {
        pipControls.cameras.helix.rotationY = 1.0;
        pipControls.cameras.micro.rotationY = 2.0;
        pipControls.resetPiP('helix');
        assert.equal(pipControls.cameras.helix.rotationY, 0, 'Helix should reset to 0');
        assert.equal(pipControls.cameras.micro.rotationY, 2.0, 'Micro should stay at 2.0');
    });

    TestFramework.it('getState() should return current camera values', () => {
        pipControls.cameras.helix.rotationY = 2.5;
        const state = pipControls.getState('helix');
        assert.equal(state.rotationY, 2.5, 'State rotationY should match camera');
    });

    TestFramework.it('Camera reference in state should be the actual camera object', () => {
        const helixState = pipControls.getState('helix');
        const helixCamera = pipControls.cameras.helix;
        assert.equal(helixState.camera, helixCamera, 'State should reference actual camera object');
    });

    TestFramework.it('Main camera and PiP cameras should be independent', () => {
        mainCamera.rotationY = 1.0;
        pipControls.cameras.helix.rotationY = 2.0;
        assert.equal(mainCamera.rotationY, 1.0, 'Main camera should be 1.0');
        assert.equal(pipControls.cameras.helix.rotationY, 2.0, 'Helix should be 2.0');
    });

    TestFramework.it('Arrow keys should rotate camera', () => {
        const initialRotationY = mainCamera.rotationY;
        const keyEvent = { key: 'ArrowRight' };
        mainController.handleKeyDown(keyEvent);
        assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera should rotate on arrow key');
    });

    TestFramework.it('R key should reset camera', () => {
        mainController.rotate(100, 50);
        const keyEvent = { key: 'r' };
        mainController.handleKeyDown(keyEvent);
        const initial = window.GreenhouseGeneticConfig.get('camera.initial');
        assert.equal(mainCamera.rotationY, initial.rotationY, 'Camera should reset on R key');
    });

    TestFramework.it('Space key should toggle auto-rotate', () => {
        const initialAutoRotate = mainController.autoRotate;
        const keyEvent = { key: ' ' };
        mainController.handleKeyDown(keyEvent);
        assert.notEqual(mainController.autoRotate, initialAutoRotate, 'Auto-rotate should toggle');
    });
});

// Run Tests
TestFramework.run();
