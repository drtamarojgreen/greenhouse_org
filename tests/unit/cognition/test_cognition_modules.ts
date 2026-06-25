(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Cognition Modules (Unit)', () => {
        TestFramework.it('should define cognition modules', () => {
            assert.isDefined(window.GreenhouseCognitionConfig);
        });
    });
})();
