(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Global UX Patterns', () => {

        TestFramework.it('DiurnalClock should advance time correctly', () => {
            const clock = new window.GreenhouseModelsUtil.DiurnalClock();
            clock.timeInHours = 8.0;

            // Advance 1 biological hour (1000ms real time in current impl)
            clock.update(1000);
            assert.equal(Math.round(clock.timeInHours), 9);

            // Wrap around 24h
            clock.timeInHours = 23.5;
            clock.update(1000);
            assert.equal(clock.timeInHours, 0.5);
            assert.equal(clock.dayCount, 1);
        });

        TestFramework.it('DiurnalClock should return correct resilience recovery multiplier', () => {
            const clock = new window.GreenhouseModelsUtil.DiurnalClock();

            clock.timeInHours = 12.0; // Day
            assert.equal(clock.getResilienceRecoveryMultiplier(), 1.0);

            clock.timeInHours = 2.0; // Night
            assert.equal(clock.getResilienceRecoveryMultiplier(), 2.5);
        });

        TestFramework.it('GreenhouseBioStatus should dispatch events on sync', () => {
            let eventCaught = false;
            const originalDispatch = window.dispatchEvent;
            window.dispatchEvent = (ev) => {
                if (ev.type === 'greenhouseBioUpdate') eventCaught = true;
            };

            window.GreenhouseBioStatus.sync('stress', { load: 0.5 });
            assert.isTrue(eventCaught);

            window.dispatchEvent = originalDispatch;
        });

    });
})();
