(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Performance Regression', () => {

        TestFramework.it('SimulationEngine should handle variable delta times', () => {
            let updateCount = 0;
            let totalDt = 0;

            const engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: {},
                initialMetrics: {},
                tickRate: 20, // Use a clean divisor
                updateFn: (state, dt) => {
                    updateCount++;
                    totalDt += dt;
                }
            });

            // Simulating 3 frames with different deltas
            engine.update(1000); // Initialize lastTick
            engine.update(1100); // 100ms later
            engine.update(1200); // another 100ms later

            // tickRate is 20ms. 200ms total. 200 / 20 = 10 updates.
            assert.equal(updateCount, 10);
            assert.equal(Math.round(totalDt), 200);
        });

        TestFramework.it('SimulationEngine update intervals should be consistent', () => {
            const engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: {},
                initialMetrics: {},
                updateFn: (state, dt) => {}
            });

            engine.lastTick = 1000;
            engine.update(1016);
            assert.equal(engine.lastTick, 1016);
        });

    });
})();
