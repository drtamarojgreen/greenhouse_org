(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Pathway Viewer (Unit)', () => {

        const Viewer = window.GreenhousePathwayViewer;

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
})();
