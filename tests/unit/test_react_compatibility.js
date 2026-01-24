/**
 * @file test_react_compatibility.js
 * @description Unit tests for GreenhouseReactCompatibility.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0' }; // Mock Firefox
global.document = {
    querySelectorAll: () => [],
    createElement: (tag) => ({
        tag,
        setAttribute: function (k, v) { this[k] = v; },
        appendChild: () => { },
        removeChild: () => { },
        parentNode: { removeChild: () => { } },
        hasAttribute: () => false
    }),
    body: { appendChild: () => { } }
};
global.console = { log: () => { }, info: () => { }, warn: () => { }, error: () => { } };
global.requestAnimationFrame = (cb) => { setTimeout(cb, 16); };

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/GreenhouseReactCompatibility.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseReactCompatibility (Unit - Firefox Mock)', () => {

    const RC = global.window.GreenhouseReactCompatibility;

    TestFramework.it('should detect Firefox from user agent', () => {
        assert.isTrue(RC.isFirefox);
    });

    TestFramework.it('detectReact should check global window.React', () => {
        global.window.React = { version: '18.2.0' };
        assert.isTrue(RC.detectReact());
        assert.equal(RC.reactVersion, '18.2.0');
        delete global.window.React;
    });

    TestFramework.describe('Element LifeCycle Safety', () => {
        TestFramework.it('createElementSafely should mark elements with greenhouse tag', () => {
            const el = RC.createElementSafely('div', { id: 'test' });
            assert.equal(el.id, 'test');
            assert.equal(el['data-greenhouse-created'], 'true');
        });

        TestFramework.it('removeElementSafely should handle non-React elements normally', async () => {
            const mockEl = { parentNode: { removeChild: () => { global.removed = true; } } };
            global.removed = false;
            await RC.removeElementSafely(mockEl);
            assert.isTrue(global.removed);
        });

        TestFramework.it('removeElementSafely should refuse to remove React-managed elements', async () => {
            const mockEl = {
                parentNode: { removeChild: () => { } },
                _reactInternalFiber: {}
            };
            const result = await RC.removeElementSafely(mockEl);
            assert.isFalse(result);
        });
    });

    TestFramework.describe('Status Reporting', () => {
        TestFramework.it('getStatus should provide comprehensive diagnostic object', () => {
            const status = RC.getStatus();
            assert.isTrue(status.isFirefox);
            assert.isDefined(status.reactDetected);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
