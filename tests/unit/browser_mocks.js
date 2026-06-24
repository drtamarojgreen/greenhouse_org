/**
 * @file browser_mocks.js
 * @description Provides a mock browser environment for running Greenhouse applications in Node.js.
 */

const eventListeners = new Map();

function addEventListener(target, event, callback) {
    if (!target) return;
    if (!eventListeners.has(target)) eventListeners.set(target, {});
    const listeners = eventListeners.get(target);
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
}

function removeEventListener(target, event, callback) {
    if (!target || !eventListeners.has(target)) return;
    const listeners = eventListeners.get(target);
    if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) listeners[event].splice(index, 1);
    }
}

function dispatchEvent(target, event) {
    if (!target || !eventListeners.has(target)) return true;
    const listeners = eventListeners.get(target);
    const eventType = typeof event === 'string' ? event : event.type;
    if (listeners[eventType]) {
        const currentListeners = [...listeners[eventType]];
        currentListeners.forEach(cb => {
            if (typeof cb === 'function') {
                try {
                    cb(event);
                } catch (e) {}
            }
        });
    }
    return true;
}

class MockElement {
    constructor(tagName) {
        this.tagName = (tagName || 'div').toUpperCase();
        this.attributes = {};
        this.dataset = {};
        this.children = [];
        this.style = { display: 'block', visibility: 'visible', opacity: '1' };
        this._classList = new Set();
        this.classList = {
            add: (c) => this._classList.add(c),
            remove: (c) => this._classList.delete(c),
            contains: (c) => this._classList.has(c),
            toggle: (c) => {
                if (this._classList.has(c)) {
                    this._classList.delete(c);
                    return false;
                } else {
                    this._classList.add(c);
                    return true;
                }
            }
        };
        this._innerHTML = '';
        this.value = '';
        this.textContent = '';
        this.parentElement = null;
        this.id = '';
        this.className = '';
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) {
        this._innerHTML = v;
        if (typeof v === 'string') {
            // Support IDs
            const idMatches = v.match(/id=["']([^"']+)["']/g);
            if (idMatches) {
                idMatches.forEach(m => {
                    const id = m.match(/id=["']([^"']+)["']/)[1];
                    if (!this.querySelector('#' + id)) {
                        const child = new MockElement('div');
                        child.setAttribute('id', id);
                        this.appendChild(child);
                    }
                });
            }
        }
    }
    setAttribute(n, v) {
        this.attributes[n] = String(v);
        if (n === 'id') this.id = String(v);
        if (n === 'class') this.className = String(v);
        if (n.startsWith('data-')) {
            const camel = n.slice(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
            this.dataset[camel] = String(v);
        }
    }
    getAttribute(n) { return this.attributes[n] || null; }
    hasAttribute(n) { return !!this.attributes[n]; }
    appendChild(c) {
        if (c) {
            c.parentElement = this;
            this.children.push(c);
        }
        return c;
    }
    prepend(c) {
        if (c) {
            c.parentElement = this;
            this.children.unshift(c);
        }
        return c;
    }
    removeChild(c) {
        const idx = this.children.indexOf(c);
        if (idx > -1) {
            this.children.splice(idx, 1);
            c.parentElement = null;
        }
        return c;
    }
    insertBefore(n, r) {
        const idx = this.children.indexOf(r);
        if (idx > -1) this.children.splice(idx, 0, n);
        else this.children.push(n);
        if (n) n.parentElement = this;
        return n;
    }
    addEventListener(e, c) { addEventListener(this, e, c); }
    removeEventListener(e, c) { removeEventListener(this, e, c); }
    dispatchEvent(e) { return dispatchEvent(this, e); }
    contains(other) {
        if (this === other) return true;
        for (let child of this.children) {
            if (child.contains(other)) return true;
        }
        return false;
    }
    remove() { if (this.parentElement) this.parentElement.removeChild(this); }
    getElementsByTagName(n) {
        let results = [];
        const targetTag = n.toUpperCase();
        for (let child of this.children) {
            if (child.tagName === targetTag) results.push(child);
            results = results.concat(child.getElementsByTagName(n));
        }
        return results;
    }
    insertAdjacentHTML(position, text) {
        if (text.includes('id=')) {
            const matches = text.match(/id=["']([^"']+)["']/g);
            if (matches) {
                matches.forEach(m => {
                    const id = m.match(/id=["']([^"']+)["']/)[1];
                    if (!this.querySelector('#' + id)) {
                        const child = new MockElement('div');
                        child.setAttribute('id', id);
                        this.appendChild(child);
                    }
                });
            }
        }
    }
    querySelector(s) {
        if (!s) return null;
        if (global.__is_loading_modules__ && (s === '#container' || s === '#dopamine-app-container' || s === '#stress-app-container')) {
            const silent = new MockElement('div');
            silent.setAttribute('id', s.slice(1));
            silent.appendChild = (c) => c;
            return silent;
        }
        if (s.startsWith('#')) {
            const id = s.slice(1);
            if (this.id === id) return this;
            for (let child of this.children) {
                const found = child.querySelector(s);
                if (found) return found;
            }
        }
        if (s.startsWith('.')) {
            const className = s.slice(1);
            if (this.className.split(' ').includes(className)) return this;
            for (let child of this.children) {
                const found = child.querySelector(s);
                if (found) return found;
            }
        }
        for (let child of this.children) {
            if (child.tagName.toLowerCase() === s.toLowerCase()) return child;
            if (child.id === s.replace('#', '')) return child;
            const found = child.querySelector(s);
            if (found) return found;
        }
        return null;
    }
    querySelectorAll(s) { return []; }
    getContext() {
        const d = () => {};
        const ctx = {
            fillRect: d, beginPath: d, moveTo: d, lineTo: d, stroke: d, fill: d, arc: d, fillText: d,
            measureText: () => ({ width: 10 }), save: d, restore: d, translate: d, rotate: d, scale: d,
            drawImage: d, setLineDash: d, createLinearGradient: () => ({ addColorStop: d }),
            createRadialGradient: () => ({ addColorStop: d }), quadraticCurveTo: d, bezierCurveTo: d,
            clip: d, roundRect: d, clearRect: d, closePath: d, strokeRect: d, rect: d, ellipse: d,
            createPattern: () => ({}),
            setTransform: d, getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
            set shadowBlur(v) {}, set shadowColor(v) {}, set globalAlpha(v) {},
            set globalCompositeOperation(v) {}, set strokeStyle(v) {}, set fillStyle(v) {},
            set lineWidth(v) {}, set lineCap(v) {}, set font(v) {}, set textAlign(v) {}, set textBaseline(v) {}, set filter(v) {},
            get fillStyle() { return '#000'; }, get strokeStyle() { return '#000'; }
        };
        ctx.canvas = this;
        return ctx;
    }
    getBoundingClientRect() { return { top: 0, left: 0, width: 800, height: 600 }; }
    get offsetWidth() { return 800; }
    get offsetHeight() { return 600; }
    get clientWidth() { return 800; }
    get clientHeight() { return 600; }
}

function setupMockEnvironment() {
    global.window = global;
    global.Node = class MockNode {};
    global.HTMLElement = class MockHTMLElement extends MockElement {};
    global.Path2D = class MockPath2D {
        moveTo() {}
        lineTo() {}
        arc() {}
        closePath() {}
        quadraticCurveTo() {}
        bezierCurveTo() {}
        rect() {}
    };
    global.self = global;
    global.performance = {
        now: () => Date.now(),
        memory: {
            usedJSHeapSize: 100 * 1048576,
            jsHeapSizeLimit: 2000 * 1048576
        }
    };

    const win = global;
    win.addEventListener = (e, c) => addEventListener(win, e, c);
    win.removeEventListener = (e, c) => removeEventListener(win, e, c);
    win.dispatchEvent = (e) => dispatchEvent(win, e);

    global.document = {
        createElement: (t) => new MockElement(t),
        createTextNode: (t) => ({ textContent: t }),
        getElementById: (id) => {
            const el = new MockElement('div');
            el.setAttribute('id', id);
            return el;
        },
        querySelector: (s) => {
            if (s && s.includes('script')) {
                const el = new MockElement('script');
                el.setAttribute('data-base-url', '/');
                el.setAttribute('data-target-selector-left', '#container');
                el.setAttribute('data-target-selector', '#container');
                el.setAttribute('data-genetic-selectors', JSON.stringify({ genetic: '#container' }));
                el.setAttribute('data-scheduler-selectors', JSON.stringify({ dashboardLeft: '#container', dashboardRight: '#container' }));
                return el;
            }
            const el = new MockElement('div');
            if (s && s.startsWith('#')) el.setAttribute('id', s.slice(1));
            return el;
        },
        querySelectorAll: (s) => {
            if (s && s.includes('script')) {
                const el = new MockElement('script');
                el.setAttribute('data-base-url', '/');
                el.setAttribute('data-target-selector-left', '#container');
                el.setAttribute('data-target-selector', '#container');
                el.setAttribute('data-genetic-selectors', JSON.stringify({ genetic: '#container' }));
                el.setAttribute('data-scheduler-selectors', JSON.stringify({ dashboardLeft: '#container', dashboardRight: '#container' }));
                return [el];
            }
            return [];
        },
        body: new MockElement('body'),
        head: new MockElement('head'),
        addEventListener: (e, c) => addEventListener(global.document, e, c),
        removeEventListener: (e, c) => removeEventListener(global.document, e, c),
        dispatchEvent: (e) => dispatchEvent(global.document, e),
        currentScript: null
    };

    global.navigator = {
        userAgent: 'node.js', platform: 'linux', maxTouchPoints: 0,
        language: 'en-US', languages: ['en-US', 'en']
    };
    global.location = {
        href: 'http://localhost/', search: '', hash: '', pathname: '/', origin: 'http://localhost'
    };
    global.requestAnimationFrame = (c) => setTimeout(c, 16);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    global.getComputedStyle = (el) => el.style || {
        getPropertyValue: () => '0px', display: 'block', includes: (v) => false
    };
    global.CustomEvent = class {
        constructor(t, o = {}) {
            this.type = t; this.detail = o.detail || null;
            this.bubbles = !!o.bubbles; this.cancelable = !!o.cancelable;
        }
    };
    global.localStorage = {
        _data: {},
        setItem: (k, v) => { global.localStorage._data[k] = String(v); },
        getItem: (k) => global.localStorage._data.hasOwnProperty(k) ? global.localStorage._data[k] : null,
        removeItem: (k) => { delete global.localStorage._data[k]; },
        clear: () => { global.localStorage._data = {}; }
    };
    global.Image = class { constructor() { setTimeout(() => { if (this.onload) this.onload(); }, 1); } };
    global.MutationObserver = class { constructor(callback) { this.callback = callback; } observe() {} disconnect() {} };
    global.AbortController = class { constructor() { this.signal = {}; } abort() {} };
    global.Blob = class { constructor(parts, options) { this.parts = parts; this.options = options; } };
    global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };
    global.fetch = () => Promise.resolve({
        ok: true, status: 200, text: () => Promise.resolve(''),
        json: () => Promise.resolve({}), headers: { get: () => 'application/json' }
    });
    global.DOMParser = class {
        parseFromString() {
            const doc = new MockElement('document');
            doc.documentElement = new MockElement('html');
            doc.appendChild(doc.documentElement);
            return doc;
        }
    };
}

module.exports = {
    MockElement,
    setupMockEnvironment
};
