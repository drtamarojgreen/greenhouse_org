/**
 * Unit Tests for Genetic Mouse Event Flow
 * Simplified tests to diagnose event handling issues
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

TestFramework.describe('Genetic Mouse Event Flow - Simplified', () => {
    let mainController;
    let pipControls;
    let mainCamera;

    TestFramework.beforeEach(() => {
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

        // Initialize PiP controls
        pipControls = window.GreenhouseGeneticPiPControls;
        pipControls.init(window.GreenhouseGeneticConfig);
    });

    TestFramework.describe('Basic Controller Initialization', () => {
        TestFramework.it('should create main camera controller', () => {
            assert.isDefined(mainController, 'Main controller should be defined');
            assert.isDefined(mainController.camera, 'Main controller should have camera');
            assert.equal(mainController.camera.z, -300, 'Camera Z should be -300');
        });

        TestFramework.it('should create PiP controllers', () => {
            assert.isDefined(pipControls.controllers, 'PiP controllers should be defined');
            assert.isDefined(pipControls.controllers.helix, 'Helix controller should exist');
            assert.isDefined(pipControls.controllers.micro, 'Micro controller should exist');
            assert.isDefined(pipControls.controllers.protein, 'Protein controller should exist');
            assert.isDefined(pipControls.controllers.target, 'Target controller should exist');
        });

        TestFramework.it('should have separate camera objects', () => {
            const helixCamera = pipControls.cameras.helix;
            const microCamera = pipControls.cameras.micro;
            
            assert.isDefined(helixCamera, 'Helix camera should exist');
            assert.isDefined(microCamera, 'Micro camera should exist');
            assert.notEqual(helixCamera, microCamera, 'Cameras should be different objects');
            assert.notEqual(helixCamera, mainCamera, 'PiP camera should differ from main');
        });
    });

    TestFramework.describe('PiP Position Detection', () => {
        TestFramework.it('should detect helix PiP at top left', () => {
            const result = pipControls.getPiPAtPosition(100, 50, 1000, 800);
            assert.equal(result, 'helix', 'Should detect helix PiP');
        });

        TestFramework.it('should detect micro PiP at top right', () => {
            const result = pipControls.getPiPAtPosition(900, 50, 1000, 800);
            assert.equal(result, 'micro', 'Should detect micro PiP');
        });

        TestFramework.it('should return null for center area', () => {
            const result = pipControls.getPiPAtPosition(500, 400, 1000, 800);
            assert.isNull(result, 'Should return null for main view area');
        });
    });

    TestFramework.describe('Main Controller Mouse Events', () => {
        TestFramework.it('should handle mouse down', () => {
            const event = { clientX: 100, clientY: 100, button: 0 };
            mainController.handleMouseDown(event);
            
            assert.isTrue(mainController.isDragging, 'Should be dragging');
            assert.equal(mainController.lastX, 100, 'Should store lastX');
            assert.equal(mainController.lastY, 100, 'Should store lastY');
        });

        TestFramework.it('should handle mouse move while dragging', () => {
            const downEvent = { clientX: 100, clientY: 100, button: 0 };
            mainController.handleMouseDown(downEvent);
            
            const initialRotationY = mainCamera.rotationY;
            
            const moveEvent = { clientX: 120, clientY: 110 };
            mainController.handleMouseMove(moveEvent);
            
            assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera should rotate');
        });

        TestFramework.it('should handle mouse up', () => {
            const downEvent = { clientX: 100, clientY: 100, button: 0 };
            mainController.handleMouseDown(downEvent);
            
            mainController.handleMouseUp();
            
            assert.isFalse(mainController.isDragging, 'Should not be dragging');
        });

        TestFramework.it('should handle wheel zoom', () => {
            const initialZ = mainCamera.z;
            const wheelEvent = { deltaY: 100 };
            
            mainController.handleWheel(wheelEvent);
            
            assert.notEqual(mainCamera.z, initialZ, 'Camera Z should change');
        });
    });

    TestFramework.describe('PiP Controller Mouse Events', () => {
        TestFramework.it('should activate PiP on mouse down', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            const event = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            
            pipControls.handleMouseDown(event, canvas);
            
            assert.equal(pipControls.activePiP, 'micro', 'Should activate micro PiP');
        });

        TestFramework.it('should route events to active PiP controller', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            const downEvent = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            
            pipControls.handleMouseDown(downEvent, canvas);
            
            const microController = pipControls.controllers.micro;
            assert.isTrue(microController.isDragging, 'Micro controller should be dragging');
        });

        TestFramework.it('should clear active PiP on mouse up', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            const downEvent = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            
            pipControls.handleMouseDown(downEvent, canvas);
            pipControls.handleMouseUp();
            
            assert.isNull(pipControls.activePiP, 'Active PiP should be cleared');
        });
    });

    TestFramework.describe('Event Isolation', () => {
        TestFramework.it('should not affect main camera when PiP is dragged', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            const initialMainRotation = mainCamera.rotationY;
            
            // Activate PiP
            const downEvent = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            pipControls.handleMouseDown(downEvent, canvas);
            
            // Move mouse
            const moveEvent = { clientX: 920, clientY: 60 };
            pipControls.handleMouseMove(moveEvent);
            
            // Main camera should not change
            assert.equal(mainCamera.rotationY, initialMainRotation, 'Main camera should not rotate');
        });

        TestFramework.it('should not affect PiP cameras when main is dragged', () => {
            const initialMicroRotation = pipControls.cameras.micro.rotationY;
            
            // Drag main camera
            const downEvent = { clientX: 400, clientY: 400, button: 0 };
            mainController.handleMouseDown(downEvent);
            
            const moveEvent = { clientX: 420, clientY: 410 };
            mainController.handleMouseMove(moveEvent);
            
            // PiP camera should not change
            assert.equal(pipControls.cameras.micro.rotationY, initialMicroRotation, 'PiP camera should not rotate');
        });
    });

    TestFramework.describe('Coordinate Scaling', () => {
        TestFramework.it('should scale coordinates correctly', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 400 })
            };
            
            const event = {
                clientX: 450,
                clientY: 25,
                button: 0,
                stopPropagation: () => {}
            };
            
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
            
            assert.equal(mouseX, 900, 'X should scale to 900');
            assert.equal(mouseY, 50, 'Y should scale to 50');
            
            const pip = pipControls.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);
            assert.equal(pip, 'micro', 'Should detect micro PiP with scaled coords');
        });
    });

    TestFramework.describe('Event Flow in genetic_ui_3d.js', () => {
        TestFramework.it('DIAGNOSTIC: PiP should call stopPropagation', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            let stopped = false;
            const event = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => { stopped = true; }
            };
            
            pipControls.handleMouseDown(event, canvas);
            
            assert.isTrue(stopped, 'stopPropagation should be called');
        });

        TestFramework.it('DIAGNOSTIC: Check activePiP blocks main controller', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
            const pipEvent = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };
            
            pipControls.handleMouseDown(pipEvent, canvas);
            
            // In genetic_ui_3d.js, this check should prevent main controller activation
            const shouldBlockMain = pipControls.activePiP !== null;
            
            assert.isTrue(shouldBlockMain, 'activePiP should block main controller');
        });

        TestFramework.it('DIAGNOSTIC: Wheel event should check PiP position', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            
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
            
            assert.isNotNull(pipAtPosition, 'Should detect PiP at wheel position');
        });
    });
});

// Run Tests
TestFramework.run();
