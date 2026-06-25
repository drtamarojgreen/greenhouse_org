(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Cognition Page (Unit)', () => {
        TestFramework.it('should define GreenhouseCognitionApp', () => {
            assert.isDefined(window.GreenhouseCognitionApp);
        });
    });
})();
