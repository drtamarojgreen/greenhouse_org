(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic Mouse Event Flow - Simplified', () => {
        let pipControls;
        let mainCamera;

        TestFramework.beforeEach(() => {
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
            pipControls.init(document.createElement('canvas'), cameras);
        });

        TestFramework.it('should create PiP controllers', () => {
            assert.isDefined(pipControls.controllers);
            assert.isDefined(pipControls.controllers.helix);
        });

        TestFramework.it('should detect helix PiP at top left', () => {
            const result = pipControls.getPiPAtPosition(100, 50, 1000, 800);
            assert.equal(result, 'helix', 'Should detect helix PiP');
        });

        TestFramework.it('should activate PiP on mouse down', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };

            const event = {
                clientX: 900,
                clientY: 50,
                button: 0,
                stopPropagation: () => {}
            };

            pipControls.handleMouseDown(event, canvas);
            assert.equal(pipControls.activePiP, 'micro', 'Should activate micro PiP');
        });
    });
})();
