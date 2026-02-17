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
global.document = {
    querySelector: () => ({ appendChild: () => {}, innerHTML: '', style: {}, classList: { add: () => {} } }),
    createElement: (tag) => ({
        tag,
        style: {},
        classList: { add: () => {} },
        appendChild: () => {},
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        getContext: () => ({
            fillRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, clearRect: () => {}, save: () => {}, restore: () => {}
        })
    }),
    body: { appendChild: () => {} }
};
global.HTMLElement = class {};
global.navigator = { userAgent: 'node' };
global.requestAnimationFrame = (cb) => {};
global.addEventListener = () => {};

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

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
