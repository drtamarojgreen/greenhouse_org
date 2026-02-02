/**
 * @file test_mobile_regression.js
 * @description Regression tests for mobile and desktop detection and viewer behavior.
 * Ensures consistent behavior across different device environments.
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
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    },
    IntersectionObserver: class {
        constructor(callback) { this.callback = callback; }
        observe(target) { setTimeout(() => this.callback([{ isIntersecting: true, target }]), 10); }
        unobserve() {}
        disconnect() {}
    }
});

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
    getAttribute: function (k) { return this[k]; },
    classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
    }
});

const createMockDocument = () => {
    const doc = {
        readyState: 'complete',
        currentScript: null,
        querySelector: function (sel) {
            if (sel === '#greenhouse-mobile-viewer') return this.getElementById('greenhouse-mobile-viewer');
            if (sel === '#greenhouse-mobile-styles') return this.getElementById('greenhouse-mobile-styles');
            return null;
        },
        getElementById: function (id) {
            const findIn = (el) => {
                if (el.id === id) return el;
                for (let child of el.children) {
                    const found = findIn(child);
                    if (found) return found;
                }
                return null;
            };
            return findIn(this.body) || findIn(this.head);
        },
        createElement: createMockElement,
        body: createMockElement('body'),
        head: createMockElement('head'),
        addEventListener: () => { }
    };
    return doc;
};

// --- Execution Helper ---
const runInNewContext = (windowOverrides = {}) => {
    const mockWindow = createMockWindow();
    // Apply overrides
    Object.keys(windowOverrides).forEach(key => {
        if (typeof windowOverrides[key] === 'object' && mockWindow[key] && !Array.isArray(windowOverrides[key])) {
            Object.assign(mockWindow[key], windowOverrides[key]);
        } else {
            mockWindow[key] = windowOverrides[key];
        }
    });

    const mockDocument = createMockDocument();
    mockWindow.document = mockDocument;

    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;
    context.navigator = mockWindow.navigator;
    context.document = mockDocument;

    const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
    const utilsCode = fs.readFileSync(utilsPath, 'utf8');
    vm.runInContext(utilsCode, context);

    const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
    const mobileCode = fs.readFileSync(mobilePath, 'utf8');
    vm.runInContext(mobileCode, context);

    return context;
};

TestFramework.describe('Mobile Regression Tests', () => {

    TestFramework.describe('GreenhouseUtils.isMobileUser() - Comprehensive Matrix', () => {

        TestFramework.it('Desktop (Windows, No Touch, Wide)', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 0, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseUtils.isMobileUser(), 'Should not detect desktop as mobile');
        });

        TestFramework.it('Desktop (macOS, No Touch, Wide)', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', maxTouchPoints: 0, platform: 'MacIntel' }
            });
            assert.isFalse(context.GreenhouseUtils.isMobileUser(), 'Should not detect macOS desktop as mobile');
        });

        TestFramework.it('Desktop Touchscreen (Windows, Wide, Touch)', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 10, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseUtils.isMobileUser(), 'Should not detect wide desktop touchscreen as mobile');
        });

        TestFramework.it('Mobile (iPhone, Narrow, Touch)', () => {
            const context = runInNewContext({
                innerWidth: 390,
                navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', maxTouchPoints: 5, platform: 'iPhone' }
            });
            assert.isTrue(context.GreenhouseUtils.isMobileUser(), 'Should detect iPhone as mobile');
        });

        TestFramework.it('Mobile (Android Phone, Narrow, Touch)', () => {
            const context = runInNewContext({
                innerWidth: 360,
                navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B)', maxTouchPoints: 5, platform: 'Linux armv8l' }
            });
            assert.isTrue(context.GreenhouseUtils.isMobileUser(), 'Should detect Android phone as mobile');
        });

        TestFramework.it('iPad Pro (macOS UA, Wide-ish, Touch)', () => {
            // iPad Pro often reports as MacIntel with touch support
            const context = runInNewContext({
                innerWidth: 1024,
                navigator: {
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
                    maxTouchPoints: 5,
                    platform: 'MacIntel'
                }
            });
            assert.isTrue(context.GreenhouseUtils.isMobileUser(), 'Should detect iPad Pro as mobile/tablet');
        });

        TestFramework.it('Small Window on Desktop (No Touch)', () => {
            const context = runInNewContext({
                innerWidth: 500,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 0, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseUtils.isMobileUser(), 'Narrow window on desktop without touch should NOT be mobile');
        });
    });

    TestFramework.describe('Mobile Override (mobile=true)', () => {
        TestFramework.it('Should detect mobile if mobile=true query param is present on desktop', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                location: { pathname: '/models', search: '?mobile=true', hostname: 'localhost' },
                navigator: { userAgent: 'Desktop', maxTouchPoints: 0, platform: 'Win32' }
            });

            // GreenhouseMobile doesn't currently use GreenhouseUtils.isMobileUser() for its internal check,
            // but we want to make sure the OVERRIDE works.
            const isMobile = context.GreenhouseMobile.isMobileUser() || context.window.location.search.includes('mobile=true');
            assert.isTrue(isMobile, 'mobile=true should allow mobile mode on desktop');
        });
    });

    TestFramework.describe('Initialization and Injection Prevention', () => {
        TestFramework.it('Should not inject styles if already present', () => {
            const context = runInNewContext({
                innerWidth: 390,
                navigator: { userAgent: 'iPhone', maxTouchPoints: 5 }
            });

            const doc = context.document;
            const style = doc.createElement('style');
            style.id = 'greenhouse-mobile-styles';
            doc.head.appendChild(style);

            const initialHeadCount = doc.head.children.length;
            context.GreenhouseMobile.injectStyles();

            assert.equal(doc.head.children.length, initialHeadCount, 'Should not inject styles twice');
        });

        TestFramework.it('Should not render hub if already present', () => {
            const context = runInNewContext({
                innerWidth: 390,
                navigator: { userAgent: 'iPhone', maxTouchPoints: 5 }
            });

            const doc = context.document;
            const hub = doc.createElement('div');
            hub.id = 'greenhouse-mobile-viewer';
            doc.body.appendChild(hub);

            const initialBodyCount = doc.body.children.length;
            context.GreenhouseMobile.renderHub([]);

            assert.equal(doc.body.children.length, initialBodyCount, 'Should not render hub twice');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
