(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Neuro Page', () => {

        TestFramework.it('should define GreenhouseNeuroApp', () => {
            assert.isDefined(window.GreenhouseNeuroApp);
        });

    });
})();
