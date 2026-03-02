/**
 * @file test_tech_canvas.js
 * @description Unit tests for the conditional canvas drawing logic on the tech page.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = (overrides = {}) => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const createMockElement = (tag) => ({
        tagName: tag.toUpperCase(),
        id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [],
        appendChild: function (c) { this.children.push(c); return c; },
        after: function (el) { this.nextSibling = el; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        getContext: function () {
            return {
                fillRect: function () {},
                strokeRect: function () {},
                fillText: function () {},
                measureText: function () { return { width: 100 }; },
                beginPath: function() {},
                moveTo: function() {},
                lineTo: function() {},
                stroke: function() {}
            };
        },
        classList: { add: function () {} },
        addEventListener: function () {}
    });

    const mockWindow = {
        innerWidth: 1200,
        navigator: { userAgent: 'Desktop', maxTouchPoints: 0 },
        location: { pathname: '/tech', search: '' },
        document: {
            readyState: 'complete',
            createElement: createMockElement,
            querySelector: function () { return createMockElement('div'); },
            body: {
                contains: () => true,
                appendChild: () => {},
                children: []
            },
            addEventListener: () => {}
        },
        console: { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
        setTimeout: (fn) => fn(),
        setInterval: () => 123,
        clearInterval: () => {},
        Promise: Promise,
        Map: Map,
        Set: Set,
        CustomEvent: class { constructor(name, data) { this.name = name; this.detail = data ? data.detail : null; } },
        dispatchEvent: () => {},
        addEventListener: () => {}
    };
    Object.assign(mockWindow, overrides);

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
    const utilsCode = fs.readFileSync(utilsPath, 'utf8');
    vm.runInContext(utilsCode, context);

    context.GreenhouseUtils.waitForElement = () => Promise.resolve(createMockElement('div'));

    return { context, mockWindow };
};

TestFramework.describe('Tech Page Canvas Mobile Detection', () => {

    TestFramework.it('should draw "Mobile Browser Detected" on canvas when isMobileUser is true', async () => {
        const { context, mockWindow } = createEnv({
            innerWidth: 500,
            navigator: { maxTouchPoints: 1, userAgent: 'iPhone' }
        });

        let messageDetected = false;
        const originalCreateElement = mockWindow.document.createElement;
        mockWindow.document.createElement = (tag) => {
            const el = originalCreateElement(tag);
            if (tag === 'canvas') {
                const originalGetContext = el.getContext;
                el.getContext = () => {
                    const ctx = originalGetContext();
                    ctx.fillText = (text) => {
                        if (text === 'Mobile Browser Detected') messageDetected = true;
                    };
                    return ctx;
                };
            }
            return el;
        };

        const path = require('path');
        const fs = require('fs');
        const techPath = path.join(__dirname, '../../docs/js/tech.js');
        const techCode = fs.readFileSync(techPath, 'utf8');
        const vm = require('vm');
        vm.runInContext(techCode, context);

        await new Promise(resolve => setTimeout(resolve, 50));
        assert.isTrue(messageDetected, 'Canvas should have drawn "Mobile Browser Detected"');
    });

    TestFramework.it('should NOT draw mobile message when isMobileUser is false', async () => {
        const { context, mockWindow } = createEnv({
            innerWidth: 1920,
            navigator: { maxTouchPoints: 0, userAgent: 'Desktop' }
        });

        let messageDetected = false;
        const originalCreateElement = mockWindow.document.createElement;
        mockWindow.document.createElement = (tag) => {
            const el = originalCreateElement(tag);
            if (tag === 'canvas') {
                const originalGetContext = el.getContext;
                el.getContext = () => {
                    const ctx = originalGetContext();
                    ctx.fillText = (text) => {
                        if (text === 'Mobile Browser Detected') messageDetected = true;
                    };
                    return ctx;
                };
            }
            return el;
        };

        const path = require('path');
        const fs = require('fs');
        const techPath = path.join(__dirname, '../../docs/js/tech.js');
        const techCode = fs.readFileSync(techPath, 'utf8');
        const vm = require('vm');
        vm.runInContext(techCode, context);

        await new Promise(resolve => setTimeout(resolve, 50));
        assert.isFalse(messageDetected, 'Canvas should NOT have drawn mobile message on desktop');
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
