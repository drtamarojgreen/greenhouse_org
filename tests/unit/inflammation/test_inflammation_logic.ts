(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Inflammation Model Logic (Restored Metrics)', () => {
        let app;
        let engine;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseInflammationApp;
            app.init(document.createElement('div'));
            engine = app.engine;
        });

        TestFramework.it('TNF-alpha should increase with pathogenic triggers', () => {
            engine.state.metrics.tnfAlpha = 0.1;
            const initialTnf = engine.state.metrics.tnfAlpha;

            engine.state.factors.pathogenActive = 1;
            engine.state.factors.chronicStress = 1;

            for (let i = 0; i < 50; i++) {
                app.updateModel(engine.state, 0.1);
            }

            assert.greaterThan(engine.state.metrics.tnfAlpha, initialTnf);
        });

        TestFramework.it('IL-10 should respond to exercise', () => {
            engine.state.metrics.il10 = 0.05;
            const initialIl10 = engine.state.metrics.il10;

            engine.state.factors.exerciseRegular = 1;

            for (let i = 0; i < 50; i++) {
                app.updateModel(engine.state, 0.1);
            }

            assert.greaterThan(engine.state.metrics.il10, initialIl10);
        });

        TestFramework.it('should verify NLRP3 Inflammasome activation', () => {
            engine.state.factors.leakyGut = 1;
            engine.state.factors.pathogenActive = 1;

            engine.state.metrics.stressBurden = 0.9;
            engine.state.metrics.tnfAlpha = 0.9;
            engine.state.metrics.microgliaActivation = 0.8;

            for (let i = 0; i < 100; i++) {
                app.updateModel(engine.state, 16);
            }

            assert.greaterThan(engine.state.metrics.nlrp3State, 0.5);
        });

    });
})();
