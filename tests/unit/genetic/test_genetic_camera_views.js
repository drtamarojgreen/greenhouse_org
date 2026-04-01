(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic Camera Views', () => {
        TestFramework.it('should initialize camera controller', () => {
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);
            assert.isDefined(controller);
            assert.equal(controller.camera, camera);
        });

        TestFramework.it('should verify flyTo transition logic', async () => {
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);

            const target = { x: 100, y: 50, z: -500 };
            let callbackCalled = false;

            // Mock performance.now
            const originalNow = performance.now;
            let currentTime = 1000;
            performance.now = () => currentTime;

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

            performance.now = originalNow;
        });
    });
})();
