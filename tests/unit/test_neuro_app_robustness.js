/**
 * Unit Tests for Neuro App Robustness and IDENTIFIED fix
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.addEventListener = () => { };
global.removeEventListener = () => { };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => 1;
global.cancelAnimationFrame = (id) => { };

global.document = {
    querySelector: (sel) => {
        if (sel === 'body') return global.document.body;
        return {
            innerHTML: '',
            style: {},
            appendChild: () => { },
            addEventListener: () => { },
            offsetWidth: 1000,
            offsetHeight: 750
        };
    },
    getElementById: () => null,
    body: {
        appendChild: () => { }
    },
    createElement: (tag) => {
        if (tag === 'canvas') {
            const canvas = {
                getContext: () => ({
                    save: () => { }, restore: () => { }, translate: () => { }, rotate: () => { }, scale: () => { },
                    beginPath: () => { }, moveTo: () => { }, lineTo: () => { }, stroke: () => { }, fill: () => { },
                    rect: () => { }, clip: () => { }, fillText: () => { }, measureText: () => ({ width: 0 }),
                    clearRect: () => { }, fillRect: () => { }, strokeRect: () => { }, closePath: () => { },
                    set fillStyle(v) { }, set strokeStyle(v) { }, set lineWidth(v) { }, set font(v) { }
                }),
                width: 1000, height: 600, style: {}, addEventListener: () => { }, appendChild: () => { },
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 })
            };
            return canvas;
        }
        return { style: {}, appendChild: () => { }, addEventListener: () => { }, focus: () => { } };
    }
};

function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Mock Dependencies
window.GreenhouseModels3DMath = { project3DTo2D: (x, y, z) => ({ x, y, scale: 1, depth: z }) };
window.GreenhouseModelsUtil = {
    t: (k) => {
        const trans = {
            'adhd_enh_20_name': 'Hyperfocus Tunneling',
            'adhd_enh_20_desc': 'Narrowing camera FOV when a high-fitness path is identified.',
            'cog_label_identified': 'IDENTIFIED'
        };
        return trans[k] || k;
    }
};
window.GreenhouseNeuroConfig = { get: () => ({ x: 0, y: 0, z: 0, fov: 600 }), set: () => { } };
window.GreenhouseNeuroGeometry = {
    getRegionVertices: () => [0],
    initializeBrainShell: (shell) => { shell.vertices = [{x:0, y:0, z:0}]; },
    createSynapseGeometry: () => ({ vertices: [], indices: [] })
};

loadScript('neuro_ga.js');
loadScript('neuro_ui_3d_enhanced.js');
loadScript('neuro_controls.js');
loadScript('neuro_app.js');

TestFramework.describe('GreenhouseNeuroApp Robustness', () => {
    let app;

    TestFramework.beforeEach(() => {
        app = window.GreenhouseNeuroApp;
        app.stopSimulation();
    });

    TestFramework.it('should NOT crash if GreenhouseADHDData is missing', () => {
        window.GreenhouseADHDData = null;
        app.updateADHDCheckboxes();
        app.setupUIComponents();
    });

    TestFramework.it('should NOT crash if GreenhouseADHDData has missing categories', () => {
        window.GreenhouseADHDData = { scenarios: {} };
        app.state.adhdCategory = 'symptoms';
        app.updateADHDCheckboxes();
    });

    TestFramework.it('should correctly filter for "identified" and map to correct labelKey', () => {
        window.GreenhouseADHDData = {
            categories: {
                symptoms: [
                    { id: 20, name: "Hyperfocus Tunneling", category: "visual", description: "identified path" }
                ]
            }
        };
        app.state.adhdCategory = 'symptoms';
        app.state.searchQuery = 'identified';
        app.updateADHDCheckboxes();

        assert.equal(app.ui.checkboxes.length, 1);
        // Correct fix: labelKey must be adhd_enh_20_name, not a generic "identified" label
        assert.equal(app.ui.checkboxes[0].labelKey, 'adhd_enh_20_name');
        assert.equal(app.ui.checkboxes[0].description, 'Narrowing camera FOV when a high-fitness path is identified.');
    });
});

TestFramework.run();
