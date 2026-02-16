/**
 * @file test_stress_enhancements.js
 * @description Unit tests for new enhancements: scrubber, telemetry, and geometries.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => {};
global.dispatchEvent = () => {};
global.CustomEvent = class { constructor(name, detail) { this.name = name; this.detail = detail; } };

const mockCanvas = {
    width: 1000,
    height: 750,
    style: {},
    getContext: function() { return this.ctx; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 750 })
};

const mockCtx = {
    canvas: mockCanvas,
    fillRect: () => {},
    fillText: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    measureText: () => ({ width: 0 }),
    save: () => {},
    restore: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    strokeRect: () => {},
    arc: () => {},
    drawImage: () => {},
    setLineDash: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {}
};
mockCanvas.ctx = mockCtx;

global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') return mockCanvas;
        return { appendChild: () => {}, style: {}, innerHTML: '' };
    },
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: '',
        offsetWidth: 1000,
        style: {}
    })
};
global.navigator = { userAgent: 'node' };
global.console = console;
global.requestAnimationFrame = (cb) => {};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Load Dependencies
loadScript('models_util.js');
loadScript('models_3d_math.js');
loadScript('neuro_ui_3d_geometry.js');
loadScript('stress_config.js');
loadScript('stress_app.js');
loadScript('stress_systemic.js');

TestFramework.describe('GreenhouseStressApp Enhancements', () => {

    let app;
    let systemic;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseStressApp;
        app.init('div');
        systemic = window.GreenhouseStressSystemic;
    });

    TestFramework.it('should initialize category-specific geometries', () => {
        systemic.initVisuals();
        // All nodes are spheres per user request
        Object.keys(systemic.categories).forEach(catKey => {
            const mesh = systemic.nodeMeshes[catKey];
            assert.isNotNull(mesh, `Mesh for ${catKey} should not be null`);
            // Sphere(1.0, 6) has 49 vertices, 72 faces
            assert.equal(mesh.vertices.length, 49, `Vertices for ${catKey} mismatch`);
            assert.equal(mesh.faces.length, 72, `Faces for ${catKey} mismatch`);
        });
    });

    TestFramework.it('should handle scrubber interaction in systemic view', () => {
        app.engine.state.factors.viewMode = 2; // Systemic
        const sw = app.canvas.width;
        const sh = app.canvas.height;
        const scrubberW = 400;
        const scrubberX = (sw - scrubberW) / 2;
        const scrubberY = sh - 40;

        // Initial T should be 0.5
        assert.equal(systemic.timelineT, 0.5);

        // Click at start of scrubber
        const eventDown = { clientX: scrubberX, clientY: scrubberY };
        app.handleMouseDown(eventDown);
        assert.equal(systemic.timelineT, 0.0);
        assert.isTrue(app.interaction.isScrubbing);

        // Move to end of scrubber
        const eventMove = { clientX: scrubberX + scrubberW, clientY: scrubberY };
        app.handleMouseMove(eventMove);
        assert.equal(systemic.timelineT, 1.0);

        // Release
        app.handleMouseUp();
        assert.isFalse(app.interaction.isScrubbing);
    });

    TestFramework.it('should render telemetry dashboard in systemic view', () => {
        const ctx = app.ctx;
        const state = app.engine.state;
        // Mock score history
        systemic.scoreHistory['hpa'] = new Array(50).fill(1);

        // This just verifies it doesn't crash during render
        systemic.render(ctx, state, app.camera, app.projection, app.ui);
        assert.isTrue(true);
    });

    TestFramework.it('should calculate multimodal synergy and adherence effects', () => {
        const state = app.engine.state;
        const f = state.factors;
        const m = state.metrics;

        // Scenario 1: Low adherence/persistence
        f.stress_interv_adherence = 0;
        f.stress_interv_persistence = 0;
        f.stress_therapy_cbt = 1;
        f.stress_interv_multimodal = 1;

        m.allostaticLoad = 0.5;
        app.updateModel(state, 100);
        const load1 = m.allostaticLoad;

        // Scenario 2: High adherence/persistence + synergy
        f.stress_interv_adherence = 1;
        f.stress_interv_persistence = 1;
        f.stress_lifestyle_exercise = 1; // High synergy bonus

        m.allostaticLoad = 0.5;
        app.updateModel(state, 100);
        const load2 = m.allostaticLoad;

        // Higher adherence and synergy should lead to lower allostatic load (more damping)
        assert.isTrue(load2 < load1, "High adherence and synergy should reduce allostatic load more effectively");
    });

    TestFramework.it('should simulate health system capacity bottlenecks', () => {
        const state = app.engine.state;
        const f = state.factors;
        const m = state.metrics;

        // Scenario: Poor system access and capacity
        f.stress_system_access = 0;
        f.stress_system_capacity = 0;
        f.stress_therapy_cbt = 1;

        m.allostaticLoad = 0.5;
        app.updateModel(state, 100);
        const loadBlocked = m.allostaticLoad;

        // Scenario: Good system access
        f.stress_system_access = 1;
        f.stress_system_capacity = 1;

        m.allostaticLoad = 0.5;
        app.updateModel(state, 100);
        const loadFree = m.allostaticLoad;

        assert.isTrue(loadFree < loadBlocked, "System bottlenecks should impair the effectiveness of clinical interventions");
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
