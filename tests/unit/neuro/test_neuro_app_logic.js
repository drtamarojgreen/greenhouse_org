(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseNeuroApp', () => {
        let app;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseNeuroApp;
            app.stopSimulation();
            app.init(document.createElement('div'));
        });

        TestFramework.it('should initialize with default state', () => {
            assert.equal(app.state.activeTab, 'sim');
            assert.equal(app.state.dosage, 1.0);
        });

        TestFramework.it('should switch tabs', () => {
            // Simulate mouse down on tab
            const tab = app.ui.tabs[1]; // ADHD tab
            app.handleMouseDown({
                clientX: tab.x + 5,
                clientY: tab.y + 5,
                preventDefault: () => { }
            });
            assert.equal(app.state.activeTab, 'adhd');
        });

        TestFramework.it('should filter scenarios via search', () => {
            app.state.activeTab = 'adhd';
            app.setupUIComponents();
            app.state.searchQuery = 'inattentive';
            const filtered = app.getFilteredCheckboxes();
            assert.equal(filtered.length, 1);
            assert.equal(filtered[0].scenarioId, 'inattentive');
        });

        TestFramework.it('should update dosage slider', () => {
            app.state.activeTab = 'sim';
            app.setupUIComponents();
            const slider = app.ui.sliders[0];
            app.handleMouseDown({
                clientX: slider.x + slider.w / 2,
                clientY: slider.y + slider.h / 2
            });
            assert.isTrue(app.state.dosage !== 1.0);
        });

        TestFramework.it('should toggle simulation state', () => {
            assert.isTrue(app.isRunning);
            app.stopSimulation();
            assert.isFalse(app.isRunning);
            app.startSimulation();
            assert.isTrue(app.isRunning);
        });

        TestFramework.it('should handle mode switching', () => {
            app.switchMode(1); // Synaptic
            assert.equal(app.state.viewMode, 1);
        });

        TestFramework.it('should switch ADHD categories', () => {
            app.state.activeTab = 'adhd';
            app.setupUIComponents();

            // Find symptoms category button
            const btn = app.ui.categoryButtons.find(b => b.val === 'symptoms');
            app.handleMouseDown({ clientX: btn.x + 5, clientY: btn.y + 5 });

            assert.equal(app.state.adhdCategory, 'symptoms');
        });

        TestFramework.it('should handle wheel scrolling', () => {
            app.state.activeTab = 'adhd';
            app.state.adhdCategory = 'symptoms';
            app.setupUIComponents(); // Ensure checkboxes are created

            // Mock a lot of items for scrolling
            app.ui.checkboxes = Array(20).fill(0).map((_, i) => ({ x: 55, y: 0, w: 200, h: 20, enhancementId: i, label: 'TEST' }));

            app.handleWheel({
                clientX: 100,
                clientY: 300,
                deltaY: 100,
                preventDefault: () => { }
            });

            assert.equal(app.state.scrollOffset, 100);
        });
    });
})();
