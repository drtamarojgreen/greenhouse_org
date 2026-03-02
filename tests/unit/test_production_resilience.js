/**
 * @file test_production_resilience.js
 * @description Verifies that Greenhouse models correctly re-initialize when the DOM is replaced.
 * This mimics the behavior of React/Wix which may swap container elements during state changes.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

TestFramework.describe('Production Resilience', () => {

    TestFramework.it('Neuro Model should survive container replacement', async (done) => {
        // This test runs in the harness environment where GreenhouseUtils and GreenhouseNeuroApp are available
        if (typeof window === 'undefined' || !window.GreenhouseNeuroApp || !window.GreenhouseUtils) {
            console.log("Skipping resilience test - Environment not ready");
            return done();
        }

        const App = window.GreenhouseNeuroApp;
        const selector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

        // 1. Initial State Check
        assert.isTrue(App.isRunning, 'App should be running initially');
        const initialCanvas = document.querySelector(`${selector} canvas`);
        assert.isDefined(initialCanvas, 'Canvas should exist');

        // 2. Simulate React DOM Update
        console.log("[Resilience Test] Replacing container...");
        const container = document.querySelector(selector);
        const parent = container.parentNode;
        container.remove();

        // App should detect removal and stop
        await new Promise(r => setTimeout(r, 500));

        const newContainer = document.createElement('div');
        newContainer.id = 'models-app-container'; // Fallback ID
        parent.appendChild(newContainer);

        console.log("[Resilience Test] New container injected. Waiting for sentinel/observer...");

        // 3. Verify Recovery
        let attempts = 0;
        const checkRecovery = setInterval(() => {
            const newCanvas = newContainer.querySelector('canvas');
            if (newCanvas && App.isRunning) {
                clearInterval(checkRecovery);
                console.log("[Resilience Test] Recovery verified!");
                assert.isTrue(true);
                done();
            }
            if (attempts++ > 20) { // 10 seconds
                clearInterval(checkRecovery);
                done(new Error("App failed to recover after 10 seconds"));
            }
        }, 500);
    }, { timeout: 15000 });

    TestFramework.it('Genetic Model should survive container replacement', async (done) => {
        const App = window.GreenhouseGenetic || window.GreenhouseGeneticUI3D;
        if (typeof window === 'undefined' || !App || !window.GreenhouseUtils) {
            return done();
        }

        const selector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

        const container = document.querySelector(selector);
        const parent = container.parentNode;
        container.remove();

        await new Promise(r => setTimeout(r, 500));

        const newContainer = document.createElement('div');
        newContainer.id = 'models-app-container';
        parent.appendChild(newContainer);

        let attempts = 0;
        const checkRecovery = setInterval(() => {
            const newCanvas = newContainer.querySelector('canvas');
            if (newCanvas && App.isRunning) {
                clearInterval(checkRecovery);
                done();
            }
            if (attempts++ > 20) {
                clearInterval(checkRecovery);
                done(new Error("Genetic App failed to recover"));
            }
        }, 500);
    });

    TestFramework.it('RNA Repair Model should survive container replacement', async (done) => {
        if (typeof window === 'undefined' || !window.Greenhouse || !window.Greenhouse.rnaSimulation) {
            return done();
        }

        const selector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

        const container = document.querySelector(selector);
        const parent = container.parentNode;
        container.remove();

        await new Promise(r => setTimeout(r, 500));

        const newContainer = document.createElement('div');
        newContainer.id = 'models-app-container';
        parent.appendChild(newContainer);

        let attempts = 0;
        const checkRecovery = setInterval(() => {
            const newCanvas = newContainer.querySelector('canvas');
            if (newCanvas && window.Greenhouse.rnaSimulation) {
                clearInterval(checkRecovery);
                done();
            }
            if (attempts++ > 20) {
                clearInterval(checkRecovery);
                done(new Error("RNA App failed to recover"));
            }
        }, 500);
    });
});
