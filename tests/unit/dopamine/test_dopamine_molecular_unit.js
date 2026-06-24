(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Dopamine Molecular Logic (Unit)', () => {

        const G = window.GreenhouseDopamine;

        TestFramework.beforeEach(() => {
            // Reset molecular state
            G.state.mode = 'D1R';
            G.state.signalingActive = true;
            G.state.receptors = [];

            G.molecularState.gProteins = [];
            G.molecularState.campMicrodomains = [];
            G.molecularState.darpp32.thr34 = 0;
            G.molecularState.ac5 = { activity: 0 };
            G.molecularState.pka = { cat: 0, reg: 10, subunits: [] };
            G.molecularState.camkii = { active: 0, calmodulin: 0 };
            G.molecularState.rgsProteins = { active: false, factor: 1.5, visual: [] };
        });

        TestFramework.describe('G-Protein Cycle', () => {
            TestFramework.it('should generate G-Proteins when signaling is active', () => {
                G.updateMolecular();
                assert.greaterThan(G.molecularState.gProteins.length, 0);
            });

            TestFramework.it('should handle GTP/GDP exchange', () => {
                G.molecularState.gProteins.push({
                    subunit: 'alpha', gtpBound: false, exchangeTimer: 0, life: 100, type: 'Gs', vx: 0, vy: 0
                });

                for (let i = 0; i < 15; i++) G.updateMolecular();

                const gp = G.molecularState.gProteins.find(p => p.subunit === 'alpha');
                assert.isDefined(gp, 'Alpha subunit should exist');
                assert.isTrue(gp.gtpBound, 'Should have bound GTP');
            });
        });

        TestFramework.describe('cAMP & DARPP-32', () => {
            TestFramework.it('should increase AC5 activity with Gs alpha subunits', () => {
                G.molecularState.gProteins.push({
                    subunit: 'alpha', type: 'Gs', life: 100, gtpBound: true, vx: 0, vy: 0
                });
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
