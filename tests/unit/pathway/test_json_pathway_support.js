(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Pathway JSON Support', () => {
        TestFramework.it('should define GreenhousePathwayViewer', () => {
            assert.isDefined(window.GreenhousePathwayViewer);
        });
    });
})();
