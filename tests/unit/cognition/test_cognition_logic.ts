(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Cognition App Logic', () => {
        TestFramework.it('should initialize with default category "All"', () => {
            const app = window.GreenhouseCognitionApp;
            const container = document.createElement('div');
            container.id = 'cognition-container';
            document.body.appendChild(container);

            app.init('#cognition-container');
            assert.equal(app.activeCategory, 'All');
        });

        TestFramework.it('should have isRunning set to true after init', () => {
            const app = window.GreenhouseCognitionApp;
            app.init('#cognition-container');
            assert.isTrue(app.isRunning);
            app.isRunning = false;
        });

        TestFramework.it('should have background particles initialized', () => {
            const app = window.GreenhouseCognitionApp;
            app.init('#cognition-container');
            assert.greaterThan(app.backgroundParticles.length, 0);
            app.isRunning = false;
        });
    });
})();
