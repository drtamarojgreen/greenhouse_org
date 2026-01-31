/**
 * @file test_mobile_viewer.js
 * @description Unit tests for the expanded mobile model viewer utility.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Setup Global Environment ---
const createMockWindow = () => ({
    innerWidth: 1200,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'Desktop', maxTouchPoints: 0, platform: 'Win32' },
    dispatchEvent: () => { },
    addEventListener: () => { },
    _greenhouseScriptAttributes: {},
    fetch: () => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
    }),
    URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
    Blob: class {},
    CustomEvent: class { constructor(name, data) { this.name = name; this.detail = data ? data.detail : null; } },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Promise: Promise,
    console: { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
    DOMParser: class {
        parseFromString(str) {
            return {
                querySelectorAll: () => [
                    { getAttribute: () => 'genetic', querySelector: (q) => ({ textContent: q === 'title' ? 'Genetic' : '/genetic' }) }
                ]
            };
        }
    }
});

const createMockElement = (tag) => ({
    tag, id: '', className: '', textContent: '', innerHTML: '',
    style: {}, dataset: {}, children: [], appendChild: function(c) { this.children.push(c); return c; }
});

const runInNewContext = (windowOverrides = {}) => {
    const mockWindow = createMockWindow();
    Object.keys(windowOverrides).forEach(key => {
        if (typeof windowOverrides[key] === 'object' && mockWindow[key] && !Array.isArray(windowOverrides[key])) {
            Object.assign(mockWindow[key], windowOverrides[key]);
        } else {
            mockWindow[key] = windowOverrides[key];
        }
    });

    const mockDocument = {
        createElement: createMockElement,
        body: createMockElement('body'),
        head: createMockElement('head'),
        querySelector: () => null,
        getElementById: () => null
    };
    mockWindow.document = mockDocument;

    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;
    context.navigator = mockWindow.navigator;
    context.document = mockDocument;

    const utilsCode = fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseUtils.js'), 'utf8');
    vm.runInContext(utilsCode, context);
    const mobileCode = fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseMobile.js'), 'utf8');
    vm.runInContext(mobileCode, context);

    return context;
};

TestFramework.describe('Mobile Model Viewer (Unit)', () => {

    TestFramework.describe('isMobileUser detection', () => {
        TestFramework.it('should return false for desktop width and UA', () => {
            const context = runInNewContext();
            assert.isFalse(context.GreenhouseUtils.isMobileUser(), 'Should not be mobile');
        });

        TestFramework.it('should return true for mobile=true query param', () => {
            const context = runInNewContext({ location: { search: '?mobile=true' } });
            assert.isTrue(context.GreenhouseUtils.isMobileUser(), 'Should be mobile via query param');
        });

        TestFramework.it('should return true for mobile UA', () => {
            const context = runInNewContext({ navigator: { userAgent: 'iPhone', maxTouchPoints: 5 } });
            assert.isTrue(context.GreenhouseUtils.isMobileUser(), 'Should be mobile via UA');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
