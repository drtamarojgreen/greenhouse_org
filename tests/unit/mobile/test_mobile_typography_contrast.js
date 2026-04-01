(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mobile Typography & Contrast Compliance', () => {

        TestFramework.it('should have basic styles injected', () => {
            if (window.GreenhouseMobile && window.GreenhouseMobile.injectStyles) {
                window.GreenhouseMobile.injectStyles();
            }
            const styleTag = document.getElementById('greenhouse-mobile-styles');
            assert.isDefined(styleTag);
        });

    });
})();
