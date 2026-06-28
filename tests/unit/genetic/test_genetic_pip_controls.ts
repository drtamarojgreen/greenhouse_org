(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseGeneticPiPControls', () => {
        const pip = window.GreenhouseGeneticPiPControls;

        TestFramework.beforeEach(() => {
            // Save original if needed, but here we just reset state
            pip.controllers = {};
            pip.cameras = {};
            pip.activePiP = null;

            const cameras = [
                {}, // Main camera
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
            ];

            const canvas = document.createElement('canvas');
            pip.init(canvas, cameras);
        });

        TestFramework.it('should initialize controllers', () => {
            assert.isDefined(pip.controllers.helix);
            assert.isDefined(pip.controllers.micro);
            assert.isDefined(pip.controllers.protein);
            assert.isDefined(pip.controllers.target);
        });

        TestFramework.it('should detect PiP at position', () => {
            const W = 1000;
            const H = 800;

            // Test Helix (Top Left)
            assert.equal(pip.getPiPAtPosition(20, 20, W, H), 'helix');

            // Test Micro (Top Right)
            assert.equal(pip.getPiPAtPosition(W - 100, 20, W, H), 'micro');

            // Test Empty Space
            assert.isNull(pip.getPiPAtPosition(400, 400, W, H));
        });

        TestFramework.it('should handle mouse interaction for PiP views', () => {
            const canvas = {
                width: 1000,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
            };
            const W = canvas.width;

            // Mouse Down on Helix
            let event = { clientX: 20, clientY: 20, stopPropagation: () => {} };
            pip.handleMouseDown(event, canvas);

            assert.equal(pip.activePiP, 'helix');
            assert.isDefined(pip.controllers.helix);

            // Mouse Up
            pip.handleMouseUp();
            assert.isNull(pip.activePiP);
        });

        TestFramework.it('should update all controllers', () => {
            pip.update();
            assert.isTrue(true); // update executed
        });

        TestFramework.it('should get state', () => {
            const state = pip.getState('helix');
            assert.isDefined(state);
            assert.isDefined(state.camera);
            assert.equal(state.camera.z, -200);
        });
    });
})();
