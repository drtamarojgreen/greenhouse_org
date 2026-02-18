
const fs = require('fs');
const path = require('path');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

global.window = global;
global.document = { addEventListener: () => {} };
global.GreenhouseModelsUtil = { t: (k) => k };

const drawingUtilsCode = fs.readFileSync(path.join(__dirname, '../../docs/js/cognition_drawing_utils.js'), 'utf8');
eval(drawingUtilsCode);

TestFramework.describe('Cognition Drawing Utilities', () => {
    const ctx = {
        save: () => {}, restore: () => {}, fillStyle: '', font: '', fillText: () => {},
        fillRect: () => {}, strokeRect: () => {}, beginPath: () => {}, arc: () => {},
        fill: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {},
        bezierCurveTo: () => {}, ellipse: () => {}, setLineDash: () => {},
        quadraticCurveTo: () => {}, globalAlpha: 1.0, lineWidth: 1.0,
        createRadialGradient: () => ({ addColorStop: () => {} }),
        closePath: () => {}, rect: () => {}
    };

    TestFramework.it('renderHeader should execute without error', () => {
        const app = { config: { regions: { r1: { name: 'n1' } } } };
        const enh = { category: 'Theory', name: 'e1', region: 'r1' };
        window.GreenhouseCognitionDrawingUtils.renderHeader(ctx, app, enh);
    });

    TestFramework.it('renderCategoryInfo should execute without error', () => {
        window.GreenhouseCognitionDrawingUtils.renderCategoryInfo(ctx, 'Analytical', 'desc', 800, 600);
    });

    TestFramework.it('drawPulse should execute without error', () => {
        window.GreenhouseCognitionDrawingUtils.drawPulse(ctx, 100, 100, '#fff', 'label');
    });

    TestFramework.it('drawSynapse should execute without error', () => {
        window.GreenhouseCognitionDrawingUtils.drawSynapse(ctx, 100, 100, '#fff', 'label');
    });

    TestFramework.it('drawNetwork should execute without error', () => {
        window.GreenhouseCognitionDrawingUtils.drawNetwork(ctx, { width: 800, height: 600 }, '#fff', 'label');
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
