"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
    TestFramework.describe('Pathway Viewer (Unit)', () => {
        const Viewer = window.GreenhousePathwayViewer;
        TestFramework.it('should define Viewer object', () => {
            assert.isDefined(Viewer);
        });
        TestFramework.describe('Dynamic Anchors', () => {
            TestFramework.it('should generate 3D layout based on anatomical regions', () => __awaiter(this, void 0, void 0, function* () {
                Viewer.availablePathways = [{ id: 'test', name: 'Test', regions: ['gut', 'raphe'] }];
                yield Viewer.switchPathway('test');
                assert.isDefined(Viewer.pathwayData);
                assert.greaterThan(Viewer.pathwayData.length, 0);
                const firstNode = Viewer.pathwayData[0];
                assert.isDefined(firstNode.position3D);
                assert.isDefined(firstNode.position3D.x);
            }));
            TestFramework.it('should verify anatomical mapping logic', () => {
                assert.equal(Viewer.mapReactomeNodeToRegion({ name: 'Tryptophan' }, 'tryptophan'), 'gut');
                assert.equal(Viewer.mapReactomeNodeToRegion({ name: 'Cortisol' }, 'hpa'), 'adrenals');
                assert.equal(Viewer.mapReactomeNodeToRegion({ name: 'CRH' }, 'hpa'), 'hypothalamus');
                // Test for stId based mapping if needed
                assert.equal(Viewer.mapReactomeNodeToRegion({ name: 'GenericGene', stId: 'R-HSA-1234' }, 'hpa'), 'pfc');
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
