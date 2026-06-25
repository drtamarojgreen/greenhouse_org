(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseGeneticLighting', () => {
        const lighting = window.GreenhouseGeneticLighting;

        TestFramework.it('should calculate lighting', () => {
            const normal = { x: 0, y: 0, z: 1 };
            const position = { x: 0, y: 0, z: 0 };
            const camera = { x: 0, y: 0, z: -100 };
            const material = { baseColor: { r: 255, g: 0, b: 0 }, metallic: 0.5, roughness: 0.5 };

            const result = lighting.calculateLighting(normal, position, camera, material);

            assert.isDefined(result);
            assert.isNumber(result.r);
        });

        TestFramework.it('should parse hex color', () => {
            const color = lighting.parseColor('#FF0000');
            assert.equal(color.r, 255);
            assert.equal(color.g, 0);
            assert.equal(color.b, 0);
        });
    });

    TestFramework.describe('GreenhouseGeneticGeometry', () => {
        const geo = window.GreenhouseGeneticGeometry;

        TestFramework.it('should generate helix points', () => {
            const point = geo.generateHelixPoints(0, 10, 0);
            assert.isDefined(point);
            assert.isNumber(point.x);
            assert.isNumber(point.y);
            assert.isNumber(point.z);
            assert.isNumber(point.strandIndex);
        });

        TestFramework.it('should generate protein chain', () => {
            const chain = geo.generateProteinChain('seed123');
            assert.isDefined(chain);
            assert.isArray(chain.vertices);
            assert.isTrue(chain.vertices.length > 0);
        });
    });

    TestFramework.describe('GreenhouseGeneticStats', () => {
        const stats = window.GreenhouseGeneticStats;

        TestFramework.it('should draw overlay info', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const activeGene = { id: 1, label: 'Test Gene' };
            stats.drawOverlayInfo(ctx, 800, activeGene);
            assert.isTrue(true);
        });

        TestFramework.it('should log event', () => {
            stats.logEvent('Test Event');
            assert.isTrue(stats.eventLog.some(e => e.message === 'Test Event'));
        });
    });

    TestFramework.describe('GreenhouseGeneticChromosome', () => {
        const chromo = window.GreenhouseGeneticChromosome;

        TestFramework.it('should draw chromatin structure', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            const activeGene = { id: 1, baseColor: 'red' };
            const camera = { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0 };

            chromo.drawChromatinStructure(ctx, 0, 0, 200, 150, activeGene, null, camera);
            assert.isTrue(true);
        });
    });
})();
