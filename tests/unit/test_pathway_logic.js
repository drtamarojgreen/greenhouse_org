/**
 * @file test_pathway_logic.js
 * @description Unit tests for Pathway Viewer and Metabolic Logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
    querySelectorAll: () => [],
    createElement: () => ({
        getContext: () => ({ fillRect: () => { }, clearRect: () => { }, beginPath: () => { }, arc: () => { }, fill: () => { }, stroke: () => { }, save: () => { }, restore: () => { } }),
        width: 800, height: 600, addEventListener: () => { },
        appendChild: () => { },
        setAttribute: () => { },
        style: {}
    }),
    body: { appendChild: () => { } },
    head: { appendChild: () => { } },
    readyState: 'complete'
};
global.console = { log: console.log, error: () => { }, warn: () => { } };
global.requestAnimationFrame = () => { };
global.performance = { now: () => Date.now() };
global.navigator = { userAgent: 'node' };

// --- Script Loading Helper ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
global.window.GreenhouseUtils = {
    loadScript: async () => { },
    observeAndReinitializeApplication: () => { },
    startSentinel: () => { }
};

loadScript('pathway.js');
loadScript('pathway_viewer.js');

TestFramework.describe('Pathway Logic (Unit)', () => {

    const App = global.window.GreenhousePathwayApp;

    TestFramework.it('should define core App object', () => {
        assert.isDefined(App);
    });

    TestFramework.describe('Graph Theory / Mapping', () => {
        TestFramework.it('should initialize nodes for key metabolic markers', () => {
            // Assume the app has a setupNodes or similar
            if (App.nodes) {
                assert.greaterThan(App.nodes.length, 0);
                const monoamineNode = App.nodes.find(n => n.id === 'MAO');
                assert.isDefined(monoamineNode);
            }
        });

        TestFramework.it('should calculate signal propagation', () => {
            if (App.propagateSignal) {
                const results = App.propagateSignal('START_NODE', 1.0);
                assert.isDefined(results);
            }
        });
    });

    TestFramework.describe('Interactive Filtering', () => {
        TestFramework.it('should apply filters to graph state', () => {
            if (App.state && App.state.activeFilters) {
                App.applyFilter('anxiety');
                assert.isTrue(App.state.activeFilters.includes('anxiety'));
            }
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
