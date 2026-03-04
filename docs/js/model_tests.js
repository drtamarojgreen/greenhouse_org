/**
 * @file model_tests.js
 * @description Unit tests and performance profiling runner for Greenhouse model pages.
 */

(function () {
    'use strict';

    const GreenhouseTestSuite = {
        tests: [],
        results: [],
        isTesting: false,

        addTest(name, fn) {
            this.tests.push({ name, fn });
        },

        async runAll() {
            console.log('--- Greenhouse Unit Tests & Profiling Starting ---');
            this.isTesting = true;
            this.results = [];

            for (const test of this.tests) {
                console.log(`Running Test: ${test.name}...`);
                try {
                    const startTime = performance.now();
                    const result = await test.fn();
                    const duration = performance.now() - startTime;
                    this.results.push({ name: test.name, status: 'PASS', duration: duration.toFixed(2) + 'ms', details: result });
                } catch (error) {
                    console.error(`Test FAILED: ${test.name}`, error);
                    this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                }
            }

            this.isTesting = false;
            this.report();
        },

        report() {
            console.log('--- Greenhouse Test Report ---');
            console.table(this.results);

            const summary = {
                total: this.results.length,
                passed: this.results.filter(r => r.status === 'PASS').length,
                failed: this.results.filter(r => r.status === 'FAIL').length
            };

            console.log('Summary:', summary);

            if (window.GreenhouseProfiler) {
                const perfReport = window.GreenhouseProfiler.generateReport();
                console.log('Performance Profiling Result:', perfReport);
            }

            this.renderVisibleResults(summary);
        },

        renderVisibleResults(summary) {
            const id = 'greenhouse-test-results-overlay';
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.style.position = 'fixed';
                el.style.top = '10px';
                el.style.right = '10px';
                el.style.backgroundColor = 'rgba(20, 20, 20, 0.98)';
                el.style.color = '#eee';
                el.style.padding = '25px';
                el.style.borderRadius = '16px';
                el.style.fontFamily = '"Inter", "Segoe UI", sans-serif';
                el.style.fontSize = '13px';
                el.style.zIndex = '1000000';
                el.style.border = '1px solid #4ca1af';
                el.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
                el.style.width = '500px';
                el.style.maxHeight = '90vh';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                document.body.appendChild(el);
            }

            const failures = this.results.filter(r => r.status === 'FAIL');
            const failureDetails = failures.length > 0 ? `
                <div style="margin-bottom: 20px; background: rgba(255, 85, 51, 0.1); border: 1px solid #ff5533; border-radius: 8px; padding: 12px;">
                    <strong style="color: #ff5533; display: block; margin-bottom: 8px;">Failed Tests (${failures.length})</strong>
                    ${failures.map(r => `
                        <div style="font-size: 11px; margin-bottom: 4px; color: #ff9988;">
                            • <strong>${r.name}:</strong> ${r.error}
                        </div>
                    `).join('')}
                </div>
            ` : '<div style="margin-bottom: 20px; background: rgba(0, 255, 153, 0.1); border: 1px solid #00ff99; border-radius: 8px; padding: 12px; color: #00ff99; font-weight: bold;">✓ All Tests Passed!</div>';

            const details = this.results.map(r => `
                <div style="margin-bottom: 6px; padding: 4px 8px; border-radius: 4px; background: ${r.status === 'PASS' ? 'transparent' : 'rgba(255,0,0,0.1)'}; border-left: 3px solid ${r.status === 'PASS' ? '#00ff99' : '#ff5533'}">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500;">${r.name}</span>
                        <span style="color: ${r.status === 'PASS' ? '#00ff99' : '#ff5533'}; font-size: 10px; font-weight: bold;">${r.status}</span>
                    </div>
                    ${r.status === 'PASS' ? `<div style="font-size: 10px; color: #888;">Duration: ${r.duration}</div>` : ''}
                </div>
            `).join('');

            el.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #4ca1af; padding-bottom: 12px;">
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color:#4ca1af; font-size: 18px;">Simulation Analytics</strong>
                        <span style="font-size: 11px; color: #777;">Greenhouse Research Suite V2.1</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: bold; color: ${summary.failed > 0 ? '#ff5533' : '#00ff99'}">${Math.round((summary.passed / summary.total) * 100)}%</div>
                        <div style="font-size: 10px; color: #888;">${summary.passed}/${summary.total} PASSED</div>
                    </div>
                </div>

                <div style="flex-grow: 1; overflow-y: auto; padding-right: 10px; scrollbar-width: thin; scrollbar-color: #4ca1af #222;">
                    ${failureDetails}
                    <div style="font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Full Test Log</div>
                    ${details}
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
                    <button onclick="window.GreenhouseTestSuite.runAll()" style="flex: 1; background:#4ca1af; border:none; padding:10px; border-radius:8px; cursor:pointer; color:#fff; font-weight:bold; transition: background 0.2s;">Rerun Diagnostics</button>
                    <button onclick="(() => {
                        const blob = new Blob([JSON.stringify(window.GreenhouseTestSuite.results, null, 2)], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'greenhouse_test_results.json'; a.click();
                    })()" style="background:#333; border:1px solid #555; padding:10px; border-radius:8px; cursor:pointer; color:#eee;">Export</button>
                    <button onclick="this.closest('#greenhouse-test-results-overlay').remove()" style="background:transparent; border:none; padding:10px; cursor:pointer; color:#777;">Dismiss</button>
                </div>
            `;
        }
    };

    window.GreenhouseTestSuite = GreenhouseTestSuite;

    // Define Standard Tests
    GreenhouseTestSuite.addTest('Dependency Check', () => {
        if (typeof window.GreenhouseUtils === 'undefined') throw new Error('GreenhouseUtils missing');
        return 'All base utilities loaded';
    });

    GreenhouseTestSuite.addTest('App Instance Check', () => {
        const apps = ['GreenhouseDopamine', 'GreenhouseSerotonin', 'GreenhouseNeuroApp', 'GreenhouseSynapseApp', 'Greenhouse', 'GreenhouseGenetic', 'GreenhousePathwayViewer', 'GreenhouseDNARepair', 'GreenhouseEmotionApp', 'GreenhouseCognitionApp'];
        const found = apps.find(a => window[a]);
        if (!found) throw new Error('No Greenhouse app instance found on window object');
        return `Found active model instance: ${found}`;
    });

    GreenhouseTestSuite.addTest('Mobile Hub Integrity Check', () => {
        if (!window.GreenhouseMobile) throw new Error('GreenhouseMobile missing');
        const registry = window.GreenhouseMobile.modelRegistry;
        const requiredModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];

        requiredModels.forEach(model => {
            if (!registry[model]) throw new Error(`Model ${model} missing from registry`);
            if (!registry[model].init) throw new Error(`Model ${model} missing init function`);
            if (!registry[model].modes || registry[model].modes.length === 0) throw new Error(`Model ${model} missing modes`);
        });

        return `Mobile hub registry verified with ${requiredModels.length} models`;
    });

    GreenhouseTestSuite.addTest('Mobile Detection Logic Check', () => {
        if (!window.GreenhouseMobile) throw new Error('GreenhouseMobile missing');
        const isMobile = window.GreenhouseMobile.isMobileUser();
        // This test will vary depending on the environment, but we ensure it returns a boolean
        if (typeof isMobile !== 'boolean') throw new Error('isMobileUser did not return a boolean');
        return `Mobile detection active (Result: ${isMobile})`;
    });

    GreenhouseTestSuite.addTest('Canvas Memory/Lifecycle Leak Check', async () => {
        // Simple test to ensure multiple init attempts don't exponentially increase memory
        // This is a basic "Process Management" check
        if (!performance.memory) return 'Memory API not available, skipping precise check';

        const startMem = performance.memory.usedJSHeapSize;
        // In a real scenario, we might re-init here, but for a unit test on a live page, 
        // we check if the current usage is stable.
        await new Promise(r => setTimeout(r, 500));
        const endMem = performance.memory.usedJSHeapSize;

        if (endMem - startMem > 50 * 1024 * 1024) { // > 50MB growth in 0.5s is suspicious
            throw new Error(`Suspicious memory growth: ${((endMem - startMem) / 1048576).toFixed(2)} MB`);
        }
        return `Memory stable: ${(endMem / 1048576).toFixed(2)} MB`;
    });

    GreenhouseTestSuite.addTest('Process Management: Frame Stability', async () => {
        // Check if the simulation is actually ticking and producing frames
        if (!window.GreenhouseProfiler) return 'Profiler missing';

        // Wait for profiler to collect at least 2 seconds of data
        await new Promise(r => setTimeout(r, 2200));
        const currentFPS = window.GreenhouseProfiler.fps;

        if (currentFPS === 0) {
            throw new Error('Simulation loop appears stalled (0 FPS measured)');
        }

        return `Simulation active. Measured ${currentFPS} FPS`;
    });

    // Auto-run if triggered by URL or data attribute
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('runTests') || document.body.dataset.testMode === 'true') {
            setTimeout(() => {
                if (window.GreenhouseProfiler) window.GreenhouseProfiler.start();
                GreenhouseTestSuite.runAll();
            }, 2000); // Delay to allow app initialization
        }
    });

})();
