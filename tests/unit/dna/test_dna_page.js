(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('DNA Repair Page (Unit)', () => {
        TestFramework.it('should define GreenhouseDNARepair', () => {
            assert.isDefined(window.GreenhouseDNARepair);
        });
    });
})();
