/**
 * @file test_rna_ui.js
 * @description Unit tests for RNA UI components (Display, Legend, Tooltip).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = function(name, cb) {
    this.listeners = this.listeners || {};
    this.listeners[name] = this.listeners[name] || [];
    this.listeners[name].push(cb);
};
global.document = {
    body: {
        appendChild: () => {}
    },
    createElement: (tag) => ({
        tag,
        style: {},
        appendChild: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        addEventListener: function(name, cb) {
            this.listeners = this.listeners || {};
            this.listeners[name] = this.listeners[name] || [];
            this.listeners[name].push(cb);
        },
        dispatchEvent: function(event) {
            if (this.listeners && this.listeners[event.name]) {
                this.listeners[event.name].forEach(cb => cb(event));
            }
        }
    }),
    getElementById: () => null
};
global.navigator = { userAgent: 'node' };
global.console = console;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('rna_tooltip.js');
loadScript('rna_legend.js');
loadScript('rna_display.js');

TestFramework.describe('RNA UI Components', () => {

    TestFramework.describe('GreenhouseRNATooltip', () => {
        const Tooltip = window.GreenhouseRNATooltip;

        TestFramework.it('should initialize and create element', () => {
            Tooltip.initialize();
            assert.isDefined(Tooltip.tooltipElement);
            assert.equal(Tooltip.tooltipElement.id, 'rna-tooltip');
        });

        TestFramework.it('should show and hide tooltip', () => {
            // Mock translations
            window.GreenhouseModelsUtil = {
                t: (k) => k === 'rna_base_a_title' ? 'Adenine' : (k === 'rna_base_a_desc' ? 'Description' : k)
            };

            Tooltip.show(100, 100, 'A');
            assert.equal(Tooltip.tooltipElement.style.display, 'block');
            assert.contains(Tooltip.tooltipElement.innerHTML, 'Adenine');

            Tooltip.hide();
            assert.equal(Tooltip.tooltipElement.style.display, 'none');
        });
    });

    TestFramework.describe('GreenhouseRNALegend', () => {
        const Legend = window.Greenhouse.RNALegend;

        TestFramework.it('should draw legend without error', () => {
            const mockCtx = {
                save: () => {},
                restore: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                quadraticCurveTo: () => {},
                closePath: () => {},
                fill: () => {},
                stroke: () => {},
                fillText: () => {},
                arc: () => {},
                font: '',
                textAlign: '',
                textBaseline: ''
            };
            const colors = { A: '#f00', U: '#0f0', G: '#00f', C: '#ff0', METHYL: '#f0f', ENZYME: '#0ff', GLOW: '#fff' };

            // Should not throw
            Legend.update(mockCtx, 800, 600, colors);
            assert.isTrue(true);
        });
    });

    TestFramework.describe('GreenhouseRNADisplay', () => {
        const initDisplay = window.Greenhouse.initializeRNADisplay;

        TestFramework.it('should attach wheel listener for zoom', () => {
            const mockCanvas = document.createElement('canvas');
            const mockSim = { canvas: mockCanvas, scale: 1.0, offsetX: 0, offsetY: 0 };

            initDisplay(mockSim);

            assert.isDefined(mockCanvas.listeners['wheel']);

            // Simulate wheel event
            const event = {
                deltaY: -100,
                preventDefault: () => {},
                clientX: 400,
                clientY: 300
            };
            mockCanvas.listeners['wheel'][0](event);

            assert.greaterThan(mockSim.scale, 1.0);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
