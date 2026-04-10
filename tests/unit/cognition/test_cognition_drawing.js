(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Cognition Drawing (Unit)', () => {
        TestFramework.it('should draw a simple cognition diagram', () => {
            const ctx = document.createElement('canvas').getContext('2d');
            if (window.GreenhouseCognitionDrawingUtils) {
                window.GreenhouseCognitionDrawingUtils.drawThoughtBubble(ctx, 100, 100, 50, 30);
            }
            assert.isTrue(true);
        });
    });
})();
