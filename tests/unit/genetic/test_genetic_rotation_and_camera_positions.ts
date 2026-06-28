(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Camera Position and Rotation Tests', () => {
        let mainController;
        let pipControls;
        let mainCamera;
        let canvas;

        TestFramework.beforeEach(() => {
            canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 800;

            mainCamera = {
                x: 0, y: 0, z: -300,
                rotationX: 0, rotationY: 0, rotationZ: 0,
                fov: 500
            };

            mainController = new window.GreenhouseGeneticCameraController(
                mainCamera,
                window.GreenhouseGeneticConfig
            );

            pipControls = window.GreenhouseGeneticPiPControls;
            const cameras = [
                mainCamera,
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
            ];
            pipControls.init(canvas, cameras);
        });

        TestFramework.it('Initial camera position should match config', () => {
            const initial = window.GreenhouseGeneticConfig.get('camera.initial');
            assert.equal(mainCamera.z, initial.z, 'Camera Z should be -300');
        });

        TestFramework.it('Camera rotation should change after mouse drag', () => {
            const initialRotationY = mainCamera.rotationY;
            mainController.handleMouseDown({ button: 0, clientX: 500, clientY: 400 });
            mainController.handleMouseMove({ clientX: 600, clientY: 400 });
            assert.notEqual(mainCamera.rotationY, initialRotationY, 'Camera rotationY should change');
        });

        TestFramework.it('Each PiP should have independent camera', () => {
            const helixCamera = pipControls.cameras.helix;
            const microCamera = pipControls.cameras.micro;
            assert.notEqual(helixCamera, microCamera, 'Helix and Micro cameras should be different');
        });

        TestFramework.it('getState() should return current camera values', () => {
            pipControls.cameras.helix.rotationY = 2.5;
            const state = pipControls.getState('helix');
            assert.equal(state.rotationY, 2.5, 'State rotationY should match camera');
        });
    });
})();
