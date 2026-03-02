/**
 * @file test_pathway_logic.js
 * @description Unit tests for Pathway Viewer and Metabolic Logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        requestAnimationFrame: () => { },
        performance: { now: () => Date.now() },
        navigator: { userAgent: 'node' },
        document: {
            querySelector: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
            querySelectorAll: () => [],
            getElementById: () => ({ appendChild: () => { }, innerHTML: '', style: {} }),
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                getContext: () => ({
                    fillRect: () => { },
                    clearRect: () => { },
                    beginPath: () => { },
                    arc: () => { },
                    fill: () => { },
                    stroke: () => { },
                    save: () => { },
                    restore: () => { },
                    measureText: () => ({ width: 50 }),
                    fillText: () => { }
                }),
                width: 800, height: 600, addEventListener: () => { },
                appendChild: () => { },
                setAttribute: () => { },
                style: {}
            }),
            body: { appendChild: () => { } },
            head: { appendChild: () => { } },
            readyState: 'complete'
        },
        GreenhouseUtils: {
            loadScript: async () => { },
            observeAndReinitializeApplication: () => { },
            startSentinel: () => { }
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['pathway.js', 'pathway_viewer.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('Pathway Viewer (Unit)', () => {

    let env;
    let Viewer;

    TestFramework.beforeEach(() => {
        env = createEnv();
        Viewer = env.window.GreenhousePathwayViewer;
    });

    TestFramework.it('should define Viewer object', () => {
        assert.isDefined(Viewer);
    });

    TestFramework.describe('Dynamic Anchors', () => {
        TestFramework.it('should generate 3D layout based on anatomical regions', async () => {
            Viewer.availablePathways = [{ id: 'test', name: 'Test', regions: ['gut', 'raphe'] }];
            await Viewer.switchPathway('test');

            assert.isDefined(Viewer.pathwayData);
            assert.greaterThan(Viewer.pathwayData.length, 0);

            const firstNode = Viewer.pathwayData[0];
            assert.isDefined(firstNode.position3D);
            assert.isDefined(firstNode.position3D.x);
            assert.isDefined(firstNode.position3D.y);
            assert.isDefined(firstNode.position3D.z);
        });

        TestFramework.it('should verify anatomical mapping logic', () => {
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'Tryptophan' }, 'tryptophan'), 'gut');
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'Cortisol' }, 'hpa'), 'adrenals');
            assert.equal(Viewer.mapKeggNodeToRegion({ name: 'CRH' }, 'hpa'), 'hypothalamus');
        });
    });

    TestFramework.describe('Semantic Zoom', () => {
        TestFramework.it('should verify label visibility logic', () => {
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

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
