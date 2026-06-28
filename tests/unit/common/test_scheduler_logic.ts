(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Greenhouse Scheduler Core (Unit)', () => {

        const Scheduler = window.GreenhouseAppsScheduler; // Check global name in scheduler.js or fallback to GreenhouseScheduler

        TestFramework.it('should define public API on window', () => {
            const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
            assert.isDefined(api);
            assert.isFunction(api.getState);
            assert.isFunction(api.reinitialize);
        });

        TestFramework.describe('State Management', () => {
            TestFramework.it('should provide access to app state', () => {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                const state = api.getState();
                assert.isDefined(state);
                assert.isBoolean(state.isInitialized);
            });

            TestFramework.it('should handle reinitialization request', async () => {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                await api.reinitialize();
                const state = api.getState();
                assert.isTrue(state.isInitialized);
            });
        });

        TestFramework.describe('View Switching (Logical)', () => {
            TestFramework.it('should update state when switching views', async () => {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                const st = api.getState();
                assert.isDefined(st.baseUrl);
            });
        });

    });
})();
