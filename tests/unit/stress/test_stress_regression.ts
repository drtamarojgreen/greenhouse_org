(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseStressApp Regression', () => {

        let app;
        let engine;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseStressApp;
            app.init(document.createElement('div'));
            engine = app.engine;
        });

        TestFramework.it('should have all 12 neural hierarchy categories', () => {
            const expected = [
                'hpa', 'env', 'limbic', 'psych', 'cortical', 'philo',
                'brainstem', 'research', 'interv', 'therapy', 'lifestyle', 'system'
            ];
            const actual = app.ui.categories.map(c => c.id);

            expected.forEach(id => {
                assert.isTrue(actual.includes(id), `Missing category: ${id}`);
            });
            assert.equal(actual.length, 12);
        });

        TestFramework.it('should clamp allostaticLoad between 0.05 and 1.0', () => {
            engine.state.metrics.autonomicBalance = 10.0;
            for(let i=0; i<500; i++) {
                app.updateModel(engine.state, 1000/60);
            }
            assert.isTrue(engine.state.metrics.allostaticLoad <= 1.0);

            engine.state.metrics.autonomicBalance = -10.0;
            engine.state.metrics.allostaticLoad = 0.0;
            for(let i=0; i<500; i++) {
                app.updateModel(engine.state, 1000/60);
            }
            assert.isTrue(engine.state.metrics.allostaticLoad >= 0.05);
        });

        TestFramework.it('should clamp resilienceReserve between 0.0 and 1.0', () => {
            engine.state.metrics.allostaticLoad = 1.0;
            engine.state.metrics.resilienceReserve = 1.0;
            for(let i=0; i<1000; i++) {
                app.updateModel(engine.state, 1000/60);
            }
            assert.isTrue(engine.state.metrics.resilienceReserve >= 0.0);
        });

        TestFramework.it('should integrate biological markers into physiological state', () => {
            const initialLoad = engine.state.metrics.allostaticLoad;
            engine.state.factors.bio_il6 = 1;
            app.updateModel(engine.state, 1000/60);
            assert.isTrue(engine.state.metrics.allostaticLoad > initialLoad);
        });

    });
})();
