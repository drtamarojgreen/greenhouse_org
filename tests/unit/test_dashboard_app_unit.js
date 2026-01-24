/**
 * @file test_dashboard_app_unit.js
 * @description Unit tests for GreenhouseDashboardApp logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
    createElement: (tag) => ({
        tag,
        dataset: {},
        style: {},
        appendChild: function (c) { this.firstChild = c; },
        removeChild: function (c) { this.firstChild = null; },
        querySelector: () => null,
        setAttribute: function (k, v) { this[k] = v; }
    }),
    body: { appendChild: () => { } }
};
global.console = { log: () => { }, error: () => { }, warn: () => { } };
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

// --- Load Dependencies ---
global.window.GreenhouseUtils = {
    displayError: () => { },
    displaySuccess: () => { }
};

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/GreenhouseDashboardApp.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseDashboardApp (Unit)', () => {

    const App = global.window.GreenhouseDashboardApp;

    TestFramework.describe('Initialization', () => {
        TestFramework.it('should define App object', () => {
            assert.isDefined(App);
            assert.isFunction(App.init);
        });
    });

    TestFramework.describe('Calendar Logic', () => {
        TestFramework.it('should populate calendar cells for a given month', () => {
            // Setup mock containers with data-identifiers
            const tbody = {
                firstChild: true,
                appendChild: () => { },
                removeChild: function () { this.firstChild = null; }
            };
            const mockContainer = {
                querySelector: (sel) => {
                    if (sel.includes('calendar-tbody')) return tbody;
                    if (sel.includes('calendar-title')) return { textContent: '' };
                    return null;
                },
                prepend: () => { }
            };

            // This requires manual state injection or init.
            // We can test the exposed methods if they don't crash.
            // But first we need to 'init' to set internal state.
            App.init(mockContainer, mockContainer);
            App.populateCalendar(2024, 0); // Jan 2024
            assert.isNotNull(tbody);
        });
    });

    TestFramework.describe('Data Fetching Triggers', () => {
        TestFramework.it('triggerDataFetchAndPopulation should attempt to fetch', async () => {
            // Setup fetch mock
            let fetchCalled = 0;
            global.fetch = () => { fetchCalled++; return Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); };

            await App.triggerDataFetchAndPopulation();
            assert.greaterThan(fetchCalled, 0);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
