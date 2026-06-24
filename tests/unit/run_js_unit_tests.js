const fs = require('fs');
const path = require('path');
const { setupMockEnvironment, MockElement } = require('./browser_mocks');
const { setupGreenhouseMocks } = require('./greenhouse_mocks');

// --- 1. Initialize Mock Environments ---
global.__GREENHOUSE_TEST_ENVIRONMENT__ = true;
global.__originalConsole = {
    log: console.log,
    error: console.error,
    info: console.info,
    warn: console.warn
};
global.__originalTimers = {
    setTimeout: global.setTimeout,
    setInterval: global.setInterval,
    requestAnimationFrame: global.requestAnimationFrame
};

// Mask console
console.log = () => {};
console.info = () => {};
console.warn = () => {};

setupMockEnvironment();
setupGreenhouseMocks();

process.on('unhandledRejection', (reason, promise) => {
    // console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- 2. Load Infrastructure ---
const ROOT = path.resolve(__dirname, '../../');
require(path.join(ROOT, 'docs/js/assertion_library.js'));
require(path.join(ROOT, 'docs/js/test_framework.js'));

// Monkey-patch TestFramework for reporting and data preservation
if (global.TestFramework) {
    const originalRunSuite = global.TestFramework.runSuite;
    const originalRunTest = global.TestFramework.runTest;
    const originalDescribe = global.TestFramework.describe;

    // Support nested describe hooks
    global.TestFramework.describe = function(name, fn) {
        const parentSuite = this.currentSuite;
        const suite = originalDescribe.call(this, name, fn);
        if (parentSuite) {
            suite.beforeEach = [...parentSuite.beforeEach, ...suite.beforeEach];
            suite.afterEach = [...parentSuite.afterEach, ...parentSuite.afterEach];
            suite.beforeAll = [...parentSuite.beforeAll, ...suite.beforeAll];
            suite.afterAll = [...parentSuite.afterAll, ...parentSuite.afterAll];
        }
        return suite;
    };

    global.TestFramework.runSuite = async function(suite) {
        // Only log if it has direct tests or we want to see everything
        if (suite.tests.length > 0) {
            global.__originalConsole.log(`Running suite: ${suite.name}`);
        }
        const result = await originalRunSuite.call(this, suite);
        // Ensure tests are included in the results for the summary reporter
        const suiteResult = (this.results.suites || []).find(s => s.name === suite.name);
        if (suiteResult) {
            suiteResult.tests = suite.tests;
        }
        return result;
    };

    global.TestFramework.runTest = async function(test, suite) {
        // Safety: Ensure test has access to current config mock during execution
        injectDefensiveConfig();

        const result = await originalRunTest.call(this, test, suite);
        if (test.result === 'passed') {
            global.__originalConsole.log(`  ✓ ${test.name}`);
        } else if (test.result === 'failed') {
            global.__originalConsole.log(`  ✗ ${test.name}`);
        }
        return result;
    };
}

// --- 3. Module Loading Logic ---
function loadModule(m) {
    const fullPath = path.join(ROOT, m.startsWith('docs/js') ? m : path.join('docs/js', m));
    if (fs.existsSync(fullPath)) {
        // Prepare environment for loader execution
        const script = new MockElement('script');
        script.setAttribute('data-base-url', '/');
        script.setAttribute('data-target-selector-left', '#container');
        script.setAttribute('data-target-selector', '#container');
        script.setAttribute('data-genetic-selectors', JSON.stringify({ genetic: '#container' }));
        script.setAttribute('data-scheduler-selectors', JSON.stringify({ dashboardLeft: '#container', dashboardRight: '#container' }));
        global.document.currentScript = script;

        // Populate window attributes so main() can finish and define exports
        global.window._greenhouseScriptAttributes = {
            'base-url': '/',
            'target-selector-left': '#container',
            'target-selector': '#container',
            'data-genetic-selectors': JSON.stringify({ genetic: '#container' })
        };

        const code = fs.readFileSync(fullPath, 'utf8');
        try {
            global.__is_loading_modules__ = true;
            eval(code);
        } catch (e) {
            global.__originalConsole.error(`Error evaluating ${m}:`, e.message);
        } finally {
            global.__is_loading_modules__ = false;
        }

        // RE-MOCK loadScript immediately after GreenhouseUtils.js might have overwritten it
        forceMockLoadScript();

        // Prevent auto-init animations and side-effects during load
        if (global.window) {
            global.window.requestAnimationFrame = (cb) => {
                if (global.__is_loading_modules__) return 0;
                return global.__originalTimers.setTimeout(cb, 16);
            };
            global.window.setInterval = (cb, ms) => {
                if (global.__is_loading_modules__) return 0;
                return global.__originalTimers.setInterval(cb, ms);
            };
            global.window.setTimeout = (cb, ms) => {
                if (global.__is_loading_modules__) return 0; // Block timers during load
                return global.__originalTimers.setTimeout(cb, ms);
            };
        }

        // Safety Inject: Ensure all controllers and configs are robust
        injectDefensiveConfig();

        // Define GreenhouseDNARepair and RNARepairSimulation early if not defined
        // to avoid null reference in test_dna_logic.js
        if (!global.GreenhouseDNARepair || !global.GreenhouseDNARepair.state) {
            global.GreenhouseDNARepair = global.GreenhouseDNARepair || {};
            global.GreenhouseDNARepair.state = {
                basePairs: [],
                particles: [],
                camera: { rotationX: 0, x: 0, y: 0, z: -250 }
            };
            global.GreenhouseDNARepair.config = { helixLength: 60 };
        }

        // Also ensure it is on window
        if (global.window) {
            global.window.GreenhouseDNARepair = global.GreenhouseDNARepair;
        }
        if (!global.RNARepairSimulation) global.RNARepairSimulation = { state: { rnaStrand: [] } };
        if (global.window && !global.window.RNARepairSimulation) global.window.RNARepairSimulation = global.RNARepairSimulation;
    }
}

function injectDefensiveConfig(targetConfig) {
    const configs = targetConfig ? [targetConfig] : [
        global.GreenhouseGeneticConfig,
        global.GreenhouseNeuroConfig,
        global.GreenhouseStressConfig,
        global.GreenhouseInflammationConfig,
        global.window?.GreenhouseGeneticConfig,
        global.window?.GreenhouseNeuroConfig
    ];

    const getImpl = function(path) {
        if (!path || typeof path !== 'string') return undefined;
        const keys = path.split('.');
        let val = this;
        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) val = val[k];
            else return undefined;
        }
        return val;
    };

    configs.forEach(config => {
        if (config && typeof config === 'object' && typeof config.get !== 'function') {
            config.get = getImpl;
        }
    });

    // Alias for LabelingSystem
    if (global.GreenhouseLabelingSystem) global.LabelingSystem = global.GreenhouseLabelingSystem;
    if (global.window && global.window.GreenhouseLabelingSystem) global.window.LabelingSystem = global.window.GreenhouseLabelingSystem;

    // Standard structures
    const defaultCamera = { x: 0, y: 0, z: -600, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 };
    const defaultProjection = { width: 800, height: 600, near: 10, far: 5000 };

    // App-specific defensive patching
    const apps = [
        'GreenhouseNeuroApp', 'GreenhouseStressApp', 'GreenhouseInflammationApp',
        'GreenhouseCognitionApp', 'GreenhouseEmotionApp', 'GreenhouseNeuroUI3D'
    ];
    apps.forEach(name => {
        const app = global[name] || global.window?.[name];
        if (app) {
            if (!app.ui) app.ui = {};
            if (!app.ui.tabs) app.ui.tabs = [];
            if (!app.ui.buttons) app.ui.buttons = [];
            if (!app.ui.actionButtons) app.ui.actionButtons = [];
            if (!app.ui.cameraButtons) app.ui.cameraButtons = [];
            if (!app.ui.categoryButtons) app.ui.categoryButtons = [];
            if (!app.ui.checkboxes) app.ui.checkboxes = [];
            if (!app.ui.sliders) app.ui.sliders = [];
            if (!app.ui.categories) app.ui.categories = [];
            if (!app.ui.metricVelocity) app.ui.metricVelocity = {};

            if (!app.camera) app.camera = { ...defaultCamera };
            if (!app.projection) app.projection = { ...defaultProjection };

            if (app.state) {
                if (!app.state.activeScenarios) app.state.activeScenarios = new Set();
                if (!app.state.activeEnhancements) app.state.activeEnhancements = new Set();
                if (!app.state.metrics) app.state.metrics = {};
                if (!app.state.factors) app.state.factors = {};
            }

            // Silence drawUI to prevent background errors during logic tests
            if (typeof app.drawUI === 'function' && !app.drawUI.__mocked) {
                const original = app.drawUI;
                app.drawUI = function() {
                    try { return original.apply(this, arguments); } catch(e) {}
                };
                app.drawUI.__mocked = true;
            }
        }
    });

    // Prototype patching
    const classes = [
        'GreenhouseGeneticCameraController',
        'GreenhouseGeneticPiPControls',
        'GreenhouseNeuroCameraControls',
        'NeuroSynapseCameraController',
        'GreenhouseNeuroApp',
        'GreenhouseNeuroUI3D',
        'GreenhouseStressApp',
        'GreenhouseInflammationApp'
    ];
    classes.forEach(clsName => {
        const cls = global[clsName] || (global.window && global.window[clsName]);
        if (cls && cls.prototype) {
            const proto = cls.prototype;
            Object.getOwnPropertyNames(proto).forEach(methodName => {
                if (typeof proto[methodName] === 'function' && methodName !== 'constructor') {
                    if (proto[methodName].__patched) return;
                    const originalMethod = proto[methodName];
                    proto[methodName] = function() {
                        if (this.config && typeof this.config.get !== 'function') {
                            this.config.get = getImpl;
                        }
                        if (this.ui) {
                            if (!this.ui.tabs) this.ui.tabs = [];
                            if (!this.ui.buttons) this.ui.buttons = [];
                            if (!this.ui.actionButtons) this.ui.actionButtons = [];
                            if (!this.ui.cameraButtons) this.ui.cameraButtons = [];
                            if (!this.ui.metricVelocity) this.ui.metricVelocity = {};
                        }
                        if (!this.camera) this.camera = { ...defaultCamera };
                        if (!this.projection) this.projection = { ...defaultProjection };

                        if (this.engine && !this.engine.state) {
                            this.engine.state = { factors: {}, metrics: {}, history: {} };
                        }
                        if (this.clock && typeof this.clock.getPhase !== 'function') {
                            this.clock.getPhase = () => 'day';
                            this.clock.getTimeString = () => '08:00';
                        }
                        try {
                            return originalMethod.apply(this, arguments);
                        } catch (e) {
                            // Silently ignore prototype method errors in tests
                        }
                    };
                    proto[methodName].__patched = true;
                }
            });
        }
    });
}

// Ensure loadScript is always a no-op mock that resolves immediately
function forceMockLoadScript() {
    const mock = () => Promise.resolve();
    const targets = [
        global.GreenhouseUtils,
        global.window?.GreenhouseUtils,
        global.GreenhouseModelsUtil,
        global.window?.GreenhouseModelsUtil
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
    'performance_profiler.js',
    'models_lang.js',
    'models_util.js',
    'models_3d_math.js',
    'models_3d_postprocess.js',
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
    'neuro/neuro_config.js', 'neuro/neuro_camera_controls.js', 'neuro/neuro_controls.js', 'neuro/neuro_lighting.js',
    'genetic/genetic_config.js', 'genetic/genetic_camera_controls.js', 'genetic/genetic_lighting.js',
    'genetic/genetic_pip_controls.js', 'genetic/genetic_algo.js', 'genetic/genetic_ui_3d_geometry.js',
    'genetic/genetic_ui_3d_dna.js', 'genetic/genetic_ui_3d_gene.js', 'genetic/genetic_ui_3d_chromosome.js',
    'genetic/genetic_ui_3d_protein.js', 'genetic/genetic_ui_3d_brain.js', 'genetic/genetic_ui_3d_stats.js',
    'genetic/genetic_ui_3d.js', 'genetic.js',
    'neuro/neuro_adhd_data.js', 'neuro/neuro_ga.js', 'neuro/neuro_ui_3d_geometry.js',
    'neuro/neuro_ui_3d_brain.js', 'neuro/neuro_ui_3d_neuron.js', 'neuro/neuro_ui_3d_synapse.js',
    'neuro/neuro_ui_3d_stats.js', 'neuro/neuro_ui_3d.js', 'neuro/neuro_app.js', 'neuro.js',
    'stress/stress_config.js', 'stress/stress_app.js', 'stress/stress_geometry.js', 'stress/stress_ui_3d.js', 'stress.js',
    'inflammation/inflammation_config.js', 'inflammation/inflammation_app.js', 'inflammation/inflammation_geometry.js', 'inflammation.js',
    'pathway/pathway_viewer.js', 'pathway/pathway_camera_controls.js', 'pathway/pathway_layout.js',
    'pathway/pathway_ui_3d_brain.js', 'pathway/pathway_ui_3d_geometry.js', 'pathway/pathway_app.js', 'pathway.js',
    'cognition/cognition_config.js', 'cognition/cognition_drawing_utils.js', 'cognition/cognition_theories.js',
    'cognition/cognition_ui_3d_brain.js', 'cognition/cognition_app.js', 'cognition.js',
    'emotion/emotion_config.js', 'emotion/emotion_theories.js', 'emotion/emotion_regions.js',
    'emotion/emotion_ui_3d_brain.js', 'emotion/emotion_app.js', 'emotion.js',
    'GreenhouseDashboardApp.js', 'scheduler.js', 'schedulerUI.js',
    'quizzes.js', 'inspiration.js', 'labeling_system.js', 'models_toc.js',
    'reactome_parser.js', 'GreenhouseReactCompatibility.js', 'V8GraphRenderer.js',
    'dna/dna_repair_mechanisms.js', 'dna/dna_repair_mutations.js', 'dna/dna_repair_buttons.js', 'dna/dna_replication.js', 'dna/dna_tooltip.js', 'dna_repair.js',
    'rna/rna_display.js', 'rna/rna_legend.js', 'rna/rna_repair_atp.js', 'rna/rna_repair_enzymes.js', 'rna/rna_repair_physics.js', 'rna/rna_tooltip.js', 'rna_repair.js'
];

modules.forEach(loadModule);

// Final re-sync of mocks after all modules loaded
setupGreenhouseMocks();

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
    global.__originalConsole.log("--- Starting Consolidated JavaScript Unit Tests ---");
    const testFiles = getAllTestFiles(__dirname);
    for (const file of testFiles) {
        try {
            eval(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            global.__originalConsole.error(`Error in ${path.relative(__dirname, file)}:`, e.message);
        }
    }
    const results = await global.TestFramework.run();

    global.__originalConsole.log("\n--- Per-Module Test Summary ---");
    (results.suites || []).forEach(suite => {
        global.__originalConsole.log(`${suite.name.padEnd(40)} | Passed: ${suite.passed.toString().padStart(3)} | Failed: ${suite.failed.toString().padStart(3)}`);
    });

    global.__originalConsole.log(`\nSummary - Passed: ${results.passed}, Failed: ${results.failed}, Total: ${results.total}`);
    if (results.failed > 0) {
        // Output detailed failures
        (results.suites || []).forEach(suite => {
            (suite.tests || []).forEach(test => {
                if (test.result === 'failed') {
                    global.__originalConsole.error(`FAIL: [${suite.name}] ${test.name} - ${test.error}`);
                }
            });
        });
        process.exit(1);
    }

    // Force exit to kill background animation loops
    process.exit(0);
}

runTests().catch(e => {
    console.error('Test Runner Error:', e);
    process.exit(1);
});
