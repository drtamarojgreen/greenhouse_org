(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    const expect = (actual) => ({
        toBeDefined: () => assert.isDefined(actual),
        toBe: (val) => assert.equal(actual, val),
        toBeFalsy: () => assert.isFalse(!!actual),
        toBeTruthy: () => assert.isTrue(!!actual)
    });

    TestFramework.describe('Genetic Main Camera Controller', () => {
        TestFramework.it('should handle dragging state', () => {
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 };
            const controller = new window.GreenhouseGeneticCameraController(camera, window.GreenhouseGeneticConfig);

            expect(controller.isDragging).toBeFalsy();
            controller.handleMouseDown({ button: 0, clientX: 10, clientY: 10 });
            expect(controller.isDragging).toBeTruthy();
            controller.handleMouseUp();
            expect(controller.isDragging).toBeFalsy();
        });
    });
})();
