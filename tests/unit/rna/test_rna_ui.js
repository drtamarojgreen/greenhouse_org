(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('RNA UI (Unit)', () => {
        TestFramework.it('should define RNARepairSimulation', () => {
            assert.isDefined(window.Greenhouse.RNARepairSimulation);
        });
    });
})();
