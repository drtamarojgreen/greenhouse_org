/**
 * @file test_dna_ui.js
 * @description Unit tests for DNA UI components (Buttons, Tooltip).
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
    createElement: (tag) => ({
        tag,
        style: {},
        classList: {
            add: function(c) { this.classes = this.classes || []; this.classes.push(c); },
            remove: function(c) { this.classes = (this.classes || []).filter(x => x !== c); }
        },
        appendChild: () => {},
        setAttribute: function(name, value) { this[name] = value; },
        getAttribute: function(name) { return this[name]; },
        querySelectorAll: () => [],
        listeners: {},
        addEventListener: function(name, cb) {
            this.listeners[name] = this.listeners[name] || [];
            this.listeners[name].push(cb);
        }
    }),
    getElementById: (id) => ({
        style: {},
        appendChild: () => {},
        innerHTML: '',
        querySelectorAll: () => []
    }),
    querySelectorAll: () => []
};
global.HTMLElement = class {};
global.navigator = { userAgent: 'node' };
global.console = console;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('dna_tooltip.js');
loadScript('dna_repair_buttons.js');

TestFramework.describe('DNA UI Components', () => {

    TestFramework.describe('GreenhouseDNATooltip', () => {
        const Tooltip = window.GreenhouseDNATooltip;

        TestFramework.it('should initialize and create element', () => {
            Tooltip.initialize();
            assert.isDefined(Tooltip.tooltipElement);
            assert.equal(Tooltip.tooltipElement.id, 'dna-tooltip');
        });

        TestFramework.it('should show and hide tooltip', () => {
            // Mock translations
            window.GreenhouseModelsUtil = {
                t: (k) => k === 'dna_base_a_title' ? 'Adenine' : k
            };

            Tooltip.show(100, 100, 'A');
            assert.equal(Tooltip.tooltipElement.style.display, 'block');
            assert.contains(Tooltip.tooltipElement.innerHTML, 'Adenine');

            Tooltip.hide();
            assert.equal(Tooltip.tooltipElement.style.display, 'none');
        });
    });

    TestFramework.describe('GreenhouseDNARepair UI Buttons', () => {
        const G = window.GreenhouseDNARepair;

        TestFramework.it('should create UI buttons', () => {
            G.state = { repairMode: 'ber', radiationLevel: 10, cellCyclePhase: 'G1' };
            const wrapper = document.createElement('div');

            G.createUI(wrapper);
            assert.isTrue(true); // Should run without error
        });

        TestFramework.it('should update info overlay when mode changes', () => {
            const mockContent = { innerHTML: '' };
            global.document.getElementById = (id) => {
                if (id === 'dna-info-content') return mockContent;
                return { innerHTML: '', style: {}, appendChild: () => {}, querySelectorAll: () => [] };
            };

            G.state.repairMode = 'ber';
            G.updateStats = () => {};
            G.updateInfoOverlay();

            assert.contains(mockContent.innerHTML, 'Base Excision Repair');
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
