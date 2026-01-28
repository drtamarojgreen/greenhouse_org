/**
 * Unit Tests for Emotion Page Deep Dive and Network Visualizations
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.CustomEvent = class { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.MutationObserver = class { constructor() {} observe() {} disconnect() {} };

global.document = {
    querySelector: () => ({
        innerHTML: '',
        style: {},
        prepend: () => {},
        appendChild: () => {},
        offsetWidth: 1000
    }),
    createElement: (tag) => {
        const el = {
            tagName: tag,
            style: {},
            innerHTML: '',
            appendChild: (child) => {
                if (!el.children) el.children = [];
                el.children.push(child);
                return child;
            },
            prepend: (child) => {
                if (!el.children) el.children = [];
                el.children.unshift(child);
                return child;
            },
            addEventListener: () => {},
            getContext: function() {
                const ctx = {
                    save: () => { },
                    restore: () => { },
                    beginPath: () => { },
                    moveTo: () => { },
                    lineTo: () => { },
                    arc: () => { },
                    fill: () => { },
                    stroke: () => { },
                    clearRect: () => { },
                    fillRect: () => { },
                    strokeRect: () => { },
                    fillText: () => { },
                    measureText: () => ({ width: 50 }),
                    createRadialGradient: () => ({ addColorStop: () => { } }),
                    setLineDash: () => { },
                    quadraticCurveTo: () => { },
                    bezierCurveTo: () => { },
                    closePath: () => { },
                    ellipse: () => { },
                    canvas: el
                };
                return ctx;
            },
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
            width: 800,
            height: 600
        };
        return el;
    },
    addEventListener: () => {}
};
global.navigator = { userAgent: 'test' };
global.console = console;
global.requestAnimationFrame = (cb) => {};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Load Dependencies ---
loadScript('GreenhouseUtils.js');
loadScript('GreenhouseBaseApp.js');
loadScript('models_util.js');
loadScript('models_3d_math.js');
loadScript('brain_mesh_realistic.js');
loadScript('emotion_ui_3d_brain.js');
loadScript('emotion_config.js');
loadScript('emotion_diagrams.js');
loadScript('emotion_regions.js');
loadScript('emotion_interventions.js');
loadScript('emotion_theories.js');
loadScript('emotion_app.js');

// --- Test Suites ---

TestFramework.describe('Emotion Page Deep Dive & Networks', () => {

    TestFramework.it('should display deep dive panel when a region is selected', () => {
        const app = global.window.GreenhouseEmotionApp;
        app.init('#test-container');

        // Select a region
        app.selectRegion('amygdala');

        assert.equal(app.selectedRegion, 'amygdala');
        assert.equal(app.deepDivePanel.style.width, '350px');
        assert.isTrue(app.deepDivePanel.innerHTML.includes('Amygdala'));
        assert.isTrue(app.deepDivePanel.innerHTML.includes('Clinical Significance'));
    });

    TestFramework.it('should hide deep dive panel when selection is cleared', () => {
        const app = global.window.GreenhouseEmotionApp;
        app.selectRegion(null);

        assert.equal(app.selectedRegion, null);
        assert.equal(app.deepDivePanel.style.width, '0');
        assert.equal(app.deepDivePanel.innerHTML, '');
    });

    TestFramework.it('should contain specific sub-regions and NTs for dlPFC', () => {
        const app = global.window.GreenhouseEmotionApp;
        app.selectRegion('dlPFC');

        assert.isTrue(app.deepDivePanel.innerHTML.includes('Brodmann Area 9/46'));
        assert.isTrue(app.deepDivePanel.innerHTML.includes('Dopamine'));
        assert.isTrue(app.deepDivePanel.innerHTML.includes('CEN'));
    });

    TestFramework.it('should render network states without crash', () => {
        const app = global.window.GreenhouseEmotionApp;
        const diagrams = global.window.GreenhouseEmotionDiagrams;
        const ctx = app.ctx;

        // Mock active theory to trigger diagrams
        app.activeTheory = { id: 7, name: 'DMN vs CEN' };

        // This should run without throwing
        diagrams.draw(ctx, app);

        assert.isTrue(true); // If we reach here, it didn't crash
    });

    TestFramework.it('should have correct anatomical centers for new regions', () => {
        const diagrams = global.window.GreenhouseEmotionDiagrams;
        assert.isDefined(diagrams.centers.dlPFC);
        assert.isDefined(diagrams.centers.subgenualACC);
        assert.isDefined(diagrams.centers.nucleusAccumbens);
        assert.isDefined(diagrams.centers.parietalLobe);
    });

});

// Run the tests
TestFramework.run();
