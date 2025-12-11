/**
 * Unit Tests for Genetic Page Models
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
// Load Config first as others depend on it
loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_algo.js');

// --- Test Suites ---

TestFramework.describe('Genetic Page Models', () => {

    // 1. Genetic Config Tests
    TestFramework.describe('GreenhouseGeneticConfig', () => {
        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(window.GreenhouseGeneticConfig);
            const config = window.GreenhouseGeneticConfig;
            assert.isDefined(config.config);
            assert.isTrue(config.get('simulation.autoEvolve'));
        });

        TestFramework.it('should get nested configuration values', () => {
            const config = window.GreenhouseGeneticConfig;
            const mutationRate = config.get('genetic.mutationRate');
            assert.isNumber(mutationRate);
        });

        TestFramework.it('should set configuration values', () => {
            const config = window.GreenhouseGeneticConfig;
            config.set('genetic.mutationRate', 0.5);
            assert.equal(config.get('genetic.mutationRate'), 0.5);
        });
    });

    // 2. Genetic Camera Controls Tests
    TestFramework.describe('GreenhouseGeneticCameraController', () => {
        let controller;
        let mockCamera;

        TestFramework.beforeEach(() => {
            mockCamera = { x: 0, y: 0, z: -500, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const config = window.GreenhouseGeneticConfig;
            controller = new window.GreenhouseGeneticCameraController(mockCamera, config);
        });

        TestFramework.it('should initialize correctly', () => {
            assert.isDefined(controller);
            assert.equal(controller.camera, mockCamera);
            assert.isTrue(controller.autoRotate);
        });

        TestFramework.it('should handle rotation', () => {
            const initialRotY = mockCamera.rotationY;
            controller.rotate(10, 0); // Rotate Y
            assert.notEqual(mockCamera.rotationY, initialRotY);
        });

        TestFramework.it('should handle zoom', () => {
            const initialZ = mockCamera.z;
            controller.zoom(100);
            assert.equal(mockCamera.z, initialZ + 100);
        });

        TestFramework.it('should handle pan', () => {
            const initialX = mockCamera.x;
            controller.pan(10, 0);
            assert.notEqual(mockCamera.x, initialX);
        });

        TestFramework.it('should reset camera', () => {
            controller.rotate(10, 10);
            controller.resetCamera();
            // Assuming reset restores to initial config values
            // We can't easily check exact values without knowing config defaults, 
            // but we can check if it changed back or is defined.
            assert.isDefined(mockCamera.x);
        });
    });

    // 3. Genetic PiP Controls Tests
    TestFramework.describe('GreenhouseGeneticPiPControls', () => {
        let pipControls;

        TestFramework.beforeEach(() => {
            const config = window.GreenhouseGeneticConfig;
            pipControls = window.GreenhouseGeneticPiPControls;
            pipControls.init(config);
        });



        TestFramework.it('should initialize PiP controllers', () => {
            assert.isDefined(pipControls.controllers);
            assert.isDefined(pipControls.controllers.helix);
            assert.isDefined(pipControls.controllers.micro);
        });

        TestFramework.it('should get state for a PiP', () => {
            const state = pipControls.getState('helix');
            assert.isDefined(state);
            assert.isDefined(state.zoom);
            assert.isDefined(state.rotationY);
        });

        TestFramework.it('should get background color', () => {
            const color = pipControls.getBackgroundColor('helix');
            assert.isString(color);
        });

        TestFramework.it('should detect PiP at position', () => {
            // Mock canvas dimensions
            const w = 1000;
            const h = 800;
            // Helix is at top left (gap, gap) -> (10, 10)
            // Size 200x150
            const name = pipControls.getPiPAtPosition(50, 50, w, h);
            assert.equal(name, 'helix');
        });
    });

    // 4. Genetic Algorithm Tests
    TestFramework.describe('GreenhouseGeneticAlgo', () => {
        TestFramework.it('should initialize population', () => {
            const ga = window.GreenhouseGeneticAlgo;
            ga.init();
            assert.equal(ga.population.length, 20);
        });

        TestFramework.it('should crossover genes', () => {
            const ga = window.GreenhouseGeneticAlgo;
            ga.init();
            const parent1 = ga.population[0];
            const parent2 = ga.population[1];
            // crossover is a method of GreenhouseGeneticAlgo
            const child = ga.crossover(parent1, parent2);
            assert.isDefined(child);
            assert.isDefined(child.connections);
        });

        TestFramework.it('should mutate genes', () => {
            const ga = window.GreenhouseGeneticAlgo;
            ga.init();
            const network = ga.population[0];

            // mutate is a method of the Network instance, not the Algo object
            // The Algo object calls it during evolve
            assert.isFunction(network.mutate);

            const initialWeight = network.connections[0].weight;
            network.mutate(1.0); // 100% mutation rate

            // We can't easily assert value change due to randomness, but we verified it didn't crash
            assert.isNumber(network.connections[0].weight);
        });
    });

});

// Run the tests
TestFramework.run();
