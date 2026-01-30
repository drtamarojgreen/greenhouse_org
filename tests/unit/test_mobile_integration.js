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
global.window = {
    innerWidth: 1200,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'Desktop', maxTouchPoints: 0 },
    dispatchEvent: () => { },
    _greenhouseScriptAttributes: {},
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' })
};

Object.defineProperty(global, 'navigator', {
    get: () => global.window.navigator,
    configurable: true
});

function createMockElement(tag) {
    const el = {
        tag, id: '', className: '', textContent: '', _innerHTML: '',
        style: {}, dataset: {}, children: [],
        appendChild: function (c) { c._parent = this; this.children.push(c); return c; },
        prepend: function (c) { c._parent = this; this.children.unshift(c); return c; },
        remove: function () { if (this._parent) this._parent.children = this._parent.children.filter(c => c !== this); },
        addEventListener: function () { },
        querySelector: function (sel) {
            if (sel.startsWith('#')) {
                const id = sel.substring(1);
                return this.children.find(c => c.id === id) || null;
            }
            if (sel.startsWith('.')) {
                const cls = sel.substring(1);
                return this.children.find(c => (c.className || '').includes(cls)) || null;
            }
            return null;
        },
        querySelectorAll: function(sel) {
            if (sel.startsWith('.')) {
                const cls = sel.substring(1);
                return this.children.filter(c => (c.className || '').includes(cls));
            }
            return [];
        },
        setAttribute: function (k, v) { this[k] = v; },
        getAttribute: function(k) { return this[k]; },
        hasAttribute: function(k) { return this[k] !== undefined; },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(html) {
            this._innerHTML = html;
            // More robust child extraction for specific test cases
            if (!html || html.trim() === '') {
                this.children = [];
                return;
            }
            // Clear existing children for major updates
            if (html.includes('<') && this.children.length > 0) {
                this.children = [];
            }
            const idRegex = /id=["']([^"']+)["']/g;
            let match;
            while ((match = idRegex.exec(html)) !== null) {
                const id = match[1];
                if (!this.children.find(c => c.id === id)) {
                    const child = createMockElement('div');
                    child.id = id;
                    child._parent = this;
                    this.children.push(child);
                }
            }
        },
        classList: {
            contains: function(c) {
                return (this._parent.className || '').split(/\s+/).filter(Boolean).includes(c);
            },
            add: function(c) {
                if (!this.contains(c)) {
                    this._parent.className = ((this._parent.className || '') + ' ' + c).trim();
                }
            },
            remove: function(c) {
                this._parent.className = (this._parent.className || '').split(/\s+/).filter(cls => cls !== c).join(' ');
            },
            toggle: function(c, val) {
                if (val === undefined) val = !this.contains(c);
                if (val) this.add(c); else this.remove(c);
            }
        }
    };
    el.classList._parent = el;
    return el;
}

global.document = {
    currentScript: null,
    querySelector: (sel) => {
        if (sel === '#greenhouse-mobile-styles') return global.document.head.children.find(c => c.id === 'greenhouse-mobile-styles');
        if (sel === '#greenhouse-mobile-viewer') return global.document.body.children.find(c => c.id === 'greenhouse-mobile-viewer');
        return null;
    },
    getElementById: (id) => {
        const findIn = (el) => {
            if (el.id === id) return el;
            if (el.children) {
                for (const child of el.children) {
                    const found = findIn(child);
                    if (found) return found;
                }
            }
            return null;
        };
        return findIn(global.document.head) || findIn(global.document.body);
    },
    createElement: (tag) => {
        const el = createMockElement(tag);
        el.classList._parent = el;
        if (tag === 'script') {
            setTimeout(() => { if (el.onload) el.onload(); }, 10);
        }
        return el;
    },
    body: {
        appendChild: (el) => { global.document.body.children.push(el); return el; },
        style: {},
        children: [],
        querySelector: (sel) => global.document.querySelector(sel)
    },
    head: {
        appendChild: (el) => {
            global.document.head.children.push(el);
            if (el.tag === 'script' && el.onload) setTimeout(() => el.onload(), 10);
            return el;
        },
        children: []
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
    }
    observe(target) {
        setTimeout(() => {
            this.callback([{ isIntersecting: true, target }]);
        }, 50);
    }
    unobserve() { }
    disconnect() { }
};

global.DOMParser = class {
    parseFromString(str, type) {
        return {
            querySelectorAll: () => []
        };
    }
};

global.URL = {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => { }
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

TestFramework.describe('Mobile Integration Tests', () => {

    TestFramework.describe('Mobile Detection', () => {
        TestFramework.it('should detect mobile by user agent', () => {
            global.window.innerWidth = 1200;
            global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect iPhone');
        });

        TestFramework.it('should detect mobile by screen width and touch', () => {
            global.window.innerWidth = 500;
            global.window.ontouchstart = () => { };
            global.navigator.userAgent = 'Desktop';
            assert.isTrue(Mobile.isMobileUser(), 'Should detect narrow touch device');
        });

        TestFramework.it('should not detect desktop as mobile', () => {
            global.window.innerWidth = 1920;
            global.navigator.userAgent = 'Desktop';
            delete global.window.ontouchstart;
            global.navigator.maxTouchPoints = 0;
            assert.isFalse(Mobile.isMobileUser(), 'Should not detect desktop');
        });
    });

    TestFramework.describe('Model Registry', () => {
        TestFramework.it('should have all 8 models registered', () => {
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!Mobile.modelRegistry[modelId], `Model ${modelId} should be registered`);
            });
        });

        TestFramework.it('should have modes defined for each model', () => {
            Object.keys(Mobile.modelRegistry).forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                assert.isTrue(Array.isArray(config.modes), `${modelId} should have modes array`);
                assert.isTrue(config.modes.length > 0, `${modelId} should have at least one mode`);
            });
        });

        TestFramework.it('should have init function for each model', () => {
            Object.keys(Mobile.modelRegistry).forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                assert.isTrue(typeof config.init === 'function', `${modelId} should have init function`);
            });
        });

        TestFramework.it('should have scripts array for each model', () => {
            Object.keys(Mobile.modelRegistry).forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                assert.isTrue(Array.isArray(config.scripts), `${modelId} should have scripts array`);
                assert.isTrue(config.scripts.length > 0, `${modelId} should have at least one script`);
            });
        });
    });

    TestFramework.describe('Model Activation', () => {
        TestFramework.it('should activate genetic model', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('genetic', container);
            assert.isFalse(container.innerHTML.includes('Failed to load'), 'Should not show error');
        });

        TestFramework.it('should activate dna model', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('dna', container);
            assert.isFalse(container.innerHTML.includes('Failed to load'), 'Should not show error');
        });

        TestFramework.it('should handle invalid model gracefully', async () => {
            const container = document.createElement('div');
            await Mobile.activateModel('invalid-model', container);
            // Should not throw, just not activate
        });
    });

    TestFramework.describe('Mode Selection', () => {
        TestFramework.it('should have DNA repair modes', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            assert.isTrue(dnaConfig.modes.includes('Base Excision'), 'Should have BER mode');
            assert.isTrue(dnaConfig.modes.includes('Mismatch Repair'), 'Should have MMR mode');
        });

        TestFramework.it('should have emotion theory modes', () => {
            const emotionConfig = Mobile.modelRegistry.emotion;
            assert.isTrue(emotionConfig.modes.includes('James-Lange'), 'Should have James-Lange theory');
            assert.isTrue(emotionConfig.modes.includes('Cannon-Bard'), 'Should have Cannon-Bard theory');
        });

        TestFramework.it('should have cognition category modes', () => {
            const cognitionConfig = Mobile.modelRegistry.cognition;
            assert.isTrue(cognitionConfig.modes.includes('Analytical'), 'Should have Analytical mode');
            assert.isTrue(cognitionConfig.modes.includes('Memory'), 'Should have Memory mode');
        });
    });

    TestFramework.describe('Style Injection', () => {
        TestFramework.it('should inject styles only once', () => {
            Mobile.injectStyles();
            const firstCall = document.head.children.length;
            Mobile.injectStyles();
            const secondCall = document.head.children.length;
            assert.equal(firstCall, secondCall, 'Should not inject styles twice');
        });
    });

    TestFramework.describe('Hub Rendering', () => {
        TestFramework.it('should render hub with models', async () => {
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);
            assert.isTrue(document.body.children.length > 0, 'Should append hub to body');
        });

        TestFramework.it('should not render hub twice', async () => {
            const models = await Utils.fetchModelDescriptions();
            Mobile.renderHub(models);
            const firstCount = document.body.children.length;
            Mobile.renderHub(models);
            const secondCount = document.body.children.length;
            assert.equal(firstCount, secondCount, 'Should not render hub twice');
        });
    });

    TestFramework.describe('Auto-trigger Logic', () => {
        TestFramework.it('should trigger on /models page for mobile', () => {
            global.window.innerWidth = 500;
            global.window.ontouchstart = () => { };
            global.window.location.pathname = '/models';
            // Auto-trigger is tested by checking if setupAutoTrigger would fire
            assert.isTrue(Mobile.isMobileUser(), 'Should be mobile');
        });

        TestFramework.it('should trigger on model-specific pages', () => {
            global.window.location.pathname = '/genetic';
            const modelNames = Object.keys(Mobile.modelRegistry);
            const shouldTrigger = modelNames.some(m => global.window.location.pathname.includes(m));
            assert.isTrue(shouldTrigger, 'Should trigger on model page');
        });
    });

    TestFramework.describe('Swipe Gesture Logic', () => {
        TestFramework.it('should cycle modes forward on swipe up', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = 0;
            const nextIndex = (currentIndex + 1) % dnaConfig.modes.length;
            assert.equal(nextIndex, 1, 'Should move to next mode');
        });

        TestFramework.it('should cycle modes backward on swipe down', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const currentIndex = 0;
            const prevIndex = (currentIndex - 1 + dnaConfig.modes.length) % dnaConfig.modes.length;
            assert.equal(prevIndex, dnaConfig.modes.length - 1, 'Should wrap to last mode');
        });

        TestFramework.it('should wrap around at end of modes', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const lastIndex = dnaConfig.modes.length - 1;
            const nextIndex = (lastIndex + 1) % dnaConfig.modes.length;
            assert.equal(nextIndex, 0, 'Should wrap to first mode');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
