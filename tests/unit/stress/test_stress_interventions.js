"use strict";
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
    TestFramework.describe('Clinical Intervention Logic Tests', () => {
        let app;
        TestFramework.beforeEach(() => {
            app = window.GreenhouseStressApp;
            app.init(document.createElement('div'));
            // Ensure metrics are initialized
            app.engine.state.metrics.allostaticLoad = 0.5;
            app.engine.state.metrics.autonomicBalance = 0.5;
        });
        TestFramework.it('should verify that interventions reduce allostatic load rate', () => {
            app.engine.state.metrics.allostaticLoad = 0.5;
            app.engine.state.metrics.autonomicBalance = 0.5;
            // No interventions
            app.engine.state.factors.interv_med = 0;
            app.engine.state.factors.therapy_cbt = 0;
            app.engine.state.factors.life_exercise = 0;
            app.updateModel(app.engine.state, 1.0);
            const loadAfterNoInterv = app.engine.state.metrics.allostaticLoad;
            // With interventions
            app.engine.state.metrics.allostaticLoad = 0.5; // Reset
            app.engine.state.factors.interv_med = 1;
            app.engine.state.factors.therapy_cbt = 1;
            app.engine.state.factors.life_exercise = 1;
            app.updateModel(app.engine.state, 1.0);
            const loadAfterInterv = app.engine.state.metrics.allostaticLoad;
            assert.lessThan(loadAfterInterv, loadAfterNoInterv);
        });
        TestFramework.it('should verify Crisis Spike without safety plan', () => {
            // Setup extreme conditions to trigger spike
            app.engine.state.factors.interv_med = 0;
            app.engine.state.factors.therapy_cbt = 0;
            app.engine.state.factors.life_exercise = 0;
<<<<<<< HEAD
            app.engine.state.metrics.allostaticLoad = 0.9;
=======
>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
            app.engine.state.factors.stress_system_crisis_plan = 0;

            // Add many environmental stressors to increase baseline sympathetic drive
            app.engine.state.factors.env_noise = 1;
            app.engine.state.factors.env_pollution = 1;
            app.engine.state.factors.env_crowding = 1;

            app.engine.state.metrics.allostaticLoad = 0.95; // Must be > 0.85
            app.engine.state.metrics.autonomicBalance = 0.5;
<<<<<<< HEAD
            app.updateModel(app.engine.state, 0.1);
=======

            // Run multiple ticks to allow smoothing to cross the 0.5 threshold
            for (let i = 0; i < 20; i++) {
                app.updateModel(app.engine.state, 16);
            }

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
            assert.greaterThan(app.engine.state.metrics.autonomicBalance, 0.5);
        });
    });
})();
