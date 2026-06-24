(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseUtils (Unit)', () => {
        TestFramework.it('should define GreenhouseUtils', () => {
            assert.isDefined(window.GreenhouseUtils);
        });
    });
})();
