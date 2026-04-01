(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic Page Loader', () => {
        TestFramework.it('should define window.GreenhouseGenetic with reinitialize', () => {
            assert.isDefined(window.GreenhouseGenetic);
            assert.isFunction(window.GreenhouseGenetic.reinitialize);
        });
    });
})();
