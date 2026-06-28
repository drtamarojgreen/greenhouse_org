(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('RNA Logic Coverage (Unit)', () => {
        let simulation;
        let canvas;

        TestFramework.beforeEach(() => {
            canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            simulation = new window.Greenhouse.RNARepairSimulation(canvas);
        });

        TestFramework.it('should initialize with default state', () => {
            assert.isDefined(simulation.rnaStrand);
            assert.isArray(simulation.rnaStrand);
            assert.equal(simulation.damageTypes.BREAK, 'break');
        });

        TestFramework.it('should initialize background particles', () => {
            assert.equal(simulation.bgParticles.length, 20);
            simulation.bgParticles.forEach(p => {
                assert.isNumber(p.x);
                assert.isNumber(p.y);
            });
        });

        TestFramework.it('should have a ribosome object', () => {
            assert.isDefined(simulation.ribosome);
            assert.equal(simulation.ribosome.index, 0);
            assert.isFalse(simulation.ribosome.stalled);
        });

        TestFramework.it('should introduce damage to RNA strand', () => {
            simulation.rnaStrand = [
                { id: 0, damaged: false, connected: true },
                { id: 1, damaged: false, connected: true },
                { id: 2, damaged: false, connected: true }
            ];

            // Force random to a value that guarantees methylation for testing if possible,
            // or just call it and check if at least one is changed.
            const originalRandom = Math.random;
            Math.random = () => 0.45; // methylation roll

            simulation.introduceDamage();

            const damagedCount = simulation.rnaStrand.filter(b => b.damaged).length;
            assert.greaterThan(damagedCount, 0);

            Math.random = originalRandom;
        });
    });
})();
