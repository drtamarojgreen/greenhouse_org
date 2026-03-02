/**
 * @file test_react_compatibility.js
 * @description Unit tests for GreenhouseReactCompatibility.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = (overrides = {}) => {
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
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0' },
        requestAnimationFrame: (cb) => { setTimeout(cb, 16); },
        document: {
            querySelectorAll: () => [],
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                setAttribute: function (k, v) { this[k] = v; },
                appendChild: () => { },
                removeChild: () => { },
                parentNode: { removeChild: () => { } },
                hasAttribute: () => false
            }),
            body: { appendChild: () => { } }
        },
        ...overrides
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/GreenhouseReactCompatibility.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('GreenhouseReactCompatibility (Unit - Firefox Mock)', () => {

    TestFramework.it('should detect Firefox from user agent', () => {
        const env = createEnv();
        const RC = env.window.GreenhouseReactCompatibility;
        assert.isTrue(RC.isFirefox);
    });

    TestFramework.it('detectReact should check global window.React', () => {
        const env = createEnv({ React: { version: '18.2.0' } });
        const RC = env.window.GreenhouseReactCompatibility;
        assert.isTrue(RC.detectReact());
        assert.equal(RC.reactVersion, '18.2.0');
    });

    TestFramework.describe('Element LifeCycle Safety', () => {
        TestFramework.it('createElementSafely should mark elements with greenhouse tag', () => {
            const env = createEnv();
            const RC = env.window.GreenhouseReactCompatibility;
            const el = RC.createElementSafely('div', { id: 'test' });
            assert.equal(el.id, 'test');
            assert.equal(el['data-greenhouse-created'], 'true');
        });

        TestFramework.it('removeElementSafely should handle non-React elements normally', async () => {
            const env = createEnv();
            const RC = env.window.GreenhouseReactCompatibility;
            let removed = false;
            const mockEl = { parentNode: { removeChild: () => { removed = true; } } };
            await RC.removeElementSafely(mockEl);
            assert.isTrue(removed);
        });

        TestFramework.it('removeElementSafely should refuse to remove React-managed elements', async () => {
            const env = createEnv();
            const RC = env.window.GreenhouseReactCompatibility;
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
            const env = createEnv();
            const RC = env.window.GreenhouseReactCompatibility;
            const status = RC.getStatus();
            assert.isTrue(status.isFirefox);
            assert.isDefined(status.reactDetected);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
