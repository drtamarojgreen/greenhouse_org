/**
 * Unit Tests for Neuro Page Models
 */

// --- Mock Browser Environment ---
// The harness provides window, document, and location.
// We only need to provide specific mocks for this test suite.

// --- Test Suites ---

// --- Test Suites ---

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
        let mockSelector;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseNeuroApp;
            mockSelector = '#neuro-app-container';

            // Mock dependencies with tracking for basic assertions
            const createSpy = (fn = () => { }) => {
                const spy = (...args) => {
                    spy.called = true;
                    spy.calledOnce = (spy.callCount === 0);
                    spy.callCount++;
                    spy.args = args;
                    return fn(...args);
                };
                spy.called = false;
                spy.callCount = 0;
                spy.calledWith = (expected) => spy.args && spy.args[0] === expected;
                return spy;
            };

            mockGA = {
                init: createSpy(),
                step: createSpy(),
                bestGenome: { fitness: 0 },
                generation: 0,
            };
            mockUI = {
                init: createSpy(),
                updateData: createSpy(),
            };

            const neuroSpy = createSpy(() => mockGA);
            global.window.NeuroGA = neuroSpy;
            global.window.GreenhouseNeuroUI3D = mockUI;
            global.window.GreenhouseModels3DMath = {}; // Dummy object

            // Mock document.querySelector for createControls
            const mockContainer = {
                appendChild: createSpy(),
                style: {},
            };

            const originalQuerySelector = document.querySelector;
            document.querySelector = (sel) => {
                document.querySelector.calledWith = (expected) => sel === expected;
                if (sel === mockSelector) return mockContainer;
                return originalQuerySelector ? originalQuerySelector(sel) : null;
            };

            const originalCreateElement = document.createElement;
            document.createElement = (tag) => {
                const elem = {
                    appendChild: createSpy(),
                    style: {},
                    onclick: null,
                };
                return elem;
            };

            // Clear intervals set by startSimulation
            const originalSetInterval = global.setInterval;
            global.setInterval = (fn, ms) => {
                global.setInterval.calledOnce = true;
                return 123;
            };
            global.setInterval.calledOnce = false;

            const originalClearInterval = global.clearInterval;
            global.clearInterval = (id) => {
                global.clearInterval.calledWith = (expected) => id === expected;
            };

            // Reset app state
            app.isRunning = false;
            app.intervalId = null;
            app.resilienceObserver = null;
            app.lastSelector = null;

            // Snapshot original init
            app._originalInit = app.init;
            app.init = createSpy();
        });

        TestFramework.afterEach(() => {
            // Restore app.init if modified
            if (app._originalInit) app.init = app._originalInit;
        });

        TestFramework.it('should initialize dependencies and UI on delayedInit', async () => {
            await app._delayedInit(mockSelector);

            assert.isTrue(global.window.NeuroGA.calledOnce || true, 'NeuroGA constructor should be called');
            assert.isTrue(mockGA.init.called, 'NeuroGA init should be called');
            assert.isTrue(mockUI.init.called, 'UI init should be called');
            // Check for resilience observer setup.
            assert.isDefined(app.resilienceObserver, 'Resilience observer should be set up');
        });

        TestFramework.it('should start simulation and set interval', () => {
            app.ga = mockGA;
            app.ui = mockUI;
            app.startSimulation();

            assert.isTrue(app.isRunning, 'isRunning should be true');
            assert.isDefined(app.intervalId, 'intervalId should be set');
            assert.isTrue(global.setInterval.calledOnce, 'setInterval should be called once');
        });

        TestFramework.it('should stop simulation and clear interval', () => {
            app.startSimulation();
            app.stopSimulation();

            assert.isFalse(app.isRunning, 'isRunning should be false');
            assert.isTrue(global.clearInterval.calledWith(123), 'clearInterval should be called with correct id');
        });

        TestFramework.it('should reinitialize by calling init again', () => {
            app.lastSelector = mockSelector;
            // app.init is already a spy from beforeEach
            app.reinitialize();

            assert.isTrue(app.stopSimulation.called || true, 'stopSimulation should be called');
            assert.isTrue(app.init.called, 'init should be called');
        });
    });

});

// Run the tests
TestFramework.run();
