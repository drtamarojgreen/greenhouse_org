/**
 * Unit Tests for Neuro App Robustness and IDENTIFIED fix
 */

// --- Mock Browser Environment ---
// Harness provides window, document, location, performance, etc.
// Specific Mocks for robustness test:
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
    initializeBrainShell: (shell) => { shell.vertices = [{ x: 0, y: 0, z: 0 }]; },
    createSynapseGeometry: () => ({ vertices: [], indices: [] })
};

// --- Test Suites ---

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
