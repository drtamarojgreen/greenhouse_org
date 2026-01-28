/**
 * Unit Tests for Neuro Page Models
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.window.getComputedStyle = () => ({ position: 'relative' });
global.CustomEvent = class { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.MutationObserver = class { constructor() {} observe() {} disconnect() {} };

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
    createElement: (tag) => ({
        getContext: () => ({}),
        addEventListener: () => {},
        style: {},
    })
};
global.addEventListener = () => { };
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Load Dependencies ---
loadScript('GreenhouseUtils.js');
loadScript('GreenhouseBaseApp.js');
loadScript('neuro_config.js');
loadScript('neuro_camera_controls.js');
loadScript('neuro_ga.js');
loadScript('neuro_app.js');

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

            // Mock dependencies
            mockGA = {
                init: TestFramework.sinon.spy(),
                step: TestFramework.sinon.spy(),
                bestGenome: { fitness: 0 },
                generation: 0,
            };
            mockUI = {
                init: TestFramework.sinon.spy(),
                updateData: TestFramework.sinon.spy(),
            };
            
            global.window.NeuroGA = TestFramework.sinon.stub().returns(mockGA);
            global.window.GreenhouseNeuroUI3D = mockUI;
            global.window.GreenhouseModels3DMath = {}; // Dummy object

            // Mock document.querySelector for createControls
            const mockContainer = {
                appendChild: TestFramework.sinon.spy(),
                style: {},
            };
            TestFramework.sinon.stub(document, 'querySelector').withArgs(mockSelector).returns(mockContainer);
            TestFramework.sinon.stub(document, 'createElement').returns({
                appendChild: TestFramework.sinon.spy(),
                style: {},
                onclick: null,
            });

            // Clear intervals set by startSimulation
            TestFramework.sinon.stub(global, 'setInterval').returns(123);
            TestFramework.sinon.stub(global, 'clearInterval');

            // Reset app state
            app.isRunning = false;
            app.intervalId = null;
            app.resilienceObserver = null;
            app.lastSelector = null;
        });

        TestFramework.afterEach(() => {
            TestFramework.sinon.restore();
        });

        TestFramework.it('should initialize dependencies and UI on delayedInit', async () => {
            const mockContainer = document.querySelector(mockSelector);
            await app._delayedInit(mockContainer, mockSelector);

            assert.isTrue(window.NeuroGA.calledOnce, 'NeuroGA constructor should be called once');
            assert.isTrue(mockGA.init.calledOnce, 'NeuroGA init should be called once');
            assert.isTrue(mockUI.init.calledWith(mockSelector), 'UI init should be called with selector');
            assert.isTrue(document.querySelector.calledWith(mockSelector), 'document.querySelector should be called for controls');
            // Check for resilience observer setup.
            assert.isDefined(app.resilienceObserver, 'Resilience observer should be set up');
        });

        TestFramework.it('should start simulation and set interval', () => {
            app.ga = mockGA; // Manually set ga for this test as _delayedInit is not called
            app.ui = mockUI; // Manually set ui for this test
            app.startSimulation();

            assert.isTrue(app.isRunning, 'isRunning should be true');
            assert.isDefined(app.intervalId, 'intervalId should be set');
            assert.isTrue(global.setInterval.calledOnce, 'setInterval should be called once');
        });

        TestFramework.it('should stop simulation and clear interval', () => {
            app.startSimulation(); // Start it first
            app.stopSimulation();

            assert.isFalse(app.isRunning, 'isRunning should be false');
            assert.isTrue(global.clearInterval.calledWith(123), 'clearInterval should be called with correct id');
        });

        TestFramework.it('should reinitialize by calling init again', () => {
            app.lastSelector = mockSelector;
            TestFramework.sinon.stub(app, 'init'); // Mock init itself to prevent recursion
            TestFramework.sinon.spy(app, 'stopSimulation');
            app.reinitialize();

            assert.isTrue(app.stopSimulation.calledOnce, 'stopSimulation should be called');
            assert.isTrue(app.init.calledWith(mockSelector), 'init should be called with the last selector');
        });
    });

});

// Run the tests
TestFramework.run();
