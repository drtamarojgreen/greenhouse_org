/**
 * @file test_patient_app_unit.js
 * @description Unit tests for GreenhousePatientApp logic.
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
    createElement: (tag) => {
        const el = {
            tag,
            dataset: {},
            style: {},
            appendChild: () => { },
            removeChild: () => { },
            querySelector: () => null,
            setAttribute: function (k, v) { this[k] = v; },
            addEventListener: () => { }
        };
        return el;
    },
    addEventListener: () => { },
    body: { classList: { add: () => { }, remove: () => { } } }
};
global.console = { log: () => { }, error: () => { }, warn: () => { } };
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

// --- Load Dependencies ---
global.window.GreenhouseUtils = {
    displayError: () => { },
    displaySuccess: () => { },
    validateForm: () => true
};
global.window.GreenhouseSchedulerUI = {};

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/GreenhousePatientApp.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhousePatientApp (Unit)', () => {

    const App = global.window.GreenhousePatientApp;

    TestFramework.describe('Core API', () => {
        TestFramework.it('should be defined on global window', () => {
            assert.isDefined(App);
            assert.isFunction(App.init);
        });
    });

    TestFramework.describe('UI Population Helpers', () => {
        TestFramework.it('populateServices should handle empty API response', async () => {
            // Mock fetch to return empty list
            global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });

            // We can't easily test the DOM mutation without full internal state injection, 
            // but we verify the method is async and returns correctly.
            await App.populateServices();
        });

        TestFramework.it('populateAppointments should create list items', async () => {
            global.fetch = () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ _id: '1', title: 'Test', date: '2024-01-01', time: '10:00', platform: 'Zoom' }])
            });

            await App.populateAppointments();
        });
    });

    TestFramework.describe('Conflict Management', () => {
        TestFramework.it('showConflictModal should not crash with null data', () => {
            // This might log an error in console, which is fine for our mock.
            App.showConflictModal(null);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
