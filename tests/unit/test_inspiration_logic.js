/**
 * @file test_inspiration_logic.js
 * @description Unit tests for Greenhouse Inspiration logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.Node = class { constructor() { this.firstChild = null; } };
global.document = {
    currentScript: {
        getAttribute: (attr) => {
            if (attr === 'data-target-selector') return '#target';
            if (attr === 'data-base-url') return './';
            return null;
        }
    },
    querySelector: () => null,
    createElement: (tag) => {
        const el = {
            tag, attributes: {}, children: [],
            setAttribute: (k, v) => { el.attributes[k] = v; },
            appendChild: (c) => {
                el.children.push(c);
                if (!el.firstChild) el.firstChild = c;
            },
            removeChild: (c) => {
                el.children = el.children.filter(child => child !== c);
                el.firstChild = el.children[0] || null;
            },
            querySelector: () => el.children.find(c => c.id === 'inspiration-list') || null,
            dataset: {},
            style: {}
        };
        return el;
    },
    createTextNode: (text) => ({ text, nodeType: 3 }),
    head: { appendChild: () => { } },
    body: { appendChild: () => { } }
};
global.MutationObserver = class { observe() { } disconnect() { } };
global.console = { log: () => { }, error: () => { }, warn: () => { }, debug: () => { } };
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ title: 'Test', quote: 'Quote' }] }) });

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/inspiration.js');
let code = fs.readFileSync(filePath, 'utf8');
// Remove the leading/trailing triple quotes if present from previous view_file artifacts
code = code.replace(/^'''/, '').replace(/'''$/, '');
vm.runInThisContext(code);

TestFramework.describe('Greenhouse Inspiration (Unit)', () => {

    const Inspiration = global.window.GreenhouseInspiration;

    TestFramework.it('should initialize and export public API', () => {
        assert.isDefined(Inspiration);
        assert.isFunction(Inspiration.getState);
    });

    TestFramework.describe('UI Component Generation', () => {
        // Since the IIFE hides the internal GreenhouseAppsInspiration, 
        // we can test the effect on state and DOM if we had more helpers.
        // But we can check if reinitialize works.
        TestFramework.it('should handle reinitialization', async () => {
            await Inspiration.reinitialize();
            const state = Inspiration.getState();
            assert.isFalse(state.isLoading);
        });
    });

    TestFramework.describe('Notification Logic', () => {
        TestFramework.it('should proxy notifications to GreenhouseUtils', () => {
            // Setup mock GreenhouseUtils
            global.window.GreenhouseUtils = {
                displaySuccess: (msg) => { global.lastSuccess = msg; },
                displayError: (msg) => { global.lastError = msg; }
            };

            Inspiration.showNotification('Success!', 'success');
            assert.equal(global.lastSuccess, 'Success!');

            Inspiration.showNotification('Error!', 'error');
            assert.equal(global.lastError, 'Error!');
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
