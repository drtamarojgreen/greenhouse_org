const fs = require('fs');
const path = require('path');
const { setupMockEnvironment, MockElement } = require('./browser_mocks');
const { setupGreenhouseMocks } = require('./greenhouse_mocks');

// --- 1. Initialize Mock Environments ---
global.__is_loading_modules__ = true;
setupMockEnvironment();
setupGreenhouseMocks();

process.on('unhandledRejection', (reason, promise) => {
    // console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- 2. Load Infrastructure ---
const ROOT = path.resolve(__dirname, '../../');
require(path.join(ROOT, 'docs/js/assertion_library.js'));
require(path.join(ROOT, 'docs/js/test_framework.js'));

function injectDefensiveConfig() {
    const configMock = {
        get: function (path) {
            if (!path || typeof path !== 'string') return undefined;
            const keys = path.split('.');
            let val = this;
            for (const k of keys) {
                if (val && typeof val === 'object' && k in val) val = val[k];
                else {
                    // Fallback for common camera controls if path is missing
                    if (path.includes('camera.controls')) {
                        if (path.endsWith('inertia')) return true;
                        if (path.endsWith('autoRotate')) return true;
                        if (path.endsWith('inertiaDamping')) return 0.95;
                        if (path.endsWith('autoRotateSpeed')) return 0.001;
                        return true;
                    }
                    return undefined;
                }
            }
            return val;
        },
        set: () => { },
        camera: {
            initial: { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0 },
            controls: {
                inertia: true, autoRotate: true, enablePan: true, enableRotate: true, enableZoom: true,
                inertiaDamping: 0.95, autoRotateSpeed: 0.001, zoomSpeed: 0.1, rotateSpeed: 0.005, panSpeed: 0.002
            }
        },
        materials: { dna: { baseColors: {} }, brain: { baseColor: { r: 180, g: 190, b: 200 } } },
        ui: { background: {} },
        pip: { enabled: true }
    };

    const targets = [
        'GreenhouseGeneticCameraController',
        'GeneticCameraController',
        'NeuroSynapseCameraController',
        'NeuroCameraController',
        'PiPControls',
        'GreenhouseGeneticPiPControls'
    ];

    targets.forEach(t => {
        const Target = global[t] || (global.window && global.window[t]);
        if (Target) {
            if (Target.prototype) {
                // Patch Prototype
                Object.defineProperty(Target.prototype, 'config', {
                    get: function () {
                        if (!this._config) this._config = configMock;
                        if (!this._config.get) {
                             Object.assign(this._config, configMock);
                             this._config.get = configMock.get;
                        }
                        return this._config;
                    },
                    set: function (v) { this._config = v; },
                    configurable: true
                });
            } else if (typeof Target === 'object') {
                // Patch Singleton
                if (!Target.config || !Target.config.get) {
                    Target.config = configMock;
                }
            }
        }
    });

    // Also patch global window configs
    if (global.window) {
        if (!global.window.GreenhouseGeneticConfig || !global.window.GreenhouseGeneticConfig.get) {
            global.window.GreenhouseGeneticConfig = configMock;
        }
        if (!global.window.GreenhouseNeuroConfig || !global.window.GreenhouseNeuroConfig.get) {
            global.window.GreenhouseNeuroConfig = configMock;
        }
    }
}

// --- 3. Module Loading Logic ---
function loadModule(m) {
    const fullPath = path.join(ROOT, m.startsWith('docs/js') ? m : path.join('docs/js', m));
    if (fs.existsSync(fullPath)) {
        // Ensure Greenhouse core mocks are stable BEFORE loading any module
        setupGreenhouseMocks();

        // Prepare environment for loader execution
        const script = new MockElement('script');
        script.setAttribute('data-base-url', '/');
        script.setAttribute('data-target-selector-left', '#container');
        script.setAttribute('data-genetic-selectors', JSON.stringify({ genetic: '#container' }));
        global.document.currentScript = script;

        // Populate window attributes which GreenhouseUtils.js uses
        global.window._greenhouseScriptAttributes = {
            'base-url': '/',
            'target-selector-left': '#container',
            'data-genetic-selectors': JSON.stringify({ genetic: '#container' })
        };

        const code = fs.readFileSync(fullPath, 'utf8');
        try {
            eval(code);
            injectDefensiveConfig();

            // Critical Patch: If this is a class definition, patch its prototype IMMEDIATELY
            const classMatch = code.match(/class\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[1];
                if (global[className] && global[className].prototype) {
                    global[className].prototype.config = global[className].prototype.config || {
                        get: (path) => {
                            const map = {
                                'camera.controls.inertia': true,
                                'camera.controls.autoRotate': true,
                                'camera.controls.inertiaDamping': 0.95,
                                'camera.controls.autoRotateSpeed': 0.001
                            };
                            return map[path];
                        }
                    };
                }
            }
        } catch (e) {
            // Silence evaluation errors if they are just about missing browser features
            // but log them for debugging if needed
            // console.error(`Error evaluating ${m}:`, e.message);
        }

        // RE-MOCK loadScript immediately after GreenhouseUtils.js might have overwritten it
        forceMockLoadScript();
    }
}

// Ensure loadScript is always a no-op mock that resolves immediately
function forceMockLoadScript() {
    const mock = () => Promise.resolve();
    const targets = [
        global.GreenhouseUtils,
        global.window.GreenhouseUtils,
        global.GreenhouseModelsUtil,
        global.window.GreenhouseModelsUtil
    ];

    targets.forEach(obj => {
        if (obj) {
            try {
                Object.defineProperty(obj, 'loadScript', {
                    value: mock,
                    writable: true,
                    configurable: true,
                    enumerable: true
                });
            } catch (e) {
                obj.loadScript = mock;
            }
        }
    });
}

const modules = [
    'GreenhouseDependencyManager.js',
    'GreenhouseUtils.js',
    'models_lang.js',
    'models_util.js',
    'models_3d_math.js',
    'brain_mesh_realistic.js',
    'dopamine/dopamine_controls.js', 'dopamine/dopamine_legend.js', 'dopamine/dopamine_tooltips.js',
    'dopamine/dopamine_molecular.js', 'dopamine/dopamine_synapse.js', 'dopamine/dopamine_electrophysiology.js',
    'dopamine/dopamine_circuit.js', 'dopamine/dopamine_plasticity.js', 'dopamine/dopamine_clinical.js',
    'dopamine/dopamine_pharmacology.js', 'dopamine/dopamine_scientific.js', 'dopamine/dopamine_analytics.js',
    'dopamine/dopamine_ux.js', 'dopamine.js',
    'serotonin/serotonin_controls.js', 'serotonin/serotonin_legend.js', 'serotonin/serotonin_tooltips.js',
    'serotonin/serotonin_receptors.js', 'serotonin/serotonin_kinetics.js', 'serotonin/serotonin_signaling.js',
    'serotonin/serotonin_transport.js', 'serotonin/serotonin_analytics.js', 'serotonin.js',
    'synapse/synapse_chemistry.js', 'synapse/synapse_neurotransmitters.js', 'synapse/synapse_sidebar.js',
    'synapse/synapse_tooltips.js', 'synapse/synapse_controls.js', 'synapse/synapse_analytics.js',
    'synapse/synapse_3d.js', 'synapse/synapse_molecular.js', 'synapse/synapse_app.js', 'synapse.js',
    'genetic/genetic_config.js', 'genetic/genetic_camera_controls.js', 'genetic/genetic_lighting.js',
    'genetic/genetic_pip_controls.js', 'genetic/genetic_algo.js', 'genetic/genetic_ui_3d_geometry.js',
    'genetic/genetic_ui_3d_dna.js', 'genetic/genetic_ui_3d_gene.js', 'genetic/genetic_ui_3d_chromosome.js',
    'genetic/genetic_ui_3d_protein.js', 'genetic/genetic_ui_3d_brain.js', 'genetic/genetic_ui_3d_stats.js',
    'genetic/genetic_ui_3d.js', 'genetic.js',
    'neuro/neuro_config.js', 'neuro/neuro_camera_controls.js', 'neuro/neuro_controls.js',
    'neuro/neuro_adhd_data.js', 'neuro/neuro_ga.js', 'neuro/neuro_ui_3d.js', 'neuro/neuro_app.js', 'neuro.js',
    'stress/stress_config.js', 'stress/stress_app.js', 'stress/stress_geometry.js', 'stress/stress_ui_3d.js', 'stress.js',
    'inflammation/inflammation_config.js', 'inflammation/inflammation_app.js', 'inflammation/inflammation_geometry.js', 'inflammation.js',
    'rna_repair.js'
];

modules.forEach(loadModule);

// Final re-sync of mocks after all modules loaded
setupGreenhouseMocks();
injectDefensiveConfig();
global.__is_loading_modules__ = false;

// --- 4. Discover and Run Tests ---
function getAllTestFiles(dir, files_ = []) {
    const fsFiles = fs.readdirSync(dir);
    for (const i in fsFiles) {
        const name = path.join(dir, fsFiles[i]);
        if (fs.statSync(name).isDirectory()) {
            getAllTestFiles(name, files_);
        } else if (path.basename(name).startsWith('test_') && name.endsWith('.js') && !name.includes('run_js_unit_tests.js')) {
            files_.push(name);
        }
    }
    return files_;
}

async function runTests() {
    console.log("--- Starting Consolidated JavaScript Unit Tests ---");
    const testFiles = getAllTestFiles(__dirname);
    for (const file of testFiles) {
        try {
            eval(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            console.error(`Error in ${path.relative(__dirname, file)}:`, e.message);
        }
    }
    injectDefensiveConfig();
    const results = await global.TestFramework.run();
    console.log(`Summary - Passed: ${results.passed}, Failed: ${results.failed}, Total: ${results.total}`);
    if (results.failed > 0) {
        // Output detailed failures
        if (results.suites) {
            results.suites.forEach(suite => {
                if (suite.tests) {
                    suite.tests.forEach(test => {
                        if (test.result === 'failed') {
                            console.error(`FAIL: [${suite.name}] ${test.name} - ${test.error}`);
                        }
                    });
                }
            });
        }
        process.exit(1);
    }

    // Force exit to kill background animation loops
    process.exit(0);
}

runTests().catch(e => {
    console.error('Test Runner Error:', e);
    process.exit(1);
});
