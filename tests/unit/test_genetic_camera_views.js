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

const expect = (actual) => ({
    toBeDefined: () => assert.isDefined(actual),
    toBe: (val) => assert.equal(actual, val)
});

const { describe, it } = TestFramework;

describe('Genetic Camera Views', () => {
    it('should initialize camera controller', () => {
        const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
        const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);
        expect(controller).toBeDefined();
        expect(controller.camera).toBe(camera);
    });
});

TestFramework.run();
