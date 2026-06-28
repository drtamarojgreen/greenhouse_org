(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Neuroinflammation Enhancements', () => {

        let app;
        const mockContainer = document.createElement('div');

        TestFramework.beforeEach(() => {
            app = window.GreenhouseInflammationApp;
            app.init(mockContainer);
        });

        TestFramework.it('should initialize and push/pop history', () => {
            const initialVal = app.engine.state.factors.pathogenActive;
            app.pushHistoryState();
            app.engine.state.factors.pathogenActive = (initialVal === 1 ? 0 : 1);
            app.popHistoryState();
            assert.equal(app.engine.state.factors.pathogenActive, initialVal);
        });

        TestFramework.it('should respect max history limit', () => {
            app.ui.maxHistoryStates = 5;
            app.ui.historyStates = [];
            for (let i = 0; i < 10; i++) {
                app.pushHistoryState();
            }
            assert.equal(app.ui.historyStates.length, 5);
        });

        TestFramework.it('should save and load category open/closed state', () => {
            const cat = app.ui.categories[0];
            cat.isOpen = false;
            app.saveCategoryState();

            app.init(mockContainer);
            assert.equal(app.ui.categories[0].isOpen, false);
        });

        TestFramework.it('should apply rotation inertia', () => {
            app.interaction.velX = 0.1;
            app.interaction.isDragging = false;
            const initialRotY = app.camera.rotationY;
            app.updateCameraInertia();
            assert.greaterThan(app.camera.rotationY, initialRotY);
        });

        TestFramework.it('should reset camera', () => {
            app.camera.z = -1000;
            app.resetCamera();
            assert.equal(app.camera.z, -600);
        });

        TestFramework.it('should update advanced metrics', () => {
            const state = app.engine.state;
            state.metrics.tnfAlpha = 0.8;
            app.updateModel(state, 0.1);
            assert.greaterThan(state.metrics.tryptase, 0);
        });

    });
})();
