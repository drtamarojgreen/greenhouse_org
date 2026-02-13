/**
 * @file test_inflammation_ui.js
 * @description Unit tests for the Neuroinflammation UI and Interaction logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => {}; // Added missing addEventListener
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
                    rect: () => {}
                }),
                width: 1000,
                height: 750,
                style: {},
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 750 }),
                onmousedown: null,
                onmousemove: null,
                onmouseup: null,
                onwheel: null
            };
        }
        return { appendChild: () => {}, innerHTML: '', style: {} };
    },
    querySelector: () => ({
        appendChild: () => {},
        innerHTML: '',
        offsetWidth: 1000,
        offsetHeight: 750,
        style: {}
    }),
    currentScript: null
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

// Mock 3D Math
global.window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x: x + 500, y: y + 350, scale: 1, depth: z })
};

// Load Dependencies
loadScript('models_util.js');
loadScript('inflammation_config.js');
loadScript('inflammation_geometry.js');
loadScript('inflammation_app.js');
loadScript('inflammation_ui_3d.js');

TestFramework.describe('GreenhouseInflammationApp UI', () => {

    let app;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseInflammationApp;
        app.init('div'); // Initializes with mocked DOM
    });

    TestFramework.it('should setup UI elements from config with categories', () => {
        assert.greaterThan(app.ui.checkboxes.length, 0);
        assert.isDefined(app.ui.checkboxes[0].category);
        assert.equal(app.ui.buttons.length, 3);
    });

    TestFramework.it('should toggle factor on checkbox click when category is open', () => {
        const cat = app.ui.categories.find(c => c.id === 'env');
        cat.isOpen = true;

        const checkbox = app.ui.checkboxes.find(c => c.category === 'env');
        const initialVal = app.engine.state.factors[checkbox.id];

        checkbox.x = cat.x + 10;
        checkbox.y = cat.y + 30;

        const event = { clientX: checkbox.x + 5, clientY: checkbox.y + 5 };
        app.handleMouseDown(event);

        assert.notEqual(app.engine.state.factors[checkbox.id], initialVal);
    });

    TestFramework.it('should change viewMode on button click', () => {
        const button = app.ui.buttons[1];
        const event = { clientX: button.x + 5, clientY: button.y + 5 };
        app.handleMouseDown(event);

        assert.equal(app.engine.state.factors.viewMode, button.val);
    });

    TestFramework.it('should set hoveredElement on mouseMove over checkbox', () => {
        const cat = app.ui.categories.find(c => c.id === 'env');
        cat.isOpen = true;
        const checkbox = app.ui.checkboxes.find(c => c.category === 'env');
        checkbox.x = cat.x + 10;
        checkbox.y = cat.y + 30;

        const event = { clientX: checkbox.x + 5, clientY: checkbox.y + 5 };
        app.handleMouseMove(event);

        assert.isNotNull(app.ui.hoveredElement);
        assert.equal(app.ui.hoveredElement.id, checkbox.id);
        assert.equal(app.ui.hoveredElement.type, 'checkbox');
    });

    TestFramework.it('should update camera Z on wheel event', () => {
        const initialZ = app.camera.z;
        const event = { deltaY: 100, preventDefault: () => {} };
        app.handleWheel(event);

        assert.notEqual(app.camera.z, initialZ);
    });

    TestFramework.describe('3D Hover Detection', () => {
        TestFramework.it('should detect glia hover in micro mode', () => {
            app.engine.state.factors.viewMode = 1;
            const ui3d = window.GreenhouseInflammationUI3D;
            ui3d.glia[0] = { x: 0, y: 0, z: 0, type: 'microglia' };

            const event = { clientX: 500, clientY: 350 };
            app.handleMouseMove(event);

            assert.isNotNull(app.ui.hoveredElement);
            assert.equal(app.ui.hoveredElement.id, 'glia');
        });

        TestFramework.it('should detect molecule hover in molecular mode', () => {
            app.engine.state.factors.viewMode = 2;
            const ui3d = window.GreenhouseInflammationUI3D;
            // Move molecule away from membrane zone (30%-50% of height)
            // Height is 750, so zone is 225-375.
            // Let's place it at y=0 which projects to 350. Wait, that's inside.
            // Let's place it at y=-300 which projects to 350 - 300 = 50.
            ui3d.molecules[0] = { x: 0, y: -300, z: 0, type: 'pro-cytokine' };

            const event = { clientX: 500, clientY: 50 };
            app.handleMouseMove(event);

            assert.isNotNull(app.ui.hoveredElement);
            assert.equal(app.ui.hoveredElement.id, 'molecule');
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
