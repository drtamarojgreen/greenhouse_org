/**
 * Unit Tests for Neuro UI 3D and Components
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.performance = { now: () => Date.now() };
global.Path2D = class {
    moveTo() { }
    lineTo() { }
    closePath() { }
};
global.document = {
    querySelector: () => null,
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
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
                    measureText: () => ({ width: 100 }),
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
                    ellipse: () => { },
                    setLineDash: () => { },
                    set fillStyle(v) { },
                    set strokeStyle(v) { },
                    set lineWidth(v) { },
                    set globalAlpha(v) { },
                    set font(v) { },
                    set textAlign(v) { },
                    set textBaseline(v) { }
                }),
                width: 800,
                height: 600,
                style: {},
                addEventListener: () => { },
                appendChild: () => { },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
            };
        }
        return {
            style: {},
            appendChild: () => { },
            addEventListener: () => { },
            offsetWidth: 1000,
            offsetHeight: 750,
            innerHTML: '',
            focus: () => { }
        };
    },
    getElementById: () => ({
        textContent: '',
        style: {},
        addEventListener: () => { }
    })
};
global.console = console;
global.requestAnimationFrame = (cb) => { return 1; };
global.cancelAnimationFrame = (id) => { };
global.setInterval = (cb) => { return 1; };
global.clearInterval = (id) => { };
global.addEventListener = () => { };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Dependencies ---
window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x: x + 400, y: y + 300, scale: 1, depth: z }),
    applyDepthFog: (alpha, depth) => alpha,
    calculateFaceNormal: (v1, v2, v3) => ({ x: 0, y: 0, z: -1 })
};
window.GreenhouseModelsUtil = {
    t: (k) => k,
    toggleLanguage: () => { },
    wrapText: () => { }
};
window.GreenhouseADHDData = {
    scenarios: {
        'inattentive': { enhancements: [1, 2] }
    },
    getEnhancementById: () => ({ name: 'Test', desc: 'Test' })
};

// Load Modules
loadScript('neuro_config.js');
loadScript('neuro_ui_3d_geometry.js');
loadScript('neuro_ui_3d_brain.js');
loadScript('neuro_ui_3d_neuron.js');
loadScript('neuro_ui_3d_synapse.js');
loadScript('neuro_ui_3d_stats.js');
loadScript('neuro_ui_3d_enhanced.js');
loadScript('neuro_controls.js');
loadScript('neuro_ga.js');
loadScript('neuro_app.js');

// --- Test Suites ---

TestFramework.describe('GreenhouseNeuroUI3D', () => {
    let ui;
    let mockContainer;

    TestFramework.beforeEach(() => {
        ui = window.GreenhouseNeuroUI3D;
        mockContainer = document.createElement('div');
        global.document.querySelector = () => mockContainer;

        window.GreenhouseNeuroApp.init(mockContainer);
        ui.init(mockContainer);

        ui.updateData({
            neurons: [{ id: 1, x: 0, y: 0, z: 0, type: 'input' }],
            connections: [{ from: 1, to: 1, weight: 0.5, mesh: { vertices: [], faces: [] } }],
            fitness: 0.5
        });
    });

    TestFramework.it('should initialize', () => {
        assert.isDefined(ui.canvas);
        assert.isDefined(ui.ctx);
    });

    TestFramework.it('should update data', () => {
        assert.isDefined(ui.neurons);
        assert.equal(ui.neurons.length, 1);
    });

    TestFramework.it('should render', () => {
        ui.render();
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroApp', () => {
    let app;
    TestFramework.beforeEach(() => {
        app = window.GreenhouseNeuroApp;
        app.stopSimulation();
        app.init(document.createElement('div'));
    });

    TestFramework.it('should initialize app state', () => {
        assert.isDefined(app.ga);
        assert.isDefined(app.ui);
        assert.equal(app.state.viewMode, 0);
        // Ensure sliders are initialized
        assert.isDefined(app.ui.sliders);
        assert.isTrue(app.ui.sliders.length > 0);
    });

    TestFramework.it('should handle mode switching', () => {
        app.switchMode(1);
        assert.equal(app.ga.populationSize, 80);
    });
});

TestFramework.describe('GreenhouseNeuroControls', () => {
    const controls = window.GreenhouseNeuroControls;
    const ctx = document.createElement('canvas').getContext('2d');
    const mockApp = {
        ui: {
            hoveredElement: null,
            sliders: [{ min: 0, max: 1, x: 0, y: 0, w: 100, h: 10 }]
        },
        roundRect: () => { }
    };

    TestFramework.it('should draw panel', () => {
        controls.drawPanel(ctx, mockApp, 0, 0, 100, 100, 'Test');
        assert.isTrue(true);
    });

    TestFramework.it('should draw buttons', () => {
        controls.drawButton(ctx, mockApp, { x: 0, y: 0, w: 50, h: 20, label: 'btn' }, false);
        assert.isTrue(true);
    });
});

// Run Tests
TestFramework.run();
