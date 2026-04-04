(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Dopamine Molecular Logic (Unit)', () => {

        const G = window.GreenhouseDopamine;

        TestFramework.beforeEach(() => {
            // Reset molecular state
            G.molecularState.gProteins = [];
            G.molecularState.campMicrodomains = [];
            G.molecularState.darpp32.thr34 = 0;
            G.state.signalingActive = true;
        });

        TestFramework.describe('G-Protein Cycle', () => {
            TestFramework.it('should generate G-Proteins when signaling is active', () => {
                G.updateMolecular();
                assert.greaterThan(G.molecularState.gProteins.length, 0);
            });

            TestFramework.it('should handle GTP/GDP exchange', () => {
                G.molecularState.gProteins.push({
                    subunit: 'alpha', gtpBound: false, exchangeTimer: 0, life: 100, type: 'Gs'
                });

                for (let i = 0; i < 11; i++) G.updateMolecular();

                const gp = G.molecularState.gProteins.find(p => p.subunit === 'alpha');
                assert.isTrue(gp.gtpBound);
            });
        });

        TestFramework.describe('cAMP & DARPP-32', () => {
            TestFramework.it('should increase AC5 activity with Gs alpha subunits', () => {
                G.molecularState.gProteins.push({ subunit: 'alpha', type: 'Gs', life: 100 });
                G.updateMolecular();
                assert.greaterThan(G.molecularState.ac5.activity, 0);
            });

            TestFramework.it('should phosphorylate DARPP-32 Thr34 via PKA', () => {
                G.molecularState.pka.cat = 5;
                G.updateMolecular();
                assert.greaterThan(G.molecularState.darpp32.thr34, 0);
            });
        });

    });
})();
