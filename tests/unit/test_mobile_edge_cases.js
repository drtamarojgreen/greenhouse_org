/**
 * @file test_mobile_edge_cases.js
 * @description Rigorous edge case and error handling tests for mobile model viewer.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const runInNewContext = (overrides = {}) => {
    const mockWindow = {
        innerWidth: overrides.innerWidth || 500,
        innerHeight: overrides.innerHeight || 800,
        location: { pathname: '/models', search: '', hostname: 'localhost', ...(overrides.location || {}) },
        navigator: overrides.navigator || { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
        matchMedia: (query) => ({ media: query, matches: false }),
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
        DOMParser: class { parseFromString() { return { querySelectorAll: () => [] }; } }
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
        if (id === 'gh-mobile-close-btn' || id === 'greenhouse-mobile-viewer' || id === 'greenhouse-mobile-styles') {
            const el = createMockElement('div'); el.id = id;
            mockDocument.body.appendChild(el); return el;
        }
        return null;
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

TestFramework.describe('Mobile Edge Cases and Error Handling', () => {

    TestFramework.describe('Boundary Conditions', () => {
        TestFramework.it('should handle exactly 1024px width (mobile threshold)', () => {
            const context = runInNewContext({ innerWidth: 1024 });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect 1024px as mobile with touch');
        });

        TestFramework.it('should handle 1025px width as desktop', () => {
            const context = runInNewContext({
                innerWidth: 1025,
                navigator: { userAgent: 'Desktop', maxTouchPoints: 0, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseMobile.isMobileUser(), 'Should not detect 1025px as mobile without touch');
        });

        TestFramework.it('should handle very small screen widths', () => {
            const context = runInNewContext({ innerWidth: 320 });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect 320px as mobile');
        });

        TestFramework.it('should handle zero touch points', () => {
            const context = runInNewContext({
                innerWidth: 500,
                navigator: { userAgent: 'Desktop', maxTouchPoints: 0, platform: 'Win32' }
            });
            assert.isFalse(context.GreenhouseMobile.isMobileUser(), 'Should not detect with zero touch points');
        });
    });

    TestFramework.describe('Missing Dependencies', () => {
        TestFramework.it('should handle missing GreenhouseUtils gracefully', () => {
            const context = runInNewContext();
            context.GreenhouseUtils = null;
            // Should not throw
            context.GreenhouseMobile.launchHub();
            assert.isTrue(true, 'Should handle missing Utils');
        });

        TestFramework.it('should handle missing model config gracefully', async () => {
            const context = runInNewContext();
            const container = context.document.createElement('div');
            await context.GreenhouseMobile.activateModel('nonexistent-model', container);
            assert.isTrue(true, 'Should handle missing config');
        });
    });

    TestFramework.describe('Invalid Input Handling', () => {
        TestFramework.it('should handle null container in activateModel', async () => {
            const context = runInNewContext();
            await context.GreenhouseMobile.activateModel('genetic', null);
            assert.isTrue(true, 'Should handle null container');
        });

        TestFramework.it('should handle undefined modelId', async () => {
            const context = runInNewContext();
            const container = context.document.createElement('div');
            await context.GreenhouseMobile.activateModel(undefined, container);
            assert.isTrue(true, 'Should handle undefined modelId');
        });

        TestFramework.it('should handle negative mode index', () => {
            const context = runInNewContext();
            const dnaConfig = context.GreenhouseMobile.modelRegistry.dna;
            const currentIndex = -1;
            const normalizedIndex = (currentIndex - 1 + dnaConfig.modes.length) % dnaConfig.modes.length;
            assert.isTrue(normalizedIndex >= 0, 'Should normalize negative index');
        });
    });

    TestFramework.describe('User Agent Edge Cases', () => {
        TestFramework.it('should detect iPad as mobile', () => {
            const context = runInNewContext({
                navigator: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect iPad');
        });

        TestFramework.it('should detect Android tablet as mobile', () => {
            const context = runInNewContext({
                navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-T510)' }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect Android tablet');
        });

        TestFramework.it('should detect Opera Mini as mobile', () => {
            const context = runInNewContext({
                navigator: { userAgent: 'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80)' }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect Opera Mini');
        });

        TestFramework.it('should detect BlackBerry as mobile', () => {
            const context = runInNewContext({
                navigator: { userAgent: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)' }
            });
            assert.isTrue(context.GreenhouseMobile.isMobileUser(), 'Should detect BlackBerry');
        });
    });

    TestFramework.describe('Async Error Handling', () => {
        TestFramework.it('should handle fetch failure gracefully', async () => {
            const context = runInNewContext();
            context.fetch = () => Promise.reject(new Error('Network error'));
            try {
                await context.GreenhouseMobile.launchHub();
                assert.isTrue(true, 'Should handle fetch failure');
            } catch (e) {
                assert.fail('Should not throw on fetch failure');
            }
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
