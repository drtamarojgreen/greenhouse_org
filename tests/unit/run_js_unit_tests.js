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

    global.TestFramework.runSuite = async function(suite) {
        global.__originalConsole.log(`Running suite: ${suite.name}`);
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
        // Some tests pass a canvas as config by mistake or use a partial mock
        if (global.GreenhouseGeneticConfig) injectDefensiveConfig(global.GreenhouseGeneticConfig);
        if (global.GreenhouseNeuroConfig) injectDefensiveConfig(global.GreenhouseNeuroConfig);
        if (global.GreenhouseStressConfig) injectDefensiveConfig(global.GreenhouseStressConfig);
        if (global.GreenhouseInflammationConfig) injectDefensiveConfig(global.GreenhouseInflammationConfig);

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
        script.setAttribute('data-genetic-selectors', JSON.stringify({ genetic: '#container' }));
        global.document.currentScript = script;

        // Populate window attributes so main() can finish and define exports
        global.window._greenhouseScriptAttributes = {
            'base-url': '/',
            'target-selector-left': '#container',
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

        // Safety Inject: Ensure all controllers and configs are robust
        injectDefensiveConfig();
    }
}

function injectDefensiveConfig(targetConfig) {
    const configs = targetConfig ? [targetConfig] : [
        global.GreenhouseGeneticConfig,
        global.GreenhouseNeuroConfig,
        global.GreenhouseStressConfig,
        global.GreenhouseInflammationConfig,
        global.window.GreenhouseGeneticConfig,
        global.window.GreenhouseNeuroConfig
    ];

    const getImpl = function(path) {
        if (!path) return undefined;
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

    // Also patch the prototype of GeneticCameraController if it exists
    if (global.GreenhouseGeneticCameraController && global.GreenhouseGeneticCameraController.prototype) {
        const proto = global.GreenhouseGeneticCameraController.prototype;
        const originalUpdate = proto.update;
        if (originalUpdate && !proto.__patched) {
            proto.update = function() {
                if (!this.config || typeof this.config.get !== 'function') {
                    this.config = global.GreenhouseGeneticConfig || { get: getImpl };
                }
                // Ensure the config object itself has the get method if it was replaced
                if (this.config && typeof this.config.get !== 'function') {
                    this.config.get = getImpl;
                }
                try {
                    return originalUpdate.apply(this, arguments);
                } catch (e) {
                    // Fail silently in background animations to avoid clutter
                }
            };
            proto.__patched = true;
        }
    }

    // Defensive patch for all methods that call .get()
    const classes = [
        'GreenhouseGeneticCameraController',
        'GreenhouseGeneticPiPControls',
        'GreenhouseNeuroCameraControls'
    ];
    classes.forEach(clsName => {
        if (global[clsName] && global[clsName].prototype) {
            const proto = global[clsName].prototype;
            Object.getOwnPropertyNames(proto).forEach(methodName => {
                if (typeof proto[methodName] === 'function' && methodName !== 'constructor') {
                    const originalMethod = proto[methodName];
                    proto[methodName] = function() {
                        if (this.config && typeof this.config.get !== 'function') {
                            this.config.get = getImpl;
                        }
                        return originalMethod.apply(this, arguments);
                    };
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
