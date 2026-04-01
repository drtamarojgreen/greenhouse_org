(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseDashboardApp (Unit)', () => {
        TestFramework.it('should define App object', () => {
            assert.isDefined(window.GreenhouseDashboardApp);
        });
    });
})();
