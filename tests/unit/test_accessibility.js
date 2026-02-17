/**
 * @file test_accessibility.js
 * @description Unit tests for accessibility compliance (ARIA labels, roles).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => {};
global.document = {
    querySelector: () => ({ appendChild: () => {}, innerHTML: '', style: {}, classList: { add: () => {} } }),
    createTextNode: (text) => ({ text }),
    createElement: (tag) => ({
        tag,
        style: {},
        classList: { add: () => {} },
        appendChild: function(c) { this.children = this.children || []; this.children.push(c); },
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        onmouseenter: null,
        onmouseleave: null,
        getContext: () => ({
            fillRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, clearRect: () => {}, save: () => {}, restore: () => {}
        })
    }),
    body: { appendChild: () => {} }
};
global.HTMLElement = class {};
global.navigator = { userAgent: 'node' };
global.requestAnimationFrame = (cb) => {};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('models_util.js');
loadScript('stress_config.js');
loadScript('stress_app.js');

TestFramework.describe('Global Accessibility Checks', () => {

    TestFramework.it('Stress App buttons should have descriptive text or labels', () => {
        const app = window.GreenhouseStressApp;
        // In our mock, setupUI creates buttons in app.ui.buttons
        app.setupUI();

        app.ui.buttons.forEach(btn => {
            assert.isDefined(btn.label, `Button ${btn.id} should have a label`);
            assert.greaterThan(btn.label.length, 0, `Button ${btn.id} label should not be empty`);
        });
    });

    TestFramework.it('Stress App checkboxes should have associated labels', () => {
        const app = window.GreenhouseStressApp;
        app.setupUI();

        app.ui.checkboxes.forEach(cb => {
            assert.isDefined(cb.label, `Checkbox ${cb.id} should have a label`);
        });
    });

    TestFramework.it('Simulation canvas should have a tabIndex for keyboard focus', () => {
        const container = document.createElement('div');
        // Neuroinflammation App sets tabIndex
        loadScript('inflammation_config.js');
        loadScript('inflammation_app.js');

        const app = window.GreenhouseInflammationApp;
        app.init(container);

        assert.equal(app.canvas.tabIndex, 1, 'Canvas should be focusable via tabIndex');
    });

    TestFramework.it('Dopamine UI should have ARIA roles for groups', () => {
        const container = document.createElement('div');
        container.children = [];
        container.querySelector = function(sel) {
            const find = (node) => {
                if (node.className && node.className.includes(sel.replace('.', ''))) return node;
                if (node.children) {
                    for (const c of node.children) {
                        const res = find(c);
                        if (res) return res;
                    }
                }
                return null;
            };
            return find(container);
        };
        container.appendChild = (c) => { container.children = container.children || []; container.children.push(c); };

        loadScript('dopamine_controls.js');
        const app = window.GreenhouseDopamine;
        app.state = { receptors: [], scenarios: {} };
        app.uxState = { highContrast: false, largeScale: false, reducedMotion: false, showPerf: false };
        window.GreenhouseUtils = { isMobileUser: () => false };

        app.createUI(container);
        const controls = container.querySelector('.dopamine-controls');
        assert.equal(controls.role, 'group');
        assert.equal(controls['aria-label'], 'Dopamine Simulation Controls');
    });

    TestFramework.it('Serotonin UI buttons should have ARIA labels', () => {
        const container = document.createElement('div');
        container.children = [];
        container.querySelector = function(sel) {
            const find = (node) => {
                if (node.className && node.className.includes(sel.replace('.', ''))) return node;
                if (node.children) {
                    for (const c of node.children) {
                        const res = find(c);
                        if (res) return res;
                    }
                }
                return null;
            };
            return find(container);
        };
        container.appendChild = (c) => { container.children = container.children || []; container.children.push(c); };

        loadScript('serotonin_controls.js');
        const app = window.GreenhouseSerotonin;
        app.state = { receptors: [], camera: { zoom: 1.0 } };
        app.Transport = {};
        app.injectStyles = () => {};
        app.setupKeyboardShortcuts = () => {};
        window.GreenhouseUtils = { isMobileUser: () => false };
        window.GreenhouseModelsUtil = { t: (k) => k };

        app.createUI(container);
        const btn = container.querySelector('.serotonin-btn');
        assert.isDefined(btn['aria-label']);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
