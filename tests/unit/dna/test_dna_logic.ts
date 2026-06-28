(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('DNA Mutation Logic (Unit)', () => {

        const G = window.GreenhouseDNARepair;

        TestFramework.describe('Damage Induction', () => {
            TestFramework.beforeEach(() => {
                G.state = {
                    radiationLevel: 50,
                    basePairs: [
                        { id: 0, base1: 'A', base2: 'T', isDamaged: false },
                        { id: 1, base1: 'C', base2: 'G', isDamaged: false },
                        { id: 2, base1: 'T', base2: 'A', isDamaged: false },
                        { id: 3, base1: 'G', base2: 'C', isDamaged: false }
                    ]
                };
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
