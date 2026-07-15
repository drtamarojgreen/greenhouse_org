// [TypeScript Migration] Source migrated from test_dna_logic_coverage.js — behavior preserved.
(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('DNA Logic Coverage (Unit)', () => {
        const G = window.GreenhouseDNARepair;

        TestFramework.it('should generate DNA strand with correct length', () => {
            G.generateDNA();
            assert.equal(G.state.basePairs.length, G.config.helixLength);
        });

        TestFramework.it('should start simulation and set simulating flag', () => {
            G.startSimulation('mmr');
            assert.equal(G.state.repairMode, 'mmr');
            assert.isTrue(G.state.simulating);
        });

        TestFramework.it('should consume ATP and update counter', () => {
            const initialATP = G.state.atpConsumed;
            G.consumeATP(10);
            assert.equal(G.state.atpConsumed, initialATP + 10);
        });

        TestFramework.it('should spawn particles correctly', () => {
            const initialParticles = G.state.particles.length;
            G.spawnParticles(0, 0, 0, 5, '#fff');
            assert.equal(G.state.particles.length, initialParticles + 5);
        });

        TestFramework.describe('Damage Induction', () => {
            TestFramework.beforeEach(() => {
                G.state.basePairs = [
                    { id: 0, base1: 'C', base2: 'G', isDamaged: false },
                    { id: 1, base1: 'C', base2: 'G', isDamaged: false }
                ];
            });

            TestFramework.it('should apply UV damage with correct spectrum based on radiation', () => {
                const pair = { isDamaged: false };
                G.applyUVDamage(pair, 90);
                assert.isTrue(pair.isDamaged);
                assert.equal(pair.spectrum, 'UVC');

                G.applyUVDamage(pair, 50);
                assert.equal(pair.spectrum, 'UVB');

                G.applyUVDamage(pair, 20);
                assert.equal(pair.spectrum, 'UVA');
            });

            TestFramework.it('should deaminate Cytosine to Uracil', () => {
                const pair = { base1: 'C', base2: 'G', isDamaged: false };
                G.applyDeamination(pair);
                assert.isTrue(pair.isDamaged);
                assert.equal(pair.base1, 'U');
                assert.equal(pair.originalBase, 'C');
            });

            TestFramework.it('should NOT deaminate Adenine', () => {
                const pair = { base1: 'A', base2: 'T', isDamaged: false };
                G.applyDeamination(pair);
                assert.isFalse(pair.isDamaged);
                assert.equal(pair.base1, 'A');
            });

            TestFramework.it('should induce spontaneous damage scaled by radiation', () => {
                G.state.radiationLevel = 10000; // 100% prob per tick
                G.induceSpontaneousDamage();
                G.state.basePairs.forEach(p => {
                    assert.isTrue(p.isDamaged);
                });
            });
        });
    });
})();
