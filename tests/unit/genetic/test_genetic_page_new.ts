(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Genetic Page', () => {

        TestFramework.it('should define GreenhouseGenetic and core objects', () => {
            assert.isDefined(window.GreenhouseGenetic);
            assert.isDefined(window.GreenhouseGeneticUI3D);
        });

    });
})();
