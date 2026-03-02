/**
 * Unit Tests for Neuro Page Models
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    // If running in harness with pre-initialized state
    if (typeof window !== 'undefined' && window.GreenhouseNeuroConfig) {
        return window;
    }

    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => Date.now() },
        requestAnimationFrame: (cb) => setTimeout(cb, 16),
        addEventListener: () => { },
        document: {
            getElementById: (id) => ({
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
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                getContext: () => ({})
            })
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['neuro_config.js', 'neuro_camera_controls.js', 'neuro_ga.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('Neuro Page Models', () => {

    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();
    });

    TestFramework.describe('GreenhouseNeuroConfig', () => {
        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(env.window.GreenhouseNeuroConfig);
            const config = env.window.GreenhouseNeuroConfig;
            assert.isDefined(config.camera);
        });

        TestFramework.it('should get configuration values', () => {
            const config = env.window.GreenhouseNeuroConfig;
            assert.isDefined(config.get);
        });
    });

    TestFramework.describe('GreenhouseNeuroCameraControls', () => {
        let controller;
        let mockCamera;
        let mockCanvas;

        TestFramework.beforeEach(() => {
            mockCamera = { x: 0, y: 0, z: -500, rotationX: 0, rotationY: 0, rotationZ: 0 };
            mockCanvas = env.document.getElementById('canvas');
            const config = env.window.GreenhouseNeuroConfig;
            controller = env.window.GreenhouseNeuroCameraControls;
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

    TestFramework.describe('NeuroGA', () => {
        TestFramework.it('should initialize', () => {
            assert.isDefined(env.window.NeuroGA);
            const ga = new env.window.NeuroGA();
            assert.isDefined(ga);
        });

        TestFramework.it('should create random genome', () => {
            const ga = new env.window.NeuroGA();
            ga.init({ bounds: { x: 100, y: 100, z: 100 } });
            const genome = ga.createRandomGenome();
            assert.isDefined(genome);
            assert.isDefined(genome.neurons);
            assert.isDefined(genome.connections);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
