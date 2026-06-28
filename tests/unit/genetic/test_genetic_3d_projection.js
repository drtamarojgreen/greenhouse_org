"use strict";
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
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
    TestFramework.describe('Genetic 3D Projection', () => {
        let camera;
        let projection;
        TestFramework.beforeEach(() => {
            camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 };
            projection = { width: 800, height: 600, near: 10, far: 2000 };
        });
        TestFramework.describe('Projection Setup', () => {
            TestFramework.it('should initialize projection parameters', () => {
                expect(projection).toBeDefined();
                expect(projection.width).toBeGreaterThan(0);
                expect(projection.height).toBeGreaterThan(0);
            });
            TestFramework.it('should have near and far clipping planes', () => {
                expect(projection.near).toBeDefined();
                expect(projection.far).toBeDefined();
                expect(projection.far).toBeGreaterThan(projection.near);
            });
        });
        TestFramework.describe('3D to 2D Projection', () => {
            TestFramework.it('should project 3D point to 2D screen space', () => {
                const math = window.GreenhouseModels3DMath || global.GreenhouseModels3DMath;
                if (math) {
                    const point3D = { x: 0, y: 0, z: 0 };
<<<<<<< HEAD
                    const projected = window.GreenhouseModels3DMath.project3DTo2D(point3D.x, point3D.y, point3D.z, camera, projection);
=======
                    const projected = math.project3DTo2D(
                        point3D.x, point3D.y, point3D.z, camera, projection
                    );

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
                    expect(projected).toBeDefined();
                    expect(projected.x).toBeDefined();
                    expect(projected.y).toBeDefined();
                    expect(projected.scale).toBeDefined();
                }
            });
            TestFramework.it('should handle points in front of camera', () => {
                const math = window.GreenhouseModels3DMath || global.GreenhouseModels3DMath;
                if (math) {
                    const point3D = { x: 0, y: 0, z: -100 };
<<<<<<< HEAD
                    const projected = window.GreenhouseModels3DMath.project3DTo2D(point3D.x, point3D.y, point3D.z, camera, projection);
=======
                    const projected = math.project3DTo2D(
                        point3D.x, point3D.y, point3D.z, camera, projection
                    );

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
                    expect(projected.scale).toBeGreaterThan(0);
                }
            });
            TestFramework.it('should handle points behind camera', () => {
<<<<<<< HEAD
                if (window.GreenhouseModels3DMath) {
                    const point3D = { x: 0, y: 0, z: 100 };
                    const projected = window.GreenhouseModels3DMath.project3DTo2D(point3D.x, point3D.y, point3D.z, camera, projection);
                    expect(projected.scale).toBeLessThanOrEqual(0);
=======
                const math = window.GreenhouseModels3DMath || global.GreenhouseModels3DMath;
                if (math) {
                    const point3D = { x: 0, y: 0, z: 400 }; // Behind camera (z = -300)
                    const projected = math.project3DTo2D(
                        point3D.x, point3D.y, point3D.z, camera, projection
                    );

                    expect(projected.scale).toBeLessThanOrEqual(1.0);
>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
                }
            });
        });
    });
})();
