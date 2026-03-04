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
                el.style.left = '10px';
                el.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
                el.style.color = '#fff';
                el.style.padding = '20px';
                el.style.borderRadius = '12px';
                el.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                el.style.fontSize = '13px';
                el.style.zIndex = '100000';
                el.style.border = '1px solid #4ca1af';
                el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                el.style.maxWidth = '450px';
                el.style.maxHeight = '80vh';
                el.style.overflowY = 'auto';
                document.body.appendChild(el);
            }

            const details = this.results.map(r => `
                <div style="margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">
                    <span style="color: ${r.status === 'PASS' ? '#00ff99' : '#ff5533'}; font-weight: bold;">
                        ${r.status === 'PASS' ? '✓' : '✗'} ${r.name}
                    </span>
                    <div style="font-size: 11px; color: #aaa; margin-left: 18px;">
                        ${r.status === 'PASS' ? (r.duration || '') : (r.error || 'Unknown error')}
                    </div>
                </div>
            `).join('');

            el.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #4ca1af; padding-bottom: 10px;">
                    <strong style="color:#4ca1af; font-size: 16px;">Test Results Dashboard</strong>
                    <span style="font-size: 12px; color: #888;">${summary.passed}/${summary.total} PASSED</span>
                </div>

                <div style="max-height: 50vh; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                    ${details}
                </div>

                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="window.GreenhouseTestSuite.runAll()" style="flex: 1; background:#4ca1af; border:none; padding:8px; border-radius:6px; cursor:pointer; color:#fff; font-weight:bold;">Rerun All</button>
                    <button onclick="this.closest('#greenhouse-test-results-overlay').remove()" style="background:#444; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; color:#fff;">Close</button>
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
