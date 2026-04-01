(function () {
    'use strict';
    const { assert } = window;
    const TestFramework = window.TestFramework;

    const mockContainer = {
        classList: {
            add: (cls) => { mockContainer.className = (mockContainer.className || '') + ' ' + cls; }
        },
        innerHTML: '',
        appendChild: (child) => {
            if (!mockContainer.children) mockContainer.children = [];
            mockContainer.children.push(child);
        },
        querySelector: (sel) => {
            if (sel === 'a') return { href: 'https://greenhousemd.org/genetic' };
            return null;
        }
    };

    TestFramework.describe('Models Table of Contents (TOC)', () => {

        const originalQuerySelector = document.querySelector;

        TestFramework.beforeEach(() => {
            mockContainer.innerHTML = '';
            mockContainer.children = [];
            mockContainer.className = '';

            document.querySelector = (selector) => {
                if (selector === '#models-toc-container') return mockContainer;
                return originalQuerySelector.call(document, selector);
            };
        });

        TestFramework.afterEach(() => {
            document.querySelector = originalQuerySelector;
        });

        TestFramework.it('should initialize with a string selector', () => {
            window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });
            assert.isTrue(window.GreenhouseModelsTOC.state.isInitialized);
            assert.contains(mockContainer.className, 'models-toc-container');
        });

        TestFramework.it('should initialize with an HTMLElement', () => {
            const customContainer = document.createElement('div');
            window.GreenhouseModelsTOC.init({ target: customContainer });
            assert.isTrue(window.GreenhouseModelsTOC.state.isInitialized);
            assert.contains(customContainer.className, 'models-toc-container');
        });

        TestFramework.it('should fetch data and render intro and cards', async () => {
            window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

            await new Promise(resolve => setTimeout(resolve, 100));

            assert.greaterThan(mockContainer.children.length, 0);

            const intro = mockContainer.children.find(c => c.className && c.className.includes('models-toc-intro'));
            assert.isDefined(intro, 'Intro should be rendered');

            const grid = mockContainer.children.find(c => c.className && c.className.includes('models-toc-grid'));
            assert.isDefined(grid, 'Grid should be rendered');
        });

        TestFramework.it('should handle fetch errors gracefully', async () => {
            const originalXmlPath = window.GreenhouseModelsTOC.config.xmlPath;
            window.GreenhouseModelsTOC.config.xmlPath = 'non_existent_error.xml';

            window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

            await new Promise(resolve => setTimeout(resolve, 100));

            assert.contains(mockContainer.innerHTML, window.GreenhouseModelsUtil.t('err_loading_models'));

            window.GreenhouseModelsTOC.config.xmlPath = originalXmlPath;
        });

        TestFramework.it('should generate correct canonical URLs for production', async () => {
            window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });
            await new Promise(resolve => setTimeout(resolve, 100));

            const grid = mockContainer.children.find(c => c.className && c.className.includes('models-toc-grid'));
            if (grid && grid.children.length > 0) {
                const card = grid.children[0];
                const launchLink = card.querySelector('a');
                if (launchLink) {
                    assert.contains(launchLink.href, 'greenhousemd.org');
                }
            }
        });

    });
})();
