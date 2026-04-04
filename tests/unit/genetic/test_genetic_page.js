(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

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
            pipControls.init(document.createElement('canvas'), cameras);
        });

        TestFramework.it('GreenhouseGeneticConfig: should initialize with default values', () => {
            assert.isDefined(window.GreenhouseGeneticConfig);
            const config = window.GreenhouseGeneticConfig;
            assert.isTrue(config.get('camera.controls.autoRotate'));
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

        TestFramework.it('GreenhouseGeneticAlgo: should initialize population', () => {
            const ga = window.GreenhouseGeneticAlgo;
            ga.init();
            assert.equal(ga.population.length, 20);
        });
    });
})();
