// tests/unit/test_genetic_camera_views.js
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && (window.location.hostname || window.location.port);

const fs = !isBrowser ? require('fs') : null;
const path = !isBrowser ? require('path') : null;
const vm = !isBrowser ? require('vm') : null;
const { assert } = !isBrowser ? require('../../utils/assertion_library.js') : { assert: window.assert };
const TestFramework = !isBrowser ? require('../../utils/test_framework.js') : window.TestFramework;

if (!isBrowser) {
global.window = global;
global.HTMLElement = class { };
global.document = {
    createElement: (tag) => ({
        tag, style: {}, appendChild: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }), addEventListener: () => {}
    })
};
}

function loadScript(filename) {
    if (isBrowser) {
        if (filename.includes('genetic_config.js') && window.GreenhouseGeneticConfig) return;
        if (filename.includes('genetic_camera_controls.js') && window.GreenhouseGeneticCameraController) return;
    }
    if (!isBrowser) {
        const filePath = path.join(__dirname, '../../../docs/js', filename);
        const code = fs.readFileSync(filePath, 'utf8');
        vm.runInThisContext(code);
    }
}

loadScript('genetic/genetic_config.js');
loadScript('genetic/genetic_camera_controls.js');

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

if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
