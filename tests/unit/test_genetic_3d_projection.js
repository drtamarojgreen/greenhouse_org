// tests/unit/test_genetic_3d_projection.js
// Unit tests for 3D projection and rendering math

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.HTMLElement = class { };
global.document = {
    body: { appendChild: () => {}, removeChild: () => {} },
    createElement: (tag) => ({
        tag,
        style: {},
        appendChild: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        width: 800, height: 600,
        addEventListener: () => {}
    })
};
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };

function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('genetic_config.js');
loadScript('models_3d_math.js');

const expect = (actual) => ({
    toBeDefined: () => assert.isDefined(actual),
    toBeGreaterThan: (val) => assert.greaterThan(actual, val),
    toBeLessThan: (val) => assert.lessThan(actual, val),
    toBeLessThanOrEqual: (val) => assert.isTrue(actual <= val),
    not: {
        toBe: (val) => assert.notEqual(actual, val),
        toBeLessThan: (val) => assert.isTrue(actual >= val)
    },
    toBe: (val) => assert.equal(actual, val),
    toBeGreaterThanOrEqual: (val) => assert.isTrue(actual >= val)
});

const { describe, it, beforeEach, afterEach } = TestFramework;

describe('Genetic 3D Projection', () => {
    let camera;
    let projection;

    beforeEach(() => {
        camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 };
        projection = { width: 800, height: 600, near: 10, far: 2000 };
    });

    describe('Projection Setup', () => {
        it('should initialize projection parameters', () => {
            expect(projection).toBeDefined();
            expect(projection.width).toBeGreaterThan(0);
            expect(projection.height).toBeGreaterThan(0);
        });

        it('should have near and far clipping planes', () => {
            expect(projection.near).toBeDefined();
            expect(projection.far).toBeDefined();
            expect(projection.far).toBeGreaterThan(projection.near);
        });
    });

    describe('3D to 2D Projection', () => {
        it('should project 3D point to 2D screen space', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: 0 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected).toBeDefined();
                expect(projected.x).toBeDefined();
                expect(projected.y).toBeDefined();
                expect(projected.scale).toBeDefined();
            }
        });

        it('should handle points in front of camera', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -100 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.scale).toBeGreaterThan(0);
            }
        });

        it('should handle points behind camera', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: 100 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.scale).toBeLessThanOrEqual(0);
            }
        });
    });
});

TestFramework.run();
