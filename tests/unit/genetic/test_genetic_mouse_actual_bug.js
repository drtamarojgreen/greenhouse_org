(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('ACTUAL BUG: Mouse Control Issues', () => {
        let pipControls;
        let mainCamera;
        let canvas;

        TestFramework.beforeEach(() => {
            canvas = document.createElement('canvas');
            mainCamera = {
                x: 0, y: 0, z: -300,
                rotationX: 0, rotationY: 0, rotationZ: 0,
                fov: 500
            };

            const cameras = [
                mainCamera,
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
            ];

            pipControls = window.GreenhouseGeneticPiPControls;
            pipControls.init(canvas, cameras);
        });

        TestFramework.it('BUG #2: CRITICAL: getState() returns a NEW object, but contains camera reference', () => {
            const helixState = pipControls.getState('helix');
            const helixCamera = pipControls.cameras.helix;

            assert.equal(helixState.camera, helixCamera, 'State should contain camera reference');

            const helixState2 = pipControls.getState('helix');
            assert.notEqual(helixState, helixState2, 'State objects are different');
            assert.equal(helixState.camera, helixState2.camera, 'But camera references are same');
        });

        TestFramework.it('BUG #5: BUG: Auto-rotate should be disabled when user interacts', () => {
            const helixController = pipControls.controllers.helix;
            assert.isTrue(helixController.autoRotate, 'Auto-rotate should be enabled initially');

            pipControls.handleMouseDown({
                clientX: 20,
                clientY: 20,
                button: 0,
                stopPropagation: () => {}
            }, {
                width: 1000, height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            });

            assert.isFalse(helixController.autoRotate, 'Auto-rotate should be disabled after interaction');
        });
    });
})();
