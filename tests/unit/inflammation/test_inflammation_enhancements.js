/**
 * @file test_inflammation_enhancements.js
 * @description Unit and regression tests for the 100-enhancement pass of the Neuroinflammation Simulation.
 */

const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

// Load Dependencies in correct order

TestFramework.describe('Neuroinflammation Enhancements', () => {

    TestFramework.it('should initialize and push/pop history', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        const initialVal = app.engine.state.factors.pathogenActive;
        app.pushHistoryState();
        app.engine.state.factors.pathogenActive = (initialVal === 1 ? 0 : 1);
        app.popHistoryState();
        assert.equal(app.engine.state.factors.pathogenActive, initialVal);
    });

    TestFramework.it('should respect max history limit', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        app.ui.maxHistoryStates = 5;
        app.ui.historyStates = [];
        for (let i = 0; i < 10; i++) {
            app.pushHistoryState();
        }
        assert.equal(app.ui.historyStates.length, 5);
    });

    TestFramework.it('should save and load category open/closed state', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        const cat = app.ui.categories[0];
        cat.isOpen = false;
        app.saveCategoryState();

        app.init(mockContainer);
        assert.equal(app.ui.categories[0].isOpen, false);
    });

    TestFramework.it('should apply rotation inertia', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        app.interaction.velX = 0.1;
        app.interaction.isDragging = false;
        const initialRotY = app.camera.rotationY;
        app.updateCameraInertia();
        assert.greaterThan(app.camera.rotationY, initialRotY);
    });

    TestFramework.it('should respect Y-axis lock', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        app.interaction.isYLocked = true;
        app.interaction.velY = 0.1;
        const initialRotX = app.camera.rotationX;
        app.updateCameraInertia();
        assert.equal(app.camera.rotationX, initialRotX);
    });

    TestFramework.it('should reset camera', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        app.camera.z = -1000;
        app.resetCamera();
        assert.equal(app.camera.z, -600);
    });

    TestFramework.it('should filter checkboxes', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        const cat = app.ui.categories.find(c => c.id === 'env');
        cat.isOpen = true;
        app.ui.searchQuery = 'pathogen';
        const hit = app.hitTestCheckboxes(cat.x + 15, cat.y + 60);
        assert.isNotNull(hit);
        app.ui.searchQuery = 'nonexistent';
        const miss = app.hitTestCheckboxes(cat.x + 15, cat.y + 60);
        assert.isNull(miss);
    });

    TestFramework.it('should update advanced metrics', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        const state = app.engine.state;
        state.metrics.tnfAlpha = 0.8;
        app.updateModel(state, 0.1);
        assert.greaterThan(state.metrics.tryptase, 0);
    });

    TestFramework.it('should handle pagination', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        app.ui.footerPage = 0;
        const event = { clientX: app.layout.metrics.x + 15, clientY: app.layout.metrics.y - 15 };
        app.handleMouseDown(event);
        assert.equal(app.ui.footerPage, 1);
    });

    TestFramework.it('should export JSON', () => {
        const app = window.GreenhouseInflammationApp;
        app.init(mockContainer);
        let downloadTriggered = false;
        const originalAppend = global.document.body.appendChild;
        global.document.body.appendChild = (el) => {
            if (el.tagName === 'A') {
                downloadTriggered = true;
            }
            return el;
        };
        app.exportData('json');
        assert.isTrue(downloadTriggered);
        global.document.body.appendChild = originalAppend;
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
