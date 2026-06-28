(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mobile Integration Tests', () => {

        TestFramework.describe('Mobile Detection', () => {
            TestFramework.it('should return boolean from isMobileUser', () => {
                const isMobile = window.GreenhouseUtils.isMobileUser();
                assert.isType(isMobile, 'boolean');
            });
        });

        TestFramework.describe('Model Registry', () => {
            TestFramework.it('should have models registered', () => {
                if (window.GreenhouseMobile && window.GreenhouseMobile.modelRegistry) {
                    assert.isTrue(Object.keys(window.GreenhouseMobile.modelRegistry).length > 0);
                }
            });
        });

        TestFramework.describe('Resilient Data Fetching', () => {
            TestFramework.it('should return models array from fetchModelDescriptions', async () => {
                const models = await window.GreenhouseUtils.fetchModelDescriptions();
                assert.isArray(models);
                assert.greaterThan(models.length, 0);
            });
        });
    });
})();
