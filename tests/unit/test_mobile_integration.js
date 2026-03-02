/**
 * @file test_mobile_integration.js
 * @description Comprehensive integration tests for mobile model viewer functionality
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = (overrides = {}) => {
    // If running in harness with pre-initialized state
    if (typeof window !== 'undefined' && window.GreenhouseMobile && !overrides.navigator) {
        return window;
    }

    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        innerWidth: 1200,
        innerHeight: 800,
        location: { pathname: '/models', search: '', hostname: 'localhost' },
        navigator: { userAgent: 'Desktop', maxTouchPoints: 0 },
        matchMedia: (query) => ({
            media: query,
            matches: false
        }),
        dispatchEvent: () => { },
        addEventListener: () => { },
        _greenhouseScriptAttributes: {},
        document: null,
        Map: Map,
        Set: Set,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        Promise: Promise,
        AbortController: class { constructor() { this.signal = {}; } abort() {} },
        CustomEvent: class { constructor(name, data) { this.name = name; this.detail = data ? data.detail : null; } },
        fetch: () => Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
        }),
        DOMParser: class {
            parseFromString(str, type) {
                return {
                    querySelectorAll: () => []
                };
            }
        },
        URL: {
            createObjectURL: () => 'blob:mock',
            revokeObjectURL: () => { }
        },
        Blob: class { constructor() {} },
        console: console,
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; }
            observe(target) { setTimeout(() => this.callback([{ isIntersecting: true, target }]), 10); }
            unobserve() {}
            disconnect() {}
        }
    };

    const createMockElement = (tag) => ({
        tagName: tag.toUpperCase(),
        id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [],
        appendChild: function (c) {
            this.children.push(c);
            c.parentNode = this;
            return c;
        },
        prepend: function (c) {
            this.children.unshift(c);
            c.parentNode = this;
            return c;
        },
        remove: function () {
            if (this.parentNode) {
                const idx = this.parentNode.children.indexOf(this);
                if (idx > -1) this.parentNode.children.splice(idx, 1);
            }
        },
        addEventListener: function () { },
        querySelector: function (sel) {
            if (sel === '#gh-mobile-scroller' || sel === '#gh-mobile-dots' || sel === '.gh-mobile-canvas-wrapper' || sel === '#greenhouse-mobile-close-btn') {
                const sub = createMockElement('div');
                sub.id = sel.startsWith('#') ? sel.substring(1) : '';
                this.appendChild(sub);
                return sub;
            }
            return null;
        },
        querySelectorAll: function () { return []; },
        setAttribute: function (k, v) { this[k] = v; },
        getAttribute: function (k) { return this[k]; }
    });

    const mockDocument = {
        readyState: 'complete',
        currentScript: null,
        querySelector: function (sel) { return null; },
        getElementById: function (id) { return null; },
        createElement: createMockElement,
        body: createMockElement('body'),
        head: createMockElement('head'),
        addEventListener: () => { }
    };
    mockWindow.document = mockDocument;

    // Apply overrides
    Object.keys(overrides).forEach(key => {
        if (typeof overrides[key] === 'object' && mockWindow[key] && !Array.isArray(overrides[key])) {
            Object.assign(mockWindow[key], overrides[key]);
        } else {
            mockWindow[key] = overrides[key];
        }
    });

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;
    context.navigator = mockWindow.navigator;
    context.document = mockWindow.document;

    const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
    const utilsCode = fs.readFileSync(utilsPath, 'utf8');
    vm.runInContext(utilsCode, context);

    const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
    const mobileCode = fs.readFileSync(mobilePath, 'utf8');
    vm.runInContext(mobileCode, context);

    return context;
};

TestFramework.describe('Mobile Integration Tests', () => {

    TestFramework.describe('Mobile Detection', () => {
        TestFramework.it('should detect mobile by user agent', () => {
            const env = createEnv({ navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' } });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect iPhone');
        });

        TestFramework.it('should detect iPad Pro (MacIntel + multi-touch)', () => {
            const env = createEnv({
                innerWidth: 1024,
                navigator: {
                    platform: 'MacIntel',
                    maxTouchPoints: 5,
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
                }
            });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect iPad Pro as mobile');
        });

        TestFramework.it('should detect mobile by screen width and touch', () => {
            const env = createEnv({
                innerWidth: 500,
                navigator: { maxTouchPoints: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                ontouchstart: () => { }
            });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect narrow touch device');
        });

        TestFramework.it('should not detect desktop as mobile', () => {
            const env = createEnv({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 0 }
            });
            assert.isFalse(env.GreenhouseMobile.isMobileUser(), 'Should not detect desktop');
        });

        TestFramework.it('should not detect desktop touchscreens as mobile', () => {
            const env = createEnv({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 10 }
            });
            assert.isFalse(env.GreenhouseMobile.isMobileUser(), 'Should not detect desktop even with touch');
        });

        TestFramework.it('should detect mobile via matchMedia fallback if narrow', () => {
            const env = createEnv({
                innerWidth: 500,
                navigator: { maxTouchPoints: 0 },
                matchMedia: (q) => ({
                    media: q,
                    matches: q === '(pointer:coarse)'
                })
            });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect via pointer:coarse on narrow screen');
        });
    });

    TestFramework.describe('Model Registry', () => {
        TestFramework.it('should have all required models registered', () => {
            const env = createEnv();
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!env.GreenhouseMobile.modelRegistry[modelId], `Model ${modelId} should be registered`);
            });
        });
    });

    TestFramework.describe('Resilient Data Fetching', () => {
        TestFramework.it('should use fallback when XML fetch fails', async () => {
            const env = createEnv({ fetch: () => Promise.reject(new Error('Network failure')) });
            const models = await env.GreenhouseUtils.fetchModelDescriptions();
            assert.isArray(models);
            assert.equal(models.length, 10, 'Should return all 10 models from fallback');
        });
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
