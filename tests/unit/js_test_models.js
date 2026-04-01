(function () {
    const baseUrl = "https://drtamarojgreen.github.io/greenhouse_org/";
    const modelContainer = document.getElementById('model-container');
    const modelSelector = document.getElementById('model-selector');
    const activeLabel = document.getElementById('active-label');
    const loadingOverlay = document.getElementById('loading-overlay');
    const runTestsBtn = document.getElementById('run-suite-tests');
    const runCommonBtn = document.getElementById('run-common-tests');
    const clearResultsBtn = document.getElementById('clear-results');
    const clearBtn = document.getElementById('clear-environment');
    const loaderMessage = document.getElementById('loader-message');

    /**
     * Robust GreenhouseUtils Interceptor
     * Ensures attributes persist across sub-script loads and handles app-specific dependencies.
     */
    const originalLoadScript = window.GreenhouseUtils ? window.GreenhouseUtils.loadScript : null;

    // Override or provide loadScript to ensure attributes are always merged and persistent
    window.GreenhouseUtils.loadScript = async function (name, baseUrl, attributes = {}) {
        console.log(`[Harness] Loading sub-script: ${name}`);

        // Merge current global attributes with newly provided ones
        const mergedAttributes = {
            ...(window._greenhouseScriptAttributes || {}),
            ...attributes
        };

        // Persist them back to the window object so the sub-script can see them
        window._greenhouseScriptAttributes = mergedAttributes;

        // Re-inject the script into the DOM with attributes
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${baseUrl}js/${name}`;
            script.dataset.modelScript = "true";

            for (const [key, value] of Object.entries(mergedAttributes)) {
                script.setAttribute(`data-${key}`, value);
            }

            script.onload = () => {
                console.log(`[Harness] Sub-script loaded: ${name}`);
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    if (window.GreenhouseUtils && !window.GreenhouseUtils.waitForElement) {
        window.GreenhouseUtils.waitForElement = (s, t = 5000) => new Promise((resolve, reject) => {
            const check = () => {
                const el = document.querySelector(Array.isArray(s) ? s[0] : s);
                if (el) return resolve(el);
                if (t <= 0) return reject();
                t -= 100; setTimeout(check, 100);
            };
            check();
        });
    }

    const models = {
        'genetic': { label: 'Genetic Model', js: 'genetic.js' },
        'neuro': { label: 'Neuro Model', js: 'neuro.js' },
        'pathway': { label: 'Pathway Model', js: 'pathway.js' },
        'synapse': { label: 'Synapse Model', js: 'synapse.js' },
        'dopamine': { label: 'Dopamine Signaling Model', js: 'dopamine.js' },
        'serotonin': { label: 'Serotonin Structural Model', js: 'serotonin.js' },
        'dna': { label: 'DNA Repair Model', js: 'dna_repair.js' },
        'rna': { label: 'RNA Repair Model', js: 'rna_repair.js' },
        'emotion': { label: 'Emotion Model', js: 'emotion.js' },
        'cognition': { label: 'Cognition Model', js: 'cognition.js' },
        'inflammation': { label: 'Neuroinflammation Model', js: 'inflammation.js' },
        'stress': { label: 'Stress Dynamics Model', js: 'stress.js' }
    };

    const primarySelector = 'section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(2)';

    const testMap = {
        'neuro': [
            'neuro/test_neuro_page.js', 'neuro/test_neuro_logic.js', 'neuro/test_neuro_ui.js', 'neuro/test_neuro_ga.js',
            'neuro/test_neuro_app_logic.js', 'neuro/test_neuro_performance.js', 'neuro/test_neuro_3d_engine.js',
            'neuro/test_neuro_ui_components.js', 'neuro/test_neuro_page_loader.js', 'neuro/test_adhd_scenarios.js',
            'neuro/test_neuro_page_full.js', 'neuro/test_neuro_page_new.js'
        ],
        'genetic': [
            'genetic/test_genetic_page.js', 'genetic/test_genetic_ui.js', 'genetic/test_genetic_helpers.js',
            'genetic/test_genetic_labels.js', 'genetic/test_genetic_visualizations.js', 'genetic/test_genetic_3d_projection.js',
            'genetic/test_genetic_camera_views.js', 'genetic/test_genetic_main_camera_controller.js', 'genetic/test_genetic_mouse_actual_bug.js',
            'genetic/test_genetic_mouse_control_independence.js', 'genetic/test_genetic_mouse_event_flow.js', 'genetic/test_genetic_pip_camera_usage.js',
            'genetic/test_genetic_pip_controls.js', 'genetic/test_genetic_pip_interactions.js', 'genetic/test_genetic_rotation_and_camera_positions.js',
            'genetic/test_genetic_page_loader.js', 'genetic/test_genetic_page_new.js'
        ],
        'dopamine': [
            'dopamine/test_dopamine_ui.js', 'dopamine/test_dopamine_model_logic.js', 'dopamine/test_dopamine_electro_unit.js', 'dopamine/test_dopamine_molecular_unit.js'
        ],
        'serotonin': [
            'serotonin/test_serotonin_ui.js', 'serotonin/test_serotonin_model_logic.js', 'serotonin/test_serotonin_transport_unit.js'
        ],
        'inflammation': [
            'inflammation/test_inflammation_logic.js', 'inflammation/test_inflammation_ui.js', 'inflammation/test_inflammation_enhancements.js'
        ],
        'stress': [
            'stress/test_stress_logic.js', 'stress/test_stress_ui.js', 'stress/test_stress_regression.js', 'stress/test_stress_enhancements.js', 'stress/test_stress_interventions.js'
        ],
        'dna': [
            'dna/test_dna_ui.js', 'dna/test_dna_logic.js', 'dna/test_dna_page.js'
        ],
        'rna': [
            'rna/test_rna_ui.js', 'rna/test_rna_page.js', 'rna/repro_rna_error.js'
        ],
        'synapse': [
            'synapse/test_synapse_ui.js', 'synapse/test_synapse_logic.js', 'synapse/test_synapse_receptors.js', 'synapse/test_synapse_page_loader.js', 'synapse/test_synapse_page_new.js'
        ],
        'pathway': [
            'pathway/test_pathway_ui.js', 'pathway/test_pathway_logic.js', 'pathway/test_pathway_page_loader.js', 'pathway/test_json_pathway_support.js', 'pathway/test_pathway_page_new.js'
        ],
        'emotion': [
            'emotion/test_emotion_page.js', 'emotion/test_emotion_deep_dive.js'
        ],
        'cognition': [
            'cognition/test_cognition_logic.js', 'cognition/test_cognition_ui.js', 'cognition/test_cognition_drawing.js', 'cognition/test_cognition_modules.js', 'cognition/test_cognition_regression.js', 'cognition/test_cognition_page.js'
        ],
        'common': [
            'common/test_accessibility.js', 'core/test_assertion_library.js', 'core/test_dependency_manager.js',
            'common/test_global_ux.js', 'core/test_greenhouse_utils.js', 'common/test_labeling_system.js',
            'common/test_models_3d_math.js', 'common/test_models_toc.js', 'common/test_models_util.js',
            'core/test_performance_profiler_unit.js', 'common/test_performance_regression.js',
            'common/test_react_compatibility.js', 'core/test_test_framework.js', 'common/test_v8_graph_renderer.js',
            'mobile/test_mobile_edge_cases.js', 'mobile/test_mobile_integration.js', 'mobile/test_mobile_model_behaviors.js',
            'mobile/test_mobile_models_lifecycle.js', 'mobile/test_mobile_regression.js', 'mobile/test_mobile_typography_contrast.js',
            'mobile/test_mobile_ui_interactions.js', 'mobile/test_mobile_viewer.js', 'common/test_model_sync.js',
            'common/test_patient_app_unit.js', 'common/test_dashboard_app_unit.js', 'common/test_meditation_app.js',
            'common/test_scheduler_logic.js', 'common/test_tech_canvas.js', 'common/test_inspiration_logic.js',
            'common/test_kegg_parser.js', 'common/test_models_page_new.js', 'common/test_layout_parity.js'
        ]
    };

    const implementationMap = {
        'neuro': [
            'neuro/neuro_config.js', 'neuro/neuro_camera_controls.js',
            'neuro/neuro_synapse_camera_controls.js', 'neuro/neuro_lighting.js',
            'neuro/neuro_ga.js', 'neuro/neuro_app.js', 'neuro/neuro_controls.js',
            'neuro/neuro_ui_3d_geometry.js', 'neuro/neuro_ui_3d_brain.js',
            'neuro/neuro_ui_3d_neuron.js', 'neuro/neuro_ui_3d_synapse.js',
            'neuro/neuro_ui_3d_stats.js', 'neuro/neuro_ui_3d.js', 'neuro/neuro_adhd_data.js'
        ],
        'genetic': [
            'models_util.js', 'models_3d_math.js',
            'genetic/genetic_config.js', 'genetic/genetic_camera_controls.js', 'genetic/genetic_lighting.js',
            'genetic/genetic_pip_controls.js', 'genetic/genetic_algo.js', 'genetic/genetic_ui_3d_geometry.js',
            'genetic/genetic_ui_3d_dna.js', 'genetic/genetic_ui_3d_gene.js', 'genetic/genetic_ui_3d_chromosome.js',
            'genetic/genetic_ui_3d_protein.js', 'genetic/genetic_ui_3d_brain.js', 'genetic/genetic_ui_3d_stats.js',
            'genetic/genetic_ui_3d.js', 'genetic.js'
        ],
        'stress': [
            'models_util.js', 'models_3d_math.js', 'neuro_ui_3d_geometry.js',
            'stress/stress_config.js', 'stress/stress_geometry.js', 'stress/stress_app.js', 'stress/stress_macro.js',
            'stress/stress_pathway.js', 'stress/stress_systemic.js', 'stress/stress_controls.js',
            'stress/stress_tooltips.js', 'stress/stress_ui_3d.js'
        ],
        'inflammation': [
            'models_util.js',
            'inflammation/inflammation_config.js', 'inflammation/inflammation_geometry.js',
            'inflammation/inflammation_pathway.js', 'inflammation/inflammation_ui_3d.js',
            'inflammation/inflammation_analysis.js', 'inflammation/inflammation_app.js',
            'inflammation/inflammation_controls.js', 'inflammation/inflammation_tooltips.js'
        ]
    };

    function clearEnvironment() {
        console.log('[Harness] Clearing environment...');
        modelContainer.innerHTML = '';
        document.querySelectorAll('script[data-model-script="true"]').forEach(s => s.remove());
        const overlay = document.getElementById('greenhouse-test-results-overlay');
        if (overlay) overlay.remove();

        // Reset global Greenhouse attributes
        const greenhouseGlobals = [
            '_greenhouseScriptAttributes',
            '_greenhouseNeuroAttributes',
            '_greenhouseSynapseAttributes',
            '_greenhouseStressAttributes',
            '_greenhouseInflammationAttributes'
        ];
        greenhouseGlobals.forEach(g => {
            if (window[g]) {
                console.log(`[Harness] Clearing global attribute: ${g}`);
                delete window[g];
            }
        });

        const apps = [
            'GreenhouseNeuroApp', 'GreenhouseGenetic', 'GreenhouseDopamine',
            'GreenhouseSerotonin', 'GreenhouseDNARepair', 'GreenhouseRNARepair',
            'GreenhouseEmotionApp', 'GreenhouseCognitionApp', 'GreenhouseInflammationApp',
            'GreenhouseStressApp', 'GreenhousePathwayApp', 'GreenhouseSynapseApp'
        ];
        apps.forEach(appKey => {
            const app = window[appKey];
            if (app) {
                console.log(`[Harness] Stopping app: ${appKey}`);
                if (app.isRunning !== undefined) app.isRunning = false;
                if (app.stop) app.stop();
                if (app.stopSimulation) app.stopSimulation();

                // Clean up resilience observers and intervals managed by GreenhouseUtils
                if (app._resilienceObserver) {
                    console.log(`[Harness] Disconnecting resilience observer for ${appKey}`);
                    app._resilienceObserver.disconnect();
                }
                if (app._sentinelInterval) {
                    console.log(`[Harness] Clearing sentinel interval for ${appKey}`);
                    clearInterval(app._sentinelInterval);
                }

                delete window[appKey];
            }
        });
        activeLabel.textContent = 'Active Model: None';
        modelSelector.value = '';
    }

    async function loadModel(modelId) {
        const model = models[modelId];
        if (!model) return;

        console.log(`[Harness] Loading model: ${modelId}`);
        modelSelector.disabled = true;
        clearEnvironment();

        if (modelId === 'neuro') {
            window.GreenhouseADHDData = {
                scenarios: { "default": { "name": "Standard", "description": "Standard neural activity", "enhancements": [] } },
                categories: {
                    "symptoms": [{ id: 1, name: "Symptom 1", category: "logic", description: "Desc" }],
                    "treatments": [], "pathology": [], "etiology": [], "conditions": []
                },
                getEnhancementById: (id) => null
            };
        }
        activeLabel.textContent = `Active Model: ${model.label}`;
        modelSelector.value = modelId;

        loaderMessage.textContent = `Replicating Production Delay for ${model.label}...`;
        loadingOverlay.style.display = 'flex';
        // Reduced delay for better harness UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        loadingOverlay.style.display = 'none';

        try {
            const section1 = document.createElement('section'); section1.className = 'wixui-section';
            section1.appendChild(document.createElement('div'));
            const div2 = document.createElement('div'); section1.appendChild(div2);
            const div2_1 = document.createElement('div'); div2.appendChild(div2_1);
            const sectionInner = document.createElement('section'); div2_1.appendChild(sectionInner);
            const idiv1 = document.createElement('div'); sectionInner.appendChild(idiv1);
            idiv1.appendChild(document.createElement('div')); idiv1.appendChild(document.createElement('div'));
            const targetDiv = document.createElement('div'); targetDiv.id = 'model-target';
            sectionInner.appendChild(targetDiv);
            modelContainer.appendChild(section1);

            const script = document.createElement('script');
            script.src = `${baseUrl}js/${model.js}`;
            script.dataset.modelScript = "true";
            script.setAttribute('data-target-selector-left', primarySelector);
            script.setAttribute('data-target-selector-right', "");
            script.setAttribute('data-base-url', baseUrl);
            script.setAttribute('data-view', "default");

            const scriptAttributes = {
                'target-selector-left': primarySelector,
                'target-selector-right': '',
                'base-url': baseUrl,
                'view': 'default'
            };

            if (modelId === 'genetic') {
                const gs = {
                    "genetic": primarySelector,
                    "geneticTitle": "section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(1) > div:nth-child(1)",
                    "geneticParagraph": "section.wixui-section:nth-child(1) > div:nth-child(2) > div:nth-child(1) > section:nth-child(1) > div:nth-child(1) > div:nth-child(2)"
                };
                script.setAttribute('data-genetic-selectors', JSON.stringify(gs));
                // Maintain 'data-' prefix for compatibility with GreenhouseGenetic.js
                scriptAttributes['data-genetic-selectors'] = JSON.stringify(gs);
            }

            window._greenhouseScriptAttributes = scriptAttributes;

            const config = { baseUrl, targetSelector: primarySelector };
            if (modelId === 'neuro') window._greenhouseNeuroAttributes = config;
            if (modelId === 'synapse') window._greenhouseSynapseAttributes = config;
            if (modelId === 'stress') window._greenhouseStressAttributes = config;
            if (modelId === 'inflammation') window._greenhouseInflammationAttributes = config;

            document.body.appendChild(script);
        } finally {
            modelSelector.disabled = false;
        }
    }

    async function executeTestBatch(testFiles, modelId = null) {
        const hLog = console.log.bind(console);
        const hError = console.error.bind(console);
        const hWarn = console.warn.bind(console);

        const existingOverlay = document.getElementById('greenhouse-test-results-overlay');
        if (existingOverlay) existingOverlay.remove();

        try {
            hLog(`[Harness] Executing batch of ${testFiles.length} tests...`);

            if (!window._originalDocumentMethods) {
                window._originalDocumentMethods = {
                    createElement: document.createElement.bind(document),
                    querySelector: document.querySelector.bind(document),
                    getElementById: document.getElementById.bind(document)
                };
            }

            const normalizePath = (...parts) => {
                const raw = parts.join('/').replace(/\\/g, '/');
                const stack = [];
                raw.split('/').forEach(part => {
                    if (!part || part === '.') return;
                    if (part === '..') {
                        stack.pop();
                        return;
                    }
                    stack.push(part);
                });
                return stack.join('/');
            };

            const readTextSync = (path) => {
                let cleanPath = String(path || '');
                if (cleanPath.startsWith('tests/unit/')) cleanPath = `/docs/${cleanPath}`;
                else if (cleanPath.startsWith('js/')) cleanPath = `/docs/${cleanPath}`;
                else if (cleanPath.includes('stress_config.js')) cleanPath = '/docs/js/stress/stress_config.js';
                else if (cleanPath.includes('inflammation_config.js')) cleanPath = '/docs/js/inflammation/inflammation_config.js';
                else if (['assertion_library.js', 'test_framework.js', 'model_tests.js', 'GreenhouseUtils.js', 'GreenhouseDependencyManager.js', 'greenhouse.js', 'models_3d_math.js', 'models_lang.js', 'models_util.js', 'performance_profiler.js', 'GreenhouseReactCompatibility.js', 'V8GraphRenderer.js', 'labeling_system.js', 'GreenhousePatientApp.js', 'GreenhouseDashboardApp.js', 'scheduler.js', 'inspiration.js', 'kegg_parser.js', 'models_toc.js'].includes(cleanPath.split('/').pop())) {
                    cleanPath = `/docs/js/${cleanPath.split('/').pop()}`;
                }
                else if (cleanPath.startsWith('docs/')) cleanPath = `/${cleanPath}`;
                else cleanPath = `/docs/js/${cleanPath}`;

                cleanPath = cleanPath.replace(/\/\/+/g, '/');
                if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;

                const xhr = new XMLHttpRequest();
                xhr.open('GET', cleanPath, false);
                xhr.send(null);
                if (xhr.status >= 200 && xhr.status < 300) return xhr.responseText;
                throw new Error(`Mock FS read failed for ${cleanPath}: HTTP ${xhr.status}`);
            };

            const mockLocation = {
                href: window.location.href, protocol: window.location.protocol, host: window.location.host, hostname: window.location.hostname, port: window.location.port, pathname: window.location.pathname, search: window.location.search, hash: window.location.hash, origin: window.location.origin,
                assign: () => { }, replace: () => { }, reload: () => { }
            };

            const originalCreateElement = window._originalDocumentMethods.createElement;
            const shadowDocument = {
                ...document,
                getElementById: window._originalDocumentMethods.getElementById,
                querySelector: window._originalDocumentMethods.querySelector,
                createElement: (tagName, ...args) => {
                    const el = originalCreateElement(tagName, ...args);
                    if (String(tagName).toLowerCase() === 'canvas' && !el.getBoundingClientRect) {
                        el.getBoundingClientRect = () => ({
                            top: 0,
                            left: 0,
                            width: el.width || 800,
                            height: el.height || 600
                        });
                    }
                    return el;
                }
            };

            const shadowUtils = new Proxy(window.GreenhouseUtils || {}, {
                get(target, prop) {
                    if (prop === 'observeAndReinitializeApplication') {
                        return (app) => {
                            if (!app) {
                                hWarn('[Harness] Guarded observeAndReinitializeApplication(undefined)');
                                return;
                            }
                            if (typeof target[prop] === 'function') return target[prop](app);
                        };
                    }
                    return target[prop];
                }
            });

            const harnessLoadedScriptCode = new Set();
            const vmExecutedScriptCode = new Set();

            window.require = (path) => {
                if (path.includes('assertion_library')) return { assert: window.assert, AssertionError: window.AssertionError };
                if (path.includes('test_framework')) return window.TestFramework;
                if (path === 'fs') return { readFileSync: (p) => readTextSync(p), existsSync: (p) => { try { readTextSync(p); return true; } catch { return false; } } };
                if (path === 'path') return { join: (...args) => normalizePath(...args), resolve: (...args) => normalizePath(...args) };
                if (path === 'vm') return {
                    createContext: (s) => s,
                    runInContext: (code, ctx) => { const fn = new Function('require', 'module', 'exports', '__dirname', 'global', 'process', 'console', 'window', 'document', 'location', code); return fn(window.require, { exports: {} }, {}, "", ctx, window.process, window.console, ctx, ctx.document, ctx.location); },
                    runInThisContext: (code) => {
                        if (harnessLoadedScriptCode.has(code) || vmExecutedScriptCode.has(code)) return;
                        vmExecutedScriptCode.add(code);
                        const fn = new Function('require', 'module', 'exports', '__dirname', 'global', 'process', 'console', 'window', 'document', 'location', code);
                        const ctx = window.global;
                        return fn(window.require, { exports: {} }, {}, "", ctx, window.process, window.console, ctx, ctx.document, ctx.location);
                    }
                };
                return {};
            };

            window.module = { exports: {} };
            window.process = { exit: () => { }, env: { NODE_ENV: 'test' } };
            const safePerformance = (window.performance && typeof window.performance.now === 'function')
                ? window.performance
                : { now: () => Date.now() };
            const shadowGlobal = {
                process: window.process,
                require: window.require,
                module: window.module,
                exports: window.module.exports,
                TestFramework: window.TestFramework,
                assert: window.assert,
                AssertionError: window.AssertionError,
                location: mockLocation,
                document: shadowDocument,
                performance: safePerformance,
                loadScript: (...args) => {
                    if (typeof shadowUtils.loadScript === 'function') {
                        return shadowUtils.loadScript(...args);
                    }
                    return Promise.reject(new Error('GreenhouseUtils.loadScript is unavailable in harness'));
                },
                GreenhouseUtils: shadowUtils,
                HTMLElement: window.HTMLElement || class HTMLElement { },
                HTMLScriptElement: window.HTMLScriptElement || class HTMLScriptElement { },
                MutationObserver: window.MutationObserver || class MutationObserver {
                    disconnect() { }
                    observe() { }
                    takeRecords() { return []; }
                }
            };
            window.global = new Proxy({}, {
                get(t, p) {
                    if (['window', 'global', 'self', 'globalThis'].includes(p)) return window.global;
                    if (p in shadowGlobal) return shadowGlobal[p];
                    const val = window[p];
                    return (typeof val === 'function' && !/^[A-Z]/.test(p)) ? val.bind(window) : val;
                },
                set(t, p, v) { shadowGlobal[p] = v; return true; }
            });

            // Pre-load Infra
            if (!window.assert || !window.TestFramework || !window.GreenhouseTestSuite) {
                for (const src of ['js/assertion_library.js', 'js/test_framework.js', 'js/model_tests.js']) {
                    await new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; document.body.appendChild(s); });
                }
            }

            if (window.GreenhouseTestSuite) {
                window.GreenhouseTestSuite.tests = [];
                window.GreenhouseTestSuite.runAll = async function () {
                    this.isTesting = true; this.results = [];
                    for (let test of this.tests) {
                        try {
                            const start = performance.now(); const res = await test.fn();
                            this.results.push({ name: test.name, status: 'PASS', duration: (performance.now() - start).toFixed(2) + 'ms', details: res });
                        } catch (e) { this.results.push({ name: test.name, status: 'FAIL', error: e.message }); }
                    }
                    this.isTesting = false; this.report();
                };
            }

            // Bridge TestFramework
            const tf = window.TestFramework;
            if (tf) {
                tf.reset();
                tf.it = (name, fn) => {
                    const suiteName = (tf.currentSuite ? tf.currentSuite.name : 'Unit');
                    window.GreenhouseTestSuite.addTest(`[${suiteName}] ${name}`, async () => {
                        if (tf.currentSuite && tf.currentSuite.beforeEach) { for (const h of tf.currentSuite.beforeEach) await h(); }
                        try { await fn(); } finally { if (tf.currentSuite && tf.currentSuite.afterEach) { for (const h of tf.currentSuite.afterEach) await h(); } }
                    });
                };
            }

            // Load Implementations
            const implFiles = modelId ? (implementationMap[modelId] || []) : [];
            for (const file of implFiles) {
                const code = readTextSync(file);
                harnessLoadedScriptCode.add(code);
                const s = document.createElement('script');
                s.textContent = `(function(window, document, location, global, self, globalThis) { ${code} })(window.global, window.global.document, window.global.location, window.global, window.global, window.global);`;
                document.body.appendChild(s);
            }

            // Load Tests
            for (const file of testFiles) {
                try {
                    const resp = await fetch(`../tests/unit/${file}`);
                    const code = await resp.text();
                    const s = document.createElement('script');
                    s.textContent = `(function(require, module, exports, __dirname, global, process, console, TestFramework, TestFrameworkClass, window, document, location, self, globalThis) { 
                        try { ${code} } catch(e) { console.error(e); }
                    })(window.require, {exports:{}}, {}, "", window.global, window.process, window.console, window.TestFramework, window.TestFrameworkClass, window.global, window.global.document, window.global.location, window.global, window.global);`;
                    document.body.appendChild(s);
                } catch (e) { hError(file, e); }
            }

            if (window.GreenhouseTestSuite) await window.GreenhouseTestSuite.runAll();
        } catch (err) { hError(err); }
    }

    modelSelector.addEventListener('change', (e) => loadModel(e.target.value));

    clearResultsBtn.onclick = () => {
        const overlay = document.getElementById('greenhouse-test-results-overlay');
        if (overlay) overlay.remove();
    };

    clearBtn.onclick = clearEnvironment;

    runTestsBtn.onclick = () => {
        const modelId = modelSelector.value;
        if (!modelId) return alert("Select a model");
        executeTestBatch(testMap[modelId] || [], modelId);
    };

    runCommonBtn.onclick = () => executeTestBatch(testMap['common'] || []);
})();
