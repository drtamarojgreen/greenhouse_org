(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseModels3DMath (Unit)', () => {
        TestFramework.it('should project 3D to 2D correctly', () => {
            const camera = { x: 0, y: 0, z: -500, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 };
            const projection = { width: 800, height: 600, near: 10, far: 2000 };
            const p = window.GreenhouseModels3DMath.project3DTo2D(100, 100, 0, camera, projection);
            assert.isDefined(p.x);
            assert.isDefined(p.y);
            assert.greaterThan(p.scale, 0);
        });
    });
})();
