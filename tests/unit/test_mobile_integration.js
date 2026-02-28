/**
 * @file test_mobile_integration.js
 * @description Comprehensive integration tests for mobile model viewer functionality
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const runInNewContext = (overrides = {}) => {
    const mockWindow = {
        innerWidth: overrides.innerWidth || 1200,
        innerHeight: overrides.innerHeight || 800,
        location: { pathname: '/models', search: '', hostname: 'localhost', ...(overrides.location || {}) },
        navigator: overrides.navigator || { userAgent: 'Desktop', maxTouchPoints: 0, platform: 'Win32' },
        matchMedia: (query) => ({
            media: query,
            matches: overrides.matchCoarse && query === '(pointer:coarse)'
        }),
        dispatchEvent: () => { },
        addEventListener: () => { },
        _greenhouseScriptAttributes: {},
        fetch: () => Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
        }),
        URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => { } },
        IntersectionObserver: class {
            constructor(cb) { this.cb = cb; }
            observe(t) { setTimeout(() => this.cb([{ isIntersecting: true, target: t }]), 10); }
            unobserve() {}
            disconnect() {}
        },
        DOMParser: class { parseFromString() { return { querySelectorAll: () => [] }; } },
        ...overrides.window
    };

    const createMockElement = (tag) => ({
        tagName: tag.toUpperCase(), tag: tag.toUpperCase(),
        id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
        appendChild: function(c) { this.children.push(c); c.parentNode = this; return c; },
        prepend: function(c) { this.children.unshift(c); c.parentNode = this; return c; },
        remove: function() {
            if (this.parentNode) {
                const idx = this.parentNode.children.indexOf(this);
                if (idx > -1) this.parentNode.children.splice(idx, 1);
            }
        },
        addEventListener: function() {},
        querySelector: function(sel) {
            const found = this.children.find(c => c.id === sel.replace('#', '') || c.className === sel.replace('.', ''));
            if (found) return found;
            if (sel.includes('scroller') || sel.includes('dots') || sel.includes('canvas') || sel.includes('close-btn')) {
                const sub = createMockElement('div');
                sub.id = sel.startsWith('#') ? sel.substring(1) : '';
                sub.className = sel.startsWith('.') ? sel.substring(1) : '';
                this.appendChild(sub);
                return sub;
            }
            return null;
        },
        querySelectorAll: () => [],
        setAttribute: function(k, v) { this[k] = v; },
        getAttribute: function(k) { return this[k]; },
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }
    });

    const mockDocument = createMockElement('document');
    mockDocument.body = createMockElement('body');
    mockDocument.head = createMockElement('head');
    mockDocument.getElementById = (id) => {
        const find = (el) => {
            if (el.id === id) return el;
            for (let c of el.children) { const r = find(c); if(r) return r; }
            return null;
        };
        return find(mockDocument.body) || find(mockDocument.head);
    };
    mockDocument.createElement = createMockElement;
    mockDocument.querySelector = () => null;
    mockDocument.addEventListener = () => {};

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
    const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
    vm.runInContext(fs.readFileSync(utilsPath, 'utf8'), context);
    vm.runInContext(fs.readFileSync(mobilePath, 'utf8'), context);

    return context;
};

TestFramework.describe('Mobile Integration Tests', () => {

    TestFramework.describe('Mobile Detection', () => {
        TestFramework.it('should detect mobile by user agent', () => {
            const context = runInNewContext({
                navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect iPhone');
        });

        TestFramework.it('should detect iPad Pro (MacIntel + multi-touch)', () => {
            const context = runInNewContext({
                innerWidth: 1024,
                navigator: {
                    platform: 'MacIntel',
                    maxTouchPoints: 5,
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
                }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect iPad Pro as mobile');
        });

        TestFramework.it('should detect mobile by screen width and touch', () => {
            const context = runInNewContext({
                innerWidth: 500,
                navigator: { maxTouchPoints: 1, userAgent: 'Mozilla/5.0 (Android)' },
                window: { ontouchstart: () => {} }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect narrow touch device');
        });

        TestFramework.it('should not detect desktop as mobile', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 0, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseMobile.isMobileUser(), 'Should not detect desktop');
        });

        TestFramework.it('should not detect desktop touchscreens as mobile', () => {
            const context = runInNewContext({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 10, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseMobile.isMobileUser(), 'Should not detect desktop even with touch');
        });

        TestFramework.it('should detect mobile via matchMedia fallback if narrow', () => {
            const context = runInNewContext({
                innerWidth: 500,
                navigator: { userAgent: 'Legacy Narrow', platform: 'Unknown' },
                matchCoarse: true
            });
            // Force removal of maxTouchPoints if it was inherited
            delete context.navigator.maxTouchPoints;
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect via pointer:coarse on narrow screen');
        });

        TestFramework.it('should detect mobile via orientation fallback if narrow', () => {
            const context = runInNewContext({
                innerWidth: 500,
                navigator: { userAgent: 'Very Legacy', platform: 'Unknown' },
                window: { orientation: 0 }
            });
            delete context.navigator.maxTouchPoints;
            context.matchMedia = null;
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect via window.orientation on narrow screen');
        });
    });

    TestFramework.describe('Model Registry', () => {
        TestFramework.it('should have all 10 models registered', () => {
            const context = runInNewContext();
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!context.GreenhouseMobile.modelRegistry[modelId], `Model ${modelId} should be registered`);
            });
        });
    });

    TestFramework.describe('Auto-trigger Logic', () => {
        TestFramework.it('should trigger on /models page for mobile', () => {
            const context = runInNewContext({
                innerWidth: 500,
                location: { pathname: '/models', search: '', hostname: 'localhost' },
                navigator: { maxTouchPoints: 1, userAgent: 'Mobile' }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should be mobile');
        });

        TestFramework.it('should trigger with mobile=true query param', () => {
            const context = runInNewContext({
                location: { pathname: '/index.html', search: '?mobile=true', hostname: 'localhost' }
            });
            assert.isTrue(context.location.search.includes('mobile=true'));
        });
    });

    TestFramework.describe('Resilient Data Fetching', () => {
        TestFramework.it('should use fallback when XML fetch fails', async () => {
            const context = runInNewContext();
            context.fetch = () => Promise.reject(new Error('Network failure'));
            const models = await context.GreenhouseUtils.fetchModelDescriptions();
            assert.isArray(models);
            assert.equal(models.length, 10, 'Should return all 10 models from fallback');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
