/**
 * Unit Tests for Neuro UI 3D and Components
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    createElement: () => ({
        getContext: () => ({
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
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            createRadialGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            closePath: () => { },
            quadraticCurveTo: () => { }, // Added quadraticCurveTo
            bezierCurveTo: () => { }, // Added bezierCurveTo
            arcTo: () => { }, // Added arcTo
            arc: () => { }, // Added arc
            ellipse: () => { }, // Added ellipse
            setLineDash: () => { }, // Added setLineDash
            set fillStyle(v) { },
            set strokeStyle(v) { },
            set lineWidth(v) { },
            set globalAlpha(v) { },
            set font(v) { },
            set textAlign(v) { },
            set textBaseline(v) { }
        }),
        width: 800,
        height: 600,
        style: {},
        addEventListener: () => { },
        appendChild: () => { } // Added appendChild
    }),
    getElementById: () => ({
        textContent: '',
        style: {},
        addEventListener: () => { }
    })
};
global.console = console;
global.requestAnimationFrame = (cb) => { }; // No auto-loop
global.setInterval = (cb) => { return 1; }; // Mock setInterval
global.clearInterval = (id) => { };
global.addEventListener = () => { };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Dependencies ---
window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x: x + 400, y: y + 300, scale: 1, depth: z }),
    applyDepthFog: (alpha, depth) => alpha, // Simple pass-through
    calculateFaceNormal: (v1, v2, v3) => ({ x: 0, y: 0, z: -1 }) // Mock normal
};

// Load Modules
loadScript('neuro_config.js');
loadScript('neuro_ui_3d_geometry.js');
loadScript('neuro_ui_3d_brain.js');
loadScript('neuro_ui_3d_neuron.js');
loadScript('neuro_ui_3d_synapse.js');
loadScript('neuro_ui_3d_stats.js');
loadScript('neuro_ui_3d_enhanced.js');
loadScript('neuro_ui_3d.js');
loadScript('neuro_controls.js');
loadScript('neuro_ga.js');
loadScript('neuro_app.js');

// --- Test Suites ---

TestFramework.describe('GreenhouseNeuroUI3D', () => {
    let ui;
    let mockContainer;
    let mockAlgo;

    TestFramework.beforeEach(() => {
        ui = window.GreenhouseNeuroUI3D;
        mockContainer = document.createElement('div');
        mockAlgo = {
            bestNetwork: {
                neurons: [{ id: 1, x: 0, y: 0, z: 0, type: 'input' }, { id: 2, x: 10, y: 10, z: 0, type: 'output' }],
                connections: [{ from: 1, to: 2, weight: 0.5 }],
                fitness: 0.5
            },
            generation: 1
        };
        global.document.querySelector = () => mockContainer;

        // Also init the app since UI3D depends on it for drawUI
        window.GreenhouseNeuroApp.init('div');

        ui.init('div'); // Corrected init signature
        ui.updateData(mockAlgo.bestNetwork); // Pre-load data
    });

    TestFramework.it('should initialize', () => {
        assert.isDefined(ui.canvas);
        assert.isDefined(ui.ctx);
    });

    TestFramework.it('should update data', () => {
        // Data is now loaded in beforeEach, this test just verifies it
        assert.isDefined(ui.neurons, "ui.neurons should be defined after updateData");
        assert.isDefined(ui.connections, "ui.connections should be defined after updateData");
        assert.equal(ui.neurons.length, 2);
        assert.equal(ui.connections.length, 1);
    });

    TestFramework.it('should render', () => {
        // With data loaded, this should no longer crash
        ui.ctx = document.createElement('canvas').getContext('2d');
        ui.render();
        assert.isTrue(true); // Reached here without error
    });
});

TestFramework.describe('GreenhouseNeuroApp', () => {
    let app;
    TestFramework.beforeEach(() => {
        app = window.GreenhouseNeuroApp;
        app.init('div');
    });

    TestFramework.it('should initialize app state', () => {
        assert.isDefined(app.ga);
        assert.isDefined(app.ui);
        assert.equal(app.state.viewMode, 0);
    });

    TestFramework.it('should handle mode switching', () => {
        app.switchMode(1);
        assert.equal(app.ga.populationSize, 80);
    });
});

TestFramework.describe('GreenhouseNeuroControls', () => {
    const controls = window.GreenhouseNeuroControls;
    const ctx = document.createElement('canvas').getContext('2d');
    const mockApp = {
        ui: {
            hoveredElement: null,
            sliders: [{ min: 0, max: 1, x: 0, y: 0, w: 100, h: 10 }]
        },
        roundRect: () => { }
    };

    TestFramework.it('should draw panel', () => {
        controls.drawPanel(ctx, mockApp, 0, 0, 100, 100, 'Test');
        assert.isTrue(true);
    });

    TestFramework.it('should draw buttons', () => {
        controls.drawButton(ctx, mockApp, { x: 0, y: 0, w: 50, h: 20, label: 'btn' }, false);
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroBrain', () => {
    const brain = window.GreenhouseNeuroBrain;
    const ctx = document.createElement('canvas').getContext('2d');

    TestFramework.it('should draw brain shell', () => {
        const shell = { vertices: [], faces: [] };
        brain.drawBrainShell(ctx, shell, {}, {}, 800, 600);
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroNeuron', () => {
    const neuronModule = window.GreenhouseNeuroNeuron;
    const ctx = document.createElement('canvas').getContext('2d');

    TestFramework.it('should draw neuron', () => {
        const neuron = { x: 0, y: 0, z: 0, type: 'input', baseColor: 'red' };
        neuronModule.drawNeuron(ctx, neuron, {}, {}, {});
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroSynapse', () => {
    const synapseModule = window.GreenhouseNeuroSynapse;
    const ctx = document.createElement('canvas').getContext('2d');

    TestFramework.it('should draw connections', () => {
        const conn = {
            from: { x: 0, y: 0, z: 0, id: 1 },
            to: { x: 10, y: 10, z: 0, id: 2 },
            weight: 0.5,
            controlPoint: { x: 5, y: 5, z: 0 },
            mesh: { vertices: [], faces: [] } // Required
        };
        // drawConnections(ctx, connections, neurons, camera, projection, width, height)
        synapseModule.drawConnections(ctx, [conn], [], {}, {}, 800, 600);
        assert.isTrue(true);
    });
});

TestFramework.describe('GreenhouseNeuroGeometry', () => {
    const geo = window.GreenhouseNeuroGeometry;

    TestFramework.it('should initialize brain shell', () => {
        const shell = { vertices: [], faces: [] };
        geo.initializeBrainShell(shell);
        assert.isTrue(shell.vertices.length > 0);
    });

    TestFramework.it('should get region vertices', () => {
        // PFC: z > 0.4 (80), y > -0.2 (-40)
        const shell = {
            vertices: [
                { x: 0, y: 0, z: 100 }, // Should match PFC
                { x: 0, y: -100, z: -100 } // Should not match
            ],
            faces: []
        };
        const indices = geo.getRegionVertices(shell, 'pfc');
        assert.equal(indices.length, 1);
    });
});

// Run Tests
TestFramework.run();
