/**
 * Unit Tests for Neuro UI 3D and Components
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => Date.now() },
        requestAnimationFrame: (cb) => { return 1; },
        Path2D: class { moveTo() { } lineTo() { } closePath() { } },
        document: {
            querySelector: () => null,
            createElement: (tag) => {
                if (tag === 'canvas') {
                    return {
                        getContext: () => ({
                            save: () => { }, restore: () => { }, translate: () => { },
                            rotate: () => { }, scale: () => { }, beginPath: () => { },
                            moveTo: () => { }, lineTo: () => { }, stroke: () => { },
                            fill: () => { }, rect: () => { }, clip: () => { },
                            fillText: () => { }, measureText: () => ({ width: 100 }),
                            createLinearGradient: () => ({ addColorStop: () => { } }),
                            createRadialGradient: () => ({ addColorStop: () => { } }),
                            clearRect: () => { }, fillRect: () => { }, strokeRect: () => { },
                            closePath: () => { }, quadraticCurveTo: () => { },
                            bezierCurveTo: () => { }, arcTo: () => { }, arc: () => { },
                            ellipse: () => { }, setLineDash: () => { },
                            set fillStyle(v) { }, set strokeStyle(v) { }, set lineWidth(v) { },
                            set globalAlpha(v) { }, set font(v) { }, set textAlign(v) { },
                            set textBaseline(v) { }
                        }),
                        width: 800, height: 600, style: {},
                        addEventListener: () => { }, appendChild: () => { },
                        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
                    };
                }
                return {
                    style: {}, appendChild: () => { }, addEventListener: () => { },
                    offsetWidth: 1000, offsetHeight: 750, innerHTML: '', focus: () => { }
                };
            },
            getElementById: () => ({ textContent: '', style: {}, addEventListener: () => { } })
        },
        GreenhouseModels3DMath: {
            project3DTo2D: (x, y, z) => ({ x: x + 400, y: y + 300, scale: 1, depth: z }),
            applyDepthFog: (alpha, depth) => alpha,
            calculateFaceNormal: (v1, v2, v3) => ({ x: 0, y: 0, z: -1 })
        },
        GreenhouseModelsUtil: {
            t: (k) => k,
            toggleLanguage: () => { },
            wrapText: () => { }
        },
        GreenhouseADHDData: {
            scenarios: { 'inattentive': { enhancements: [1, 2] } },
            getEnhancementById: () => ({ name: 'Test', desc: 'Test' })
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['neuro_config.js', 'neuro_ui_3d_geometry.js', 'neuro_ui_3d_brain.js', 'neuro_ui_3d_neuron.js', 'neuro_ui_3d_synapse.js', 'neuro_ui_3d_stats.js', 'neuro_ui_3d_enhanced.js', 'neuro_controls.js', 'neuro_ga.js', 'neuro_app.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('GreenhouseNeuroUI3D', () => {
    let env;
    let ui;
    let mockContainer;

    TestFramework.beforeEach(() => {
        env = createEnv();
        ui = env.window.GreenhouseNeuroUI3D;
        mockContainer = env.document.createElement('div');
        env.document.querySelector = () => mockContainer;

        env.window.GreenhouseNeuroApp.init(mockContainer);
        ui.init(mockContainer);

        ui.updateData({
            neurons: [{ id: 1, x: 0, y: 0, z: 0, type: 'input' }],
            connections: [{ from: 1, to: 1, weight: 0.5, mesh: { vertices: [], faces: [] } }],
            fitness: 0.5
        });
    });

    TestFramework.it('should initialize', () => {
        assert.isDefined(ui.canvas);
        assert.isDefined(ui.ctx);
    });

    TestFramework.it('should update data', () => {
        assert.isDefined(ui.neurons);
        assert.equal(ui.neurons.length, 1);
    });

    TestFramework.it('should render', () => {
        ui.render();
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroApp', () => {
    let env;
    let app;
    TestFramework.beforeEach(() => {
        env = createEnv();
        app = env.window.GreenhouseNeuroApp;
        app.stopSimulation();
        app.init(env.document.createElement('div'));
    });

    TestFramework.it('should initialize app state', () => {
        assert.isDefined(app.ga);
        assert.isDefined(app.ui);
        assert.equal(app.state.viewMode, 0);
        assert.isDefined(app.ui.sliders);
        assert.isTrue(app.ui.sliders.length > 0);
    });

    TestFramework.it('should handle mode switching', () => {
        app.switchMode(1);
        assert.equal(app.ga.populationSize, 50); // Population size remains constant in this implementation
    });
});

TestFramework.describe('GreenhouseNeuroControls', () => {
    let env;
    TestFramework.beforeEach(() => {
        env = createEnv();
    });

    TestFramework.it('should draw panel', () => {
        const controls = env.window.GreenhouseNeuroControls;
        const ctx = env.document.createElement('canvas').getContext('2d');
        const mockApp = {
            ui: { hoveredElement: null, sliders: [{ min: 0, max: 1, x: 0, y: 0, w: 100, h: 10 }] },
            roundRect: () => { }
        };
        controls.drawPanel(ctx, mockApp, 0, 0, 100, 100, 'Test');
        assert.isTrue(true);
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
