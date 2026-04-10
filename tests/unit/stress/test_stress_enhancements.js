(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseStressApp Enhancements', () => {

        let app;
        let systemic;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseStressApp;
            app.init(document.createElement('div'));
            systemic = window.GreenhouseStressSystemic;
        });

        TestFramework.it('should initialize category-specific geometries', () => {
            systemic.initVisuals();
            Object.keys(systemic.categories).forEach(catKey => {
                const mesh = systemic.nodeMeshes[catKey];
                assert.isNotNull(mesh, `Mesh for ${catKey} should not be null`);
            });
        });

        TestFramework.it('should handle scrubber interaction in systemic view', () => {
            app.engine.state.factors.viewMode = 2; // Systemic
            const sw = app.canvas.width;
            const sh = app.canvas.height;
            const scrubberW = 400;
            const scrubberX = (sw - scrubberW) / 2;
            const scrubberY = sh - 40;

            assert.equal(systemic.timelineT, 0.5);

            // Click at start of scrubber
            const eventDown = { clientX: scrubberX, clientY: scrubberY };
            app.handleMouseDown(eventDown);
            assert.equal(systemic.timelineT, 0.0);
            assert.isTrue(app.interaction.isScrubbing);

            // Move to end of scrubber
            const eventMove = { clientX: scrubberX + scrubberW, clientY: scrubberY };
            app.handleMouseMove(eventMove);
            assert.equal(systemic.timelineT, 1.0);

            // Release
            app.handleMouseUp();
            assert.isFalse(app.interaction.isScrubbing);
        });

        TestFramework.it('should render telemetry dashboard in systemic view', () => {
            const ctx = app.ctx;
            const state = app.engine.state;
            systemic.scoreHistory['hpa'] = new Array(50).fill(1);

            systemic.render(ctx, state, app.camera, app.projection, app.ui);
            assert.isTrue(true);
        });

    });
})();
