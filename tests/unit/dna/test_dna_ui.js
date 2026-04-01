(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('DNA Repair UI (Unit)', () => {
        TestFramework.it('should define GreenhouseDNARepair', () => {
            assert.isDefined(window.GreenhouseDNARepair);
        });
    });
})();
