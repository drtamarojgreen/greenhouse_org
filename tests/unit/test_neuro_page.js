/**
 * Unit Tests for Neuro Page Models
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const { createEnv, loadScript } = require('../utils/test_env_factory.js');

TestFramework.describe('Neuro Page Models', () => {

    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();
        loadScript(env, 'docs/js/neuro_config.js');
        loadScript(env, 'docs/js/neuro_camera_controls.js');
        loadScript(env, 'docs/js/neuro_ga.js');
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
