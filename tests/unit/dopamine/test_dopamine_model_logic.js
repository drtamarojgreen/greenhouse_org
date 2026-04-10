(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Dopamine Model Logic (Unit)', () => {

        const G = window.GreenhouseDopamine;

        TestFramework.it('should define core G object', () => {
            assert.isDefined(G);
        });

        TestFramework.describe('State Initialization', () => {
            TestFramework.it('should have initial vesicles in synapseState', () => {
                assert.isDefined(G.synapseState.vesicles);
            });

            TestFramework.it('should initialize cleft DA array', () => {
                assert.isDefined(G.synapseState.cleftDA);
            });
        });

        TestFramework.describe('Synaptic Dynamics', () => {
            TestFramework.it('should handle synaptic updates', () => {
                G.synapseState.releaseRate = 1.0;
                G.updateSynapse();
                assert.isDefined(G.synapseState.cleftDA);
            });

            TestFramework.it('should handle synthesis pathway', () => {
                G.synapseState.synthesis.tyrosine = 100;
                G.updateSynapse();
                assert.isDefined(G.synapseState.synthesis.ldopa);
            });
        });

        TestFramework.describe('Molecular Signaling', () => {
            TestFramework.it('should update molecular states', () => {
                if (G.updateMolecular) {
                    G.updateMolecular();
                    assert.isDefined(G.molecularState.pka);
                }
            });
        });

    });
})();
