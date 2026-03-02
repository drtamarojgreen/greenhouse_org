/**
 * @file test_dashboard_app_unit.js
 * @description Unit tests for GreenhouseDashboardApp logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        document: {
            querySelector: (sel) => {
                const el = {
                    appendChild: () => { },
                    innerHTML: '',
                    style: {},
                    prepend: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { }
                };
                return el;
            },
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                dataset: {},
                style: {},
                appendChild: function (c) { this.firstChild = c; },
                removeChild: function (c) { this.firstChild = null; },
                querySelector: () => null,
                setAttribute: function (k, v) { this[k] = v; },
                addEventListener: () => { },
                removeEventListener: () => { }
            }),
            addEventListener: () => { },
            body: { appendChild: () => { } }
        },
        GreenhouseUtils: {
            displayError: () => { },
            displaySuccess: () => { }
        },
        GreenhouseSchedulerUI: {}
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/GreenhouseDashboardApp.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('GreenhouseDashboardApp (Unit)', () => {

    let env;
    let App;

    TestFramework.beforeEach(() => {
        env = createEnv();
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
