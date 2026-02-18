
const fs = require('fs');
const path = require('path');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Mock browser environment
global.window = global;
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
        width: 800, height: 600, addEventListener: () => {}
    }),
    querySelector: () => ({ appendChild: () => {}, prepend: () => {}, style: {}, setAttribute: () => {}, offsetWidth: 800, innerHTML: '' }),
    getElementById: () => null,
    addEventListener: () => {}
};

global.GreenhouseModelsUtil = { t: (k) => k || '' };

// Load modules
const files = [
    'cognition_drawing_utils.js',
    'cognition_analytics.js',
    'cognition_theories.js',
    'cognition_development.js',
    'cognition_interventions.js',
    'cognition_medications.js',
    'cognition_research.js',
    'cognition_educational.js'
];

files.forEach(f => {
    const code = fs.readFileSync(path.join(__dirname, '../../docs/js/', f), 'utf8');
    eval(code);
});

TestFramework.describe('Cognition Sub-Modules Registration', () => {
    const modules = [
        { name: 'Analytical', obj: 'GreenhouseCognitionAnalytics' },
        { name: 'Theory', obj: 'GreenhouseCognitionTheories' },
        { name: 'Development', obj: 'GreenhouseCognitionDevelopment' },
        { name: 'Intervention', obj: 'GreenhouseCognitionInterventions' },
        { name: 'Medication', obj: 'GreenhouseCognitionMedications' },
        { name: 'Research', obj: 'GreenhouseCognitionResearch' },
        { name: 'Educational', obj: 'GreenhouseCognitionEducational' }
    ];

    const mockCtx = {
        save: () => {}, restore: () => {}, fillStyle: '', font: '', fillText: () => {},
        fillRect: () => {}, strokeRect: () => {}, beginPath: () => {}, arc: () => {},
        fill: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {},
        bezierCurveTo: () => {}, ellipse: () => {}, setLineDash: () => {},
        quadraticCurveTo: () => {}, globalAlpha: 1.0, lineWidth: 1.0,
        createRadialGradient: () => ({ addColorStop: () => {} })
    };

    modules.forEach(m => {
        TestFramework.describe(`${m.name} Module`, () => {
            TestFramework.it('should have an init function', () => {
                assert.isFunction(window[m.obj].init);
            });
            TestFramework.it('should have a render function', () => {
                assert.isFunction(window[m.obj].render);
            });
            TestFramework.it('should render without crashing for a valid ID', () => {
                const app = {
                    activeEnhancement: { id: 1, category: m.name, region: 'pfc', name: 'Enh1' }, // Added name
                    canvas: { width: 800, height: 600 },
                    config: { regions: { pfc: { name: 'PFC' } } }
                };
                window[m.obj].init(app);
                window[m.obj].render(mockCtx);
            });
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
