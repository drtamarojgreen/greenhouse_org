// tests/unit/test_genetic_main_camera_controller.js
const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

global.HTMLElement = class { };

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
