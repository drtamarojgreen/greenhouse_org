(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mobile Model Viewer (Unit)', () => {

        TestFramework.describe('isMobileUser detection', () => {
            TestFramework.it('should return boolean from GreenhouseUtils.isMobileUser', () => {
                const isMobile = window.GreenhouseUtils.isMobileUser();
                assert.isType(isMobile, 'boolean');
            });
        });

    });
})();
