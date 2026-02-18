/**
 * Unit Tests for Neuro 3D Engine
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => ({
        appendChild: () => { },
        offsetWidth: 1000,
        offsetHeight: 750
    }),
    createElement: (tag) => {
        if (tag === 'canvas') {
            const canvas = {
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
                }),
                width: 1000,
                height: 600,
                style: {},
                addEventListener: () => { },
                appendChild: () => { },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: canvas.width, height: canvas.height })
            };
            return canvas;
        }
        return {
            style: {},
            appendChild: () => { },
            addEventListener: () => { },
            offsetWidth: 1000,
            offsetHeight: 750
        };
    }
};
global.addEventListener = () => { };
global.requestAnimationFrame = (cb) => 1;
global.cancelAnimationFrame = (id) => { };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Mock Dependencies
window.GreenhouseNeuroConfig = {
    get: (path) => {
        if (path === 'camera.initial') return { x: 0, y: 0, z: -600, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 };
        if (path === 'projection') return { width: 800, height: 600, near: 10, far: 5000 };
        if (path === 'pip') return { width: 300, height: 250, padding: 20 };
        if (path === 'materials.neuron') return { baseColors: ['#00FFFF'] };
        return {};
    }
};
window.GreenhouseNeuroGeometry = {
    createSynapseGeometry: () => ({ vertices: [{ x: 0, y: 0, z: 0 }], faces: [[0, 0, 0]] }),
    initializeBrainShell: () => ({ vertices: [], faces: [] }),
    generateNeuronMesh: () => ({ vertices: [], faces: [] }),
    generateTubeMesh: () => ({ vertices: [], faces: [] }),
    getRegionVertices: () => []
};
window.GreenhouseNeuroCameraControls = {
    init: () => {},
    update: () => {},
    resetCamera: () => {},
    toggleAutoRotate: () => {}
};
window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x, y, scale: 1, depth: z }),
    applyDepthFog: (a, d) => a,
    calculateFaceNormal: () => ({ x: 0, y: 0, z: 1 })
};

loadScript('neuro_ui_3d_enhanced.js');

TestFramework.describe('GreenhouseNeuroUI3D', () => {
    let ui;

    TestFramework.beforeEach(() => {
        ui = window.GreenhouseNeuroUI3D;
        ui.init(document.createElement('div'));
    });

    TestFramework.it('should initialize with correct camera and projection', () => {
        assert.equal(ui.camera.z, -600);
        // Projection width is updated to canvas.width which is container.offsetWidth
        assert.equal(ui.projection.width, 1000);
    });

    TestFramework.it('should update data with neurons and connections', () => {
        const genome = {
            neurons: [{ id: 0, x: 0, y: 0, z: 0, type: 'soma' }],
            connections: [{ from: 0, to: 0, weight: 0.5 }]
        };
        ui.updateData(genome);
        assert.equal(ui.neurons.length, 1);
        assert.equal(ui.connections.length, 1);
    });

    TestFramework.it('should generate synapse meshes', () => {
        const meshes = ui.generateSynapseMeshes();
        assert.isDefined(meshes.pre);
        assert.isDefined(meshes.post);
        assert.isTrue(meshes.pre.vertices.length > 0);
    });

    TestFramework.it('should toggle auto-rotate', () => {
        ui.toggleAutoRotate();
        assert.isTrue(true);
    });

    TestFramework.it('should initialize synapse particles and fluid grid', () => {
        ui.initSynapseParticles();
        assert.equal(ui.synapseParticles.length, 100);
        assert.equal(ui.fluidGrid.length, ui.fluidCols * ui.fluidRows);
    });
});

TestFramework.run();
