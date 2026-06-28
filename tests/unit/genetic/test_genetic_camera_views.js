"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
    TestFramework.describe('Genetic Camera Views', () => {
        TestFramework.it('should initialize camera controller', () => {
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);
            assert.isDefined(controller);
            assert.equal(controller.camera, camera);
        });
        TestFramework.it('should verify flyTo transition logic', () => __awaiter(this, void 0, void 0, function* () {
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);
            const target = { x: 100, y: 50, z: -500 };
            let callbackCalled = false;
<<<<<<< HEAD
            // Mock performance.now
            const originalNow = performance.now;
            let currentTime = 1000;
            performance.now = () => currentTime;
=======

            // Mock Date.now since flyTo uses it
            const originalDateNow = Date.now;
            let currentTime = 1000;
            Date.now = () => currentTime;

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
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
<<<<<<< HEAD
            performance.now = originalNow;
        }));
=======

            Date.now = originalDateNow;
        });
>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
    });
})();
