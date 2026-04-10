(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseGeneticDNA', () => {
        const dna = window.GreenhouseGeneticDNA;

        TestFramework.it('should draw macro view', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const neurons = [
                { id: 1, type: 'gene', x: 10, y: 10, z: 0, strand: 0, baseColor: 'red' },
                { id: 2, type: 'gene', x: 20, y: 20, z: 0, strand: 1, baseColor: 'blue' }
            ];
            const camera = { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0 };
            const projection = { width: 800, height: 600 };

            const projected = dna.drawMacroView(ctx, 800, 600, camera, projection, neurons, 0, null);

            assert.isDefined(projected);
            assert.equal(projected.length, 2);
        });
    });

    TestFramework.describe('GreenhouseGeneticProtein', () => {
        const proteinModule = window.GreenhouseGeneticProtein;

        TestFramework.it('should draw protein view', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const activeGene = { id: 1, proteinMode: 'ribbon' };
            const proteinCache = {
                1: {
                    vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 10, z: 10 }
                    ]
                }
            };
            const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

            proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);
            assert.isTrue(true);
        });

        TestFramework.it('should generate protein if missing', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const activeGene = { id: 2 };
            const proteinCache = {};
            const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

            proteinModule.drawProteinView(ctx, 0, 0, 200, 150, activeGene, proteinCache, null, cameraState);
            assert.isDefined(proteinCache[2]);
        });
    });

    TestFramework.describe('GreenhouseGeneticBrain', () => {
        const brainModule = window.GreenhouseGeneticBrain;

        TestFramework.it('should draw target view', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const brainShell = {
                vertices: [{ x: 0, y: 0, z: 0 }],
                faces: [{ indices: [0, 0, 0] }],
                regions: { pfc: { color: 'rgba(0,0,0,0)' } }
            };
            const cameraState = { camera: { rotationX: 0, rotationY: 0, x: 0, y: 0, z: -100, fov: 400 } };

            brainModule.drawTargetView(ctx, 0, 0, 200, 150, { region: 'pfc' }, 0, brainShell, null, cameraState);
            assert.isTrue(true);
        });
    });
})();
