(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseNeuroControls', () => {
        let ctx;
        let mockApp;

        TestFramework.beforeEach(() => {
            ctx = document.createElement('canvas').getContext('2d');
            mockApp = {
                ui: {
                    hoveredElement: null
                },
                roundRect: (ctx, x, y, w, h, r, fill, stroke) => {
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    if (fill) ctx.fill();
                    if (stroke) ctx.stroke();
                }
            };
        });

        TestFramework.it('should draw a panel', () => {
            window.GreenhouseNeuroControls.drawPanel(ctx, mockApp, 10, 10, 100, 100, 'Test Panel');
            assert.isTrue(true);
        });

        TestFramework.it('should draw a button', () => {
            const btn = { id: 'test_btn', label: 'Click Me', x: 10, y: 10, w: 50, h: 20 };
            window.GreenhouseNeuroControls.drawButton(ctx, mockApp, btn, false);
            assert.isTrue(true);
        });

        TestFramework.it('should draw a slider', () => {
            const slider = { id: 'test_slider', x: 10, y: 10, w: 100, h: 20, min: 0, max: 1 };
            window.GreenhouseNeuroControls.drawSlider(ctx, mockApp, slider, 0.5);
            assert.isTrue(true);
        });

        TestFramework.it('should draw a checkbox', () => {
            const checkbox = { id: 'test_cb', labelKey: 'cb_label', x: 10, y: 10, w: 100, h: 20 };
            window.GreenhouseNeuroControls.drawCheckbox(ctx, mockApp, checkbox, true);
            assert.isTrue(true);
        });

        TestFramework.it('should draw a search box', () => {
            const search = { id: 'test_search', x: 10, y: 10, w: 100, h: 20 };
            window.GreenhouseNeuroControls.drawSearchBox(ctx, mockApp, search, 'query');
            assert.isTrue(true);
        });
    });
})();
