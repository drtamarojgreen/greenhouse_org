(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Greenhouse Inspiration (Unit)', () => {

        const Inspiration = window.GreenhouseInspiration;

        TestFramework.it('should initialize and export public API', () => {
            assert.isDefined(Inspiration);
            assert.isFunction(Inspiration.getState);
        });

        TestFramework.describe('UI Component Generation', () => {
            TestFramework.it('should handle reinitialization', async () => {
                await Inspiration.reinitialize();
                const state = Inspiration.getState();
                assert.isFalse(state.isLoading);
            });
        });

        TestFramework.describe('Notification Logic', () => {
            TestFramework.it('should proxy notifications to GreenhouseUtils', () => {
                const originalUtils = window.GreenhouseUtils;
                let lastSuccess, lastError;
                window.GreenhouseUtils = {
                    displaySuccess: (msg) => { lastSuccess = msg; },
                    displayError: (msg) => { lastError = msg; }
                };

                Inspiration.showNotification('Success!', 'success');
                assert.equal(lastSuccess, 'Success!');

                Inspiration.showNotification('Error!', 'error');
                assert.equal(lastError, 'Error!');

                window.GreenhouseUtils = originalUtils;
            });
        });

    });
})();
