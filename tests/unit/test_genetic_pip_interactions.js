// tests/unit/test_genetic_pip_interactions.js
// Unit tests for PiP window interactions and controls

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.HTMLElement = class { };
global.document = {
    body: {
        appendChild: () => { },
        removeChild: () => { }
    },
    createElement: (tag) => ({
        tag,
        getContext: () => ({
            save: () => { },
            restore: () => { },
            beginPath: () => { },
            arc: () => { },
            fill: () => { },
            stroke: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            rect: () => { },
            clip: () => { },
            translate: () => { },
            scale: () => { },
            rotate: () => { },
            clearRect: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            createRadialGradient: () => ({ addColorStop: () => { } }),
            closePath: () => { }
        }),
        appendChild: () => { },
        parentNode: { removeChild: () => { } },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        width: 800,
        height: 600,
        style: {},
        addEventListener: () => { },
        removeEventListener: () => { },
        querySelector: () => ({ addEventListener: () => { } }),
        id: ''
    }),
    getElementById: (id) => ({ style: {}, appendChild: () => { }, innerHTML: '', addEventListener: () => { }, textContent: '' }),
    querySelector: () => ({ style: {}, addEventListener: () => { } }),
    addEventListener: () => { }
};
global.cancelAnimationFrame = () => { };
global.requestAnimationFrame = (cb) => { };
global.performance = { now: () => Date.now() };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Mock GreenhouseModels3DMath
global.window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x, y, scale: 1, depth: z })
};

// Load Dependencies
loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_ui_3d.js');

const jasmine = {
    createSpy: (name) => {
        const spy = (...args) => {
            spy.calls.push(args);
            spy.called = true;
        };
        spy.calls = [];
        spy.called = false;
        spy.toHaveBeenCalled = () => assert.isTrue(spy.called, `Expected ${name} to have been called`);
        return spy;
    }
};

TestFramework.describe('Genetic PiP Interactions', () => {
    let ui3d;
    let canvas;

    TestFramework.beforeEach(() => {
        ui3d = window.GreenhouseGeneticUI3D;
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        ui3d.canvas = canvas;
        ui3d.cameras = [
            { x: 0, y: -100, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 }
        ];

        if (window.GreenhouseGeneticPiPControls) {
            window.GreenhouseGeneticPiPControls.init(window.GreenhouseGeneticConfig, ui3d.cameras);
        }
    });

    TestFramework.it('should detect mouse over helix PiP', () => {
        const isOver = window.GreenhouseGeneticPiPControls.getPiPAtPosition(
            15, 15, canvas.width, canvas.height
        );
        assert.equal(isOver, 'helix');
    });

    TestFramework.it('should handle mouse drag in helix PiP', () => {
        const initialRotY = ui3d.cameras[1].rotationY;
        const mockEvent = { clientX: 50, clientY: 50, button: 0, stopPropagation: () => {} };

        window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
        window.GreenhouseGeneticPiPControls.handleMouseMove({ clientX: 100, clientY: 50 });
        window.GreenhouseGeneticPiPControls.handleMouseUp();

        assert.notEqual(ui3d.cameras[1].rotationY, initialRotY);
    });

    TestFramework.it('should reset PiP state', () => {
        ui3d.cameras[1].rotationY = 1.5;
        window.GreenhouseGeneticPiPControls.resetPiP('helix');
        assert.equal(ui3d.cameras[1].rotationY, 0);
    });

    TestFramework.it('should verify zoom in PiP via wheel', () => {
        const initialZ = ui3d.cameras[1].z;
        const mockEvent = {
            clientX: 15, clientY: 15,
            deltaY: 100,
            preventDefault: () => {},
            stopPropagation: () => {}
        };

        const handled = window.GreenhouseGeneticPiPControls.handleWheel(mockEvent, canvas);
        assert.equal(handled, true);
        assert.notEqual(ui3d.cameras[1].z, initialZ);
    });

    TestFramework.it('should check reset button hit detection', () => {
        // Reset button is in top-right corner of PiP
        // helix PiP is at (10, 10, 200, 150)
        // Reset icon is at (10 + 200 - 16 - 4, 10 + 4) = (190, 14)
        const pipName = window.GreenhouseGeneticPiPControls.checkResetButton(
            195, 15, canvas.width, canvas.height
        );
        assert.equal(pipName, 'helix');
    });
});

TestFramework.run();
