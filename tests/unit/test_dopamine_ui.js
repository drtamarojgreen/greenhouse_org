/**
 * @file test_dopamine_ui.js
 * @description Unit tests for Dopamine UI components and interactions.
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
    body: {
        style: {},
        appendChild: () => {}
    },
    documentElement: { style: {} },
    createElement: (tag) => ({
        tag,
        className: '',
        style: {},
        appendChild: () => {},
        prepend: () => {},
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        querySelector: (sel) => {
            if (sel === '.dropdown-content') return { style: { display: 'none' } };
            return null;
        },
        querySelectorAll: () => [],
        onclick: null,
        innerText: ''
    }),
    getElementById: (id) => ({
        innerHTML: '',
        innerText: '',
        style: {},
        appendChild: () => {}
    }),
    querySelectorAll: () => []
};
global.navigator = { userAgent: 'node' };
global.console = console;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('dopamine_controls.js');

TestFramework.describe('Dopamine UI Components', () => {
    const G = window.GreenhouseDopamine;

    TestFramework.it('should create UI with controls', () => {
        const container = document.createElement('div');
        G.state = { receptors: [], scenarios: {} };
        G.uxState = { highContrast: false, largeScale: false, reducedMotion: false, showPerf: false };
        window.GreenhouseUtils = { isMobileUser: () => false };

        G.createUI(container);
        assert.isTrue(true); // Should run without error
    });

    TestFramework.it('should apply color palettes to receptors', () => {
        G.state.receptors = [{ color: '' }, { color: '' }];
        G.applyPalette('deuteranopia');

        assert.notEqual(G.state.receptors[0].color, '');
        assert.equal(G.state.receptors[0].color, '#e69f00');
    });

    TestFramework.it('should update text on language change', () => {
        const mockInfo = { innerHTML: '' };
        global.document.getElementById = (id) => {
            if (id === 'dopamine-info-display') return mockInfo;
            return { innerText: '', style: {} };
        };
        window.GreenhouseModelsUtil = { t: (k) => 'T_' + k };

        G.updateLanguage();
        assert.contains(mockInfo.innerHTML, 'T_neuro_dopamine_signaling');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
