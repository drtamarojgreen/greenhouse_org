"use strict";
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
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
            ui.canvas = document.getElementById('canvas') || document.createElement('canvas');
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
            let fillRectCalled = false;
<<<<<<< HEAD
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
=======
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillRect = () => { fillRectCalled = true; };

            ui.drawPiPFrame(ctx, 0, 0, 100, 100, 'Test', 'red');

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
            assert.isTrue(fillRectCalled);
        });
        TestFramework.it('should call sub-modules in draw methods', () => {
            // Mock sub-modules
            let geneCalled = false;
            window.GreenhouseGeneticGene = {
                drawMicroView: () => { geneCalled = true; }
            };
            // Mock context
<<<<<<< HEAD
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
=======
            const ctx = document.createElement('canvas').getContext('2d');

            ui.drawMicroView(ctx, 0, 0, 100, 100, {}, 0, {}, () => {}, {});

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
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
                getState: () => ({ camera: {} }),
                getBackgroundColor: () => 'rgba(0,0,0,1)',
                drawControls: () => { controlsCalled = true; }
            };
            // Mock Context
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 800;
            const ctx = canvas.getContext('2d');

            ui.ctx = ctx;
<<<<<<< HEAD
            ui.canvas = { width: 1000, height: 800 };
=======
            ui.canvas = canvas;
            ui.neurons3D = [{ type: 'gene', label: 'BDNF' }];
            ui.activeGeneIndex = 0;

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
            // Run render
            ui.render();
            assert.isTrue(geneCalled, 'Micro View should be drawn');
            assert.isTrue(proteinCalled, 'Protein View should be drawn');
            assert.isTrue(targetCalled, 'Target View should be drawn');
            assert.isTrue(controlsCalled, 'Controls should be drawn');
        });
        TestFramework.it('should handle null activeGene without context leak', () => {
            // Mock Context
            let saveCount = 0;
            let restoreCount = 0;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const originalSave = ctx.save;
            const originalRestore = ctx.restore;

            ctx.save = () => { saveCount++; originalSave.call(ctx); };
            ctx.restore = () => { restoreCount++; originalRestore.call(ctx); };

            ui.ctx = ctx;
            // Call drawMicroView with null activeGene
<<<<<<< HEAD
            ui.drawMicroView(ctx, 0, 0, 100, 100, null, {}, 'red');
=======
            ui.drawMicroView(ctx, 0, 0, 100, 100, null, 0, {}, () => {}, {});

>>>>>>> origin/fix-js-test-reporting-and-masking-8340965416753265766
            // Check balance
            assert.equal(saveCount, restoreCount, `Context save/restore mismatch: ${saveCount} saves, ${restoreCount} restores`);
        });
    });
})();
