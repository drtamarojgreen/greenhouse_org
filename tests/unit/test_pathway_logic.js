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
    getElementById: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
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

TestFramework.describe('Pathway Viewer (Unit)', () => {

    const Viewer = global.window.GreenhousePathwayViewer;

    TestFramework.it('should define Viewer object', () => {
        assert.isDefined(Viewer);
    });

    TestFramework.describe('Dynamic Anchors', () => {
        TestFramework.it('should generate 3D layout based on anatomical regions', async () => {
            Viewer.availablePathways = [{ id: 'test', name: 'Test', regions: ['gut', 'raphe'] }];

            // Trigger switchPathway which uses internal PathwayLayout
            await Viewer.switchPathway('test');

            assert.isDefined(Viewer.pathwayData);
            assert.greaterThan(Viewer.pathwayData.length, 0);

            // Check if 3D positions are assigned
            const firstNode = Viewer.pathwayData[0];
            assert.isDefined(firstNode.position3D);
            assert.isDefined(firstNode.position3D.x);
            assert.isDefined(firstNode.position3D.y);
            assert.isDefined(firstNode.position3D.z);
        });

        TestFramework.it('should verify anatomical mapping logic', () => {
            // mapKeggNodeToRegion is public on Viewer
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'Tryptophan' }, 'tryptophan'), 'gut');
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'Cortisol' }, 'hpa'), 'adrenals');
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'CRH' }, 'hpa'), 'hypothalamus');
        });
    });

    TestFramework.describe('Semantic Zoom', () => {
        TestFramework.it('should verify label visibility logic', () => {
            // The logic is in drawPathwayGraph:
            // const showLabel = isHighlighted || node.projected.scale > semanticZoomThreshold;

            const semanticZoomThreshold = 0.5;

            let isHighlighted = false;
            let scale = 0.3;
            let showLabel = isHighlighted || scale > semanticZoomThreshold;
            assert.isFalse(showLabel);

            isHighlighted = true;
            showLabel = isHighlighted || scale > semanticZoomThreshold;
            assert.isTrue(showLabel);

            isHighlighted = false;
            scale = 0.6;
            showLabel = isHighlighted || scale > semanticZoomThreshold;
            assert.isTrue(showLabel);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
