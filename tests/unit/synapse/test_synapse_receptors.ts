(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Synapse Receptors Integration', () => {

        const G = window.GreenhouseSynapseApp;
        const Chem = G.Chemistry;
        const Analytics = G.Analytics;

        TestFramework.it('should have ampar, nmdar, and tlr4 defined in chemistry', () => {
            assert.isDefined(Chem.receptors.ampar);
            assert.isDefined(Chem.receptors.nmdar);
            assert.isDefined(Chem.receptors.tlr4);
        });

        TestFramework.it('should track depolarization in analytics', () => {
            assert.isDefined(Analytics.state.depolarization);
            Analytics.state.depolarization = -70;
            Analytics.update(0, 10, 2);
            assert.greaterThan(Analytics.state.depolarization, -70);
        });

        TestFramework.describe('Environment and Scenarios', () => {
            TestFramework.it('should verify Specialized Scenarios (Fear Conditioning)', () => {
                G.applyScenario('fearConditioning');
                assert.equal(G.config.elements.receptors.length, 5);
            });
        });

    });
})();
