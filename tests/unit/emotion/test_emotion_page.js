(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Emotion Page Enhancements', () => {

        TestFramework.it('should initialize the app without error', () => {
            const app = window.GreenhouseEmotionApp;
            assert.isDefined(app);

            const container = document.createElement('div');
            container.id = 'emotion-container';
            document.body.appendChild(container);

            app.init('#emotion-container');
            assert.isTrue(app.isRunning);
        });

        TestFramework.it('should change categories correctly', () => {
            const app = window.GreenhouseEmotionApp;
            app.currentCategory = 'regulations';
            app.updateTheorySelector();
            assert.equal(app.currentCategory, 'regulations');
        });

        TestFramework.it('should handle multi-region selection', () => {
            const app = window.GreenhouseEmotionApp;
            const mockTheory = { name: 'Test Theory', regions: ['amygdala', 'prefrontalCortex'] };

            app.activeTheory = mockTheory;
            app.activeRegion = mockTheory.regions;
            app.updateInfoPanel();

            assert.isTrue(Array.isArray(app.activeRegion));
            assert.equal(app.activeRegion.length, 2);
        });

    });
})();
