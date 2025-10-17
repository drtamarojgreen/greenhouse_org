/**
 * Unit Tests for Lightweight Unit Testing Framework
 *
 * Test cases for the core functionality of the test framework.
 */

// Load assertion library and test framework
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Create a new test suite for the framework
TestFramework.describe('Test Framework Core', () => {

  TestFramework.beforeEach(() => {
    // Reset the framework before each test to ensure isolation
    TestFramework.reset();
  });

  TestFramework.it('should create a test suite with describe', () => {
    TestFramework.describe('My Suite', () => {});
    assert.equal(TestFramework.suites.length, 1);
    assert.equal(TestFramework.suites[0].name, 'My Suite');
  });

  TestFramework.it('should create a test case with it', () => {
    TestFramework.describe('My Suite', () => {
      TestFramework.it('My Test', () => {});
    });
    const suite = TestFramework.suites[0];
    assert.equal(suite.tests.length, 1);
    assert.equal(suite.tests[0].name, 'My Test');
  });

  TestFramework.it('should run a simple passing test', async () => {
    TestFramework.describe('Passing Suite', () => {
      TestFramework.it('should pass', () => {
        assert.isTrue(true);
      });
    });
    const results = await TestFramework.run();
    assert.equal(results.passed, 1);
    assert.equal(results.failed, 0);
  });

  TestFramework.it('should run a simple failing test', async () => {
    TestFramework.describe('Failing Suite', () => {
      TestFramework.it('should fail', () => {
        assert.isTrue(false);
      });
    });
    const results = await TestFramework.run();
    assert.equal(results.passed, 0);
    assert.equal(results.failed, 1);
  });

  TestFramework.it('should handle skipped tests with xit', async () => {
    TestFramework.describe('Skipped Suite', () => {
      TestFramework.xit('should be skipped', () => {
        // This code will not run
        assert.isTrue(false);
      });
    });
    const results = await TestFramework.run();
    assert.equal(results.skipped, 1);
    assert.equal(results.total, 0); // Skipped tests are not included in total
  });

  TestFramework.it('should run only specified tests with fit', async () => {
    TestFramework.describe('Only Suite', () => {
      TestFramework.it('should be skipped', () => {
        assert.isTrue(false);
      });
      TestFramework.fit('should run', () => {
        assert.isTrue(true);
      });
    });
    const results = await TestFramework.run();
    assert.equal(results.passed, 1);
    assert.equal(results.failed, 0);
    assert.equal(results.total, 1);
  });

  TestFramework.it('should run beforeEach and afterEach hooks', async () => {
    let count = 0;
    TestFramework.describe('Hooks Suite', () => {
      TestFramework.beforeEach(() => {
        count++;
      });
      TestFramework.afterEach(() => {
        count++;
      });
      TestFramework.it('test 1', () => {
        assert.equal(count, 1);
      });
      TestFramework.it('test 2', () => {
        assert.equal(count, 3);
      });
    });
    await TestFramework.run();
    assert.equal(count, 4);
  });

  TestFramework.it('should run beforeAll and afterAll hooks', async () => {
    let count = 0;
    TestFramework.describe('All Hooks Suite', () => {
      TestFramework.beforeAll(() => {
        count = 1;
      });
      TestFramework.afterAll(() => {
        count = 0;
      });
      TestFramework.it('test 1', () => {
        assert.equal(count, 1);
      });
      TestFramework.it('test 2', () => {
        assert.equal(count, 1);
      });
    });
    await TestFramework.run();
    assert.equal(count, 0);
  });

  TestFramework.it('should handle async tests', async () => {
    TestFramework.describe('Async Suite', () => {
      TestFramework.it('should handle async operations', async () => {
        const result = await new Promise(resolve => setTimeout(() => resolve(true), 50));
        assert.isTrue(result);
      });
    });
    const results = await TestFramework.run();
    assert.equal(results.passed, 1);
  });

  TestFramework.it('should handle test timeouts', async () => {
    TestFramework.describe('Timeout Suite', () => {
      TestFramework.it('should timeout', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      }, { timeout: 50 });
    });
    const results = await TestFramework.run();
    assert.equal(results.failed, 1);
    const test = TestFramework.suites[0].tests[0];
    assert.contains(test.error.message, 'timeout');
  });

});

// Run the tests for the framework itself
TestFramework.run();