(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Serotonin Model Logic (Unit)', () => {

        const G = window.GreenhouseSerotonin;

        TestFramework.it('should define core G object', () => {
            assert.isDefined(G);
        });

        TestFramework.describe('Structural Model', () => {
            TestFramework.it('should initialize with default receptors', () => {
                G.setupStructuralModel();
                assert.isDefined(G.state.receptors);
                assert.greaterThan(G.state.receptors.length, 0);
            });

            TestFramework.it('should calculate lipids', () => {
                G.setupStructuralModel();
                assert.greaterThan(G.state.lipids.length, 0);
            });
        });

        TestFramework.describe('Receptor States & Dynamics', () => {
            TestFramework.it('should modulate affinity based on sodium levels', () => {
                G.setupStructuralModel();
                G.state.timer = 1000;
                G.Receptors.updateReceptorStates();
                const h1a = G.state.receptors.find(r => r.type === '5-HT1A');
                assert.isDefined(h1a.sodiumModulation);
            });
        });

        TestFramework.describe('Ligand Kinetics', () => {
            TestFramework.it('should spawn ligands correctly', () => {
                const initialCount = G.Kinetics.activeLigands.length;
                G.Kinetics.spawnLigand('Serotonin');
                assert.equal(G.Kinetics.activeLigands.length, initialCount + 1);
            });
        });

        TestFramework.describe('Signaling Pathways', () => {
            TestFramework.it('should update secondary messengers', () => {
                G.Signaling.cAMP = 50;
                G.Signaling.updateSignaling();
                assert.lessThan(G.Signaling.cAMP, 50.1);
            });
        });

    });
})();
