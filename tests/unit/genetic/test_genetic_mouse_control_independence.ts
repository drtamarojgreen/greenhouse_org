(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mouse Control Independence - Main Window vs PiP', () => {
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

        TestFramework.it('Event Propagation: should stop propagation when clicking on PiP', () => {
            let propagationStopped = false;
            const event = {
                clientX: 900,
                clientY: 20,
                button: 0,
                stopPropagation: () => { propagationStopped = true; },
                preventDefault: () => {}
            };

            pipControls.handleMouseDown(event, {
                width: 1000, height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            });

            assert.isTrue(propagationStopped, 'Event propagation should be stopped when clicking on PiP');
            assert.isNotNull(pipControls.activePiP, 'PiP should be active');
        });

        TestFramework.it('PiP Position Detection: should correctly identify helix PiP (top left)', () => {
            const pip = pipControls.getPiPAtPosition(100, 50, 1000, 800);
            assert.equal(pip, 'helix', 'Should detect helix PiP at top left');
        });

        TestFramework.it('Camera State Isolation: should maintain separate camera states for each PiP', () => {
            const helixState = pipControls.getState('helix');
            const microState = pipControls.getState('micro');

            assert.isDefined(helixState.camera);
            assert.isDefined(microState.camera);
            assert.notEqual(helixState.camera, microState.camera, 'Helix and Micro should have different cameras');
        });
    });
})();
