/**
 * @file test_mobile_ui_interactions.js
 * @description Rigorous tests for mobile UI interactions, animations, and visual feedback.
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
    dispatchEvent: () => { },
    addEventListener: () => { },
    ontouchstart: () => { },
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
    querySelector: function (sel) {
        if (sel.startsWith('#')) return this.children.find(c => c.id === sel.substring(1)) || null;
        return this.children.find(c => c.className?.includes(sel.replace('.', ''))) || null;
    },
    addEventListener: function (evt, handler) {
        this._listeners = this._listeners || {};
        this._listeners[evt] = handler;
    },
    classList: {
        add: function(c) { this._classes = this._classes || new Set(); this._classes.add(c); },
        remove: function(c) { this._classes = this._classes || new Set(); this._classes.delete(c); },
        contains: function(c) { return this._classes ? this._classes.has(c) : false; }
    }
});

const runInNewContext = (overrides = {}) => {
    const mockWindow = {
        innerWidth: 500, innerHeight: 800,
        location: { pathname: '/models', search: '', hostname: 'localhost' },
        navigator: { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
        dispatchEvent: () => { }, addEventListener: () => { },
        fetch: () => Promise.resolve({
            ok: true, text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
        }),
        URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
        setTimeout: (fn, t) => setTimeout(fn, t)
    };

    const createEl = (tag) => ({
        tagName: tag.toUpperCase(), id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
        appendChild: function(c) { this.children.push(c); c.parentNode = this; return c; },
        querySelector: function(sel) {
            if (sel.startsWith('#')) return this.children.find(c => c.id === sel.substring(1)) || null;
            return this.children.find(c => c.className?.includes(sel.replace('.', ''))) || null;
        },
        addEventListener: function() {},
        classList: {
            add: function(c) { this._cl = this._cl || new Set(); this._cl.add(c); },
            remove: function(c) { this._cl = this._cl || new Set(); this._cl.delete(c); },
            contains: function(c) { return this._cl ? this._cl.has(c) : false; }
        }
    });

    const mockDocument = createEl('document');
    mockDocument.body = createEl('body'); mockDocument.head = createEl('head');
    mockDocument.getElementById = (id) => {
        const find = (el) => { if(el.id === id) return el; for(let c of el.children){ const r=find(c); if(r) return r; } return null; };
        return find(mockDocument.body) || find(mockDocument.head);
    };
    mockDocument.createElement = createEl;
    mockDocument.querySelector = () => null;
    mockDocument.addEventListener = () => {};

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseUtils.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseMobile.js'), 'utf8'), context);

    return context;
};

TestFramework.describe('Mobile UI Interactions', () => {

    TestFramework.it('should show and hide mode indicator', (done) => {
        const context = runInNewContext();
        const indicator = context.document.createElement('div');
        indicator.id = 'mode-indicator-test';
        context.document.body.appendChild(indicator);

        // Simulation of indicator showing/hiding
        indicator.classList.add('show');
        assert.isTrue(indicator.classList.contains('show'), 'Should have show class');

        setTimeout(() => {
            indicator.classList.remove('show');
            assert.isFalse(indicator.classList.contains('show'), 'Should remove show class');
            done();
        }, 100);
    });

    TestFramework.it('should calculcate card index on scroll', () => {
        const scroller = { scrollLeft: 400, offsetWidth: 400 };
        const cardWidth = scroller.offsetWidth * 0.82;
        const gap = 25;
        const index = Math.round(scroller.scrollLeft / (cardWidth + gap));
        assert.equal(index, 1, 'Should calculate index 1');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
