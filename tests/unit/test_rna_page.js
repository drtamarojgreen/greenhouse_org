/**
 * Unit Tests for RNA Page Models
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: (selector) => {
        if (selector === '#rna-container') {
            return {
                getBoundingClientRect: () => ({ width: 800, height: 600 }),
                innerHTML: '',
                appendChild: () => { }
            };
        }
        return null;
    },
    createElement: (tag) => {
        const element = {
            tag,
            style: {},
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
                arc: () => { },
                closePath: () => { },
                clip: () => { },
                fillText: () => { },
                measureText: () => ({ width: 0 }),
                clearRect: () => { },
                fillRect: () => { },
                strokeRect: () => { },
                setLineDash: () => { },
                setTransform: () => { },
                quadraticCurveTo: () => { }
            }),
            width: 800,
            height: 600,
            addEventListener: () => { },
            appendChild: () => { },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        };
        return element;
    },
    body: {
        appendChild: () => { }
    }
};
global.addEventListener = () => { };
global.console = console;
global.requestAnimationFrame = (cb) => { };
const originalSetTimeout = global.setTimeout;
global.setTimeout = (cb, delay) => {
    if (delay > 0) {
        // Do nothing for scheduled timeouts in tests to avoid infinite loops
        return;
    }
    return originalSetTimeout(cb, delay);
};
// Use real Date to avoid "is not a constructor"

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('rna_repair_atp.js');
loadScript('rna_repair_enzymes.js');
loadScript('rna_repair_physics.js');
loadScript('rna_repair.js');
loadScript('rna_legend.js');
loadScript('rna_display.js');

// --- Test Suites ---

TestFramework.describe('RNA Page Models', () => {

    TestFramework.describe('RNARepairSimulation', () => {
        let simulation;
        let mockCanvas;

        TestFramework.beforeEach(() => {
            mockCanvas = document.createElement('canvas');
            // Prevent animation loop in tests
            const originalAnimate = window.Greenhouse.RNARepairSimulation.prototype.animate;
            window.Greenhouse.RNARepairSimulation.prototype.animate = () => { };

            simulation = new window.Greenhouse.RNARepairSimulation(mockCanvas);

            // Restore for other potential uses, though usually not needed in unit tests
            window.Greenhouse.RNARepairSimulation.prototype.animate = originalAnimate;

            // Also prevent scheduleDamage from starting timeouts
            simulation.scheduleDamage = () => { };
        });

        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(simulation);
            assert.isTrue(simulation.isRunning);
            assert.equal(simulation.rnaStrand.length, 40);
            assert.equal(simulation.enzymes.length, 0);
            assert.isTrue(!!(simulation.atpManager || simulation.atp === 100));
            assert.isDefined(simulation.ribosome);
            assert.isDefined(simulation.foldingEngine);
            assert.isDefined(simulation.environmentManager);
            assert.equal(simulation.bgParticles.length, 20);
        });

        TestFramework.it('should create RNA strand correctly', () => {
            simulation.rnaStrand = [];
            simulation.createRnaStrand();
            assert.equal(simulation.rnaStrand.length, 40);
            const firstBase = simulation.rnaStrand[0];
            assert.isDefined(firstBase.type);
            assert.isTrue(['A', 'U', 'G', 'C'].includes(firstBase.type));
        });

        TestFramework.it('should have 5\' cap (G) and Poly-A tail', () => {
            simulation.rnaStrand = [];
            simulation.createRnaStrand();
            assert.equal(simulation.rnaStrand[0].type, 'G', "First base should be G (5' Cap)");
            const lastTen = simulation.rnaStrand.slice(-10);
            assert.isTrue(lastTen.every(b => b.type === 'A'), "Last 10 bases should be A (Poly-A Tail)");
        });

        TestFramework.it('should introduce damage', () => {
            // Force introduction of damage
            simulation.introduceDamage();
            const damaged = simulation.rnaStrand.some(b => b.damaged || !b.connected);
            assert.isTrue(damaged);
            assert.greaterThan(simulation.enzymes.length, 0);
        });

        TestFramework.it('should spawn enzymes', () => {
            // Clear enzymes and spawn one
            simulation.enzymes = [];
            simulation.spawnEnzyme('Ligase', 5);
            assert.equal(simulation.enzymes.length, 1);
            // Name might be Ligase or RtcB (random upgrade)
            assert.isTrue(['Ligase', 'RtcB'].includes(simulation.enzymes[0].name));
            assert.equal(simulation.enzymes[0].targetIndex, 5);
        });

        TestFramework.it('should update simulation state', () => {
            simulation.spawnEnzyme('Ligase', 5);
            const enzyme = simulation.enzymes[0];
            const initialX = enzyme.x;
            const initialY = enzyme.y;

            simulation.update(16);

            assert.notEqual(enzyme.x, initialX);
            assert.notEqual(enzyme.y, initialY);
        });

        TestFramework.it('should move ribosome and stall at damage', () => {
            simulation.ribosome.index = 0;
            simulation.ribosome.progress = 0;

            // Base 0 is connected and not damaged
            simulation.update(16);
            assert.greaterThan(simulation.ribosome.progress, 0);
            assert.isFalse(simulation.ribosome.stalled);

            // Break base 1
            simulation.rnaStrand[1].connected = false;
            simulation.ribosome.index = 1;
            simulation.update(16);
            assert.isTrue(simulation.ribosome.stalled);
        });

        TestFramework.it('should consume ATP during repair', () => {
            const initialATP = simulation.atpManager ? simulation.atpManager.atp : simulation.atp;
            simulation.spawnEnzyme('Ligase', 5);
            const enzyme = simulation.enzymes[0];
            enzyme.state = 'repairing';

            simulation.update(16);
            const currentATP = simulation.atpManager ? simulation.atpManager.atp : simulation.atp;
            assert.isTrue(currentATP < initialATP);
        });

        TestFramework.it('should apply folding offsets', () => {
            simulation.foldingEngine.targetStrength = 1.0;
            simulation.foldingEngine.foldingStrength = 1.0;

            const baseIndex = Math.floor(simulation.rnaStrand.length / 2);
            const initialX = simulation.rnaStrand[baseIndex].x;

            simulation.update(16);

            const offset = simulation.foldingEngine.getFoldingOffset(baseIndex, simulation.rnaStrand.length);
            assert.isTrue(Math.abs(simulation.rnaStrand[baseIndex].x - (simulation.rnaStrand[baseIndex].targetX + offset.x)) < 20);
        });

        TestFramework.it('should trigger surveillance decay on ribosome stall', () => {
            simulation.ribosome.index = 5;
            simulation.rnaStrand[5].connected = false;
            simulation.enzymes = [];

            // Stall for > 15s (simulate with dt)
            simulation.update(16000);

            const hasUPF1 = simulation.enzymes.some(e => e.name === 'UPF1/Exosome');
            assert.isTrue(hasUPF1);
        });

        TestFramework.it('should perform ribozyme self-repair', () => {
            // Find a ribozyme base
            const rIndex = simulation.rnaStrand.findIndex(b => b.isRibozyme);
            assert.isTrue(rIndex !== -1);

            simulation.rnaStrand[rIndex].connected = false;

            // Force random success
            const originalRandom = Math.random;
            Math.random = () => 0.0001; // Less than 0.001

            simulation.update(16);

            assert.isTrue(simulation.rnaStrand[rIndex].connected);
            Math.random = originalRandom;
        });

        TestFramework.it('should shorten Poly-A tail and trigger 3\' decay', () => {
            simulation.polyATailLength = 1;
            simulation.tailShortenTimer = 30001;

            simulation.update(1);

            assert.equal(simulation.polyATailLength, 0);
            const hasExosome = simulation.enzymes.some(e => e.name === 'Exosome Complex');
            assert.isTrue(hasExosome);
        });

        TestFramework.it('should handle RNAi RISC cleavage', () => {
            simulation.spawnRISC();
            const risc = simulation.enzymes.find(e => e.name === 'RISC (RNAi)');
            assert.isDefined(risc);

            const target = simulation.rnaStrand[risc.targetIndex];
            target.connected = true;

            // Repairing state
            risc.state = 'repairing';
            risc.progress = 0.99;

            simulation.update(16);
            assert.isFalse(target.connected);
        });

        TestFramework.it('should spawn protective proteins', () => {
            simulation.spawnProtein();
            assert.equal(simulation.proteins.length, 1);
            const protein = simulation.proteins[0];
            assert.isTrue(simulation.rnaStrand[protein.startIndex].protected);
        });

        TestFramework.it('should finish repair', () => {
            const targetIndex = 5;
            simulation.rnaStrand[targetIndex].connected = false;
            simulation.spawnEnzyme('Ligase', targetIndex);
            const enzyme = simulation.enzymes[0];

            // Teleport to target
            enzyme.x = simulation.rnaStrand[targetIndex].x;
            enzyme.y = simulation.rnaStrand[targetIndex].y;
            enzyme.state = 'repairing';
            enzyme.progress = 0.99;

            simulation.update();

            assert.isTrue(simulation.rnaStrand[targetIndex].connected);
            assert.equal(enzyme.state, 'leaving');
            assert.greaterThan(simulation.particles.length, 0);
        });
    });

    TestFramework.describe('RNALegend', () => {
        TestFramework.it('should provide update function', () => {
            assert.isFunction(window.Greenhouse.RNALegend.update);
        });

        TestFramework.it('should draw legend without errors', () => {
            const mockCtx = document.createElement('canvas').getContext('2d');
            const colors = { METHYL: '#f00', BACKBONE: '#00f', ENZYME: '#fff', GLOW: '#ff0' };
            window.Greenhouse.RNALegend.update(mockCtx, 800, 600, colors);
            // If no error thrown, we consider it success for this unit test
            assert.isTrue(true);
        });
    });

    TestFramework.describe('RNADisplay', () => {
        TestFramework.it('should initialize display controls', () => {
            const mockCanvas = document.createElement('canvas');
            const simulation = { canvas: mockCanvas, scale: 1.0, offsetX: 0, offsetY: 0 };
            window.Greenhouse.initializeRNADisplay(simulation);
            // Check if it added listeners is hard without mocking addEventListener
            assert.isTrue(true);
        });
    });
});

// Run the tests
TestFramework.run().then(results => {
    if (results.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
});
