(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic Labels', () => {
        const ui = window.GreenhouseGeneticUI3D;

        TestFramework.it('should assign grounded gene labels with increased frequency', () => {
            // Mock algo with population
            const mockNetwork = {
                nodes: Array.from({ length: 50 }, (_, i) => ({ id: i })),
                connections: [],
                fitness: 0.5
            };
            const mockAlgo = {
                bestNetwork: mockNetwork,
                generation: 1
            };

            ui.algo = mockAlgo;
            ui.brainShell = { vertices: [{x: 0, y: 0, z: 0}], faces: [] };

            // Mock Geometry module
            window.GreenhouseGeneticGeometry = {
                generateHelixPoints: (i, total, offset) => ({ x: 0, y: 0, z: 0, strandIndex: i % 2 }),
                initializeBrainShell: () => { },
                getRegionVertices: () => [0],
                generateProteinChain: () => ({ vertices: [] }),
                generateTubeMesh: () => ({ vertices: [], faces: [] }),
                generateNeuronMesh: () => ({ vertices: [], faces: [] })
            };

            // Update data to trigger label assignment
            ui.updateData();

            // Check labels
            const genes = ui.neurons3D.filter(n => n.type === 'gene');

            assert.isTrue(genes.length > 0);
            assert.isDefined(genes[0].label);
        });

        TestFramework.it('should use translation function for active gene label', () => {
            const stats = window.GreenhouseGeneticStats;
            const util = window.GreenhouseModelsUtil;

            let translationCalled = false;
            const originalT = util.t;
            util.t = (k) => {
                if (k === 'COMT') translationCalled = true;
                return k;
            };

            const ctx = {
                measureText: () => ({ width: 0 }),
                fillText: () => { },
                set fillStyle(v) { },
                set font(v) { },
                set textAlign(v) { },
                canvas: { width: 800 }
            };

            const activeGene = { id: 1, label: 'COMT' };
            stats.drawOverlayInfo(ctx, 800, activeGene);

            assert.isTrue(translationCalled, 'Translation should be called for active gene label');

            util.t = originalT;
        });
    });
})();
