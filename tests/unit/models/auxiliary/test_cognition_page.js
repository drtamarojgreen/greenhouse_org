/**
 * Unit Tests for Cognition Page and 100 Enhancements
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => { };
global.document = {
    querySelector: () => ({
        appendChild: () => { },
        prepend: () => { },
        style: {},
        innerHTML: '',
        offsetWidth: 800,
        children: []
    }),
    createElement: (tag) => {
        const el = {
            style: {},
            appendChild: () => { },
            prepend: () => { },
            innerHTML: '',
            children: [],
            addEventListener: () => { },
            onmouseover: null,
            onmouseout: null,
            onclick: null,
            onchange: null,
            oninput: null,
            value: '',
            textContent: '',
            title: '',
            getAttribute: () => '',
            setAttribute: () => '',
            hasAttribute: () => false,
            offsetWidth: 800
        };
        if (tag === 'canvas') {
            el.width = 800;
            el.height = 500;
            el.getContext = () => ({
                save: () => { },
                restore: () => { },
                beginPath: () => { },
                moveTo: () => { },
                lineTo: () => { },
                stroke: () => { },
                fill: () => { },
                arc: () => { },
                ellipse: () => { },
                fillRect: () => { },
                strokeRect: () => { },
                fillText: () => { },
                measureText: () => ({ width: 0 }),
                clearRect: () => { },
                createRadialGradient: () => ({ addColorStop: () => { } }),
                setLineDash: () => { },
                quadraticCurveTo: () => { },
                bezierCurveTo: () => { },
                rect: () => { },
                closePath: () => { }
            });
        }
        return el;
    },
    addEventListener: () => { }
};
global.navigator = {
    userAgent: 'node.js'
};
// Prevent infinite loop in tests
global.requestAnimationFrame = (cb) => { };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// Load dependencies
global.GreenhouseUtils = { observeAndReinitializeApplication: () => {} };
global.GreenhouseModels3DMath = { project3DTo2D: () => ({x:0, y:0, scale:1, depth:0}), applyDepthFog: () => 1 };
global.GreenhouseBrainMeshRealistic = { generateRealisticBrain: () => ({ vertices: [], faces: [], regions: {} }) };
global.GreenhouseNeuroBrain = { drawBrainShell: () => {} };

TestFramework.describe('Cognition Page Enhancements', () => {

    TestFramework.it('should load all cognition scripts', () => {
        loadScript('cognition_config.js');
        loadScript('cognition_analytics.js');
        loadScript('cognition_theories.js');
        loadScript('cognition_development.js');
        loadScript('cognition_interventions.js');
        loadScript('cognition_medications.js');
        loadScript('cognition_research.js');
        loadScript('cognition_educational.js');
        loadScript('cognition_app.js');

        assert.isDefined(global.window.GreenhouseCognitionConfig);
        assert.isDefined(global.window.GreenhouseCognitionApp);
    });

    TestFramework.it('should have 200 enhancements in config', () => {
        const config = global.window.GreenhouseCognitionConfig;
        assert.equal(config.enhancements.length, 200);
    });

    TestFramework.it('should initialize app and sub-modules', () => {
        const app = global.window.GreenhouseCognitionApp;
        app.init('#test-container');

        assert.isTrue(app.isRunning);
        assert.isDefined(global.window.GreenhouseCognitionAnalytics.app);
        assert.isDefined(global.window.GreenhouseCognitionTheories.app);
    });

    TestFramework.it('should cycle through enhancement categories', () => {
        const config = global.window.GreenhouseCognitionConfig;
        const app = global.window.GreenhouseCognitionApp;

        const categories = ['Analytical', 'Theory', 'Development', 'Intervention', 'Medication', 'Visualization', 'Accuracy', 'Research', 'Educational'];
        categories.forEach(cat => {
            const enh = config.enhancements.find(e => e.category === cat);
            assert.isDefined(enh, `Should have at least one ${cat} enhancement`);

            app.activeEnhancement = enh;
            app.activeRegion = enh.region;

            // Trigger render to ensure no crashes
            try {
                app.render();
            } catch (e) {
                throw new Error(`Rendering failed for category ${cat}: ${e.message}`);
            }
        });
    });

});

TestFramework.run();
