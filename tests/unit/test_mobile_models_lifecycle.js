/**
 * @file test_mobile_models_lifecycle.js
 * @description Rigorous lifecycle tests for mobile model initialization, cleanup, and state management.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const runInNewContext = (overrides = {}) => {
    const mockWindow = {
        innerWidth: 500, innerHeight: 800,
        location: { pathname: '/models', search: '', hostname: 'localhost', ...(overrides.location || {}) },
        navigator: { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
        dispatchEvent: () => { }, addEventListener: () => { },
        fetch: () => Promise.resolve({
            ok: true, text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
        }),
        URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
        setTimeout: setTimeout, clearTimeout: clearTimeout,
        IntersectionObserver: class {
            constructor(cb) { this.cb = cb; }
            observe(t) { setTimeout(() => this.cb([{ isIntersecting: true, target: t }]), 10); }
            unobserve() {}
            disconnect() {}
        },
        DOMParser: class {
            parseFromString() {
                return { querySelectorAll: () => [{ getAttribute: () => 'genetic', querySelector: (q) => ({ textContent: q === 'title' ? 'Genetic' : '/genetic' }) }] };
            }
        }
    };

    const createEl = (tag) => ({
        tagName: tag.toUpperCase(), id: '', className: '', textContent: '', innerHTML: '',
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
                const sub = createEl('div');
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
        classList: {
            add: () => {}, remove: () => {}, toggle: () => {},
            contains: function(c) { return this._cl ? this._cl.has(c) : false; }
        }
    });

    const mockDocument = createEl('document');
    mockDocument.body = createEl('body'); mockDocument.head = createEl('head');
    mockDocument.getElementById = (id) => {
        const find = (el) => { if(el.id === id) return el; for(let c of el.children){ const r=find(c); if(r) return r; } return null; };
        const found = find(mockDocument.body) || find(mockDocument.head);
        if (found) return found;
        if (id === 'gh-mobile-close-btn' || id === 'greenhouse-mobile-viewer' || id === 'greenhouse-mobile-styles') {
            const el = createEl('div'); el.id = id;
            mockDocument.body.appendChild(el); return el;
        }
        return null;
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
