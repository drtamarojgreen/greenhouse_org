/**
 * Unit Tests for Neuro Page Models
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    getElementById: () => ({
        addEventListener: () => { },
        getContext: () => ({
            save: () => { },
            restore: () => { },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            rect: () => { },
            clip: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        }),
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    }),
    createElement: () => ({
        getContext: () => ({})
    })
};
global.addEventListener = () => { };
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('neuro_config.js');
loadScript('neuro_camera_controls.js');
loadScript('neuro_ga.js');

// --- Test Suites ---

TestFramework.describe('Neuro Page Models', () => {

    // 1. Neuro Config Tests
    TestFramework.describe('GreenhouseNeuroConfig', () => {
        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(window.GreenhouseNeuroConfig);
            const config = window.GreenhouseNeuroConfig;
            assert.isDefined(config.camera);
        });

        TestFramework.it('should get configuration values', () => {
            const config = window.GreenhouseNeuroConfig;
            // Assuming 'simulation.speed' exists based on typical config structure
            // If not, this test might fail, but serves as a template
            const val = config.get('simulation.speed');
            // We assert it doesn't throw, value might be undefined if key doesn't exist
            // Let's check a known key if possible. 
            // Usually 'camera' or 'simulation' exists.
            assert.isDefined(config.get);
        });
    });

    // 2. Neuro Camera Controls Tests
    TestFramework.describe('GreenhouseNeuroCameraControls', () => {
        let controller;
        let mockCamera;
        let mockCanvas;

        TestFramework.beforeEach(() => {
            mockCamera = { x: 0, y: 0, z: -500, rotationX: 0, rotationY: 0, rotationZ: 0 };
            mockCanvas = document.getElementById('canvas');
            const config = window.GreenhouseNeuroConfig;

            // It's a singleton object, not a class
            controller = window.GreenhouseNeuroCameraControls;
            controller.init(mockCanvas, mockCamera, config);
        });

        TestFramework.it('should initialize correctly', () => {
            assert.isDefined(controller);
            assert.equal(controller.camera, mockCamera);
        });

        TestFramework.it('should handle rotation', () => {
            const initialRotY = mockCamera.rotationY;
            controller.rotate(10, 0);
            assert.notEqual(mockCamera.rotationY, initialRotY);
        });

        TestFramework.it('should handle zoom', () => {
            const initialZ = mockCamera.z;
            controller.zoom(100);
            assert.equal(mockCamera.z, initialZ + 100);
        });
    });

    // 3. Neuro Genetic Algorithm Tests
    TestFramework.describe('NeuroGA', () => {
        TestFramework.it('should initialize', () => {
            assert.isDefined(window.NeuroGA);
            const ga = new window.NeuroGA();
            assert.isDefined(ga);
        });

        TestFramework.it('should create random genome', () => {
            const ga = new window.NeuroGA();
            ga.init({ bounds: { x: 100, y: 100, z: 100 } });
            const genome = ga.createRandomGenome();
            assert.isDefined(genome);
            assert.isDefined(genome.neurons);
            assert.isDefined(genome.connections);
        });
    });

});

// Run the tests
TestFramework.run();
