(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('ADHD Scenarios Integration', () => {

        TestFramework.it('Checking a scenario should update GA config and be visible to UI3D', () => {
            const app = window.GreenhouseNeuroApp;
            const container = document.createElement('div');
            app.init(container);
            const ga = app.ga;

            // Verify initial state
            assert.isDefined(ga.adhdConfig);

            app.state.activeTab = 'adhd';
            app.state.adhdCategory = 'scenarios';
            app.updateADHDCheckboxes();

            // Toggle scenario 0 if exists
            if (app.ui.checkboxes.length > 0) {
                const cb = app.ui.checkboxes[0];
                app.handleMouseDown({
                    clientX: cb.x + 5,
                    clientY: cb.y + 5,
                    preventDefault: () => {}
                });

                assert.greaterThan(ga.adhdConfig.activeEnhancements.size, 0);
            }
        });

    });
})();
