/**
 * Unit Tests for Emotion Page
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.location = { search: '', pathname: '/emotion', hostname: 'localhost' };
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.HTMLElement = class { constructor() { this.style = {}; this.innerHTML = ''; } };
global.CustomEvent = class { constructor(name, detail) { this.name = name; this.detail = detail; } };
global.MutationObserver = class { constructor() {} observe() {} disconnect() {} };

global.document = {
    body: { contains: () => true },
    querySelector: () => ({
        innerHTML: '',
        style: {},
        prepend: () => {},
        appendChild: () => {},
        offsetWidth: 800,
        querySelector: () => ({})
    }),
    createElement: (tag) => {
        const el = {
            tagName: tag,
            style: {},
            innerHTML: '',
            appendChild: () => {},
            prepend: () => {},
            addEventListener: () => {},
            getContext: () => ({
                save: () => { },
                restore: () => { },
                beginPath: () => { },
                moveTo: () => { },
                lineTo: () => { },
                fill: () => { },
                stroke: () => { },
                clearRect: () => { },
                fillRect: () => { },
                fillText: () => { },
                createRadialGradient: () => ({ addColorStop: () => { } })
            })
        };
        return el;
    },
    addEventListener: () => {}
};
global.navigator = { userAgent: 'test' };
global.console = console;
global.requestAnimationFrame = (cb) => {}; // No-op for testing

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Load Dependencies ---
loadScript('GreenhouseUtils.js');
loadScript('models_util.js');
loadScript('models_3d_math.js');
loadScript('brain_mesh_realistic.js');
loadScript('emotion_ui_3d_brain.js');
loadScript('emotion_config.js');
loadScript('emotion_regions.js');
loadScript('emotion_interventions.js');
loadScript('emotion_theories.js');
loadScript('emotion_app.js');

// --- Test Suites ---

TestFramework.describe('Emotion Page Enhancements', () => {

    TestFramework.it('should have 106 enhancements total in the config (6 philosophies + 100 new)', () => {
        const config = global.window.GreenhouseEmotionConfig;
        assert.isDefined(config);

        const count = (config.philosophies ? config.philosophies.length : 0) +
                      (config.regulations ? config.regulations.length : 0) +
                      (config.therapeuticInterventions ? config.therapeuticInterventions.length : 0) +
                      (config.medicationTreatments ? config.medicationTreatments.length : 0) +
                      (config.advancedTheories ? config.advancedTheories.length : 0);

        assert.equal(count, 106);
    });

    TestFramework.it('should initialize the app without error', () => {
        const app = global.window.GreenhouseEmotionApp;
        assert.isDefined(app);

        app.init('#test-container');
        assert.isTrue(app.isRunning);
    });

    TestFramework.it('should change categories correctly', () => {
        const app = global.window.GreenhouseEmotionApp;
        app.currentCategory = 'regulations';
        app.updateTheorySelector();
        assert.equal(app.currentCategory, 'regulations');
    });

    TestFramework.it('should handle multi-region selection', () => {
        const app = global.window.GreenhouseEmotionApp;
        // Mock a theory with multiple regions
        const mockTheory = { name: 'Test Theory', regions: ['amygdala', 'prefrontalCortex'] };

        // Simulate click
        app.activeTheory = mockTheory;
        app.activeRegion = mockTheory.regions;
        app.updateInfoPanel();

        assert.isTrue(Array.isArray(app.activeRegion));
        assert.equal(app.activeRegion.length, 2);
    });

    TestFramework.it('should update simulation state and animate correctly', () => {
        const app = global.window.GreenhouseEmotionApp;
        const config = global.window.GreenhouseEmotionConfig;

        // Find an SSRI theory (e.g., ID 51)
        const ssri = config.medicationTreatments.find(t => t.id === 51);
        assert.isDefined(ssri);

        app.updateSimulationState(ssri);
        assert.equal(app.simState.targetSerotonin, 0.9);

        // Initial state is 0.5
        app.simState.serotonin = 0.5;

        // Run one animation frame
        app.updateSimAnimation();

        // With speed 0.05, it should be 0.5 + (0.9 - 0.5) * 0.05 = 0.52
        assert.equal(app.simState.serotonin.toFixed(2), "0.52");
    });

});

// Run the tests
TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
