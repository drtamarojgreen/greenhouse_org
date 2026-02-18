/**
 * Unit Tests for Neuro UI Components (Canvas Controls)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;

function createMockCtx() {
    return {
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
        setLineDash: () => { },
        set fillStyle(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        set globalAlpha(v) { },
        set font(v) { },
        set textAlign(v) { },
        set textBaseline(v) { }
    };
}

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('neuro_controls.js');

TestFramework.describe('GreenhouseNeuroControls', () => {
    let ctx;
    let mockApp;

    TestFramework.beforeEach(() => {
        ctx = createMockCtx();
        mockApp = {
            ui: {
                hoveredElement: null
            },
            roundRect: (ctx, x, y, w, h, r, fill, stroke) => {
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                if (fill) ctx.fill();
                if (stroke) ctx.stroke();
            }
        };
    });

    TestFramework.it('should draw a panel', () => {
        window.GreenhouseNeuroControls.drawPanel(ctx, mockApp, 10, 10, 100, 100, 'Test Panel');
        assert.isTrue(true); // Should not crash
    });

    TestFramework.it('should draw a button', () => {
        const btn = { id: 'test_btn', label: 'Click Me', x: 10, y: 10, w: 50, h: 20 };
        window.GreenhouseNeuroControls.drawButton(ctx, mockApp, btn, false);
        assert.isTrue(true);
    });

    TestFramework.it('should draw an active button', () => {
        const btn = { id: 'test_btn', label: 'Click Me', x: 10, y: 10, w: 50, h: 20 };
        window.GreenhouseNeuroControls.drawButton(ctx, mockApp, btn, true);
        assert.isTrue(true);
    });

    TestFramework.it('should draw a slider', () => {
        const slider = { id: 'test_slider', x: 10, y: 10, w: 100, h: 20, min: 0, max: 1 };
        window.GreenhouseNeuroControls.drawSlider(ctx, mockApp, slider, 0.5);
        assert.isTrue(true);
    });

    TestFramework.it('should draw a checkbox', () => {
        const checkbox = { id: 'test_cb', labelKey: 'cb_label', x: 10, y: 10, w: 100, h: 20 };
        window.GreenhouseNeuroControls.drawCheckbox(ctx, mockApp, checkbox, true);
        assert.isTrue(true);
    });

    TestFramework.it('should draw a search box', () => {
        const search = { id: 'test_search', x: 10, y: 10, w: 100, h: 20 };
        window.GreenhouseNeuroControls.drawSearchBox(ctx, mockApp, search, 'query');
        assert.isTrue(true);
    });
});

TestFramework.run();
