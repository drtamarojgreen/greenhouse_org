(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Neuro Page Models', () => {

        // 1. Neuro Config Tests
        TestFramework.describe('GreenhouseNeuroConfig', () => {
            TestFramework.it('should initialize with default values', () => {
                assert.isDefined(window.GreenhouseNeuroConfig);
                const config = window.GreenhouseNeuroConfig;
                assert.isTrue(config.get('camera.controls.autoRotate'));
            });

            TestFramework.it('should get nested configuration values', () => {
                const config = window.GreenhouseNeuroConfig;
                const panSpeed = config.get('camera.controls.panSpeed');
                assert.isNumber(panSpeed);
            });

            TestFramework.it('should set configuration values', () => {
                const config = window.GreenhouseNeuroConfig;
                config.set('ga.mutationRate', 0.5);
                assert.equal(config.get('ga.mutationRate'), 0.5);
            });
        });

        // 2. Neuro Camera Controls Tests
        TestFramework.describe('GreenhouseNeuroCameraControls', () => {
            let controller;
            let mockCamera;
            let mockCanvas;

            TestFramework.beforeEach(() => {
                mockCamera = { x: 0, y: 0, z: -600, rotationX: 0, rotationY: 0, rotationZ: 0 };
                mockCanvas = document.createElement('canvas');
                controller = window.GreenhouseNeuroCameraControls;
                controller.init(mockCanvas, mockCamera, window.GreenhouseNeuroConfig);
            });

            TestFramework.it('should initialize correctly', () => {
                assert.isDefined(controller);
                assert.equal(controller.camera, mockCamera);
                assert.isTrue(controller.config.get('camera.controls.autoRotate'));
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
                assert.equal(mockCamera.rotationX, 0);
                assert.equal(mockCamera.rotationY, 0);
            });

            TestFramework.it('[Bug Hunt] should not result in NaN when zoom is called with undefined', () => {
                const initialZ = mockCamera.z;
                controller.zoom(undefined);
                assert.isTrue(!isNaN(mockCamera.z), "camera.z should not be NaN after zooming with undefined");
            });
        });

        // 4. GreenhouseNeuroApp Tests
        TestFramework.describe('GreenhouseNeuroApp', () => {
            let app;
            let mockGA;
            let mockUI;
            const mockSelector = '#neuro-app-container';

            TestFramework.beforeEach(() => {
                app = window.GreenhouseNeuroApp;

                mockGA = {
                    init: () => {},
                    step: () => {},
                    bestGenome: { fitness: 0 },
                    generation: 0,
                };
                mockUI = {
                    init: () => {},
                    updateData: () => {},
                };

                app.ga = mockGA;
                app.ui = mockUI;

                // Reset app state
                app.isRunning = false;
                app.intervalId = null;
            });

            TestFramework.it('should start simulation and set interval', () => {
                app.startSimulation();
                assert.isTrue(app.isRunning, 'isRunning should be true');
                assert.isDefined(app.intervalId, 'intervalId should be set');
            });

            TestFramework.it('should stop simulation and clear interval', () => {
                app.startSimulation();
                const id = app.intervalId;
                app.stopSimulation();

                assert.isFalse(app.isRunning, 'isRunning should be false');
                assert.isNull(app.intervalId);
            });
        });

    });
})();
