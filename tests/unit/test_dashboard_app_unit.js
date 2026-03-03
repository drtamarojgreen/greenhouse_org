/**
 * @file test_dashboard_app_unit.js
 * @description Unit tests for GreenhouseDashboardApp logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');
const { createEnv, loadScript } = require('../utils/test_env_factory.js');

TestFramework.describe('GreenhouseDashboardApp (Unit)', () => {

    let env;
    let App;

    TestFramework.beforeEach(() => {
        env = createEnv({
            fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
            GreenhouseUtils: {
                displayError: () => { },
                displaySuccess: () => { }
            },
            GreenhouseSchedulerUI: {}
        });

        // Specific mock for querySelector needed by App
        const originalQuerySelector = env.document.querySelector;
        env.document.querySelector = (sel) => {
            if (sel) {
                return {
                    appendChild: () => { },
                    innerHTML: '',
                    style: {},
                    prepend: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    textContent: ''
                };
            }
            return originalQuerySelector(sel);
        };

        loadScript(env, 'docs/js/GreenhouseDashboardApp.js');
        App = env.window.GreenhouseDashboardApp;
    });

    TestFramework.describe('Initialization', () => {
        TestFramework.it('should define App object', () => {
            assert.isDefined(App);
            assert.isFunction(App.init);
        });
    });

    TestFramework.describe('Calendar Logic', () => {
        TestFramework.it('should populate calendar cells for a given month', () => {
            const tbody = {
                firstChild: true,
                appendChild: () => { },
                removeChild: function () { this.firstChild = null; },
                addEventListener: () => { }
            };
            const mockContainer = {
                querySelector: (sel) => {
                    if (sel.includes('calendar-tbody')) return tbody;
                    if (sel.includes('calendar-title')) return { textContent: '' };
                    return null;
                },
                prepend: () => { },
                addEventListener: () => { }
            };

            App.init(mockContainer, mockContainer);
            App.populateCalendar(2024, 0); // Jan 2024
            assert.isNotNull(tbody);
        });
    });

    TestFramework.describe('Data Fetching Triggers', () => {
        TestFramework.it('triggerDataFetchAndPopulation should attempt to fetch', async () => {
            let fetchCalled = 0;
            env.fetch = () => { fetchCalled++; return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

            await App.triggerDataFetchAndPopulation();
            assert.greaterThan(fetchCalled, 0);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
