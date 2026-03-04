/**
 * @file test_neuro_browser.js
 * @description Browser-native unit tests for GreenhouseNeuroApp.
 */

(function() {
    'use strict';

    const framework = window.TestFramework;
    if (!framework || !framework.describe) {
        console.error('[Neuro Test] TestFramework instance not found on window. Check script loading order.');
        return;
    }

    const { describe, it, beforeAll } = framework;

    describe('GreenhouseNeuroApp (Browser Native)', () => {

        beforeAll(async () => {
            // Ensure dependencies are available or mocked
            window.NeuroGA = window.NeuroGA || class {
                init() {} start() {} stop() {} update() {}
                setADHDEnhancement() {}
                adhdConfig = { viewMode: 0, dosagePrecision: 1.0 };
            };
            window.GreenhouseNeuroUI3D = window.GreenhouseNeuroUI3D || {
                init: () => {}, startAnimation: () => {}, stopAnimation: () => {},
                resetCamera: () => {}, toggleAutoRotate: () => {}, updateData: () => {},
                canvas: { width: 1000, height: 750, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 750 }) }
            };
            window.GreenhouseModelsUtil = window.GreenhouseModelsUtil || {
                t: (k) => k,
                toggleLanguage: () => {}
            };
            window.GreenhouseNeuroControls = window.GreenhouseNeuroControls || {
                drawPanel: () => {}, drawButton: () => {}, drawSlider: () => {},
                drawCheckbox: () => {}, drawSearchBox: () => {}
            };
            window.GreenhouseADHDData = window.GreenhouseADHDData || {
                scenarios: { "default": { name: "Default", enhancements: [1] } },
                enhancements: { "1": { category: ["symptoms"] } }
            };

            // Initialize app if not already
            if (!window.GreenhouseNeuroApp.container) {
                const container = document.createElement('div');
                container.id = 'test-neuro-container';
                document.body.appendChild(container);
                window.GreenhouseNeuroApp.init('#test-neuro-container');
            }
        });

        it('should have a valid initial state', () => {
            const app = window.GreenhouseNeuroApp;
            assert.isDefined(app.state, 'App state should be defined');
            assert.equal(app.state.viewMode, 0, 'Initial viewMode should be 0');
            assert.equal(app.state.activeTab, 'sim', 'Initial activeTab should be sim');
        });

        it('should switch tabs correctly', () => {
            const app = window.GreenhouseNeuroApp;
            const tab = app.ui.tabs.find(t => t.val === 'adhd');

            const rect = app.ui3d.canvas.getBoundingClientRect();
            const event = {
                clientX: rect.left + tab.x + 5,
                clientY: rect.top + tab.y + 5
            };

            app.handleMouseDown(event);
            assert.equal(app.state.activeTab, 'adhd', 'activeTab should be adhd after click');
        });

        it('should filter ADHD checkboxes by category', () => {
            const app = window.GreenhouseNeuroApp;
            app.state.activeTab = 'adhd';
            app.state.adhdCategory = 'scenarios';
            app.updateADHDCheckboxes();

            const scenarios = app.getFilteredCheckboxes();
            assert.isTrue(scenarios.length > 0, 'Should have scenario checkboxes');
            assert.equal(scenarios[0].category, 'scenarios', 'Checkbox should belong to scenarios category');
        });

        it('should toggle simulation running state', () => {
            const app = window.GreenhouseNeuroApp;
            const initialState = app.isRunning;
            const pauseBtn = app.ui.actionButtons.find(b => b.action === 'pause');
            const rect = app.ui3d.canvas.getBoundingClientRect();

            const event = {
                clientX: rect.left + pauseBtn.x + 5,
                clientY: rect.top + pauseBtn.y + 5
            };

            app.handleMouseDown(event);
            assert.notEqual(app.isRunning, initialState, 'isRunning state should be toggled');

            app.handleMouseDown(event);
            assert.equal(app.isRunning, initialState, 'isRunning state should be restored');
        });

        it('should update dosage via slider', () => {
            const app = window.GreenhouseNeuroApp;
            const slider = app.ui.sliders[0];
            const middleX = slider.x + slider.w / 2;
            app.updateSlider(middleX, slider);

            assert.isTrue(app.state.dosage > 1.0 && app.state.dosage < 1.1, 'Dosage should be updated to approximately midpoint');
        });

    });

})();
