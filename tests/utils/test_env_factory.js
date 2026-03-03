/**
 * @file test_env_factory.js
 * @description Standardized environment factory for Greenhouse unit tests.
 * Provides a isolated virtual DOM context using Node.js 'vm' module.
 */

const vm = typeof require !== 'undefined' ? require('vm') : null;
const path = typeof require !== 'undefined' ? require('path') : null;
const fs = typeof require !== 'undefined' ? require('fs') : null;

/**
 * Creates a mock window/document environment.
 * @param {Object} overrides - Property overrides for the mock window.
 * @returns {Object} A VM context object or the current window.
 */
function createEnv(overrides = {}) {
    // If running in browser harness with pre-initialized state
    if (typeof window !== 'undefined' && !vm) {
        return window;
    }

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
        AbortController: typeof AbortController !== 'undefined' ? AbortController : class { constructor() { this.signal = {}; } abort() {} },
        CustomEvent: typeof CustomEvent !== 'undefined' ? CustomEvent : class { constructor(name, data) { this.name = name; this.detail = data ? data.detail : null; } },
        performance: { now: () => Date.now() },
        requestAnimationFrame: (cb) => setTimeout(cb, 16),
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
            return null;
        },
        querySelectorAll: function () { return []; },
        setAttribute: function (k, v) { this[k] = v; },
        getAttribute: function (k) { return this[k]; },
        getContext: () => ({
            save: () => { },
            restore: () => { },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            rect: () => { },
            clip: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            quadraticCurveTo: () => { },
            closePath: () => { }
        }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        offsetWidth: 800,
        offsetHeight: 600
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

    // Apply overrides
    Object.keys(overrides).forEach(key => {
        if (typeof overrides[key] === 'object' && mockWindow[key] && !Array.isArray(overrides[key])) {
            Object.assign(mockWindow[key], overrides[key]);
        } else {
            mockWindow[key] = overrides[key];
        }
    });

    const context = vm.createContext(mockWindow);

    const safeAssign = (target, prop, value) => {
        try {
            target[prop] = value;
        } catch (e) {
            try {
                Object.defineProperty(target, prop, {
                    value: value,
                    configurable: true,
                    writable: true
                });
            } catch (e2) { }
        }
    };

    safeAssign(context, 'global', context);
    safeAssign(context, 'window', context);
    safeAssign(context, 'self', context);
    safeAssign(context, 'globalThis', context);

    // Ensure Node.js globals are available if needed
    context.Buffer = Buffer;
    context.process = process;

    return context;
}

/**
 * Loads a script into the given context.
 * @param {Object} context - The VM context.
 * @param {string} scriptPath - Path to the script relative to repo root.
 */
function loadScript(context, scriptPath) {
    if (!vm) return; // In browser, scripts are usually loaded via <script> tags
    const fullPath = path.join(__dirname, '../../', scriptPath);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, context);
}

module.exports = {
    createEnv,
    loadScript
};
