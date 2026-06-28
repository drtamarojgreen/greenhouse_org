(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Mobile Models Lifecycle Tests', () => {

        TestFramework.it('should prevent duplicate hub rendering', async () => {
            const models = [{id: 'genetic', title: 'Genetic', url: '/genetic'}];
            if (window.GreenhouseMobile && window.GreenhouseMobile.renderHub) {
                window.GreenhouseMobile.renderHub(models);
                const firstCount = document.body.children.length;

                window.GreenhouseMobile.renderHub(models);
                const secondCount = document.body.children.length;

                assert.equal(firstCount, secondCount);
            }
        });

        TestFramework.it('should track active models correctly', async () => {
            if (window.GreenhouseMobile && window.GreenhouseMobile.activateModel) {
                const container = document.createElement('div');
                window.GreenhouseMobile.modelRegistry.test = { scripts: [], init: () => {} };
                await window.GreenhouseMobile.activateModel('test', container);
                assert.isTrue(window.GreenhouseMobile.activeModels.has(container));
            }
        });
    });
})();
