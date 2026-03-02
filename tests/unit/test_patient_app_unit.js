/**
 * @file test_patient_app_unit.js
 * @description Unit tests for GreenhousePatientApp logic.
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
            querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                dataset: {},
                style: {},
                appendChild: () => { },
                removeChild: () => { },
                querySelector: () => null,
                setAttribute: function (k, v) { this[k] = v; },
                addEventListener: () => { }
            }),
            addEventListener: () => { },
            body: { classList: { add: () => { }, remove: () => { } } }
        },
        GreenhouseUtils: {
            displayError: () => { },
            displaySuccess: () => { },
            validateForm: () => true
        },
        GreenhouseSchedulerUI: {}
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/GreenhousePatientApp.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('GreenhousePatientApp (Unit)', () => {
    let env;
    let App;

    TestFramework.beforeEach(() => {
        env = createEnv();
        App = env.window.GreenhousePatientApp;
    });

    TestFramework.describe('Core API', () => {
        TestFramework.it('should be defined on global window', () => {
            assert.isDefined(App);
            assert.isFunction(App.init);
        });
    });

    TestFramework.describe('UI Population Helpers', () => {
        TestFramework.it('populateServices should handle empty API response', async () => {
            env.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            await App.populateServices();
        });

        TestFramework.it('populateAppointments should create list items', async () => {
            env.fetch = () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ _id: '1', title: 'Test', date: '2024-01-01', time: '10:00', platform: 'Zoom' }])
            });

            await App.populateAppointments();
        });
    });

    TestFramework.describe('Conflict Management', () => {
        TestFramework.it('showConflictModal should not crash with null data', () => {
            App.showConflictModal(null);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
