/**
 * @file test_tech_canvas.js
 * @description Unit tests for the conditional canvas drawing logic on the tech page.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = (overrides = {}) => {
    const mockWindow = {
        innerWidth: overrides.innerWidth || 1200,
        navigator: overrides.navigator || { userAgent: 'Desktop', maxTouchPoints: 0 },
        location: { pathname: '/tech', search: '', ...(overrides.location || {}) },
        setTimeout: (fn) => fn(),
        setInterval: () => 123,
        clearInterval: () => {},
        CustomEvent: class { constructor(n, d) { this.name = n; this.detail = d ? d.detail : null; } },
        dispatchEvent: () => {},
        addEventListener: () => {}
    };

    const createMockElement = (tag) => ({
        tagName: tag.toUpperCase(), id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [],
        appendChild: function(c) { this.children.push(c); return c; },
        after: function(el) { this.nextSibling = el; },
        querySelector: function(sel) {
            if (sel.includes('wixui-column-strip')) return createMockElement('section');
            return null;
        },
        querySelectorAll: () => [],
        getContext: function() {
            return {
                fillRect: () => {}, strokeRect: () => {},
                fillText: function(t) { if (t === 'Mobile Browser Detected') this._mobileDetected = true; },
                measureText: () => ({ width: 100 }),
                beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}
            };
        },
        classList: { add: () => {} },
        addEventListener: () => {}
    });

    const mockDocument = {
        readyState: 'complete',
        createElement: createMockElement,
        querySelector: () => createMockElement('div'),
        body: { contains: () => true, appendChild: () => {}, children: [] },
        head: { appendChild: () => {} },
        addEventListener: () => {}
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    const load = (n) => {
        const c = fs.readFileSync(path.join(__dirname, '../../docs/js', n), 'utf8');
        vm.runInContext(c, context);
    };

    load('GreenhouseUtils.js');
    context.GreenhouseUtils.waitForElement = (sel) => {
        if (sel.includes('column-strip')) return Promise.resolve(createMockElement('section'));
        return Promise.resolve(createMockElement('div'));
    };

    context.loadTech = () => load('tech.js');

    return context;
};

TestFramework.describe('Tech Page Canvas Mobile Detection', () => {

    TestFramework.it('should draw "Mobile Browser Detected" on canvas when isMobileUser is true', async () => {
        const env = createEnv({
            innerWidth: 500,
            navigator: { userAgent: 'iPhone', maxTouchPoints: 5 }
        });

        // Use a proxy to capture the created canvas
        let capturedCtx = null;
        const originalCreate = env.document.createElement;
        env.document.createElement = (tag) => {
            const el = originalCreate(tag);
            if (tag === 'canvas') {
                const originalGet = el.getContext;
                el.getContext = () => {
                    capturedCtx = originalGet.call(el);
                    return capturedCtx;
                };
            }
            return el;
        };

        env.loadTech();
        await new Promise(res => setTimeout(res, 50));

        assert.isTrue(capturedCtx && capturedCtx._mobileDetected, 'Canvas should have drawn "Mobile Browser Detected"');
    });

    TestFramework.it('should NOT draw mobile message when isMobileUser is false', async () => {
        const env = createEnv({
            innerWidth: 1920,
            navigator: { userAgent: 'Desktop', maxTouchPoints: 0 }
        });

        let capturedCtx = null;
        const originalCreate = env.document.createElement;
        env.document.createElement = (tag) => {
            const el = originalCreate(tag);
            if (tag === 'canvas') {
                const originalGet = el.getContext;
                el.getContext = () => {
                    capturedCtx = originalGet.call(el);
                    return capturedCtx;
                };
            }
            return el;
        };

        env.loadTech();
        await new Promise(res => setTimeout(res, 50));

        assert.isFalse(capturedCtx && capturedCtx._mobileDetected, 'Canvas should NOT have drawn mobile message on desktop');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
