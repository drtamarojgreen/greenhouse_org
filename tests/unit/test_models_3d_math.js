/**
 * @file test_models_3d_math.js
 * @description Unit tests for the 3D Mathematics Foundation.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/models_3d_math.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseModels3DMath', () => {

    const Math3D = global.window.GreenhouseModels3DMath;

    TestFramework.describe('Basic Translations & Conversions', () => {
        TestFramework.it('should convert degrees to radians', () => {
            assert.equal(Math3D.degToRad(180), Math.PI);
            assert.equal(Math3D.degToRad(90), Math.PI / 2);
        });

        TestFramework.it('should convert radians to degrees', () => {
            assert.equal(Math3D.radToDeg(Math.PI), 180);
            assert.equal(Math3D.radToDeg(Math.PI / 2), 90);
        });

        TestFramework.it('should interpolate between points (lerp3D)', () => {
            const start = { x: 0, y: 0, z: 0 };
            const end = { x: 10, y: 20, z: 30 };
            const mid = Math3D.lerp3D(start, end, 0.5);
            assert.deepEqual(mid, { x: 5, y: 10, z: 15 });
        });
    });

    TestFramework.describe('3D Rotations', () => {
        TestFramework.it('should rotate a point around X axis', () => {
            const point = { x: 0, y: 10, z: 0 };
            const rotated = Math3D.rotatePoint3D(point, Math.PI / 2, 0, 0);
            // After 90 deg rotation around X, Y(10) becomes Z(10)
            assert.lessThan(Math.abs(rotated.y), 0.0001);
            assert.lessThan(Math.abs(rotated.z - 10), 0.0001);
        });

        TestFramework.it('should rotate a point around Y axis', () => {
            const point = { x: 10, y: 0, z: 0 };
            const rotated = Math3D.rotatePoint3D(point, 0, Math.PI / 2, 0);
            // After 90 deg rotation around Y, X(10) becomes Z(-10)
            assert.lessThan(Math.abs(rotated.x), 0.0001);
            assert.lessThan(Math.abs(rotated.z + 10), 0.0001);
        });
    });

    TestFramework.describe('Perspective Projection', () => {
        const camera = { x: 0, y: 0, z: -500, fov: 500 };
        const projection = { width: 800, height: 600, near: 10, far: 5000 };

        TestFramework.it('should project a centered point to the center of screen', () => {
            const result = Math3D.project3DTo2D(0, 0, 0, camera, projection);
            assert.equal(result.x, 400); // center X
            assert.equal(result.y, 300); // center Y
            assert.equal(result.scale, 1); // scale at distance = fov
        });

        TestFramework.it('should scale objects smaller as they move further away', () => {
            const near = Math3D.project3DTo2D(0, 0, 0, camera, projection);
            const far = Math3D.project3DTo2D(0, 0, 500, camera, projection);
            assert.lessThan(far.scale, near.scale);
        });

        TestFramework.it('should handle camera rotation during projection', () => {
            const cameraWithRot = { ...camera, rotationY: Math.PI / 2 };
            const point = { x: 100, y: 0, z: 0 };
            const result = Math3D.project3DTo2D(point.x, point.y, point.z, cameraWithRot, projection);
            // Rotating camera 90 deg Y means the point at X:100 is now behind or centered depending on rotation dir
            // The check is that it doesn't crash and changes coordinates
            assert.notEqual(result.x, 400);
        });
    });

    TestFramework.describe('Scene Management', () => {
        TestFramework.it('should sort objects by depth (back-to-front)', () => {
            const camera = { x: 0, y: 0, z: -500 };
            const objects = [
                { id: 'near', x: 0, y: 0, z: 0 },
                { id: 'far', x: 0, y: 0, z: 1000 },
                { id: 'mid', x: 0, y: 0, z: 500 }
            ];
            const sorted = Math3D.sortByDepth(objects, camera);
            assert.equal(sorted[0].id, 'far');
            assert.equal(sorted[1].id, 'mid');
            assert.equal(sorted[2].id, 'near');
        });

        TestFramework.it('should calculate surface normals', () => {
            const p1 = { x: 0, y: 0, z: 0 };
            const p2 = { x: 1, y: 0, z: 0 };
            const p3 = { x: 0, y: 1, z: 0 };
            const normal = Math3D.calculateNormal(p1, p2, p3);
            // Triangle in XY plane should have normal on Z axis
            assert.equal(normal.x, 0);
            assert.equal(normal.y, 0);
            assert.equal(normal.z, 1);
        });

        TestFramework.it('should calculate diffuse lighting', () => {
            const normal = { x: 0, y: 0, z: 1 };
            const lightDir = { x: 0, y: 0, z: -1 }; // Light pointing towards surface
            const brightness = Math3D.calculateDiffuse(normal, lightDir, 0.1);
            assert.greaterThan(brightness, 0.9); // Should be near full bright
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
