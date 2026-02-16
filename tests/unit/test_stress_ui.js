/**
 * @file test_stress_ui.js
 * @description Unit tests for the Stress Dynamics UI and Interaction logic.
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
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                getContext: () => ({
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
                    rect: () => {},
                    strokeRect: () => {}
                }),
                width: 1000,
                height: 750,
                style: {},
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 750 }),
                addEventListener: () => {}
            };
        }
        return { appendChild: () => {}, innerHTML: '', style: {}, addEventListener: () => {} };
    },
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: '',
        offsetWidth: 1000,
        offsetHeight: 750,
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

// Mock 3D Math and Geometry
global.window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x: x + 500, y: y + 375, scale: 1, depth: z })
};
global.window.GreenhouseNeuroGeometry = {
    generateSphere: () => ({ vertices: [], faces: [] })
};

// Load Dependencies
loadScript('models_util.js');
loadScript('stress_config.js');
loadScript('stress_geometry.js');
loadScript('stress_app.js');
loadScript('stress_systemic.js');
loadScript('stress_ui_3d.js');

TestFramework.describe('GreenhouseStressApp UI', () => {

    let app;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseStressApp;
        app.init('div');
    });

    TestFramework.it('should setup UI elements and categories', () => {
        assert.greaterThan(app.ui.categories.length, 0);
        assert.greaterThan(app.ui.checkboxes.length, 0);
    });

    TestFramework.it('should toggle category isOpen on header click', () => {
        const cat = app.ui.categories[0]; // 'hpa', closed by default
        assert.isFalse(cat.isOpen);

        const event = { clientX: cat.x + 5, clientY: cat.y + 5 };
        app.handleMouseDown(event);

        assert.isTrue(cat.isOpen);
        // Accordion check: 'env' (index 1) should now be closed
        assert.isFalse(app.ui.categories[1].isOpen);
    });

    TestFramework.it('should toggle factor on checkbox click when category is open', () => {
        const cat = app.ui.categories[0]; // 'env' is open by default
        cat.isOpen = true;

        // Find a checkbox in this category
        const checkbox = app.ui.checkboxes.find(c => c.category === cat.id);
        const initialVal = app.engine.state.factors[checkbox.id];

        // hitTestCheckboxes uses layout: bx = cat.x + 10 + (col * 190); by = cat.y + 30 + (row * 22);
        // For the first one: col=0, row=0 -> bx = cat.x + 10, by = cat.y + 30
        const mx = cat.x + 15;
        const my = cat.y + 35;

        const event = { clientX: mx, clientY: my };
        app.handleMouseDown(event);

        assert.notEqual(app.engine.state.factors[checkbox.id], initialVal);
    });

    TestFramework.it('should set hoveredElement on mouseMove over category header', () => {
        const cat = app.ui.categories[0];
        const event = { clientX: cat.x + 5, clientY: cat.y + 5 };
        app.handleMouseMove(event);

        assert.isNotNull(app.ui.hoveredElement);
        assert.equal(app.ui.hoveredElement.id, cat.id);
        assert.equal(app.ui.hoveredElement.type, 'header');
    });

    TestFramework.it('should detect 3D node hover in systemic view', () => {
        app.engine.state.factors.viewMode = 2; // Systemic
        // HPA node (index 0) at time=0: angle=0, orbit=120 -> x=120, y=0 -> Projected: 620, 375
        const event = { clientX: 620, clientY: 375 };
        app.handleMouseMove(event);

        assert.isNotNull(app.ui.hoveredElement);
        assert.equal(app.ui.hoveredElement.id, 'cat_hpa');
    });

    TestFramework.it('should correctly implement hitTestCheckboxes', () => {
        const cat = app.ui.categories[0];
        cat.isOpen = true;
        const catBoxes = app.ui.checkboxes.filter(c => c.category === cat.id);

        // Test first checkbox (col 0, row 0)
        let hit = app.hitTestCheckboxes(cat.x + 15, cat.y + 35);
        assert.equal(hit.id, catBoxes[0].id);

        // Test second checkbox (col 1, row 0) if exists
        if (catBoxes.length > 1) {
            hit = app.hitTestCheckboxes(cat.x + 205, cat.y + 35);
            assert.equal(hit.id, catBoxes[1].id);
        }

        // Test third checkbox (col 0, row 1) if exists
        if (catBoxes.length > 2) {
            hit = app.hitTestCheckboxes(cat.x + 15, cat.y + 57);
            assert.equal(hit.id, catBoxes[2].id);
        }
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
