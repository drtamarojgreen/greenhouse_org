/**
 * @file test_mobile_models_lifecycle.js
 * @description Rigorous lifecycle tests for mobile model initialization, cleanup, and state management.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Setup Global Environment ---
const createMockWindow = () => ({
    innerWidth: 500,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
    matchMedia: (query) => ({ media: query, matches: false }),
    dispatchEvent: () => { },
    addEventListener: () => { },
    ontouchstart: () => { },
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
                querySelectorAll: () => [
                    {
                        getAttribute: (attr) => attr === 'id' ? 'genetic' : null,
                        querySelector: (q) => ({ textContent: q === 'title' ? 'Genetic' : '/genetic' })
                    }
                ]
            };
        }
    },
    URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
    Blob: class {},
    console: { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
    IntersectionObserver: class {
        constructor(callback) { this.callback = callback; }
        observe(target) { setTimeout(() => this.callback([{ isIntersecting: true, target }]), 10); }
        unobserve() {}
        disconnect() {}
    }
});

const createMockElement = (tag) => ({
    tag, id: '', className: '', textContent: '', innerHTML: '',
    style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
    appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
    prepend: function (c) { this.children.unshift(c); c.parentNode = this; return c; },
    remove: function () {
        if (this.parentNode) {
            const idx = this.parentNode.children.indexOf(this);
            if (idx > -1) this.parentNode.children.splice(idx, 1);
        }
    },
    addEventListener: function (evt, handler) {
        this._listeners = this._listeners || {};
        this._listeners[evt] = handler;
    },
    querySelector: function (sel) {
        if (sel === '#gh-mobile-scroller' || sel === '#gh-mobile-dots' || sel === '.gh-mobile-canvas-wrapper' || sel === '#gh-mobile-close-btn' || sel === '#greenhouse-mobile-close-btn') {
            let existing = this.children.find(c => c.id === sel.replace('#', '') || c.className === sel.replace('.', ''));
            if (existing) return existing;
            const sub = createMockElement('div');
            sub.id = sel.startsWith('#') ? sel.substring(1) : '';
            sub.className = sel.startsWith('.') ? sel.substring(1) : '';
            this.appendChild(sub);
            return sub;
        }
        return this.children.find(c => c.id === sel.replace('#', '') || c.className === sel.replace('.', '')) || null;
    },
    querySelectorAll: function (sel) { return []; },
    setAttribute: function (k, v) { this[k] = v; },
    getAttribute: function (k) { return this[k]; },
    classList: {
        add: () => {},
        remove: () => {},
        toggle: function(cls, state) {
            this._classes = this._classes || new Set();
            if (state) this._classes.add(cls); else this._classes.delete(cls);
        },
        contains: function(cls) { return this._classes ? this._classes.has(cls) : false; }
    }
});

const runInNewContext = (windowOverrides = {}) => {
    const mockWindow = createMockWindow();
    Object.assign(mockWindow, windowOverrides);

    const mockDocument = {
        readyState: 'complete',
        createElement: createMockElement,
        body: createMockElement('body'),
        head: createMockElement('head'),
        querySelector: () => null,
        getElementById: function (id) {
            const findIn = (el) => {
                if (el.id === id) return el;
                for (let child of el.children) {
                    const found = findIn(child);
                    if (found) return found;
                }
                return null;
            };
            let found = findIn(this.body) || findIn(this.head);
            if (found) return found;
            if (id === 'gh-mobile-close-btn' || id === 'greenhouse-mobile-viewer' || id === 'greenhouse-mobile-styles') {
                const sub = createMockElement('div');
                sub.id = id;
                this.body.appendChild(sub);
                return sub;
            }
            return null;
        },
        addEventListener: () => {}
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

TestFramework.describe('Mobile Models Lifecycle Tests', () => {

    TestFramework.it('should prevent duplicate hub rendering', async () => {
        const context = runInNewContext();
        const models = [{id: 'genetic', title: 'Genetic', url: '/genetic'}];
        context.GreenhouseMobile.renderHub(models);
        const firstCount = context.document.body.children.length;

        context.GreenhouseMobile.renderHub(models);
        const secondCount = context.document.body.children.length;

        assert.equal(firstCount, secondCount, 'Should not render hub twice');
    });

    TestFramework.it('should track active models correctly', async () => {
        const context = runInNewContext();
        const container1 = context.document.createElement('div');
        const container2 = context.document.createElement('div');

        // Mock modelRegistry for quick activation
        context.GreenhouseMobile.modelRegistry.test = { scripts: [], init: () => {} };

        await context.GreenhouseMobile.activateModel('test', container1);
        await context.GreenhouseMobile.activateModel('test', container2);

        assert.isTrue(context.GreenhouseMobile.activeModels.has(container1), 'Should track container1');
        assert.isTrue(context.GreenhouseMobile.activeModels.has(container2), 'Should track container2');
        assert.equal(context.GreenhouseMobile.activeModels.size, 2, 'Should have 2 active models');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
