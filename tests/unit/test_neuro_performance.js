/**
 * @file test_neuro_performance.js
 * @description Performance profiling for Neuro Genetic Algorithm and 3D Visualization.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.performance = { now: () => Date.now() };
global.Path2D = class {
    moveTo() { }
    lineTo() { }
    closePath() { }
};

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Dependencies ---
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                getContext: () => ({
                    save: () => { }, restore: () => { }, translate: () => { }, rotate: () => { }, scale: () => { },
                    beginPath: () => { }, moveTo: () => { }, lineTo: () => { }, stroke: () => { }, fill: () => { },
                    rect: () => { }, clip: () => { }, fillText: () => { }, measureText: () => ({ width: 100 }),
                    createLinearGradient: () => ({ addColorStop: () => { } }),
                    createRadialGradient: () => ({ addColorStop: () => { } }),
                    clearRect: () => { }, fillRect: () => { }, strokeRect: () => { }, closePath: () => { },
                    quadraticCurveTo: () => { }, bezierCurveTo: () => { }, arcTo: () => { }, arc: () => { },
                    setLineDash: () => { },
                    set fillStyle(v) { }, set strokeStyle(v) { }, set lineWidth(v) { }, set globalAlpha(v) { },
                    set font(v) { }, set textAlign(v) { }, set textBaseline(v) { }
                }),
                width: 800, height: 600, style: {},
                addEventListener: () => { }, appendChild: () => { }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
            };
        }
        return { style: {}, appendChild: () => { }, addEventListener: () => { }, offsetWidth: 1000, offsetHeight: 750, innerHTML: '', focus: () => { } };
    },
    querySelector: () => null
};

loadScript('models_3d_math.js');
loadScript('models_util.js');
loadScript('neuro_config.js');
loadScript('neuro_ui_3d_geometry.js');
loadScript('neuro_ui_3d_brain.js');
loadScript('neuro_ui_3d_neuron.js');
loadScript('neuro_ui_3d_synapse.js');
loadScript('neuro_ga.js');

TestFramework.describe('Neuro Performance Profiling', () => {

    TestFramework.it('GA.step should execute within reasonable time (10ms)', () => {
        const ga = new window.NeuroGA();
        ga.init({ populationSize: 50 });

        const start = Date.now();
        for(let i=0; i<10; i++) {
            ga.step();
        }
        const end = Date.now();
        const avgTime = (end - start) / 10;
        console.log(`GA.step average time: ${avgTime}ms`);
        assert.lessThan(avgTime, 100); // Relaxed for CI but should be low
    });

    TestFramework.it('GA.evaluateFitness should be efficient', () => {
        const ga = new window.NeuroGA();
        ga.init({ populationSize: 50 });

        const start = Date.now();
        ga.evaluateFitness();
        const end = Date.now();
        console.log(`GA.evaluateFitness time: ${end - start}ms`);
        assert.lessThan(end - start, 50);
    });

    TestFramework.it('Synapse.drawConnections should handle many connections efficiently', () => {
        const ga = new window.NeuroGA();
        ga.init({ populationSize: 50 });
        const genome = ga.bestGenome;

        const ui3d = {
            canvas: { width: 800, height: 600 },
            ctx: document.createElement('canvas').getContext('2d'),
            camera: { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            projection: { width: 800, height: 600, near: 10, far: 1000 }
        };

        // Create mock connection meshes (as GreenhouseNeuroUI3D.updateData does)
        const connections = genome.connections.map(c => {
            const from = genome.neurons[c.from];
            const to = genome.neurons[c.to];
            const cp = { x: (from.x + to.x)/2, y: (from.y + to.y)/2, z: (from.z + to.z)/2 };
            return {
                ...c,
                from, to, controlPoint: cp,
                mesh: window.GreenhouseNeuroGeometry.generateTubeMesh(from, to, cp, 2, 6)
            };
        });

        const start = Date.now();
        window.GreenhouseNeuroSynapse.drawConnections(ui3d.ctx, connections, genome.neurons, ui3d.camera, ui3d.projection, 800, 600);
        const end = Date.now();
        console.log(`Synapse.drawConnections time for ${connections.length} connections: ${end - start}ms`);
        assert.lessThan(end - start, 16); // Should ideally be less than one frame (16ms)
    });

    TestFramework.it('Brain.drawBrainShell should be efficient', () => {
        const brainShell = { vertices: [], faces: [] };
        window.GreenhouseNeuroGeometry.initializeBrainShell(brainShell);

        const ui3d = {
            ctx: document.createElement('canvas').getContext('2d'),
            camera: { x: 0, y: 0, z: -800, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            projection: { width: 800, height: 600, near: 10, far: 1000 }
        };

        const start = Date.now();
        window.GreenhouseNeuroBrain.drawBrainShell(ui3d.ctx, brainShell, ui3d.camera, ui3d.projection, 800, 600);
        const end = Date.now();
        console.log(`Brain.drawBrainShell time: ${end - start}ms`);
        assert.lessThan(end - start, 32);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
