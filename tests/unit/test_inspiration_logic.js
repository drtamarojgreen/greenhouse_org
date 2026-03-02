/**
 * @file test_inspiration_logic.js
 * @description Unit tests for Greenhouse Inspiration logic.
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
        fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ title: 'Test', quote: 'Quote' }] }) }),
        document: {
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
                    id: '',
                    setAttribute: (k, v) => { el.attributes[k] = v; if(k==='id') el.id=v; },
                    appendChild: (c) => {
                        el.children.push(c);
                        if (!el.firstChild) el.firstChild = c;
                    },
                    removeChild: (c) => {
                        el.children = el.children.filter(child => child !== c);
                        el.firstChild = el.children[0] || null;
                    },
                    querySelector: (sel) => {
                        if (sel==='#inspiration-list') return el.children.find(c => c.id === 'inspiration-list') || null;
                        return null;
                    },
                    dataset: {},
                    style: {}
                };
                return el;
            },
            createTextNode: (text) => ({ text, nodeType: 3 }),
            head: { appendChild: () => { } },
            body: { appendChild: () => { } }
        },
        MutationObserver: class { observe() { } disconnect() { } },
        GreenhouseUtils: {
            displaySuccess: () => {},
            displayError: () => {}
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/inspiration.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('Greenhouse Inspiration (Unit)', () => {

    let env;
    let Inspiration;

    TestFramework.beforeEach(() => {
        env = createEnv();
        Inspiration = env.window.GreenhouseInspiration;
    });

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
            let lastSuccess, lastError;
            env.window.GreenhouseUtils.displaySuccess = (msg) => { lastSuccess = msg; };
            env.window.GreenhouseUtils.displayError = (msg) => { lastError = msg; };

            Inspiration.showNotification('Success!', 'success');
            assert.equal(lastSuccess, 'Success!');

            Inspiration.showNotification('Error!', 'error');
            assert.equal(lastError, 'Error!');
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
