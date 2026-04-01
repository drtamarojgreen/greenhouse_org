(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseInflammationApp UI', () => {

        let app;

        TestFramework.beforeEach(() => {
            app = window.GreenhouseInflammationApp;
            app.init(document.createElement('div'));
        });

        TestFramework.it('should setup UI elements from config with categories', () => {
            assert.greaterThan(app.ui.checkboxes.length, 0);
            assert.isDefined(app.ui.checkboxes[0].category);
        });

        TestFramework.it('should toggle factor on checkbox click when category is open', () => {
            const cat = app.ui.categories.find(c => c.id === 'env');
            cat.isOpen = true;

            const checkbox = app.ui.checkboxes.find(c => c.category === 'env');
            const initialVal = app.engine.state.factors[checkbox.id];

            checkbox.x = cat.x + 10;
            checkbox.y = cat.y + 55;

            const event = { clientX: checkbox.x + 5, clientY: checkbox.y + 5 };
            app.handleMouseDown(event);

            assert.notEqual(app.engine.state.factors[checkbox.id], initialVal);
        });

        TestFramework.it('should change viewMode on button click', () => {
            if (app.ui.buttons.length > 1) {
                const button = app.ui.buttons[1];
                const event = { clientX: button.x + 5, clientY: button.y + 5 };
                app.handleMouseDown(event);

                assert.equal(app.engine.state.factors.viewMode, button.val);
            }
        });

        TestFramework.it('should set hoveredElement on mouseMove over checkbox', () => {
            const cat = app.ui.categories.find(c => c.id === 'env');
            cat.isOpen = true;
            const checkbox = app.ui.checkboxes.find(c => c.category === 'env');
            checkbox.x = cat.x + 10;
            checkbox.y = cat.y + 55;

            const event = { clientX: checkbox.x + 5, clientY: checkbox.y + 5 };
            app.handleMouseMove(event);

            assert.isNotNull(app.ui.hoveredElement);
            assert.equal(app.ui.hoveredElement.id, checkbox.id);
        });

    });
})();
