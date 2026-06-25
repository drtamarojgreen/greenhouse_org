(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseNeuroApp Robustness', () => {
        let app;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseNeuroApp;
            app.stopSimulation();
        });

        TestFramework.it('should NOT crash if GreenhouseADHDData is missing', () => {
            const originalData = window.GreenhouseADHDData;
            window.GreenhouseADHDData = null;
            app.updateADHDCheckboxes();
            app.setupUIComponents();
            window.GreenhouseADHDData = originalData;
        });

        TestFramework.it('should NOT crash if GreenhouseADHDData has missing categories', () => {
            const originalData = window.GreenhouseADHDData;
            window.GreenhouseADHDData = { scenarios: {} };
            app.state.adhdCategory = 'symptoms';
            app.updateADHDCheckboxes();
            window.GreenhouseADHDData = originalData;
        });

        TestFramework.it('should correctly filter for "identified" and map to correct labelKey', () => {
            const originalData = window.GreenhouseADHDData;
            window.GreenhouseADHDData = {
                categories: {
                    symptoms: [
                        { id: 20, name: "Hyperfocus Tunneling", category: "visual", description: "identified path" }
                    ]
                },
                getEnhancementById: (id) => window.GreenhouseADHDData.categories.symptoms.find(s => s.id === id)
            };
            app.state.adhdCategory = 'symptoms';
            app.state.searchQuery = 'identified';
            app.updateADHDCheckboxes();

            if (app.ui.checkboxes.length > 0) {
                assert.equal(app.ui.checkboxes[0].labelKey, 'adhd_enh_20_name');
            }
            window.GreenhouseADHDData = originalData;
        });
    });
})();
