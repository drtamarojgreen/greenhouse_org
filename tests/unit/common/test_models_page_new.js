(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Models Page Loader', () => {
        TestFramework.it('should define core modules', () => {
            assert.isDefined(window.GreenhouseModelsData);
            assert.isDefined(window.GreenhouseModelsUI);
        });
    });
})();
