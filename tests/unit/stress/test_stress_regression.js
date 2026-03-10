/**
 * @file test_stress_regression.js
 * @description Regression and boundary tests for the Stress Dynamics Model.
 */

const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

TestFramework.describe('GreenhouseStressApp Regression', () => {

    let app;
    let engine;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseStressApp;
        app.init('div');
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
        assert.equal(actual.length, 12, "Should have exactly 12 categories");
    });

    TestFramework.it('should clamp allostaticLoad between 0.05 and 1.0', () => {
        // Force high sympathetic balance
        engine.state.metrics.autonomicBalance = 10.0;
        for(let i=0; i<500; i++) {
            app.updateModel(engine.state, 1000/60);
        }
        assert.isTrue(engine.state.metrics.allostaticLoad <= 1.0, "allostaticLoad > 1.0");

        // Force high damping
        engine.state.metrics.autonomicBalance = -10.0;
        engine.state.metrics.allostaticLoad = 0.0;
        for(let i=0; i<500; i++) {
            app.updateModel(engine.state, 1000/60);
        }
        assert.isTrue(engine.state.metrics.allostaticLoad >= 0.05, "allostaticLoad < 0.05");
    });

    TestFramework.it('should clamp resilienceReserve between 0.0 and 1.0', () => {
        engine.state.metrics.allostaticLoad = 1.0;
        engine.state.metrics.resilienceReserve = 1.0;
        for(let i=0; i<1000; i++) {
            app.updateModel(engine.state, 1000/60);
        }
        assert.isTrue(engine.state.metrics.resilienceReserve >= 0.0, "resilienceReserve < 0.0");

        engine.state.metrics.allostaticLoad = 0.05;
        engine.state.metrics.resilienceReserve = 1.0;
        for(let i=0; i<100; i++) {
            app.updateModel(engine.state, 1000/60);
        }
        assert.isTrue(engine.state.metrics.resilienceReserve <= 1.0, "resilienceReserve > 1.0");
    });

    TestFramework.it('should integrate biological markers into physiological state', () => {
        // Test IL-6 (Cytokine) effect on allostatic load
        const initialLoad = engine.state.metrics.allostaticLoad;
        engine.state.factors.bio_il6 = 1;
        app.updateModel(engine.state, 1000/60);
        assert.isTrue(engine.state.metrics.allostaticLoad > initialLoad);

        // Test BDNF effect on resilience
        const initialRes = engine.state.metrics.resilienceReserve;
        engine.state.factors.bio_bdnf = 1;
        app.updateModel(engine.state, 1000/60);
        assert.isTrue(engine.state.metrics.resilienceReserve > initialRes);

        // Test CRH effect on cortisol
        engine.state.metrics.crhDrive = 0;
        engine.state.factors.bio_crh = 1;
        app.updateModel(engine.state, 1000/60);
        assert.isTrue(engine.state.metrics.crhDrive > 0);
    });

    TestFramework.it('should handle diurnal clock influence on cortisol', () => {
        // Morning (approx 8am) should have higher cortisol drive than midnight
        app.clock.timeInHours = 8;
        app.updateModel(engine.state, 0);
        const morningCortisol = engine.state.metrics.cortisolLevels;

        app.clock.timeInHours = 0;
        app.updateModel(engine.state, 0);
        const midnightCortisol = engine.state.metrics.cortisolLevels;

        assert.isTrue(morningCortisol !== midnightCortisol);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
