(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Production Resilience', () => {

        TestFramework.it('Neuro Model should survive container replacement', async () => {
            // This test runs in the harness environment where GreenhouseUtils and GreenhouseNeuroApp are available
            if (typeof window === 'undefined' || !window.GreenhouseNeuroApp || !window.GreenhouseUtils) {
                console.log("Skipping resilience test - Environment not ready");
                return;
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
            let recovered = false;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 500));
                const newCanvas = newContainer.querySelector('canvas');
                if (newCanvas && App.isRunning) {
                    recovered = true;
                    break;
                }
            }

            assert.isTrue(recovered, "App failed to recover after 10 seconds");
        });

        TestFramework.it('Genetic Model should survive container replacement', async () => {
            const App = window.GreenhouseGenetic || window.GreenhouseGeneticUI3D;
            if (typeof window === 'undefined' || !App || !window.GreenhouseUtils) {
                return;
            }

            const selector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

            const container = document.querySelector(selector);
            const parent = container.parentNode;
            container.remove();

            await new Promise(r => setTimeout(r, 500));

            const newContainer = document.createElement('div');
            newContainer.id = 'models-app-container';
            parent.appendChild(newContainer);

            let recovered = false;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 500));
                const newCanvas = newContainer.querySelector('canvas');
                if (newCanvas && App.isRunning) {
                    recovered = true;
                    break;
                }
            }
            assert.isTrue(recovered, "Genetic App failed to recover");
        });

        TestFramework.it('RNA Repair Model should survive container replacement', async () => {
            if (typeof window === 'undefined' || !window.Greenhouse || !window.Greenhouse.rnaSimulation) {
                return;
            }

            const selector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

            const container = document.querySelector(selector);
            const parent = container.parentNode;
            container.remove();

            await new Promise(r => setTimeout(r, 500));

            const newContainer = document.createElement('div');
            newContainer.id = 'models-app-container';
            parent.appendChild(newContainer);

            let recovered = false;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 500));
                const newCanvas = newContainer.querySelector('canvas');
                if (newCanvas && window.Greenhouse.rnaSimulation) {
                    recovered = true;
                    break;
                }
            }
            assert.isTrue(recovered, "RNA App failed to recover");
        });
    });
})();
