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
    let controller;
    let mockCamera;
    let pipControls;

    TestFramework.beforeEach(() => {
        mockCamera = { x: 0, y: 0, z: -500, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const config = window.GreenhouseGeneticConfig;
        controller = new window.GreenhouseGeneticCameraController(mockCamera, config);

        const cameras = [
            mockCamera, // Main camera
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
        ];

        pipControls = window.GreenhouseGeneticPiPControls;
        pipControls.init(config, cameras);
    });

    TestFramework.it('GreenhouseGeneticConfig: should initialize with default values', () => {
        assert.isDefined(window.GreenhouseGeneticConfig);
        const config = window.GreenhouseGeneticConfig;
        assert.isTrue(config.get('camera.controls.autoRotate'));
    });

    TestFramework.it('GreenhouseGeneticConfig: should get nested configuration values', () => {
        const config = window.GreenhouseGeneticConfig;
        const mutationRate = config.get('ga.mutationRate');
        assert.isNumber(mutationRate);
    });

    TestFramework.it('GreenhouseGeneticConfig: should set configuration values', () => {
        const config = window.GreenhouseGeneticConfig;
        config.set('ga.mutationRate', 0.5);
        assert.equal(config.get('ga.mutationRate'), 0.5);
    });

    TestFramework.it('GreenhouseGeneticCameraController: should initialize correctly', () => {
        assert.isDefined(controller);
        assert.equal(controller.camera, mockCamera);
        assert.isTrue(controller.autoRotate);
    });

    TestFramework.it('GreenhouseGeneticCameraController: should handle rotation', () => {
        const initialRotY = mockCamera.rotationY;
        controller.rotate(10, 0); // Rotate Y
        assert.notEqual(mockCamera.rotationY, initialRotY);
    });

    TestFramework.it('GreenhouseGeneticCameraController: should handle zoom', () => {
        const initialZ = mockCamera.z;
        controller.zoom(100);
        assert.equal(mockCamera.z, initialZ + 100);
    });

    TestFramework.it('GreenhouseGeneticCameraController: should handle pan', () => {
        const initialX = mockCamera.x;
        controller.pan(10, 0);
        assert.notEqual(mockCamera.x, initialX);
    });

    TestFramework.it('GreenhouseGeneticCameraController: should reset camera', () => {
        controller.rotate(10, 10);
        controller.resetCamera();
        assert.isDefined(mockCamera.x);
    });

    TestFramework.it('GreenhouseGeneticPiPControls: should initialize PiP controllers', () => {
        assert.isDefined(pipControls.controllers);
        assert.isDefined(pipControls.controllers.helix);
        assert.isDefined(pipControls.controllers.micro);
    });

    TestFramework.it('GreenhouseGeneticPiPControls: should get state for a PiP', () => {
        const state = pipControls.getState('helix');
        assert.isDefined(state);
        assert.isDefined(state.zoom);
        assert.isDefined(state.rotationY);
    });

    TestFramework.it('GreenhouseGeneticPiPControls: should detect PiP at position', () => {
        const w = 1000;
        const h = 800;
        const name = pipControls.getPiPAtPosition(50, 50, w, h);
        assert.equal(name, 'helix');
    });

    TestFramework.it('GreenhouseGeneticAlgo: should initialize population', () => {
        const ga = window.GreenhouseGeneticAlgo;
        ga.init();
        assert.equal(ga.population.length, 20);
    });

    TestFramework.it('GreenhouseGeneticAlgo: should crossover genes', () => {
        const ga = window.GreenhouseGeneticAlgo;
        ga.init();
        const parent1 = ga.population[0];
        const parent2 = ga.population[1];
        const child = ga.crossover(parent1, parent2);
        assert.isDefined(child);
        assert.isDefined(child.connections);
    });

    TestFramework.it('GreenhouseGeneticAlgo: should mutate genes', () => {
        const ga = window.GreenhouseGeneticAlgo;
        ga.init();
        const network = ga.population[0];
        assert.isFunction(network.mutate);
        const initialWeight = network.connections[0].weight;
        network.mutate(1.0);
        assert.isNumber(network.connections[0].weight);
    });
});

// Run the tests
TestFramework.run();
