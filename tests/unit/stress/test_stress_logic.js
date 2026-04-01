(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseStressApp Logic', () => {

        let app;
        let engine;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseStressApp;
            const config = window.GreenhouseStressConfig;
            engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => {
                    acc[f.id] = f.defaultValue;
                    return acc;
                }, {}),
                initialMetrics: {
                    allostaticLoad: 0.15,
                    autonomicBalance: 0.4,
                    resilienceReserve: 0.9,
                    hpaSensitivity: 1.0,
                    hrv: 65,
                    vagalTone: 0.7
                },
                updateFn: (state, dt) => app.updateModel(state, dt)
            });
            app.engine = engine;
            app.clock = new window.GreenhouseModelsUtil.DiurnalClock();
        });

        TestFramework.it('should increase allostaticLoad with environmental stressors', () => {
            for (let id in engine.state.factors) {
                engine.state.factors[id] = 0;
            }
            engine.state.metrics.allostaticLoad = 0.15;
            const initialState = JSON.parse(JSON.stringify(engine.state));

            engine.state.factors.env_noise = 1;
            engine.state.factors.env_air = 1;

            for(let i=0; i<100; i++) {
                app.updateModel(engine.state, 1000/60);
            }

            assert.greaterThan(engine.state.metrics.allostaticLoad, initialState.metrics.allostaticLoad);
        });

        TestFramework.it('should decrease resilienceReserve when allostaticLoad is high', () => {
            engine.state.factors.psych_support = 0;
            engine.state.metrics.allostaticLoad = 0.8;
            const initialState = JSON.parse(JSON.stringify(engine.state));

            for(let i=0; i<100; i++) {
                app.updateModel(engine.state, 1000/60);
            }

            assert.lessThan(engine.state.metrics.resilienceReserve, initialState.metrics.resilienceReserve);
        });

        TestFramework.it('should calculate hrv based on autonomicBalance', () => {
            engine.state.metrics.autonomicBalance = 1.2;
            app.updateModel(engine.state, 1000/60);
            const lowHrv = engine.state.metrics.hrv;

            engine.state.metrics.autonomicBalance = 0.1;
            app.updateModel(engine.state, 1000/60);
            const highHrv = engine.state.metrics.hrv;

            assert.greaterThan(highHrv, lowHrv);
        });

        TestFramework.it('should verify Risk Monitoring activation', () => {
            engine.state.factors.stress_system_risk_monitor = 1;
            engine.state.metrics.allostaticLoad = 0.95;

            app.updateModel(engine.state, 1000/60);
            assert.isTrue(engine.state.history.riskAlertActive);

            engine.state.metrics.allostaticLoad = 0.5;
            app.updateModel(engine.state, 1000/60);
            assert.isFalse(engine.state.history.riskAlertActive);
        });

    });
})();
