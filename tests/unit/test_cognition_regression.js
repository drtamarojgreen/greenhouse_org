
const fs = require('fs');
const path = require('path');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Mock browser environment
global.window = global;
global.addEventListener = () => {};
global.document = {
    createElement: (tag) => ({
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        prepend: () => {},
        getContext: () => ({
            clearRect: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, fillText: () => {},
            fillRect: () => {}, strokeRect: () => {}, save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
            moveTo: () => {}, lineTo: () => {}, bezierCurveTo: () => {}, quadraticCurveTo: () => {}, ellipse: () => {},
            setLineDash: () => {}, rect: () => {}, closePath: () => {}, createRadialGradient: () => ({ addColorStop: () => {} })
        }),
        width: 800, height: 600, addEventListener: () => {}, offsetWidth: 800, value: '', options: []
    }),
    querySelector: () => ({ appendChild: () => {}, prepend: () => {}, style: {}, setAttribute: () => {}, offsetWidth: 800, innerHTML: '', value: '' }),
    getElementById: () => ({ value: '', textContent: '' }),
    addEventListener: () => {}
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

global.GreenhouseModelsUtil = { t: (k) => k || '' };
global.GreenhouseBrainMeshRealistic = {
    generateRealisticBrain: () => ({
        vertices: [{x:0, y:0, z:0}],
        faces: [{indices: [0,0,0], region: 'prefrontalCortex'}],
        regions: { prefrontalCortex: { vertices: [0] } }
    })
};
global.GreenhouseModels3DMath = {
    project3DTo2D: () => ({ x: 400, y: 300, scale: 1, depth: 0.5 }),
    applyDepthFog: (v) => v
};
global.GreenhouseCognitionBrain = {
    calculateCentroids: () => ({ prefrontalCortex: {x:0, y:0, z:0} }),
    drawBrainShell: () => {},
    drawLabels: () => {}
};

// Load app and drawing utils
const drawingUtilsCode = fs.readFileSync(path.join(__dirname, '../../docs/js/cognition_drawing_utils.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../../docs/js/cognition_app.js'), 'utf8');
const configCode = fs.readFileSync(path.join(__dirname, '../../docs/js/cognition_config.js'), 'utf8');

eval(configCode);
eval(drawingUtilsCode);
eval(appCode);

TestFramework.describe('Cognition Regression Tests', () => {
    TestFramework.it('should display category documentation when no enhancement is active', () => {
        const app = window.GreenhouseCognitionApp;
        app.init('#container');
        app.activeCategory = 'Analytical';
        app.activeEnhancement = null;

        let callCount = 0;
        const originalRenderCategoryInfo = window.GreenhouseCognitionDrawingUtils.renderCategoryInfo;
        window.GreenhouseCognitionDrawingUtils.renderCategoryInfo = () => { callCount++; };

        app.render();

        assert.equal(callCount, 1);
        window.GreenhouseCognitionDrawingUtils.renderCategoryInfo = originalRenderCategoryInfo;
        app.isRunning = false;
    });

    TestFramework.it('should handle missing category metadata gracefully', () => {
        const app = window.GreenhouseCognitionApp;
        app.init('#container');
        app.activeCategory = 'NonExistent';
        app.activeEnhancement = null;

        // Should not throw
        app.render();
        assert.isTrue(true);
        app.isRunning = false;
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
