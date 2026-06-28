(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Neuro Page Loader', () => {

        TestFramework.it('should define GreenhouseNeuroApp and other core objects', () => {
            assert.isDefined(window.GreenhouseNeuroApp);
            assert.isDefined(window.NeuroGA);
            assert.isDefined(window.GreenhouseNeuroUI3D);
        });

    });
})();
