(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Synapse Chemistry Logic (Unit)', () => {

        const Chem = window.GreenhouseSynapseApp.Chemistry;

        TestFramework.it('should define core neurotransmitters with correct types', () => {
            assert.isDefined(Chem.neurotransmitters);
            assert.equal(Chem.neurotransmitters.glutamate.type, 'excitatory');
            assert.equal(Chem.neurotransmitters.gaba.type, 'inhibitory');
        });

        TestFramework.it('should define receptors and their binding profiles', () => {
            const ionotropic = Chem.receptors.ionotropic_receptor;
            assert.includes(ionotropic.binds, 'glutamate');
        });

        TestFramework.describe('Scenario Modifiers', () => {
            TestFramework.it('Schizophrenia should have increased receptor density', () => {
                const sc = Chem.scenarios.schizophrenia;
                assert.greaterThan(sc.modifiers.receptorDensity, 1.0);
            });
        });

    });
})();
