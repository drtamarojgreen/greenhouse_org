/**
 * @file test_pathway_ui.js
 * @description Unit tests for Pathway Viewer UI components and interactions.
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
    querySelector: () => ({ appendChild: () => {}, innerHTML: '', style: {}, textContent: '' }),
    querySelectorAll: () => [],
    getElementById: (id) => ({
        appendChild: () => {},
        innerHTML: '',
        style: {},
        addEventListener: () => {},
        options: []
    }),
    createElement: (tag) => ({
        tag,
        style: {},
        appendChild: () => {},
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        offsetWidth: 1000,
        offsetHeight: 800,
        getContext: () => ({
            fillRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, clearRect: () => {}, save: () => {}, restore: () => {}, clip: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }), measureText: () => ({ width: 50 })
        })
    }),
    body: { appendChild: () => {} }
};
global.navigator = { userAgent: 'node' };
global.console = console;
global.MutationObserver = class { observe() {} disconnect() {} };
global.requestAnimationFrame = () => {};
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ pathways: [] }), text: () => Promise.resolve('') });
global.DOMParser = class { parseFromString() { return { getElementsByTagName: () => [] }; } };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('models_util.js');
global.window.GreenhouseModels3DMath = {
    project3DTo2D: () => ({ x: 0, y: 0, scale: 1 })
};
loadScript('pathway_viewer.js');

TestFramework.describe('Pathway Viewer UI', () => {
    const Viewer = window.GreenhousePathwayViewer;

    TestFramework.it('should initialize UI components', async () => {
        const container = document.createElement('div');
        container.textContent = '<pathway></pathway>';
        // Mock GreenhouseUtils
        window.GreenhouseUtils = {
            isMobileUser: () => false,
            observeAndReinitializeApplication: () => {},
            startSentinel: () => {}
        };

        await Viewer.executeInitialization(container, '#pathway-container', '');

        assert.isTrue(Viewer.isRunning);
        assert.isDefined(Viewer.canvas);
    });

    TestFramework.it('should handle pathway switching', async () => {
        Viewer.availablePathways = [{ id: 'tryptophan', name: 'Tryptophan', regions: ['gut'] }];

        // Mock getElementById for selectors
        const mockSelector = { innerHTML: '', value: '', appendChild: () => {} };
        global.document.getElementById = (id) => mockSelector;

        await Viewer.switchPathway('tryptophan');

        assert.equal(Viewer.currentPathwayId, 'tryptophan');
    });

    TestFramework.it('should update language across UI', () => {
        window.GreenhouseModelsUtil = {
            t: (k) => 'Translated_' + k,
            toggleLanguage: () => {}
        };

        const mockLabel = { textContent: '' };
        global.document.getElementById = (id) => {
            if (id === 'pathway-systemic-label') return mockLabel;
            return { innerHTML: '', style: {}, appendChild: () => {}, options: [] };
        };

        Viewer.refreshUIText();
        assert.equal(mockLabel.textContent, 'Translated_systemic_pathway');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
