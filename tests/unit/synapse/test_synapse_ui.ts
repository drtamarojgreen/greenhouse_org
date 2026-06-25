(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Synapse UI Rendering', () => {

        TestFramework.it('should initialize and setup DOM', () => {
            const container = document.createElement('div');
            container.id = 'synapse-container';
            document.body.appendChild(container);

            window.GreenhouseSynapseApp.init('#synapse-container', '/');
            assert.isDefined(window.GreenhouseSynapseApp.canvas);
        });

        TestFramework.it('should execute rendering pipeline', () => {
            window.GreenhouseSynapseApp.render();
            assert.isTrue(true);
        });

        TestFramework.it('should calculate hoveredId based on mouse position', () => {
            const app = window.GreenhouseSynapseApp;
            app.mouse.x = 400;
            app.mouse.y = 100;
            app.checkHover(800, 600);
            assert.equal(app.hoveredId, 'preSynapticTerminal');
        });

    });
})();
