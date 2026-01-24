/**
 * @file test_labeling_system.js
 * @description Unit tests for GreenhouseLabelingSystem.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => null,
    createElement: () => ({ style: {} }),
    body: { appendChild: () => { } }
};

// Mock the 3D Math dependency
global.window.GreenhouseModels3DMath = {
    project3DTo2D: (x, y, z, cam, proj) => {
        // Simple mock projection: return x, y directly if z is positive relative to camera
        return { x: x + 400, y: 300 - y, scale: 1, depth: 0.5 };
    }
};

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/labeling_system.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseLabelingSystem (Unit)', () => {

    const LS = global.window.GreenhouseLabelingSystem;

    TestFramework.beforeEach(() => {
        LS.init();
    });

    TestFramework.it('should add and retrieve labels', () => {
        LS.addLabel({
            id: 'l1',
            text: 'Test Label',
            position: { x: 0, y: 0, z: 0 },
            category: 'brain'
        });

        assert.equal(LS.labels.length, 1);
        assert.equal(LS.labels[0].id, 'l1');
    });

    TestFramework.it('should update existing labels with same ID', () => {
        LS.addLabel({ id: 'l1', text: 'Old' });
        LS.addLabel({ id: 'l1', text: 'New' });
        assert.equal(LS.labels.length, 1);
        assert.equal(LS.labels[0].text, 'New');
    });

    TestFramework.it('should toggle container-wide visibility flags', () => {
        assert.isTrue(LS.showLabels);
        LS.toggleLabels();
        assert.isFalse(LS.showLabels);

        assert.isTrue(LS.showLegend);
        LS.toggleLegend();
        assert.isFalse(LS.showLegend);
    });

    TestFramework.describe('Hit Testing', () => {
        TestFramework.it('should detect mouse over label', () => {
            LS.addLabel({
                id: 'target',
                text: 'Target',
                position: { x: 0, y: 0, z: 0 },
                alwaysShow: true
            });

            // Our mock projection puts (0,0,0) at (400, 300)
            const result = LS.hitTest(400, 300, {}, {});
            assert.isNotNull(result);
            assert.equal(result.id, 'target');
        });

        TestFramework.it('should return null if mouse is far from label', () => {
            LS.addLabel({ id: 't', position: { x: 0, y: 0, z: 0 } });
            const result = LS.hitTest(100, 100, {}, {});
            assert.isNull(result);
        });
    });

    TestFramework.describe('Specialized Helpers', () => {
        TestFramework.it('addBrainRegionLabels should calculate centers', () => {
            const mockBrain = {
                vertices: [{ x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 10 }],
                regions: {
                    'test-region': { name: 'Test', vertices: [0, 1], color: '#f00' }
                }
            };
            LS.addBrainRegionLabels(mockBrain);
            assert.equal(LS.labels.length, 1);
            assert.equal(LS.labels[0].text, 'Test');
            // Center of (0,0,0) and (10,10,10) is (5,5,5)
            assert.equal(LS.labels[0].position.x, 5);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
