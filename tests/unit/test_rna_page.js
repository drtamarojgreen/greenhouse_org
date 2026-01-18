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
                getBoundingClientRect: () => ({ width: 800, height: 800 }),
                innerHTML: '',
                appendChild: () => { },
                dataset: {}
            };
        }
        return null;
    },
    createElement: (tag) => {
        const element = {
            tag,
            style: {},
            dataset: {},
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
                quadraticCurveTo: () => { },
                createRadialGradient: () => ({
                    addColorStop: () => { }
                }),
                closePath: () => { },
                clip: () => { },
                fillText: () => { },
                measureText: () => ({ width: 10 }),
                clearRect: () => { },
                fillRect: () => { },
                strokeRect: () => { },
                setLineDash: () => { },
                setTransform: () => { },
                shadowBlur: 0,
                shadowColor: '',
                globalAlpha: 1
            }),
            width: 800,
            height: 800,
            addEventListener: () => { },
            appendChild: () => { },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }),
            innerHTML: ''
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
    if (delay > 0) return;
    return originalSetTimeout(cb, delay);
};
global.Date = { now: () => 1000000 };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Ensure GreenhouseUtils exists for the simulation script
global.window.GreenhouseUtils = {
    loadScript: () => Promise.resolve(),
    waitForElement: () => Promise.resolve(global.document.querySelector('#rna-container'))
};

loadScript('rna_repair.js');

// --- Test Suites ---

TestFramework.describe('RNA Page Models - Enhanced', () => {

    TestFramework.describe('RNARepairSimulation', () => {
        let simulation;
        let mockCanvas;

        TestFramework.beforeEach(() => {
            mockCanvas = document.createElement('canvas');
            // Prevent animation loop and damage loop
            const originalAnimate = window.Greenhouse.RNARepairSimulation.prototype.animate;
            window.Greenhouse.RNARepairSimulation.prototype.animate = () => { };

            simulation = new window.Greenhouse.RNARepairSimulation(mockCanvas);
            simulation.scheduleDamage = () => { };
            window.Greenhouse.RNARepairSimulation.prototype.animate = originalAnimate;
        });

        TestFramework.it('should initialize with correct strand length (40)', () => {
            assert.equal(simulation.rnaStrand.length, 40);
        });

        TestFramework.it('should have initialized coordinates without NaN', () => {
            const firstBase = simulation.rnaStrand[0];
            assert.isNumber(firstBase.x);
            assert.isNumber(firstBase.y);
            assert.isNumber(firstBase.targetX);
            assert.equal(firstBase.targetX, 400);
        });

        TestFramework.it('should have 5\' cap (G) at index 0', () => {
            assert.equal(simulation.rnaStrand[0].type, 'G');
        });

        TestFramework.it('should have Poly-A tail at end', () => {
            for (let i = 30; i < 40; i++) {
                assert.equal(simulation.rnaStrand[i].type, 'A');
            }
        });

        TestFramework.it('should support reaction flashes', () => {
            const base = simulation.rnaStrand[5];
            assert.isDefined(base.flash);
            base.flash = 1.0;
            simulation.update(16);
            assert.lessThan(base.flash, 1.0);
        });

        TestFramework.it('should handle damage and enzyme spawning', () => {
            simulation.introduceDamage();
            const damaged = simulation.rnaStrand.some(b => b.damaged || !b.connected);
            assert.isTrue(damaged);
            assert.greaterThan(simulation.enzymes.length, 0);
        });

        TestFramework.it('should implement fluid dynamics movement', () => {
            const base = simulation.rnaStrand[10];
            const initialX = base.x;
            simulation.update(100);
            assert.notEqual(base.x, initialX);
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
