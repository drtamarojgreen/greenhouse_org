(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Emotion Deep Dive (Unit)', () => {
        TestFramework.it('should define GreenhouseEmotionApp', () => {
            assert.isDefined(window.GreenhouseEmotionApp);
        });
    });
})();
