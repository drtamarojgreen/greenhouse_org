(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseStressApp UI', () => {

        let app;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseStressApp;
            app.init(document.createElement('div'));
        });

        TestFramework.it('should setup UI elements and categories', () => {
            assert.greaterThan(app.ui.categories.length, 0);
            assert.greaterThan(app.ui.checkboxes.length, 0);
        });

        TestFramework.it('should toggle category isOpen on header click', () => {
            const cat = app.ui.categories[0]; // 'hpa', closed by default
            assert.isFalse(cat.isOpen);

            const event = { clientX: cat.x + 5, clientY: cat.y + 5 };
            app.handleMouseDown(event);

            assert.isTrue(cat.isOpen);
        });

        TestFramework.it('should toggle factor on checkbox click when category is open', () => {
            const cat = app.ui.categories[0]; // 'hpa'
            cat.isOpen = true;

            const checkbox = app.ui.checkboxes.find(c => c.category === cat.id);
            const initialVal = app.engine.state.factors[checkbox.id];

            const event = { clientX: cat.x + 15, clientY: cat.y + 45 };
            app.handleMouseDown(event);

            assert.notEqual(app.engine.state.factors[checkbox.id], initialVal);
        });

        TestFramework.it('should set hoveredElement on mouseMove over category header', () => {
            const cat = app.ui.categories[0];
            const event = { clientX: cat.x + 5, clientY: cat.y + 5 };
            app.handleMouseMove(event);

            assert.isNotNull(app.ui.hoveredElement);
            assert.equal(app.ui.hoveredElement.id, cat.id);
        });

    });
})();
