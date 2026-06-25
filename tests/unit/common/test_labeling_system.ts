(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Labeling System (Unit)', () => {
        TestFramework.it('should define LabelingSystem', () => {
            assert.isDefined(window.LabelingSystem);
        });
    });
})();
