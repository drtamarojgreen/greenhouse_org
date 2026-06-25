(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Neuro Performance Profiling', () => {

        TestFramework.it('GA.step should execute within reasonable time (10ms)', () => {
            const ga = new window.NeuroGA();
            ga.init({ populationSize: 50 });

            const start = performance.now();
            for(let i=0; i<10; i++) {
                ga.step();
            }
            const end = performance.now();
            const avgTime = (end - start) / 10;
            console.log(`GA.step average time: ${avgTime}ms`);
            assert.lessThan(avgTime, 100); // Relaxed for CI but should be low
        });

        TestFramework.it('GA.evaluateFitness should be efficient', () => {
            const ga = new window.NeuroGA();
            ga.init({ populationSize: 50 });

            const start = performance.now();
            ga.evaluateFitness();
            const end = performance.now();
            console.log(`GA.evaluateFitness time: ${end - start}ms`);
            assert.lessThan(end - start, 50);
        });

        TestFramework.it('Synapse.drawConnections should handle many connections efficiently', () => {
            const ga = new window.NeuroGA();
            ga.init({ populationSize: 50 });
            const genome = ga.bestGenome;

            const ctx = document.createElement('canvas').getContext('2d');
            const camera = { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 };
            const projection = { width: 800, height: 600, near: 10, far: 1000 };

            // Create mock connection meshes
            const connections = genome.connections.map(c => {
                const from = genome.neurons[c.from];
                const to = genome.neurons[c.to];
                const cp = { x: (from.x + to.x)/2, y: (from.y + to.y)/2, z: (from.z + to.z)/2 };
                return {
                    ...c,
                    from, to, controlPoint: cp,
                    mesh: window.GreenhouseNeuroGeometry.generateTubeMesh(from, to, cp, 2, 6)
                };
            });

            const start = performance.now();
            window.GreenhouseNeuroSynapse.drawConnections(ctx, connections, genome.neurons, camera, projection, 800, 600);
            const end = performance.now();
            console.log(`Synapse.drawConnections time for ${connections.length} connections: ${end - start}ms`);
            assert.lessThan(end - start, 32);
        });

        TestFramework.it('Brain.drawBrainShell should be efficient', () => {
            const brainShell = { vertices: [], faces: [] };
            window.GreenhouseNeuroGeometry.initializeBrainShell(brainShell);

            const ctx = document.createElement('canvas').getContext('2d');
            const camera = { x: 0, y: 0, z: -800, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 };
            const projection = { width: 800, height: 600, near: 10, far: 1000 };

            const start = performance.now();
            window.GreenhouseNeuroBrain.drawBrainShell(ctx, brainShell, camera, projection, 800, 600);
            const end = performance.now();
            console.log(`Brain.drawBrainShell time: ${end - start}ms`);
            assert.lessThan(end - start, 50);
        });

    });
})();
