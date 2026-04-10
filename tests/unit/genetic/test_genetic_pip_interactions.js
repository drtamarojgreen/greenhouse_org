(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic PiP Interactions', () => {
        let ui3d;
        let canvas;

        TestFramework.beforeEach(() => {
            ui3d = window.GreenhouseGeneticUI3D;
            canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;

            ui3d.canvas = canvas;
            ui3d.cameras = [
                { x: 0, y: -100, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
                { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
                { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 }
            ];

            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.init(canvas, ui3d.cameras);
            }
        });

        TestFramework.it('should detect mouse over helix PiP', () => {
            const isOver = window.GreenhouseGeneticPiPControls.getPiPAtPosition(
                15, 15, canvas.width, canvas.height
            );
            assert.equal(isOver, 'helix');
        });

        TestFramework.it('should handle mouse drag in helix PiP', () => {
            const initialRotY = ui3d.cameras[1].rotationY;
            const mockEvent = { clientX: 50, clientY: 50, button: 0, stopPropagation: () => {} };

            window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
            window.GreenhouseGeneticPiPControls.handleMouseMove({ clientX: 100, clientY: 50 });
            window.GreenhouseGeneticPiPControls.handleMouseUp();

            assert.notEqual(ui3d.cameras[1].rotationY, initialRotY);
        });

        TestFramework.it('should reset PiP state', () => {
            ui3d.cameras[1].rotationY = 1.5;
            window.GreenhouseGeneticPiPControls.resetPiP('helix');
            assert.equal(ui3d.cameras[1].rotationY, 0);
        });

        TestFramework.it('should verify zoom in PiP via wheel', () => {
            const initialZ = ui3d.cameras[1].z;
            const mockEvent = {
                clientX: 15, clientY: 15,
                deltaY: 100,
                preventDefault: () => {},
                stopPropagation: () => {}
            };

            const handled = window.GreenhouseGeneticPiPControls.handleWheel(mockEvent, canvas);
            assert.equal(handled, true);
            assert.notEqual(ui3d.cameras[1].z, initialZ);
        });
    });
})();
