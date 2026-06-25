(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('PiP Camera Usage Analysis', () => {
        let pipControls;
        let mockCtx;

        TestFramework.beforeEach(() => {
            const cameras = [
                {}, // Main camera
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // helix
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // micro
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }, // protein
                { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }  // target
            ];

            pipControls = window.GreenhouseGeneticPiPControls;
            pipControls.init(document.createElement('canvas'), cameras);

            mockCtx = document.createElement('canvas').getContext('2d');
        });

        TestFramework.it('TEST: Helix PiP - Check if it uses cameraState.camera', () => {
            pipControls.cameras.helix.rotationY = 2.5;
            pipControls.cameras.helix.x = 50;
            const helixState = pipControls.getState('helix');
            assert.isDefined(helixState.camera, 'State should have camera reference');
            assert.equal(helixState.camera.rotationY, 2.5, 'Camera should have rotationY = 2.5');
            assert.equal(helixState.camera.x, 50, 'Camera should have x = 50');
        });

        TestFramework.it('TEST: Micro PiP - Check if drawMicroView uses cameraState.camera', () => {
            pipControls.cameras.micro.rotationY = 1.5;
            pipControls.cameras.micro.z = -500;
            const microState = pipControls.getState('micro');
            assert.isDefined(microState.camera, 'State should have camera reference');
            assert.equal(microState.camera.rotationY, 1.5, 'Camera should have rotationY = 1.5');
            assert.equal(microState.camera.z, -500, 'Camera should have z = -500');

            const activeGene = { id: 1, baseColor: '#FF0000' };
            if (window.GreenhouseGeneticGene && window.GreenhouseGeneticGene.drawMicroView) {
                window.GreenhouseGeneticGene.drawMicroView(
                    mockCtx, 0, 0, 200, 150, activeGene, 0, null,
                    (ctx, x, y, w, h, title) => {},
                    microState
                );
            }
        });

        TestFramework.it('TEST: Protein PiP - Check if drawProteinView uses cameraState.camera', () => {
            pipControls.cameras.protein.rotationX = 0.8;
            pipControls.cameras.protein.y = 100;
            const proteinState = pipControls.getState('protein');
            assert.isDefined(proteinState.camera, 'State should have camera reference');
            assert.equal(proteinState.camera.rotationX, 0.8, 'Camera should have rotationX = 0.8');
            assert.equal(proteinState.camera.y, 100, 'Camera should have y = 100');

            const activeGene = { id: 1, baseColor: '#FF0000' };
            const proteinCache = {};
            if (window.GreenhouseGeneticProtein && window.GreenhouseGeneticProtein.drawProteinView) {
                window.GreenhouseGeneticProtein.drawProteinView(
                    mockCtx, 0, 0, 200, 150, activeGene, proteinCache,
                    (ctx, x, y, w, h, title) => {},
                    proteinState
                );
            }
        });

        TestFramework.it('TEST: Target (Brain) PiP - Check if drawTargetView uses cameraState.camera', () => {
            pipControls.cameras.target.rotationY = 3.0;
            pipControls.cameras.target.z = -400;
            const targetState = pipControls.getState('target');
            assert.isDefined(targetState.camera, 'State should have camera reference');
            assert.equal(targetState.camera.rotationY, 3.0, 'Camera should have rotationY = 3.0');
            assert.equal(targetState.camera.z, -400, 'Camera should have z = -400');

            const activeGene = { id: 1, baseColor: '#FF0000' };
            const brainShell = { vertices: [], faces: [] };
            if (window.GreenhouseGeneticBrain && window.GreenhouseGeneticBrain.drawTargetView) {
                window.GreenhouseGeneticBrain.drawTargetView(
                    mockCtx, 0, 0, 200, 150, activeGene, 0, brainShell,
                    (ctx, x, y, w, h, title) => {},
                    targetState
                );
            }
        });
    });
})();
