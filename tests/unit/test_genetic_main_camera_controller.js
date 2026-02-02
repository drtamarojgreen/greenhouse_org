// tests/unit/test_genetic_main_camera_controller.js
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

TestFramework.run();
