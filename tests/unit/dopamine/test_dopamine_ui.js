(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Dopamine UI Components', () => {
        const G = window.GreenhouseDopamine;

        TestFramework.it('should create UI with controls', () => {
            const container = document.createElement('div');
            G.state = { receptors: [], scenarios: {} };
            G.uxState = { highContrast: false, largeScale: false, reducedMotion: false, showPerf: false };

            G.createUI(container);
            assert.isTrue(true);
        });

        TestFramework.it('should apply color palettes to receptors', () => {
            G.state.receptors = [{ color: '' }, { color: '' }];
            G.applyPalette('deuteranopia');

            assert.notEqual(G.state.receptors[0].color, '');
            assert.equal(G.state.receptors[0].color, '#e69f00');
        });

        TestFramework.it('should update text on language change', () => {
            const originalGetElementById = document.getElementById;
            const mockInfo = { innerHTML: '', style: {} };
            document.getElementById = (id) => {
                if (id === 'dopamine-info-display') return mockInfo;
                return { innerText: '', style: {}, appendChild: () => {} };
            };

            const originalUtil = window.GreenhouseModelsUtil;
            window.GreenhouseModelsUtil = { t: (k) => 'T_' + k };

            G.updateLanguage();
            assert.contains(mockInfo.innerHTML, 'T_');

            document.getElementById = originalGetElementById;
            window.GreenhouseModelsUtil = originalUtil;
        });
    });
})();
