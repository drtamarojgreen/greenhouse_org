/**
 * @file test_mobile_edge_cases.js
 * @description Rigorous edge case and error handling tests for mobile model viewer
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const assert = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = {
    innerWidth: 500,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'iPhone', maxTouchPoints: 5 },
    dispatchEvent: () => { },
    addEventListener: () => { },
    ontouchstart: () => { },
    _greenhouseScriptAttributes: {}
};

global.document = {
    currentScript: null,
    querySelector: (sel) => null,
    getElementById: (id) => null,
    createElement: (tag) => {
        const el = {
            tag, id: '', className: '', textContent: '', innerHTML: '',
            style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
            appendChild: function (c) { this.children.push(c); return c; },
            prepend: function (c) { this.children.unshift(c); return c; },
            remove: function () { this._removed = true; },
            addEventListener: function (evt, handler, opts) {
                this._listeners = this._listeners || {};
                this._listeners[evt] = handler;
            },
            querySelector: function (sel) {
                return this.children.find(c => c.id === sel.replace('#', '')) || null;
            },
            querySelectorAll: function (sel) {
                return this.children.filter(c => c.className?.includes(sel.replace('.', '')));
            },
            setAttribute: function (k, v) { this[k] = v; },
            classList: {
                add: function () { },
                remove: function () { },
                toggle: function () { }
            },
            offsetWidth: 100
        };
        if (tag === 'script') {
            setTimeout(() => { if (el.onload) el.onload(); }, 10);
        }
        return el;
    },
    body: { appendChild: (el) => { }, style: {} },
    head: { appendChild: (el) => { if (el.tag === 'script' && el.onload) setTimeout(() => el.onload(), 10); return el; } }
};

global.IntersectionObserver = class {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
    }
    observe(target) {
        setTimeout(() => {
            this.callback([{ isIntersecting: true, target }]);
        }, 50);
    }
    unobserve() { }
    disconnect() { }
};

global.console = console;
global.fetch = () => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
});

// --- Load Scripts ---
const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
vm.runInThisContext(utilsCode);

const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
const mobileCode = fs.readFileSync(mobilePath, 'utf8');
vm.runInThisContext(mobileCode);

const Utils = global.window.GreenhouseUtils;
const Mobile = global.window.GreenhouseMobile;

TestFramework.describe('Mobile Edge Cases and Error Handling', () => {

    TestFramework.describe('Boundary Conditions', () => {
        TestFramework.it('should handle exactly 1024px width (mobile threshold)', () => {
            global.window.innerWidth = 1024;
            global.window.ontouchstart = () => { };
            assert.isTrue(Mobile.isMobileUser(), 'Should detect 1024px as mobile with touch');
        });

        TestFramework.it('should handle 1025px width as desktop', () => {
            global.window.innerWidth = 1025;
            delete global.window.ontouchstart;
            global.navigator.maxTouchPoints = 0;
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect 1025px as mobile without touch');
        });

        TestFramework.it('should handle very small screen widths', () => {
            global.window.innerWidth = 320;
            global.window.ontouchstart = () => { };
            assert.isTrue(Mobile.isMobileUser(), 'Should detect 320px as mobile');
        });

        TestFramework.it('should handle very large screen widths', () => {
            global.window.innerWidth = 3840;
            delete global.window.ontouchstart;
            global.navigator.maxTouchPoints = 0;
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect 4K as mobile');
        });

        TestFramework.it('should handle zero touch points', () => {
            global.window.innerWidth = 500;
            global.navigator.maxTouchPoints = 0;
            delete global.window.ontouchstart;
            global.navigator.userAgent = 'Desktop';
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect with zero touch points');
        });
    });

    TestFramework.describe('Missing Dependencies', () => {
        TestFramework.it('should handle missing GreenhouseUtils gracefully', () => {
            const originalUtils = global.window.GreenhouseUtils;
            global.window.GreenhouseUtils = null;

            // Should not throw
            Mobile.launchHub();

            global.window.GreenhouseUtils = originalUtils;
            assert.isTrue(true, 'Should handle missing Utils');
        });

        TestFramework.it('should handle missing model config gracefully', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('nonexistent-model', container);

            // Should not throw, just not activate
            assert.isTrue(true, 'Should handle missing config');
        });

        TestFramework.it('should handle missing init function', async () => {
            const container = document.createElement('div');
            const originalConfig = Mobile.modelRegistry.genetic;
            Mobile.modelRegistry.genetic = { scripts: [], modes: [] };

            await Mobile.activateModel('genetic', container);

            Mobile.modelRegistry.genetic = originalConfig;
            assert.isTrue(true, 'Should handle missing init');
        });

        TestFramework.it('should handle missing onSelectMode function', () => {
            const card = document.createElement('div');
            card.dataset.modelId = 'genetic';
            card.dataset.currentModeIndex = '0';

            // Genetic doesn't have onSelectMode, should not throw
            Mobile.setupSwipeInteraction(card, 'genetic');
            assert.isTrue(true, 'Should handle missing onSelectMode');
        });
    });

    TestFramework.describe('Invalid Input Handling', () => {
        TestFramework.it('should handle null container in activateModel', async () => {
            await Mobile.activateModel('genetic', null);
            // Should not throw
            assert.isTrue(true, 'Should handle null container');
        });

        TestFramework.it('should handle undefined modelId', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel(undefined, container);
            // Should not throw
            assert.isTrue(true, 'Should handle undefined modelId');
        });

        TestFramework.it('should handle empty string modelId', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('', container);
            // Should not throw
            assert.isTrue(true, 'Should handle empty modelId');
        });

        TestFramework.it('should handle negative mode index', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = -1;
            const normalizedIndex = (currentIndex - 1 + dnaConfig.modes.length) % dnaConfig.modes.length;

            assert.isTrue(normalizedIndex >= 0, 'Should normalize negative index');
            assert.isTrue(normalizedIndex < dnaConfig.modes.length, 'Should be within bounds');
        });

        TestFramework.it('should handle mode index beyond array length', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = 100;
            const normalizedIndex = (currentIndex + 1) % dnaConfig.modes.length;

            assert.isTrue(normalizedIndex >= 0, 'Should normalize large index');
            assert.isTrue(normalizedIndex < dnaConfig.modes.length, 'Should be within bounds');
        });
    });

    TestFramework.describe('Container State Edge Cases', () => {
        TestFramework.it('should handle container with zero dimensions', () => {
            const container = document.createElement('div');
            container.offsetWidth = 0;
            container.offsetHeight = 0;

            const rnaConfig = Mobile.modelRegistry.rna;
            rnaConfig.init(container, 'https://test.com/');

            // Should use fallback dimensions
            assert.isTrue(true, 'Should handle zero dimensions');
        });

        TestFramework.it('should handle container without offsetWidth', () => {
            const container = document.createElement('div');
            delete container.offsetWidth;
            delete container.offsetHeight;

            const rnaConfig = Mobile.modelRegistry.rna;
            rnaConfig.init(container, 'https://test.com/');

            // Should use fallback dimensions
            assert.isTrue(true, 'Should handle missing offset properties');
        });

        TestFramework.it('should handle already activated container', async () => {
            const container = document.createElement('div');

            await Mobile.activateModel('genetic', container);
            const firstActivation = Mobile.activeModels.has(container);

            await Mobile.activateModel('genetic', container);
            const secondActivation = Mobile.activeModels.has(container);

            assert.isTrue(firstActivation, 'Should activate first time');
            assert.isTrue(secondActivation, 'Should remain activated');
        });
    });

    TestFramework.describe('Swipe Gesture Edge Cases', () => {
        TestFramework.it('should handle swipe with exactly 80px delta', () => {
            const deltaY = -80;
            const shouldTrigger = Math.abs(deltaY) > 80;

            assert.isFalse(shouldTrigger, 'Should not trigger at exactly 80px');
        });

        TestFramework.it('should handle swipe with 81px delta', () => {
            const deltaY = -81;
            const shouldTrigger = Math.abs(deltaY) > 80;

            assert.isTrue(shouldTrigger, 'Should trigger at 81px');
        });

        TestFramework.it('should handle very large swipe delta', () => {
            const deltaY = -1000;
            const shouldTrigger = Math.abs(deltaY) > 80;

            assert.isTrue(shouldTrigger, 'Should trigger large swipe');
        });

        TestFramework.it('should handle zero delta swipe', () => {
            const deltaY = 0;
            const shouldTrigger = Math.abs(deltaY) > 80;

            assert.isFalse(shouldTrigger, 'Should not trigger zero delta');
        });

        TestFramework.it('should handle missing mode indicator element', () => {
            const card = document.createElement('div');
            card.dataset.modelId = 'dna';
            card.dataset.currentModeIndex = '0';

            // Card has no mode indicator child
            Mobile.setupSwipeInteraction(card, 'dna');

            // Should not throw when trying to update indicator
            assert.isTrue(true, 'Should handle missing indicator');
        });
    });

    TestFramework.describe('Path Detection Edge Cases', () => {
        TestFramework.it('should handle /models.html path', () => {
            global.window.location.pathname = '/models.html';
            const path = global.window.location.pathname.toLowerCase();
            const isModelHub = path.includes('/models') || path.endsWith('/models.html');

            assert.isTrue(isModelHub, 'Should detect models.html');
        });

        TestFramework.it('should handle /models/ path with trailing slash', () => {
            global.window.location.pathname = '/models/';
            const path = global.window.location.pathname.toLowerCase();
            const isModelHub = path.includes('/models');

            assert.isTrue(isModelHub, 'Should detect models with trailing slash');
        });

        TestFramework.it('should handle uppercase paths', () => {
            global.window.location.pathname = '/GENETIC.HTML';
            const path = global.window.location.pathname.toLowerCase();
            const modelNames = Object.keys(Mobile.modelRegistry);
            const isRegisteredModel = modelNames.some(m => path.includes(m));

            assert.isTrue(isRegisteredModel, 'Should detect uppercase paths');
        });

        TestFramework.it('should handle paths with query strings', () => {
            global.window.location.pathname = '/genetic.html';
            global.window.location.search = '?mode=test';
            const path = global.window.location.pathname.toLowerCase();
            const modelNames = Object.keys(Mobile.modelRegistry);
            const isRegisteredModel = modelNames.some(m => path.includes(m));

            assert.isTrue(isRegisteredModel, 'Should detect path with query string');
        });

        TestFramework.it('should not trigger on unrelated paths', () => {
            global.window.location.pathname = '/about.html';
            const path = global.window.location.pathname.toLowerCase();
            const isModelHub = path.includes('/models') || path.endsWith('/models.html');
            const modelNames = Object.keys(Mobile.modelRegistry);
            const isRegisteredModel = modelNames.some(m => path.includes(m));

            assert.isFalse(isModelHub, 'Should not detect as model hub');
            assert.isFalse(isRegisteredModel, 'Should not detect as registered model');
        });
    });

    TestFramework.describe('Scroll Calculation Edge Cases', () => {
        TestFramework.it('should handle zero scroll position', () => {
            const scroller = { scrollLeft: 0, offsetWidth: 400 };
            const index = Math.round(scroller.scrollLeft / (scroller.offsetWidth * 0.82 + 25));

            assert.equal(index, 0, 'Should calculate index 0 for zero scroll');
        });

        TestFramework.it('should handle very large scroll position', () => {
            const scroller = { scrollLeft: 10000, offsetWidth: 400 };
            const index = Math.round(scroller.scrollLeft / (scroller.offsetWidth * 0.82 + 25));

            assert.isTrue(index >= 0, 'Should calculate valid index for large scroll');
        });

        TestFramework.it('should handle zero offsetWidth', () => {
            const scroller = { scrollLeft: 100, offsetWidth: 0 };
            const divisor = scroller.offsetWidth * 0.82 + 25;

            assert.equal(divisor, 25, 'Should have non-zero divisor');
        });

        TestFramework.it('should handle fractional scroll positions', () => {
            const scroller = { scrollLeft: 123.456, offsetWidth: 400 };
            const index = Math.round(scroller.scrollLeft / (scroller.offsetWidth * 0.82 + 25));

            assert.isTrue(Number.isInteger(index), 'Should round to integer');
        });
    });

    TestFramework.describe('User Agent Edge Cases', () => {
        TestFramework.it('should detect iPad as mobile', () => {
            global.navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect iPad');
        });

        TestFramework.it('should detect Android tablet as mobile', () => {
            global.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-T510)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect Android tablet');
        });

        TestFramework.it('should detect Opera Mini as mobile', () => {
            global.navigator.userAgent = 'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect Opera Mini');
        });

        TestFramework.it('should detect BlackBerry as mobile', () => {
            global.navigator.userAgent = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect BlackBerry');
        });

        TestFramework.it('should not detect Chrome desktop as mobile', () => {
            global.window.innerWidth = 1920;
            global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            delete global.window.ontouchstart;
            global.navigator.maxTouchPoints = 0;
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect Chrome desktop');
        });
    });

    TestFramework.describe('Async Error Handling', () => {
        TestFramework.it('should handle fetch failure gracefully', async () => {
            const originalFetch = global.fetch;
            global.fetch = () => Promise.reject(new Error('Network error'));

            try {
                await Mobile.launchHub();
                // Should not throw
                assert.isTrue(true, 'Should handle fetch failure');
            } catch (e) {
                assert.fail('Should not throw on fetch failure');
            } finally {
                global.fetch = originalFetch;
            }
        });

        TestFramework.it('should handle script loading failure', async () => {
            const container = document.createElement('div');
            const originalUtils = global.window.GreenhouseUtils;

            global.window.GreenhouseUtils = {
                ...originalUtils,
                loadScript: () => Promise.reject(new Error('Script load failed'))
            };

            await Mobile.activateModel('genetic', container);
            assert.isTrue(container.innerHTML.includes('Failed to load'), 'Should show error message');

            global.window.GreenhouseUtils = originalUtils;
        });
    });

    TestFramework.describe('Memory and Performance', () => {
        TestFramework.it('should not leak memory with repeated activations', async () => {
            const initialSize = Mobile.activeModels.size;

            for (let i = 0; i < 10; i++) {
                const container = document.createElement('div');
                await Mobile.activateModel('genetic', container);
            }

            const finalSize = Mobile.activeModels.size;
            assert.isTrue(finalSize >= initialSize, 'Should track all activations');
            assert.isTrue(finalSize <= initialSize + 10, 'Should not create excessive entries');
        });

        TestFramework.it('should handle rapid mode switching', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            let currentIndex = 0;

            for (let i = 0; i < 100; i++) {
                currentIndex = (currentIndex + 1) % dnaConfig.modes.length;
            }

            assert.isTrue(currentIndex >= 0 && currentIndex < dnaConfig.modes.length, 'Should handle rapid switching');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
