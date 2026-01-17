/**
 * Unit Tests for Genetic PiP Controls
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

// --- Mock Dependencies ---
// Mock Camera Controller
window.GreenhouseGeneticCameraController = class {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;
    }
    handleMouseDown(e) { this.mouseDown = true; }
    handleMouseMove(e) { this.mouseMove = true; }
    handleMouseUp() { this.mouseDown = false; }
    handleWheel(e) { this.wheel = true; }
    update() { this.updated = true; }
    resetCamera() { this.reset = true; }
};

// Mock Config
window.GreenhouseGeneticConfig = {};

// Load Module
loadScript('genetic_pip_controls.js');

// --- Test Suites ---

TestFramework.describe('GreenhouseGeneticPiPControls', () => {
    const pip = window.GreenhouseGeneticPiPControls;

    TestFramework.beforeEach(() => {
        // Reset state
        pip.controllers = {};
        pip.cameras = {};
        pip.activePiP = null;

        const cameras = [
            {}, // Main camera (mock)
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
        ];

        pip.init({}, cameras);
    });

    TestFramework.it('should initialize controllers', () => {
        assert.isDefined(pip.controllers.helix);
        assert.isDefined(pip.controllers.micro);
        assert.isDefined(pip.controllers.protein);
        assert.isDefined(pip.controllers.target);
    });

    TestFramework.it('should detect PiP at position', () => {
        // Layout:
        // Left PiP (Helix): x=10, y=10, w=200, h=150
        // Right PiPs: x=W-210, y=10 (Micro), y=170 (Protein), y=330 (Target)

        const W = 1000;
        const H = 800;

        // Test Helix (Top Left)
        assert.equal(pip.getPiPAtPosition(20, 20, W, H), 'helix');

        // Test Micro (Top Right)
        assert.equal(pip.getPiPAtPosition(W - 100, 20, W, H), 'micro');

        // Test Protein (Middle Right)
        assert.equal(pip.getPiPAtPosition(W - 100, 180, W, H), 'protein');

        // Test Target (Bottom Right)
        assert.equal(pip.getPiPAtPosition(W - 100, 340, W, H), 'target');

        // Test Empty Space
        assert.isNull(pip.getPiPAtPosition(400, 400, W, H));
    });

    TestFramework.it('should handle mouse interaction for all PiP views', () => {
        const canvas = {
            width: 1000,
            height: 800,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
        };
        const W = canvas.width;

        const testCases = [
            { view: 'helix', x: 20, y: 20 },
            { view: 'micro', x: W - 100, y: 20 },
            { view: 'protein', x: W - 100, y: 180 },
            { view: 'target', x: W - 100, y: 340 }
        ];

        testCases.forEach(tc => {
            // Reset mock states before each test case
            Object.values(pip.controllers).forEach(c => {
                c.mouseDown = false;
                c.mouseMove = false;
            });
            pip.activePiP = null;

            // Mouse Down on the view
            let event = { clientX: tc.x, clientY: tc.y, stopPropagation: () => {} };
            pip.handleMouseDown(event, canvas);

            assert.equal(pip.activePiP, tc.view, `Active PiP should be ${tc.view}`);
            assert.isTrue(pip.controllers[tc.view].mouseDown, `Mouse down should be true for ${tc.view}`);

            // Mouse Move
            pip.handleMouseMove({});
            assert.isTrue(pip.controllers[tc.view].mouseMove, `Mouse move should be true for ${tc.view}`);

            // Mouse Up
            pip.handleMouseUp();
            assert.isNull(pip.activePiP, `Active PiP should be null after mouse up for ${tc.view}`);
            assert.isFalse(pip.controllers[tc.view].mouseDown, `Mouse down should be false after mouse up for ${tc.view}`);
        });
    });

    TestFramework.it('should update all controllers', () => {
        pip.update();
        assert.isTrue(pip.controllers.helix.updated);
        assert.isTrue(pip.controllers.micro.updated);
    });

    TestFramework.it('should get state', () => {
        const state = pip.getState('helix');
        assert.isDefined(state);
        assert.isDefined(state.camera);
        assert.equal(state.camera.x, 0);
        assert.equal(state.camera.z, -200);
    });
});

// Run Tests
TestFramework.run();
