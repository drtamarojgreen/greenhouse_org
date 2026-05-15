const fs = require('fs');
const path = require('path');
const { setupMockEnvironment, MockElement } = require('./browser_mocks');
const { setupGreenhouseMocks } = require('./greenhouse_mocks');

// --- 1. Initialize Mock Environments ---
setupMockEnvironment();
setupGreenhouseMocks();

process.on('unhandledRejection', () => {});

// --- 2. Load Infrastructure ---
const ROOT = path.resolve(__dirname, '../../');
require(path.join(ROOT, 'docs/js/assertion_library.js'));
require(path.join(ROOT, 'docs/js/test_framework.js'));

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
        global.window._greenhouseScriptAttributes = {
            'base-url': '/',
            'target-selector-left': '#container',
            'data-genetic-selectors': JSON.stringify({ genetic: '#container' })
        };

        const code = fs.readFileSync(fullPath, 'utf8');
        try {
            eval(code);
        } catch (e) {}
    }
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

// FINAL FORCE of required members and Node-safe behaviors
setupGreenhouseMocks();

// Use a getter to ensure loadScript is always our mock
if (global.GreenhouseUtils) {
    Object.defineProperty(global.GreenhouseUtils, 'loadScript', {
        get: () => () => Promise.resolve(),
        configurable: true
    });
}
if (global.window.GreenhouseUtils) {
    Object.defineProperty(global.window.GreenhouseUtils, 'loadScript', {
        get: () => () => Promise.resolve(),
        configurable: true
    });
}

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
    const results = await global.TestFramework.run();
    console.log(`Summary - Passed: ${results.passed}, Failed: ${results.failed}, Total: ${results.total}`);
    if (results.failed > 0) {
        if (results.suites) {
            results.suites.forEach(s => {
                if (s.tests) {
                    s.tests.forEach(t => {
                        if (t.result === 'failed') console.error(`❌ [${s.name}] ${t.name}: ${t.error ? t.error.message : 'Unknown Error'}`);
                    });
                }
            });
        }
        process.exit(1);
    }
}
runTests().catch(e => { console.error(e); process.exit(1); });
