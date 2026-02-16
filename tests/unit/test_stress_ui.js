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
                    strokeRect: () => {},
                    createRadialGradient: () => ({ addColorStop: () => {} })
                }),
                width: 1440,
                height: 900,
                style: {},
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 900 }),
                addEventListener: () => {}
            };
        }
        return { appendChild: () => {}, innerHTML: '', style: {}, addEventListener: () => {} };
    },
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: '',
        offsetWidth: 1440,
        offsetHeight: 900,
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
    // Offset Y to 450 to avoid overlap with category headers in unit tests
    project3DTo2D: (x, y, z) => ({ x: x + 720, y: y + 450, scale: 1, depth: z })
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
        const cat = app.ui.categories[0]; // 'hpa'
        cat.isOpen = true;

        // Find a checkbox in this category
        const checkbox = app.ui.checkboxes.find(c => c.category === cat.id);
        const initialVal = app.engine.state.factors[checkbox.id];

        const mx = cat.x + 15;
        const my = cat.y + 45;

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
        // HPA node (index 0) at time=0: angle=0, orbit=110 -> x=110, y=0 -> Projected: 720+110=830, 450
        const event = { clientX: 830, clientY: 450 };
        app.handleMouseMove(event);

        assert.isNotNull(app.ui.hoveredElement);
        assert.equal(app.ui.hoveredElement.id, 'cat_hpa');
    });

    TestFramework.it('should correctly implement hitTestCheckboxes', () => {
        const cat = app.ui.categories[0];
        cat.isOpen = true;
        const catBoxes = app.ui.checkboxes.filter(c => c.category === cat.id);

        let hit = app.hitTestCheckboxes(cat.x + 15, cat.y + 45);
        assert.equal(hit.id, catBoxes[0].id);

        if (catBoxes.length > 1) {
            hit = app.hitTestCheckboxes(cat.x + 205, cat.y + 45);
            assert.equal(hit.id, catBoxes[1].id);
        }

        if (catBoxes.length > 2) {
            hit = app.hitTestCheckboxes(cat.x + 15, cat.y + 70);
            assert.equal(hit.id, catBoxes[2].id);
        }
    });

    TestFramework.it('should ensure no overlap between categories and telemetry dashboard', () => {
        const dashboardLeft = app.canvas.width - 220; // Exact dashboard left edge per code

        app.ui.categories.forEach(cat => {
            // Check header (width is 390 based on code/panel logic)
            // Note: Header w is 180 in the ui object but it draws a wider panel in drawUI?
            // Actually GreenhouseStressControls.drawCategoryHeader uses cat.w which is 180.
            // But the dropdown panel is 400 wide.
            const panelWidth = 400;
            assert.isTrue(cat.x + panelWidth <= dashboardLeft, `Category ${cat.id} panel overlaps dashboard: ${cat.x + panelWidth} > ${dashboardLeft}`);

            const wasOpen = cat.isOpen;
            cat.isOpen = true;
            app.updateCategoryPositions();

            const catBoxes = app.ui.checkboxes.filter(c => c.category === cat.id);
            catBoxes.forEach(box => {
                const boxRight = cat.x + 10 + (box.col || 0) * 190 + 180;
                // col is calculated at runtime in hitTestCheckboxes and drawUI
            });
            cat.isOpen = wasOpen;
        });
    });

    TestFramework.it('should ensure all systemic nodes are within canvas bounds', () => {
        const systemic = window.GreenhouseStressSystemic;
        systemic.initVisuals();
        [0, 1000, 5000].forEach(time => {
            app.engine.state.time = time;
            Object.keys(systemic.categories).forEach((catKey, i) => {
                const cat = systemic.categories[catKey];
                const angle = time * cat.speed + (i * Math.PI / 6);
                const x = Math.cos(angle) * cat.orbit;
                const z = Math.sin(angle) * cat.orbit;
                const y = Math.sin(angle * 2) * 30;
                const p = window.GreenhouseModels3DMath.project3DTo2D(x, y, z);
                assert.isTrue(p.x >= 0 && p.x <= app.canvas.width, `Node ${catKey} x out of bounds at t=${time}: ${p.x}`);
                assert.isTrue(p.y >= 0 && p.y <= app.canvas.height, `Node ${catKey} y out of bounds at t=${time}: ${p.y}`);
            });
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
