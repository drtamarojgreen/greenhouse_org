/**
 * Integration Test for Genetic PiP Event Handling
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
const createMockElement = (tag) => {
    const element = {
        style: {},
        appendChild: () => {},
        querySelector: () => createMockElement(),
        eventHandlers: {},
        addEventListener(event, handler) {
            if (!this.eventHandlers[event]) {
                this.eventHandlers[event] = [];
            }
            this.eventHandlers[event].push(handler);
        },
        getBoundingClientRect() {
            return { left: 0, top: 0, width: this.width || 0, height: this.height || 0 };
        }
    };

    if (tag === 'canvas') {
        element.getContext = () => ({
            clearRect: () => {}, fillRect: () => {}, strokeRect: () => {}, beginPath: () => {},
            moveTo: () => {}, lineTo: () => {}, stroke: () => {}, arc: () => {}, fill: () => {},
            save: () => {}, restore: () => {}, translate: () => {}, fillText: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
        });
        element.width = 1000;
        element.height = 800;
    }

    return element;
};

global.window = global;
global.document = {
    querySelector: () => createMockElement(),
    createElement: (tag) => createMockElement(tag),
    eventHandlers: {} // for window listeners
};

window.addEventListener = (event, handler) => {
    if (!document.eventHandlers[event]) document.eventHandlers[event] = [];
    document.eventHandlers[event].push(handler);
};
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16); // Mock rAF

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Mock Dependencies ---
// Mock Config
window.GreenhouseGeneticConfig = {
    _config: {
        'camera.controls.enablePan': true,
        'camera.controls.enableZoom': true,
        'camera.controls.panSpeed': 0.002,
        'camera.controls.zoomSpeed': 0.1,
    },
    get: function(key) {
        return this._config[key];
    }
};

// Load Modules
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_ui_3d.js'); // This is the module we are testing

// --- Test Suites ---
TestFramework.describe('Genetic UI 3D PiP Integration', () => {

    TestFramework.beforeEach(() => {
        // Reset the environment before each test
        document.eventHandlers = {}; // Clear event handlers

        // Prevent the animation loop from running and causing a timeout
        window.GreenhouseGeneticUI3D.animate = () => {};

        window.GreenhouseGeneticUI3D.mainCameraController = null;
        window.GreenhouseGeneticPiPControls.controllers = {};
        window.GreenhouseGeneticPiPControls.activePiP = null;

        // Mock the initialization process
        const mockContainer = document.createElement('div');
        window.GreenhouseGeneticUI3D.init(mockContainer, {});
        window.GreenhouseGeneticUI3D.resize(); // Ensure canvas has dimensions
    });

    TestFramework.it('should prevent main camera movement when a PiP is active', () => {
        const ui = window.GreenhouseGeneticUI3D;
        const pipControls = window.GreenhouseGeneticPiPControls;

        // Spy on the handleMouseMove methods of both main and PiP controllers
        let mainCameraMoved = false;
        let pipCameraMoved = false;

        ui.mainCameraController.handleMouseMove = () => { mainCameraMoved = true; };
        pipControls.controllers.helix.handleMouseMove = () => { pipCameraMoved = true; };

        // --- Simulate User Action ---

        // 1. Directly call the PiP handler for mousedown to set the active state
        const mouseDownEvent = { clientX: 20, clientY: 20, stopPropagation: () => {} };
        pipControls.handleMouseDown(mouseDownEvent, ui.canvas);

        // Pre-condition check
        assert.equal(pipControls.activePiP, 'helix', 'PiP should be active after direct call to handleMouseDown.');

        // 2. Simulate a global mouse move by calling the main UI's handler
        // This replicates the behavior of the window event listener
        const mouseMoveEvent = { clientX: 30, clientY: 30 };

        // This is the crucial part: we are testing the logic within the 'mousemove' event listener in genetic_ui_3d.js
        // We get the handler from the mocked event listeners and call it directly.
        const mouseMoveHandler = document.eventHandlers.mousemove[0];
        mouseMoveHandler(mouseMoveEvent);

        // --- Assertions ---
        assert.isTrue(pipCameraMoved, 'The active PiP camera controller should have moved.');
        assert.isFalse(mainCameraMoved, 'The main camera controller should NOT have moved while a PiP was active.');
    });
});

// Run Tests
TestFramework.run();
