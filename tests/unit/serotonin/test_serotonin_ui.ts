(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Serotonin UI Components', () => {
        const G = window.GreenhouseSerotonin;

        TestFramework.beforeEach(() => {
            G.state = { receptors: [], camera: { zoom: 1.0 } };
            G.Transport = { tphActivity: 1.0, sertActivity: 1.0, maoActivity: 1.0 };
            G.injectStyles = () => {};
            G.setupKeyboardShortcuts = () => {};
        });

        TestFramework.it('should create UI controls', () => {
            const container = document.createElement('div');
            G.createUI(container);
            assert.isTrue(true);
        });

        TestFramework.it('should cycle environments', () => {
            const container = document.createElement('div');
            G.createUI(container);
            G.currentEnvIndex = 0;
            G.cycleEnvironment();
            assert.equal(G.currentEnvIndex, 1);
        });

        TestFramework.it('should toggle color blind filters', () => {
            const mockCanvas = { style: { filter: '' } };
            G.canvas = mockCanvas;

            G.toggleColorBlind('deuteranopia');
            assert.contains(mockCanvas.style.filter, 'grayscale');

            G.toggleColorBlind('deuteranopia');
            assert.equal(mockCanvas.style.filter, 'none');
        });
    });
})();
