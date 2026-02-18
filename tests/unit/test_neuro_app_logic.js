/**
 * Unit Tests for Neuro App Logic
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => { };
global.removeEventListener = () => { };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => 1;
global.cancelAnimationFrame = (id) => { };

global.document = {
    querySelector: () => ({
        innerHTML: '',
        style: {},
        appendChild: () => { },
        addEventListener: () => { },
        offsetWidth: 1000,
        offsetHeight: 750
    }),
    createElement: (tag) => {
        if (tag === 'canvas') {
            const canvas = {
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
                    createRadialGradient: () => ({ addColorStop: () => { } }),
                    clearRect: () => { },
                    fillRect: () => { },
                    strokeRect: () => { },
                    closePath: () => { },
                    quadraticCurveTo: () => { },
                    bezierCurveTo: () => { },
                    arcTo: () => { },
                    arc: () => { },
                    setLineDash: () => { },
                    set fillStyle(v) { },
                    set strokeStyle(v) { },
                    set lineWidth(v) { },
                    set globalAlpha(v) { },
                    set font(v) { },
                    set textAlign(v) { },
                    set textBaseline(v) { }
                }),
                width: 1000,
                height: 600,
                style: {},
                addEventListener: () => { },
                appendChild: () => { },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: canvas.width, height: canvas.height })
            };
            return canvas;
        }
        return {
            style: {},
            appendChild: () => { },
            addEventListener: () => { },
            focus: () => { },
            offsetWidth: 1000,
            offsetHeight: 750
        };
    }
};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Mock Dependencies
window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x, y, scale: 1, depth: z }),
    applyDepthFog: (a, d) => a
};
window.GreenhouseModelsUtil = { t: (k) => k, toggleLanguage: () => { } };
window.GreenhouseNeuroConfig = { get: () => ({ x: 0, y: 0, z: 0, fov: 600 }), set: () => { } };
window.GreenhouseADHDData = {
    scenarios: { 'inattentive': { enhancements: [1] } },
    categories: { 'symptoms': [{ id: 1 }, { id: 2 }] }
};

// Load modules
loadScript('neuro_ga.js');
loadScript('neuro_ui_3d_enhanced.js');
loadScript('neuro_controls.js');
loadScript('neuro_app.js');

TestFramework.describe('GreenhouseNeuroApp', () => {
    let app;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseNeuroApp;
        app.stopSimulation();
        app.init(document.createElement('div'));
    });

    TestFramework.it('should initialize with default state', () => {
        assert.equal(app.state.activeTab, 'sim');
        assert.equal(app.state.dosage, 1.0);
    });

    TestFramework.it('should switch tabs', () => {
        // Simulate mouse down on tab
        const tab = app.ui.tabs[1]; // ADHD tab
        app.handleMouseDown({
            clientX: tab.x + 5,
            clientY: tab.y + 5,
            preventDefault: () => {}
        });
        assert.equal(app.state.activeTab, 'adhd');
    });

    TestFramework.it('should filter scenarios via search', () => {
        app.state.searchQuery = 'inattentive';
        const filtered = app.getFilteredCheckboxes();
        assert.equal(filtered.length, 1);
        assert.equal(filtered[0].scenarioId, 'inattentive');
    });

    TestFramework.it('should update dosage slider', () => {
        const slider = app.ui.sliders[0];
        // Middle of slider
        app.handleMouseDown({
            clientX: slider.x + slider.w / 2,
            clientY: slider.y + slider.h / 2
        });
        // Dosage min is 0.1, max is 2.0. Mid should be ~1.05
        assert.isTrue(app.state.dosage > 1.0 && app.state.dosage < 1.1);
    });

    TestFramework.it('should toggle simulation state', () => {
        assert.isTrue(app.isRunning);
        app.stopSimulation();
        assert.isFalse(app.isRunning);
        app.startSimulation();
        assert.isTrue(app.isRunning);
    });

    TestFramework.it('should handle mode switching', () => {
        app.switchMode(1); // Synaptic
        assert.equal(app.ga.populationSize, 80);
    });

    TestFramework.it('should switch ADHD categories', () => {
        app.state.activeTab = 'adhd';
        const catBtn = app.ui.categoryButtons.find(b => b.val === 'symptoms');
        app.handleMouseDown({
            clientX: catBtn.x + 5,
            clientY: catBtn.y + 5
        });
        assert.equal(app.state.adhdCategory, 'symptoms');
        assert.equal(app.ui.checkboxes.length, 2);
        assert.equal(app.ui.checkboxes[0].enhancementId, 1);
    });

    TestFramework.it('should handle wheel scrolling', () => {
        app.state.activeTab = 'adhd';
        app.state.adhdCategory = 'symptoms';
        app.updateADHDCheckboxes();

        // Mock a lot of items for scrolling
        app.ui.checkboxes = Array(20).fill(0).map((_, i) => ({ x: 55, y: 0, w: 200, h: 20, enhancementId: i }));

        app.handleWheel({
            clientX: 100,
            clientY: 300,
            deltaY: 100,
            preventDefault: () => {}
        });

        assert.equal(app.state.scrollOffset, 100);
    });
});

TestFramework.run();
