// tests/unit/test_genetic_camera_views.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

global.window = global;
global.HTMLElement = class { };
global.document = {
    createElement: (tag) => ({
        tag, style: {}, appendChild: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }), addEventListener: () => {}
    })
};

function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');

const { describe, it } = TestFramework;

describe('Genetic Camera Views', () => {
    it('should initialize camera controller', () => {
        const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);
        assert.isDefined(controller);
        assert.equal(controller.camera, camera);
    });

    it('should verify flyTo transition logic', () => {
        const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);

        const target = { x: 100, y: 50, z: -500 };
        let callbackCalled = false;

        // Mock Date.now
        const originalNow = Date.now;
        let currentTime = 1000;
        Date.now = () => currentTime;

        controller.flyTo(target, 1000, () => { callbackCalled = true; });

        assert.isTrue(controller.isTransitioning);

        // Update halfway
        currentTime += 500;
        controller.update();
        assert.greaterThan(camera.x, 0);
        assert.lessThan(camera.x, 100);

        // Finalize
        currentTime += 500;
        controller.update();
        assert.equal(camera.x, 100);
        assert.equal(camera.y, 50);
        assert.equal(camera.z, -500);
        assert.isFalse(controller.isTransitioning);
        assert.isTrue(callbackCalled);

        Date.now = originalNow;
    });
});

TestFramework.run();
