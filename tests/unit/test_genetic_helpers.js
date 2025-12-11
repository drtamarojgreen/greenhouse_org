/**
 * Unit Tests for Genetic Helpers (Lighting, Geometry, Stats, Chromosome)
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
            createRadialGradient: () => ({ addColorStop: () => { } }),
            fillRect: () => { },
            beginPath: () => { },
            arc: () => { },
            fill: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            closePath: () => { },
            save: () => { },
            restore: () => { },
            set fillStyle(v) { },
            set strokeStyle(v) { },
            set globalAlpha(v) { }
        }),
        width: 0,
        height: 0
    })
};
global.console = console;

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Mock Dependencies ---
window.GreenhouseGeneticConfig = {
    get: (path) => {
        if (path === 'lighting.ambient') return { color: { r: 255, g: 255, b: 255 }, intensity: 0.5 };
        if (path === 'lighting.directional') return { color: { r: 255, g: 255, b: 255 }, intensity: 0.8, direction: { x: 1, y: 1, z: 1 } };
        return {};
    }
};

window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z) => ({ x: x + 400, y: y + 300, scale: 1, depth: z })
};

// Load Modules
loadScript('genetic_lighting.js');
loadScript('genetic_ui_3d_geometry.js');
loadScript('genetic_ui_3d_stats.js');
loadScript('genetic_ui_3d_chromosome.js');

// --- Test Suites ---

TestFramework.describe('GreenhouseGeneticLighting', () => {
    const lighting = window.GreenhouseGeneticLighting;

    TestFramework.it('should calculate lighting', () => {
        const normal = { x: 0, y: 0, z: 1 };
        const position = { x: 0, y: 0, z: 0 };
        const camera = { x: 0, y: 0, z: -100 };
        const material = { baseColor: { r: 255, g: 0, b: 0 }, metallic: 0.5, roughness: 0.5 };

        const result = lighting.calculateLighting(normal, position, camera, material);

        assert.isDefined(result);
        assert.isNumber(result.r);
        assert.isNumber(result.g);
        assert.isNumber(result.b);
    });

    TestFramework.it('should parse hex color', () => {
        const color = lighting.parseColor('#FF0000');
        assert.equal(color.r, 255);
        assert.equal(color.g, 0);
        assert.equal(color.b, 0);
    });
});

TestFramework.describe('GreenhouseGeneticGeometry', () => {
    const geo = window.GreenhouseGeneticGeometry;

    TestFramework.it('should generate helix points', () => {
        const point = geo.generateHelixPoints(0, 10, 0);
        assert.isDefined(point);
        assert.isNumber(point.x);
        assert.isNumber(point.y);
        assert.isNumber(point.z);
        assert.isNumber(point.strandIndex);
    });

    TestFramework.it('should generate protein chain', () => {
        const chain = geo.generateProteinChain('seed123');
        assert.isDefined(chain);
        assert.isArray(chain.vertices);
        assert.isTrue(chain.vertices.length > 0);
    });
});

TestFramework.describe('GreenhouseGeneticStats', () => {
    const stats = window.GreenhouseGeneticStats;
    const ctx = {
        save: () => { },
        restore: () => { },
        fillText: () => { },
        fillRect: () => { },
        strokeRect: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        measureText: () => ({ width: 10 }),
        set fillStyle(v) { },
        set font(v) { },
        set textAlign(v) { },
        set textBaseline(v) { },
        set globalAlpha(v) { }
    };

    TestFramework.it('should draw overlay info', () => {
        const activeGene = { id: 1, label: 'Test Gene' };
        stats.drawOverlayInfo(ctx, 800, activeGene);
        assert.isTrue(true); // Reached here
    });

    TestFramework.it('should log event', () => {
        stats.logEvent('Test Event');
        assert.equal(stats.eventLog.length, 1);
        assert.equal(stats.eventLog[0].message, 'Test Event');
    });
});

TestFramework.describe('GreenhouseGeneticChromosome', () => {
    const chromo = window.GreenhouseGeneticChromosome;
    const ctx = {
        save: () => { },
        restore: () => { },
        beginPath: () => { },
        arc: () => { },
        fill: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        closePath: () => { },
        rect: () => { },
        clip: () => { },
        createPattern: () => { },
        fillRect: () => { },
        set fillStyle(v) { },
        set strokeStyle(v) { },
        set lineWidth(v) { },
        set globalAlpha(v) { }
    };

    TestFramework.it('should draw chromatin structure', () => {
        const activeGene = { id: 1, baseColor: 'red' };
        const camera = { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0 };

        chromo.drawChromatinStructure(ctx, 0, 0, 200, 150, activeGene, null, camera);
        assert.isTrue(true); // Reached here
    });
});

// Run Tests
TestFramework.run();
