/**
 * Unit Tests for Genetic Page Loader
 */

const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

TestFramework.describe('Genetic Page Loader', () => {
    TestFramework.it('should define window.GreenhouseGenetic with reinitialize', () => {
        assert.isDefined(window.GreenhouseGenetic);
        assert.isFunction(window.GreenhouseGenetic.reinitialize);
    });
});

TestFramework.run();
