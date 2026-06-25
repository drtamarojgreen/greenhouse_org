(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Pathway Page Loader', () => {
        TestFramework.it('should define GreenhousePathwayViewer', () => {
            assert.isDefined(window.GreenhousePathwayViewer);
        });
    });
})();
