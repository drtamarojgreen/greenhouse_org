/**
 * Unit Tests for DNA Page Models
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
        if (selector === '#dna-container') {
            return {
                offsetWidth: 800,
                offsetHeight: 600,
                innerHTML: '',
                appendChild: () => { }
            };
        }
        return null;
    },
    getElementById: () => ({
        addEventListener: () => { },
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
            createLinearGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        }),
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        style: {},
        appendChild: () => { }
    }),
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
                setLineDash: () => { }
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

// --- Helper to Load Scripts ---
function loadScript(filename, exposeInternal = false, internalName = '') {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    let code = fs.readFileSync(filePath, 'utf8');

    if (exposeInternal && internalName) {
        // Simple trick to expose internal object from IIFE for testing
        code = code.replace('})();', `window.${internalName} = ${internalName}; })();`);
    }

    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('models_3d_math.js');
loadScript('dna_repair.js', true, 'GreenhouseDNARepair');
loadScript('dna_tooltip.js');

// --- Test Suites ---

TestFramework.describe('DNA Page Models', () => {

    TestFramework.describe('GreenhouseDNARepair', () => {
        let dnaRepair;

        TestFramework.beforeEach(() => {
            dnaRepair = window.GreenhouseDNARepair;
            // Prevent animation loop in tests
            dnaRepair.animate = () => { };
            // Mock initialization
            dnaRepair.initializeDNARepairSimulation('#dna-container');
        });

        TestFramework.it('should initialize with default values', () => {
            assert.isDefined(dnaRepair);
            assert.isTrue(dnaRepair.isRunning);
            assert.isDefined(dnaRepair.state.basePairs);
            assert.equal(dnaRepair.state.basePairs.length, dnaRepair.config.helixLength);
        });

        TestFramework.it('should generate DNA correctly', () => {
            dnaRepair.generateDNA();
            assert.equal(dnaRepair.state.basePairs.length, dnaRepair.config.helixLength);
            const firstPair = dnaRepair.state.basePairs[0];
            assert.isDefined(firstPair.base1);
            assert.isDefined(firstPair.base2);
            assert.isFalse(firstPair.isDamaged);
        });

        TestFramework.it('should switch simulation modes', () => {
            dnaRepair.startSimulation('mmr');
            assert.equal(dnaRepair.state.repairMode, 'mmr');
            assert.equal(dnaRepair.state.timer, 0);
            assert.isTrue(dnaRepair.state.simulating);
        });

        TestFramework.it('should handle BER repair cycle', () => {
            dnaRepair.startSimulation('ber');
            const targetIdx = Math.floor(dnaRepair.config.helixLength / 2);

            // Damage trigger at t=10
            dnaRepair.handleBER(10);
            assert.isTrue(dnaRepair.state.basePairs[targetIdx].isDamaged);

            // Excision at t=200 (between 150 and 300)
            dnaRepair.handleBER(200);
            assert.equal(dnaRepair.state.basePairs[targetIdx].base1, '');

            // Repair at t=350
            dnaRepair.handleBER(350);
            assert.equal(dnaRepair.state.basePairs[targetIdx].base1, 'A');
            assert.isFalse(dnaRepair.state.basePairs[targetIdx].isDamaged);
        });

        TestFramework.it('should handle DSB repair cycle', () => {
            dnaRepair.startSimulation('dsb');
            const targetIdx = Math.floor(dnaRepair.config.helixLength / 2);

            // Break at t=50
            dnaRepair.handleDSB(50);
            assert.isTrue(dnaRepair.state.basePairs[targetIdx].isBroken);

            // Drift at t=100
            const initialX = dnaRepair.state.basePairs[0].x;
            dnaRepair.handleDSB(100);
            assert.lessThan(dnaRepair.state.basePairs[0].x, initialX);

            // Rejoin starts at t=401
            dnaRepair.handleDSB(401);
            // It uses lerp-like update, so it moves back
            assert.greaterThan(dnaRepair.state.basePairs[0].x, initialX - 10); // Check it's moving back
        });

        TestFramework.it('should update simulation state', () => {
            const initialRotationX = dnaRepair.state.camera.rotationX;
            dnaRepair.update();
            assert.notEqual(dnaRepair.state.camera.rotationX, initialRotationX);
        });
    });

    TestFramework.describe('GreenhouseDNATooltip', () => {
        let tooltip;

        TestFramework.beforeEach(() => {
            tooltip = window.GreenhouseDNATooltip;
            tooltip.initialize();
        });

        TestFramework.it('should initialize tooltip element', () => {
            assert.isDefined(tooltip.tooltipElement);
            assert.equal(tooltip.tooltipElement.id, 'dna-tooltip');
        });

        TestFramework.it('should show tooltip for valid key', () => {
            tooltip.show(100, 100, 'A');
            assert.equal(tooltip.tooltipElement.style.display, 'block');
            assert.isTrue(tooltip.tooltipElement.innerHTML.includes('Adenine'));
        });

        TestFramework.it('should hide tooltip', () => {
            tooltip.show(100, 100, 'A');
            tooltip.hide();
            assert.equal(tooltip.tooltipElement.style.display, 'none');
        });

        TestFramework.it('should change language', () => {
            tooltip.setLanguage('es');
            assert.equal(tooltip.currentLang, 'es');
            tooltip.show(100, 100, 'A');
            assert.isTrue(tooltip.tooltipElement.innerHTML.includes('Adenina'));
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
