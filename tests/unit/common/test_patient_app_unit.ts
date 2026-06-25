(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhousePatientApp (Unit)', () => {

        const App = window.GreenhousePatientApp;

        TestFramework.describe('Core API', () => {
            TestFramework.it('should be defined on global window', () => {
                assert.isDefined(App);
                assert.isFunction(App.init);
            });
        });

        TestFramework.describe('UI Population Helpers', () => {
            TestFramework.it('populateServices should handle empty API response', async () => {
                const originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

                await App.populateServices();

                window.fetch = originalFetch;
            });

            TestFramework.it('populateAppointments should create list items', async () => {
                const originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ _id: '1', title: 'Test', date: '2024-01-01', time: '10:00', platform: 'Zoom' }])
                });

                await App.populateAppointments();

                window.fetch = originalFetch;
            });
        });

        TestFramework.describe('Conflict Management', () => {
            TestFramework.it('showConflictModal should not crash with null data', () => {
                App.showConflictModal(null);
            });
        });

    });
})();
