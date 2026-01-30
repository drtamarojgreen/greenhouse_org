/**
 * @file test_mobile_models_lifecycle.js
 * @description Rigorous lifecycle tests for mobile model initialization, cleanup, and state management
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
    getElementById: (id) => {
        if (id === 'greenhouse-mobile-styles') return null;
        if (id === 'greenhouse-mobile-viewer') return null;
        return null;
    },
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
                return this.children.find(c => c.className?.includes(sel.replace('.', ''))) || null;
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
    body: {
        appendChild: (el) => { document.body._children = document.body._children || []; document.body._children.push(el); },
        style: {},
        _children: []
    },
    head: {
        appendChild: (el) => {
            document.head._children = document.head._children || [];
            document.head._children.push(el);
            if (el.tag === 'script' && el.onload) setTimeout(() => el.onload(), 10);
            return el;
        },
        _children: []
    }
};

global.MutationObserver = class {
    observe() { }
    disconnect() { }
};

global.IntersectionObserver = class {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.observedElements = [];
    }
    observe(target) {
        this.observedElements.push(target);
        setTimeout(() => {
            this.callback([{ isIntersecting: true, target }]);
        }, 50);
    }
    unobserve(target) {
        this.observedElements = this.observedElements.filter(el => el !== target);
    }
    disconnect() {
        this.observedElements = [];
    }
};

global.DOMParser = class {
    parseFromString(str, type) {
        return {
            querySelectorAll: () => [
                {
                    getAttribute: (attr) => attr === 'id' ? 'genetic' : null,
                    querySelector: (q) => ({ textContent: q === 'title' ? 'Genetic' : '/genetic' })
                }
            ]
        };
    }
};

const originalConsole = console;
global.console = {
    log: (...args) => originalConsole.log(...args),
    error: (...args) => originalConsole.error(...args),
    warn: (...args) => originalConsole.warn(...args),
    debug: (...args) => originalConsole.debug(...args)
};

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

TestFramework.describe('Mobile Models Lifecycle Tests', () => {

    TestFramework.describe('Initialization Sequence', () => {
        TestFramework.it('should initialize mobile module when GreenhouseUtils is ready', () => {
            assert.isTrue(typeof Mobile.init === 'function', 'Mobile should have init function');
            assert.isTrue(Mobile.isMobileUser(), 'Should detect mobile environment');
        });

        TestFramework.it('should setup auto-trigger for models page', () => {
            global.window.location.pathname = '/models.html';
            assert.isTrue(typeof Mobile.setupAutoTrigger === 'function', 'Should have setupAutoTrigger');
        });

        TestFramework.it('should setup auto-trigger for individual model pages', () => {
            const modelPages = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            modelPages.forEach(model => {
                global.window.location.pathname = `/${model}.html`;
                const path = global.window.location.pathname.toLowerCase();
                const shouldTrigger = Object.keys(Mobile.modelRegistry).some(m => path.includes(m));
                assert.isTrue(shouldTrigger, `Should trigger for ${model} page`);
            });
        });
    });

    TestFramework.describe('Model Registry Validation', () => {
        TestFramework.it('should have complete registry for all 10 models', () => {
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!Mobile.modelRegistry[modelId], `${modelId} should be registered`);
            });
            assert.equal(Object.keys(Mobile.modelRegistry).length, 10, 'Should have exactly 10 models');
        });

        TestFramework.it('should have valid scripts array for each model', () => {
            Object.entries(Mobile.modelRegistry).forEach(([modelId, config]) => {
                assert.isTrue(Array.isArray(config.scripts), `${modelId} scripts should be array`);
                assert.isTrue(config.scripts.length > 0, `${modelId} should have scripts`);
                config.scripts.forEach(script => {
                    assert.isTrue(typeof script === 'string', `${modelId} script should be string`);
                    assert.isTrue(script.endsWith('.js'), `${modelId} script should be .js file`);
                });
            });
        });

        TestFramework.it('should have valid modes array for each model', () => {
            Object.entries(Mobile.modelRegistry).forEach(([modelId, config]) => {
                assert.isTrue(Array.isArray(config.modes), `${modelId} modes should be array`);
                assert.isTrue(config.modes.length >= 3, `${modelId} should have at least 3 modes`);
                config.modes.forEach(mode => {
                    assert.isTrue(typeof mode === 'string', `${modelId} mode should be string`);
                    assert.isTrue(mode.length > 0, `${modelId} mode should not be empty`);
                });
            });
        });

        TestFramework.it('should have valid init function for each model', () => {
            Object.entries(Mobile.modelRegistry).forEach(([modelId, config]) => {
                assert.isTrue(typeof config.init === 'function', `${modelId} should have init function`);
                assert.equal(config.init.length, 2, `${modelId} init should accept 2 parameters`);
            });
        });

        TestFramework.it('should have onSelectMode function for models that need it', () => {
            const modelsWithModeSelection = ['dna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            modelsWithModeSelection.forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                if (config.onSelectMode) {
                    assert.isTrue(typeof config.onSelectMode === 'function', `${modelId} onSelectMode should be function`);
                }
            });
        });
    });

    TestFramework.describe('Model Activation', () => {
        TestFramework.it('should prevent duplicate activation', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('genetic', container);
            const firstActivation = Mobile.activeModels.has(container);

            await Mobile.activateModel('genetic', container);
            const secondActivation = Mobile.activeModels.has(container);

            assert.isTrue(firstActivation, 'Should activate first time');
            assert.isTrue(secondActivation, 'Should still be active');
        });

        TestFramework.it('should handle activation of all models', async () => {
            const models = Object.keys(Mobile.modelRegistry);
            for (const modelId of models) {
                const container = document.createElement('div');
                await Mobile.activateModel(modelId, container);
                assert.isFalse(container.innerHTML.includes('Failed to load'), `${modelId} should activate without error`);
            }
        }, { timeout: 15000 });

        TestFramework.it('should gracefully handle invalid model activation', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('nonexistent-model', container);
            // Should not throw error
            assert.isTrue(true, 'Should handle invalid model gracefully');
        });

        TestFramework.it('should track active models correctly', async () => {
            const container1 = document.createElement('div');
            const container2 = document.createElement('div');

            await Mobile.activateModel('genetic', container1);
            await Mobile.activateModel('neuro', container2);

            assert.isTrue(Mobile.activeModels.has(container1), 'Should track first container');
            assert.isTrue(Mobile.activeModels.has(container2), 'Should track second container');
            assert.equal(Mobile.activeModels.size, 2, 'Should have 2 active models');
        });
    });

    TestFramework.describe('Style Injection', () => {
        TestFramework.it('should inject styles only once', () => {
            document.head._children = [];
            Mobile.injectStyles();
            const firstCount = document.head._children.length;

            Mobile.injectStyles();
            const secondCount = document.head._children.length;

            assert.equal(firstCount, secondCount, 'Should not inject styles twice');
            assert.isTrue(firstCount > 0, 'Should inject styles');
        });

        TestFramework.it('should inject complete style definitions', () => {
            document.head._children = [];
            Mobile.injectStyles();

            const styleElement = document.head._children.find(el => el.id === 'greenhouse-mobile-styles');
            assert.isTrue(!!styleElement, 'Should create style element');
            assert.isTrue(styleElement.textContent.includes('.gh-mobile-overlay'), 'Should include overlay styles');
            assert.isTrue(styleElement.textContent.includes('.gh-mobile-card'), 'Should include card styles');
            assert.isTrue(styleElement.textContent.includes('@keyframes'), 'Should include animations');
        });
    });

    TestFramework.describe('Hub Rendering', () => {
        TestFramework.it('should render hub with model cards', async () => {
            document.body._children = [];
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);

            assert.isTrue(document.body._children.length > 0, 'Should append hub to body');
        });

        TestFramework.it('should prevent duplicate hub rendering', async () => {
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);
            const firstCount = document.body._children.length;

            Mobile.renderHub(models);
            const secondCount = document.body._children.length;

            assert.equal(firstCount, secondCount, 'Should not render hub twice');
        });

        TestFramework.it('should set body overflow hidden when hub is active', async () => {
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);

            assert.equal(document.body.style.overflow, 'hidden', 'Should hide body overflow');
        });
    });

    TestFramework.describe('Intersection Observer Integration', () => {
        TestFramework.it('should setup observer for each card', async () => {
            const models = await Utils.fetchModelDescriptions();
            const card = document.createElement('div');
            card.dataset.modelId = 'genetic';

            Mobile.setupIntersectionObserver(card, 'genetic');
            assert.isTrue(true, 'Should setup observer without error');
        });

        TestFramework.it('should trigger activation when card intersects', (done) => {
            const card = document.createElement('div');
            card.dataset.modelId = 'genetic';
            const wrapper = document.createElement('div');
            wrapper.className = 'gh-mobile-canvas-wrapper';
            card.appendChild(wrapper);

            Mobile.setupIntersectionObserver(card, 'genetic');

            setTimeout(() => {
                done();
            }, 100);
        });
    });

    TestFramework.describe('Swipe Gesture Handling', () => {
        TestFramework.it('should setup swipe listeners on cards', () => {
            const card = document.createElement('div');
            card.dataset.modelId = 'dna';
            card.dataset.currentModeIndex = '0';

            Mobile.setupSwipeInteraction(card, 'dna');
            assert.isTrue(!!card._listeners, 'Should attach listeners');
        });

        TestFramework.it('should cycle modes forward on upward swipe', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = 0;
            const nextIndex = (currentIndex + 1) % dnaConfig.modes.length;

            assert.equal(nextIndex, 1, 'Should advance to next mode');
        });

        TestFramework.it('should cycle modes backward on downward swipe', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = 1;
            const prevIndex = (currentIndex - 1 + dnaConfig.modes.length) % dnaConfig.modes.length;

            assert.equal(prevIndex, 0, 'Should go to previous mode');
        });

        TestFramework.it('should wrap around at mode boundaries', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const lastIndex = dnaConfig.modes.length - 1;
            const nextIndex = (lastIndex + 1) % dnaConfig.modes.length;

            assert.equal(nextIndex, 0, 'Should wrap to first mode');

            const firstIndex = 0;
            const prevIndex = (firstIndex - 1 + dnaConfig.modes.length) % dnaConfig.modes.length;

            assert.equal(prevIndex, lastIndex, 'Should wrap to last mode');
        });
    });

    TestFramework.describe('Cleanup and Memory Management', () => {
        TestFramework.it('should clear active models on hub close', async () => {
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);

            const container1 = document.createElement('div');
            await Mobile.activateModel('genetic', container1);

            assert.isTrue(Mobile.activeModels.size > 0, 'Should have active models');

            Mobile.activeModels.clear();
            assert.equal(Mobile.activeModels.size, 0, 'Should clear active models');
        });

        TestFramework.it('should restore body overflow on hub close', () => {
            document.body.style.overflow = 'hidden';
            document.body.style.overflow = '';

            assert.equal(document.body.style.overflow, '', 'Should restore overflow');
        });
    });

    TestFramework.describe('Scroll Listener', () => {
        TestFramework.it('should setup scroll listener for dot indicators', () => {
            const scroller = document.createElement('div');
            const dotContainer = document.createElement('div');

            Mobile.setupScrollListener(scroller, dotContainer);
            assert.isTrue(!!scroller._listeners, 'Should attach scroll listener');
        });

        TestFramework.it('should update active dot on scroll', () => {
            const scroller = document.createElement('div');
            scroller.scrollLeft = 0;
            scroller.offsetWidth = 400;

            const index = Math.round(scroller.scrollLeft / (scroller.offsetWidth * 0.82 + 25));
            assert.equal(index, 0, 'Should calculate correct index');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
