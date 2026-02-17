/**
 * @file test_serotonin_ui.js
 * @description Unit tests for Serotonin UI components and interactions.
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
        appendChild: () => {}
    },
    createTextNode: (text) => ({ text }),
    createElement: (tag) => ({
        tag,
        className: '',
        style: {},
        appendChild: () => {},
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        querySelector: () => null,
        querySelectorAll: () => [],
        onmouseenter: null,
        onmouseleave: null,
        onclick: null,
        innerText: '',
        innerHTML: ''
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
global.location = { reload: () => {} };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('serotonin_controls.js');

TestFramework.describe('Serotonin UI Components', () => {
    const G = window.GreenhouseSerotonin;

    TestFramework.beforeEach(() => {
        G.state = { receptors: [], camera: { zoom: 1.0 } };
        G.Transport = { tphActivity: 1.0, sertActivity: 1.0, maoActivity: 1.0 };
        G.injectStyles = () => {};
        G.setupKeyboardShortcuts = () => {};
    });

    TestFramework.it('should create UI controls', () => {
        const container = document.createElement('div');
        window.GreenhouseUtils = { isMobileUser: () => false };
        window.GreenhouseModelsUtil = { t: (k) => k };

        G.createUI(container);
        assert.isTrue(true); // Should run without error
    });

    TestFramework.it('should cycle environments', () => {
        const container = document.createElement('div');
        G.createUI(container);
        G.currentEnvIndex = 0;
        G.cycleEnvironment();
        assert.equal(G.currentEnvIndex, 1);
        assert.isDefined(G.currentEnvLabel);
    });

    TestFramework.it('should toggle color blind filters', () => {
        const mockCanvas = { style: { filter: '' } };
        G.canvas = mockCanvas;

        G.toggleColorBlind('deuteranopia');
        assert.contains(mockCanvas.style.filter, 'grayscale');

        G.toggleColorBlind('deuteranopia');
        assert.equal(mockCanvas.style.filter, 'none');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
