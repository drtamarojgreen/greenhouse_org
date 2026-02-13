/**
 * @file inflammation_test_harness.js
 * @description Automated test scenarios for the Neuroinflammation Simulation.
 * Replays known inflammation scenarios and verifies enhancement availability.
 */

(function () {
    'use strict';

    const GreenhouseInflammationTestHarness = {
        scenarios: [
            {
                name: 'Systemic Infection (Acute)',
                factors: { pathogenActive: 1, leakyGut: 1, chronicStress: 0 },
                expectedMetric: 'tnfAlpha',
                minVal: 0.6
            },
            {
                name: 'Wellness Intervention',
                factors: { cleanDiet: 1, exerciseRegular: 1, meditationPractice: 1, pathogenActive: 0 },
                expectedMetric: 'neuroprotection',
                minVal: 0.8
            }
        ],

        async runAll(app) {
            console.log("--- STARTING INFLAMMATION TEST HARNESS ---");

            for (const scenario of this.scenarios) {
                console.log(`Executing Scenario: ${scenario.name}`);
                this.applyScenario(app, scenario);
                await new Promise(r => setTimeout(r, 2000)); // Wait for stabilization
                this.verifyMetrics(app, scenario);
            }

            this.verifyEnhancementCoverage(app);
            console.log("--- TEST HARNESS COMPLETE ---");
        },

        applyScenario(app, scenario) {
            for (const [fid, val] of Object.entries(scenario.factors)) {
                if (app.engine.state.factors.hasOwnProperty(fid)) {
                    app.engine.state.factors[fid] = val;
                }
            }
        },

        verifyMetrics(app, scenario) {
            const val = app.engine.state.metrics[scenario.expectedMetric];
            if (val >= scenario.minVal) {
                console.log(`[PASS] ${scenario.name}: ${scenario.expectedMetric} = ${val.toFixed(2)} (>= ${scenario.minVal})`);
            } else {
                console.warn(`[FAIL] ${scenario.name}: ${scenario.expectedMetric} = ${val.toFixed(2)} (< ${scenario.minVal})`);
            }
        },

        verifyEnhancementCoverage(app) {
            console.log("Checking Enhancement Module Coverage...");
            const modules = {
                'Atlas Legend': !!window.GreenhouseInflammationControls.drawAtlasLegend,
                'Mini-map': !!window.GreenhouseInflammationControls.drawMiniMap,
                'Analysis Matrix': !!window.GreenhouseInflammationAnalysis.drawMatrix,
                'Temporal Timeline': !!window.GreenhouseInflammationAnalysis.drawTimeline,
                'Lobe Boundaries': !!window.GreenhouseInflammationMacro.drawLobeBoundaries,
                'Region Confidence': !!window.GreenhouseInflammationUI3D.drawRegionConfidence,
                'Disease Presets': !!app.applyPreset,
                'Keyboard Accessibility': !!app.handleKeyDown
            };

            for (const [name, exists] of Object.entries(modules)) {
                console.log(`[${exists ? 'OK' : 'MISSING'}] ${name}`);
            }
        }
    };

    window.GreenhouseInflammationTestHarness = GreenhouseInflammationTestHarness;
})();
