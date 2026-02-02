/**
 * @file test_greenhouse_utils.js
 * @description Unit tests for GreenhouseUtils shared library.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.dispatchEvent = () => { };
global.document = {
    currentScript: null,
    querySelector: () => null,
    createElement: (tag) => {
        const el = {
            tag,
            className: '',
            textContent: '',
            appendChild: () => { },
            remove: () => { },
            addEventListener: () => { },
            style: {},
            dataset: {},
            set src(val) {
                if (tag === 'script') {
                    setTimeout(() => { if (el.onload) el.onload(); }, 0);
                }
            }
        };
        return el;
    },
    body: { appendChild: () => { } },
    head: { appendChild: () => { } }
};
global.MutationObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() { }
    disconnect() { }
};
global.console = console;
global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('console.log("loaded");') });
global.Blob = class { };
global.URL = { createObjectURL: () => 'blob:url', revokeObjectURL: () => { } };
global.CustomEvent = class { };

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseUtils (Unit)', () => {

    const Utils = global.window.GreenhouseUtils;

    TestFramework.it('should initialize app state', () => {
        assert.isDefined(Utils.appState);
        assert.isFalse(Utils.appState.isInitialized);
    });

    TestFramework.describe('Messaging Utilities', () => {
        TestFramework.it('should expose notification methods', () => {
            assert.isFunction(Utils.displayError);
            assert.isFunction(Utils.displaySuccess);
            assert.isFunction(Utils.displayInfo);
        });

        TestFramework.it('displayError should call displayMessage logic (mocked)', () => {
            // Verification that it doesn't crash in mock environment
            Utils.displayError('Test Error', 100);
        });
    });

    TestFramework.describe('DOM Utilities', () => {
        TestFramework.it('waitForElement should return a promise', () => {
            const p = Utils.waitForElement('.any');
            assert.isType(p, 'object'); // Promise
        });
    });

    TestFramework.describe('Script Loading & Security', () => {
        TestFramework.it('loadScript should use fetch and blobs', async () => {
            await Utils.loadScript('test.js', 'http://base.url/');
            assert.isTrue(Utils.appState.loadedScripts.has('test.js'));
        });

        TestFramework.it('retryOperation should respect max attempts', async () => {
            let count = 0;
            const op = async () => { count++; throw new Error('fail'); };

            try {
                await Utils.retryOperation(op, 'Test Op', 2);
            } catch (e) {
                assert.equal(count, 2);
                assert.contains(e.message, 'failed after 2 attempts');
            }
        });
    });

    TestFramework.describe('Form Validation', () => {
        TestFramework.it('validateField should check required attribute', () => {
            const field = { required: true, value: '', trim: () => '', name: 'test', classList: { add: () => { }, remove: () => { } } };
            const errorEl = { textContent: '', classList: { add: () => { }, remove: () => { } } };
            const result = Utils.validateField(field, errorEl);
            assert.isFalse(result);
            assert.contains(errorEl.textContent, 'required');
        });

        TestFramework.it('validateField should check date persistence', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const field = {
                type: 'date',
                value: futureDate.toISOString().split('T')[0],
                trim: function () { return this.value; },
                classList: { add: () => { }, remove: () => { } }
            };
            const result = Utils.validateField(field, null);
            assert.isTrue(result);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
