/**
 * @file test_mobile_typography_contrast.js
 * @description specialized tests for mobile typography and color contrast compliance.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Contrast Calculation Utilities ---

/**
 * Calculates relative luminance of a color
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(color) {
    let r, g, b;
    if (color.startsWith('#')) {
        if (color.length === 4) {
            r = parseInt(color[1] + color[1], 16);
            g = parseInt(color[2] + color[2], 16);
            b = parseInt(color[3] + color[3], 16);
        } else {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        }
    } else if (color.startsWith('rgb')) {
        const parts = color.match(/\d+/g);
        r = parseInt(parts[0]);
        g = parseInt(parts[1]);
        b = parseInt(parts[2]);
    } else {
        return 0; // Default for unknown
    }

    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
function getContrast(color1, color2) {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// --- Setup Global Environment ---
const createMockWindow = () => ({
    innerWidth: 500,
    innerHeight: 800,
    location: { pathname: '/models', search: '?mobile=true', hostname: 'localhost' },
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
    setTimeout: (fn, t) => fn(),
    clearTimeout: clearTimeout,
    Promise: Promise,
    console: { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
    IntersectionObserver: class {
        constructor(callback) { this.callback = callback; }
        observe(target) { this.callback([{ isIntersecting: true, target }]); }
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

const runInNewContext = () => {
    const mockWindow = createMockWindow();
    const mockDocument = {
        createElement: createMockElement,
        body: createMockElement('body'),
        head: createMockElement('head'),
        querySelector: () => null,
        getElementById: function(id) {
            const findIn = (el) => {
                if (el.id === id) return el;
                for (let child of el.children) {
                    const found = findIn(child);
                    if (found) return found;
                }
                return null;
            };
            return findIn(this.body) || findIn(this.head);
        }
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

// --- Test Suite ---

TestFramework.describe('Mobile Typography & Contrast Compliance', () => {

    const context = runInNewContext();
    // Trigger style injection
    context.GreenhouseMobile.injectStyles();
    const styleTag = context.document.getElementById('greenhouse-mobile-styles');
    const css = styleTag.textContent;

    TestFramework.it('should adhere to minimum font size of 16px (1.0rem) for all text', () => {
        // Extract all font-size declarations
        const fontSizeMatches = css.match(/font-size:\s*([\d.]+(rem|px))/g);
        assert.isNotNull(fontSizeMatches, 'Should have font-size declarations');

        fontSizeMatches.forEach(match => {
            const value = match.split(':')[1].trim();
            if (value.endsWith('rem')) {
                const remValue = parseFloat(value);
                assert.isTrue(remValue >= 1.0, `Font size ${value} should be >= 1.0rem (16px)`);
            } else if (value.endsWith('px')) {
                const pxValue = parseFloat(value);
                assert.isTrue(pxValue >= 16, `Font size ${value} should be >= 16px`);
            }
        });
    });

    TestFramework.it('should target 1.2rem+ for titles and buttons', () => {
        const titleRegex = /\.gh-model-title\s*{[^}]*font-size:\s*([\d.]+)rem/i;
        const headerRegex = /\.gh-mobile-overlay-header h2\s*{[^}]*font-size:\s*([\d.]+)rem/i;
        const btnRegex = /\.gh-mobile-btn\s*{[^}]*font-size:\s*([\d.]+)rem/i;

        const titleMatch = css.match(titleRegex);
        const headerMatch = css.match(headerRegex);
        const btnMatch = css.match(btnRegex);

        assert.isNotNull(titleMatch, 'Should find .gh-model-title font-size');
        assert.isTrue(parseFloat(titleMatch[1]) >= 1.2, '.gh-model-title should be >= 1.2rem');

        assert.isNotNull(headerMatch, 'Should find .gh-mobile-overlay-header h2 font-size');
        assert.isTrue(parseFloat(headerMatch[1]) >= 1.2, '.gh-mobile-overlay-header h2 should be >= 1.2rem');

        assert.isNotNull(btnMatch, 'Should find .gh-mobile-btn font-size');
        assert.isTrue(parseFloat(btnMatch[1]) >= 1.2, '.gh-mobile-btn should be >= 1.2rem');
    });

    TestFramework.it('should meet WCAG AA contrast ratio of 4.5:1 for key UI elements', () => {
        // Based on GreenhouseMobile.js styles:
        // Background for overlay is effectively black (#000)
        const bg = '#000000';

        // .gh-mobile-overlay-header h2 { color: #4ca1af; }
        const headerColor = '#4ca1af';
        const headerContrast = getContrast(headerColor, bg);
        assert.isTrue(headerContrast >= 4.5, `Header contrast (${headerContrast.toFixed(2)}) should be >= 4.5:1`);

        // .gh-model-title { color: #fff; }
        const titleColor = '#ffffff';
        const titleContrast = getContrast(titleColor, bg);
        assert.isTrue(titleContrast >= 4.5, `Title contrast (${titleContrast.toFixed(2)}) should be >= 4.5:1`);

        // .gh-model-index { color: #4ca1af; background: rgba(0,0,0,0.3); }
        // Background is 0.3 opacity black on black = black.
        const indexColor = '#4ca1af';
        const indexContrast = getContrast(indexColor, bg);
        assert.isTrue(indexContrast >= 4.5, `Index contrast (${indexContrast.toFixed(2)}) should be >= 4.5:1`);

        // .gh-mode-indicator { color: #4ca1af; background: rgba(0, 0, 0, 0.8); }
        // Background is 0.8 opacity black on black = black.
        const indicatorColor = '#4ca1af';
        const indicatorContrast = getContrast(indicatorColor, bg);
        assert.isTrue(indicatorContrast >= 4.5, `Indicator contrast (${indicatorContrast.toFixed(2)}) should be >= 4.5:1`);

        // .gh-mobile-btn { background: linear-gradient(135deg, #2c7a7b 0%, #2c3e50 100%); color: white; }
        const btnBgRegex = /\.gh-mobile-btn\s*{[^}]*background:\s*linear-gradient\([^,]+,\s*(#[0-9a-f]{3,6})/i;
        const btnBgMatch = css.match(btnBgRegex);
        assert.isNotNull(btnBgMatch, 'Should find .gh-mobile-btn background gradient');

        const btnText = '#ffffff';
        const btnBgLight = btnBgMatch[1];
        const btnBgDark = '#2c3e50';
        const btnContrastLight = getContrast(btnText, btnBgLight);
        const btnContrastDark = getContrast(btnText, btnBgDark);

        assert.isTrue(btnContrastLight >= 4.5, `Button contrast (light end ${btnBgLight}: ${btnContrastLight.toFixed(2)}) should be >= 4.5:1`);
        assert.isTrue(btnContrastDark >= 4.5, `Button contrast (dark end: ${btnContrastDark.toFixed(2)}) should be >= 4.5:1`);
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
