// tests/unit/test_genetic_main_camera_controller.js
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

const expect = (actual) => ({
    toBeDefined: () => assert.isDefined(actual),
    toBe: (val) => assert.equal(actual, val),
    toBeFalsy: () => assert.isFalse(!!actual),
    toBeTruthy: () => assert.isTrue(!!actual)
});

const { describe, it } = TestFramework;

describe('Genetic Main Camera Controller', () => {
    it('should handle dragging state', () => {
        const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);

        expect(controller.isDragging).toBeFalsy();
        controller.handleMouseDown({ button: 0, clientX: 10, clientY: 10 });
        expect(controller.isDragging).toBeTruthy();
        controller.handleMouseUp();
        expect(controller.isDragging).toBeFalsy();
    });
});

if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
