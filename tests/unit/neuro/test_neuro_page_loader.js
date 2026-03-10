/**
 * Unit Tests for Neuro Page Loader
 */

// --- Mock Browser Environment ---
// Harness provides window, document, location, performance, etc.
// Specific Mocks for loader test:
global.HTMLElement = class { };
global.window.GreenhouseDependencyManager = {
    waitFor: () => Promise.resolve()
};

// --- Mocks ---
const mockUtils = {
    loadScript: async (name) => {
        mockUtils.loaded.push(name);
        if (name === 'neuro_app.js') global.window.GreenhouseNeuroApp = { init: () => { } };
        if (name === 'neuro_ga.js') global.window.NeuroGA = function () { };
        if (name === 'neuro_ui_3d.js') global.window.GreenhouseNeuroUI3D = {};
        return Promise.resolve();
    },
    displayError: () => { },
    renderModelsTOC: () => { },
    loaded: []
};
global.window.GreenhouseUtils = mockUtils;

// --- Test Suite ---

// --- Test Suite ---

TestFramework.describe('Neuro Page Loader', () => {

    TestFramework.beforeEach(() => {
        mockUtils.loaded = [];
        delete global.window.GreenhouseNeuroApp;
        delete global.window.NeuroGA;
        delete global.window.GreenhouseNeuroUI3D;
    });

    TestFramework.it('should load all neuro dependencies', async () => {
        loadScript('neuro.js');

        // wait for async init
        await new Promise(resolve => setTimeout(resolve, 100));

        const expected = [
            'models_lang.js',
            'models_util.js',
            'models_3d_math.js',
            'brain_mesh_realistic.js',
            'neuro_config.js',
            'neuro_camera_controls.js',
            'neuro_synapse_camera_controls.js',
            'neuro_lighting.js',
            'neuro_adhd_data.js',
            'neuro_ga.js',
            'neuro_ui_3d_geometry.js',
            'neuro_ui_3d_brain.js',
            'neuro_ui_3d_neuron.js',
            'neuro_ui_3d_synapse.js',
            'neuro_ui_3d_stats.js',
            'neuro_ui_3d.js',
            'neuro_controls.js',
            'neuro_app.js'
        ];

        for (const script of expected) {
            assert.includes(mockUtils.loaded, script);
        }
    });

    TestFramework.it('should use pre-defined attributes if available', async () => {
        loadScript('neuro.js', { baseUrl: '/custom/', targetSelector: '.custom' });

        await new Promise(resolve => setTimeout(resolve, 50));

        assert.equal(global.window._greenhouseNeuroAttributes.baseUrl, '/custom/');
    });

});

TestFramework.run();
