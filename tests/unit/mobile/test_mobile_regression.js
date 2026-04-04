(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mobile Regression Tests', () => {

        TestFramework.describe('GreenhouseUtils.isMobileUser() - Basic Checks', () => {

            TestFramework.it('should return boolean from GreenhouseUtils.isMobileUser', () => {
                const isMobile = window.GreenhouseUtils.isMobileUser();
                assert.isType(isMobile, 'boolean');
            });
        });

        TestFramework.describe('Initialization and Injection Prevention', () => {
            TestFramework.it('Should not inject styles if already present', () => {
                const doc = document;
                let existing = doc.getElementById('greenhouse-mobile-styles');
                if (!existing) {
                    existing = doc.createElement('style');
                    existing.id = 'greenhouse-mobile-styles';
                    doc.head.appendChild(existing);
                }

                const initialHeadCount = doc.head.children.length;
                if (window.GreenhouseMobile && window.GreenhouseMobile.injectStyles) {
                    window.GreenhouseMobile.injectStyles();
                }

                assert.equal(doc.head.children.length, initialHeadCount);
            });
        });
    });
})();
