/**
 * Unit Tests for Genetic UI 3D
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    getElementById: () => ({
        addEventListener: () => { },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        width: 800,
        height: 600,
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
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        })
    }),
    createElement: () => ({
        getContext: () => ({})
    })
};
global.console = console;
global.requestAnimationFrame = (cb) => { }; // Do not auto-loop in tests
global.addEventListener = () => { };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
loadScript('genetic_config.js');
loadScript('genetic_camera_controls.js');
loadScript('genetic_pip_controls.js');
loadScript('genetic_ui_3d_gene.js');
loadScript('genetic_ui_3d_protein.js');
loadScript('genetic_ui_3d_brain.js');
loadScript('genetic_ui_3d_dna.js');
loadScript('genetic_ui_3d.js');

// --- Test Suites ---

TestFramework.describe('Genetic UI 3D', () => {
    let ui;
    let originalGene, originalProtein, originalBrain, originalPiP;

    TestFramework.beforeEach(() => {
        // Save originals
        originalGene = window.GreenhouseGeneticGene;
        originalProtein = window.GreenhouseGeneticProtein;
        originalBrain = window.GreenhouseGeneticBrain;
        originalPiP = window.GreenhouseGeneticPiPControls;

        // Reset UI instance if needed, or create new one
        // GreenhouseGeneticUI3D is a singleton object in the file
        ui = window.GreenhouseGeneticUI3D;

        // Mock canvas
        ui.canvas = document.getElementById('canvas');
        ui.ctx = ui.canvas.getContext('2d');

        // Initialize if not already
        if (!ui.initialized) {
            // Mock config
            ui.config = window.GreenhouseGeneticConfig;
            ui.initialized = true;
        }
    });

    TestFramework.afterEach(() => {
        // Restore originals
        window.GreenhouseGeneticGene = originalGene;
        window.GreenhouseGeneticProtein = originalProtein;
        window.GreenhouseGeneticBrain = originalBrain;
        window.GreenhouseGeneticPiPControls = originalPiP;
    });

    TestFramework.it('should be defined', () => {
        assert.isDefined(ui);
    });

    TestFramework.it('should have draw methods', () => {
        assert.isFunction(ui.drawDNAHelixPiP);
        assert.isFunction(ui.drawMicroView);
        assert.isFunction(ui.drawProteinView);
        assert.isFunction(ui.drawTargetView);
    });

    TestFramework.it('should draw PiP frame', () => {
        // Mock context
        let fillStyleSet = false;
        let fillRectCalled = false;
        const ctx = {
            save: () => { },
            restore: () => { },
            fillRect: () => { fillRectCalled = true; },
            strokeRect: () => { },
            fillText: () => { },
            clip: () => { },
            beginPath: () => { },
            rect: () => { },
            set fillStyle(val) { fillStyleSet = true; },
            get fillStyle() { return ''; },
            set strokeStyle(val) { },
            set lineWidth(val) { },
            set font(val) { },
            set textAlign(val) { },
            set textBaseline(val) { }
        };

        ui.drawPiPFrame(ctx, 0, 0, 100, 100, 'Test', 'red');

        assert.isTrue(fillStyleSet);
        assert.isTrue(fillRectCalled);
    });

    TestFramework.it('should call sub-modules in draw methods', () => {
        // Mock sub-modules
        let geneCalled = false;
        window.GreenhouseGeneticGene = {
            drawMicroView: () => { geneCalled = true; }
        };

        // Mock context
        const ctx = {
            save: () => { },
            restore: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            fillText: () => { },
            clip: () => { },
            beginPath: () => { },
            rect: () => { },
            set fillStyle(val) { },
            set strokeStyle(val) { },
            set lineWidth(val) { },
            set font(val) { },
            set textAlign(val) { },
            set textBaseline(val) { }
        };

        ui.drawMicroView(ctx, 0, 0, 100, 100, {}, {}, 'blue');

        assert.isTrue(geneCalled);
    });

    TestFramework.it('should render all views', () => {
        // Mock dependencies
        let geneCalled = false;
        let proteinCalled = false;
        let targetCalled = false;
        let controlsCalled = false;

        window.GreenhouseGeneticGene = { drawMicroView: () => { geneCalled = true; } };
        window.GreenhouseGeneticProtein = { drawProteinView: () => { proteinCalled = true; } };
        window.GreenhouseGeneticBrain = { drawTargetView: () => { targetCalled = true; } };

        // Mock PiP Controls
        window.GreenhouseGeneticPiPControls = {
            getState: () => ({}),
            getBackgroundColor: () => 'rgba(0,0,0,1)',
            drawControls: () => { controlsCalled = true; }
        };

        // Mock Context
        const ctx = {
            save: () => { },
            restore: () => { },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            fillText: () => { },
            clip: () => { },
            beginPath: () => { },
            rect: () => { },
            clearRect: () => { },
            createLinearGradient: () => ({ addColorStop: () => { } }),
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            set fillStyle(val) { },
            set strokeStyle(val) { },
            set lineWidth(val) { },
            set font(val) { },
            set textAlign(val) { },
            set textBaseline(val) { }
        };
        ui.ctx = ctx;
        ui.canvas = { width: 1000, height: 800 };

        // Run render
        ui.render();

        assert.isTrue(geneCalled, 'Micro View should be drawn');
        assert.isTrue(proteinCalled, 'Protein View should be drawn');
        assert.isTrue(targetCalled, 'Target View should be drawn');
        assert.isTrue(controlsCalled, 'Controls should be drawn');
    });

    TestFramework.it('should handle null activeGene without context leak', () => {
        // Mock dependencies
        // We use the REAL logic for drawMicroView wrapper, which calls window.GreenhouseGeneticGene.drawMicroView
        // We need to mock window.GreenhouseGeneticGene to simulate the real file's behavior (early return)
        // OR we can load the real file? We already loaded it.
        // So window.GreenhouseGeneticGene is the REAL one.

        // Mock Context
        let saveCount = 0;
        let restoreCount = 0;
        const ctx = {
            save: () => { saveCount++; },
            restore: () => { restoreCount++; },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            fillRect: () => { },
            strokeRect: () => { },
            fillText: () => { },
            clip: () => { },
            beginPath: () => { },
            rect: () => { },
            clearRect: () => { },
            createLinearGradient: () => ({ addColorStop: () => { } }),
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            set fillStyle(val) { },
            set strokeStyle(val) { },
            set lineWidth(val) { },
            set font(val) { },
            set textAlign(val) { },
            set textBaseline(val) { }
        };
        ui.ctx = ctx;

        // Call drawMicroView with null activeGene
        ui.drawMicroView(ctx, 0, 0, 100, 100, null, {}, 'red');

        // Check balance
        assert.equal(saveCount, restoreCount, `Context save/restore mismatch: ${saveCount} saves, ${restoreCount} restores`);
    });

});

// Run tests
TestFramework.run();
