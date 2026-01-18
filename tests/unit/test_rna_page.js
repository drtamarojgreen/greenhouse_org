const assert = require('assert');

// Mock browser globals
global.window = {
    addEventListener: () => { },
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    dispatchEvent: () => { },
    CustomEvent: class { },
    location: { search: '' },
    Greenhouse: {}
};

global.document = {
    addEventListener: () => { },
    querySelector: () => null,
    currentScript: null,
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                getContext: () => ({
                    fillRect: () => { },
                    clearRect: () => { },
                    beginPath: () => { },
                    arc: () => { },
                    fill: () => { },
                    stroke: () => { },
                    moveTo: () => { },
                    lineTo: () => { },
                    fillText: () => { },
                    save: () => { },
                    restore: () => { },
                    translate: () => { },
                    scale: () => { },
                    setLineDash: () => { },
                    rect: () => { },
                    globalAlpha: 1.0,
                    shadowBlur: 0,
                    shadowColor: '',
                    lineWidth: 1,
                    strokeStyle: '',
                    fillStyle: '',
                    font: '',
                    textAlign: ''
                }),
                width: 800,
                height: 800,
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }),
                style: {},
                addEventListener: () => { }
            };
        }
        return {
            style: {},
            appendChild: () => { },
            getBoundingClientRect: () => ({ width: 800, height: 800 }),
            innerHTML: '',
            dataset: {},
            classList: { contains: () => false, add: () => {}, remove: () => {} }
        };
    },
    body: { appendChild: () => { } }
};

global.MutationObserver = class {
    observe() { }
    disconnect() { }
};

// Mock GreenhouseUtils
global.window.GreenhouseUtils = {
    loadScript: async () => {},
    waitForElement: async () => global.document.createElement('div')
};

async function runTests() {
    console.log("\n========================================");
    console.log("Running Test Suite");
    console.log("========================================\n");

    // Load simulation script
    require('../../docs/js/rna_repair.js');
    const RNARepairSimulation = global.window.Greenhouse.RNARepairSimulation;

    console.log("RNA Page Models - Enhanced");
    console.log("──────────────────────────");

    try {
        console.log("RNARepairSimulation");
        console.log("───────────────────");

        const mockCanvas = global.document.createElement('canvas');
        const sim = new RNARepairSimulation(mockCanvas);

        // Test 1: Strand Length (should be 40)
        assert.strictEqual(sim.rnaStrand.length, 40, "Strand should have 40 bases");
        console.log("  ✓ should initialize with correct strand length (40)");

        // Test 2: Initialization check
        assert.ok(!isNaN(sim.rnaStrand[0].x), "Coordinates should not be NaN");
        console.log("  ✓ should have initialized coordinates without NaN");

        // Test 3: 5' Cap
        assert.strictEqual(sim.rnaStrand[0].type, 'G', "5' Cap should be G");
        console.log("  ✓ should have 5' cap (G) at index 0");

        // Test 4: Poly-A Tail
        const lastTen = sim.rnaStrand.slice(-10);
        const allA = lastTen.every(b => b.type === 'A');
        assert.ok(allA, "Last 10 bases should be A (Poly-A Tail)");
        console.log("  ✓ should have Poly-A tail at end");

        // Test 5: Reaction Flashes
        assert.ok('flash' in sim.rnaStrand[0], "Base should have flash property");
        console.log("  ✓ should support reaction flashes");

        // Test 6: Enzymes
        sim.introduceDamage();
        assert.ok(sim.enzymes.length > 0, "Enzyme should spawn on damage");
        console.log("  ✓ should handle damage and enzyme spawning");

        // Test 7: Fluid Dynamics
        const initialX = sim.rnaStrand[5].x;
        sim.update(100);
        const nextX = sim.rnaStrand[5].x;
        assert.notStrictEqual(initialX, nextX, "Bases should move due to fluid dynamics/noise");
        console.log("  ✓ should implement fluid dynamics movement");

        console.log("\n========================================");
        console.log("Test Summary");
        console.log("========================================");
        console.log("Total:   7");
        console.log("Passed:  7 ✓");
        console.log("Failed:  0 ✗");
        console.log("Skipped: 0 ⊘");
        console.log("========================================\n");
        console.log("✅ All tests passed");

        sim.stop();
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Test Failed:");
        console.error(err.message);
        process.exit(1);
    }
}

runTests();
