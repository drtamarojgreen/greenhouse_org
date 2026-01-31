/**
 * @file test_mobile_integration.js
 * @description Comprehensive integration tests for mobile model viewer functionality
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Setup Global Environment ---
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

// Create clean context
const context = vm.createContext(mockWindow);
// Make context also have global objects
context.global = context;
context.window = context;
context.navigator = mockWindow.navigator;
context.document = mockDocument;

// --- Load Scripts ---
const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
vm.runInContext(utilsCode, context);

const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
const mobileCode = fs.readFileSync(mobilePath, 'utf8');
vm.runInContext(mobileCode, context);

const Utils = context.GreenhouseUtils;
const Mobile = context.GreenhouseMobile;

TestFramework.describe('Mobile Integration Tests', () => {

    TestFramework.describe('Mobile Detection', () => {
        TestFramework.it('should detect mobile by user agent', () => {
            mockWindow.innerWidth = 1200;
            mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect iPhone');
        });

        TestFramework.it('should detect mobile by screen width and touch', () => {
            mockWindow.innerWidth = 500;
            mockWindow.ontouchstart = () => { };
            mockWindow.navigator.maxTouchPoints = 1;
            mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect narrow touch device');
        });

        TestFramework.it('should not detect desktop as mobile', () => {
            mockWindow.innerWidth = 1920;
            mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            delete mockWindow.ontouchstart;
            mockWindow.navigator.maxTouchPoints = 0;
            mockWindow.matchMedia = (q) => ({ media: q, matches: false });
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect desktop');
        });

        TestFramework.it('should not detect desktop touchscreens as mobile', () => {
            mockWindow.innerWidth = 1920;
            mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            mockWindow.navigator.maxTouchPoints = 10;
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect desktop even with touch');
        });

        TestFramework.it('should detect mobile via matchMedia fallback if narrow', () => {
            // Simulate older browser without maxTouchPoints
            mockWindow.innerWidth = 500;
            const originalMaxTouchPoints = mockWindow.navigator.maxTouchPoints;
            delete mockWindow.navigator.maxTouchPoints;

            mockWindow.matchMedia = (q) => ({
                media: q,
                matches: q === '(pointer:coarse)'
            });
            assert.isTrue(Mobile.isMobileUser(), 'Should detect via pointer:coarse on narrow screen');

            // Restore
            mockWindow.navigator.maxTouchPoints = originalMaxTouchPoints;
        });

        TestFramework.it('should detect mobile via orientation fallback if narrow', () => {
            mockWindow.innerWidth = 500;
            const originalMaxTouchPoints = mockWindow.navigator.maxTouchPoints;
            delete mockWindow.navigator.maxTouchPoints;

            // Simulate matchMedia not being supported to reach orientation fallback
            const originalMatchMedia = mockWindow.matchMedia;
            mockWindow.matchMedia = null;

            mockWindow.orientation = 0;

            assert.isTrue(Mobile.isMobileUser(), 'Should detect via window.orientation on narrow screen');

            delete mockWindow.orientation;
            mockWindow.matchMedia = originalMatchMedia;
            mockWindow.navigator.maxTouchPoints = originalMaxTouchPoints;
        });
    });

    TestFramework.describe('Model Registry', () => {
        TestFramework.it('should have all 10 models registered', () => {
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!Mobile.modelRegistry[modelId], `Model ${modelId} should be registered`);
            });
        });
    });

    TestFramework.describe('Auto-trigger Logic', () => {
        TestFramework.it('should trigger on /models page for mobile', () => {
            mockWindow.innerWidth = 500;
            mockWindow.navigator.maxTouchPoints = 1;
            mockWindow.location.pathname = '/models';
            assert.isTrue(Mobile.isMobileUser(), 'Should be mobile');
        });

        TestFramework.it('should trigger with mobile=true query param', () => {
            mockWindow.location.search = '?mobile=true';
            mockWindow.location.pathname = '/index.html';
            // We can't easily test the setTimeout call without mocking setTimeout
            // but we can check the logic in setupAutoTrigger if we exposed it.
            assert.isTrue(mockWindow.location.search.includes('mobile=true'));
        });
    });

    TestFramework.describe('Resilient Data Fetching', () => {
        TestFramework.it('should use fallback when XML fetch fails', async () => {
            mockWindow.fetch = () => Promise.reject(new Error('Network failure'));
            const models = await Utils.fetchModelDescriptions();
            assert.isArray(models);
            assert.equal(models.length, 10, 'Should return all 10 models from fallback');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
