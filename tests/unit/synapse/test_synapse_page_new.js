(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Synapse Page New', () => {
        TestFramework.it('should define GreenhouseSynapseApp', () => {
            assert.isDefined(window.GreenhouseSynapseApp);
        });
    });
})();
