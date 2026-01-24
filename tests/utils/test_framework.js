/**
 * Lightweight Unit Testing Framework
 * 
 * A custom-built testing framework for JavaScript unit tests
 * without external dependencies. Provides essential testing
 * capabilities including test organization, assertions, and reporting.
 * 
 * Test Case Coverage: TC-WIX-04
 */

class TestFramework {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      suites: []
    };
    this.verbose = true;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }

  /**
   * Create a test suite
   */
  describe(suiteName, suiteFunction) {
    const suite = {
      name: suiteName,
      tests: [],
      beforeEach: [],
      afterEach: [],
      beforeAll: [],
      afterAll: [],
      results: {
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };

    this.suites.push(suite);
    this.currentSuite = suite;

    // Execute the suite function to register tests
    try {
      suiteFunction();
    } catch (error) {
      console.error(`Error in suite "${suiteName}":`, error);
    }

    this.currentSuite = null;
    return suite;
  }

  /**
   * Create a test case
   */
  it(testName, testFunction, options = {}) {
    if (!this.currentSuite) {
      throw new Error('Tests must be defined within a describe block');
    }

    const test = {
      name: testName,
      function: testFunction,
      skip: options.skip || false,
      only: options.only || false,
      timeout: options.timeout || 5000,
      result: null,
      error: null,
      duration: 0
    };

    this.currentSuite.tests.push(test);
    return test;
  }

  /**
   * Skip a test
   */
  xit(testName, testFunction) {
    return this.it(testName, testFunction, { skip: true });
  }

  /**
   * Run only this test
   */
  fit(testName, testFunction) {
    return this.it(testName, testFunction, { only: true });
  }

  /**
   * Register beforeEach hook
   */
  beforeEach(hookFunction) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach.push(hookFunction);
    } else {
      this.beforeEachHooks.push(hookFunction);
    }
  }

  /**
   * Register afterEach hook
   */
  afterEach(hookFunction) {
    if (this.currentSuite) {
      this.currentSuite.afterEach.push(hookFunction);
    } else {
      this.afterEachHooks.push(hookFunction);
    }
  }

  /**
   * Register beforeAll hook
   */
  beforeAll(hookFunction) {
    if (this.currentSuite) {
      this.currentSuite.beforeAll.push(hookFunction);
    } else {
      this.beforeAllHooks.push(hookFunction);
    }
  }

  /**
   * Register afterAll hook
   */
  afterAll(hookFunction) {
    if (this.currentSuite) {
      this.currentSuite.afterAll.push(hookFunction);
    } else {
      this.afterAllHooks.push(hookFunction);
    }
  }

  /**
   * Run all test suites
   */
  async run() {
    console.log('\n========================================');
    console.log('Running Test Suite');
    console.log('========================================\n');

    const startTime = Date.now();

    // Run global beforeAll hooks
    for (const hook of this.beforeAllHooks) {
      await hook();
    }

    // Run each suite
    for (const suite of this.suites) {
      await this.runSuite(suite);
    }

    // Run global afterAll hooks
    for (const hook of this.afterAllHooks) {
      await hook();
    }

    const duration = Date.now() - startTime;

    // Print summary
    this.printSummary(duration);

    return this.results;
  }

  /**
   * Run a single test suite
   */
  async runSuite(suite) {
    if (this.verbose) {
      console.log(`\n${suite.name}`);
      console.log('─'.repeat(suite.name.length));
    }

    // Run suite beforeAll hooks
    for (const hook of suite.beforeAll) {
      await hook();
    }

    // Check if any tests are marked as "only"
    const onlyTests = suite.tests.filter(test => test.only);
    const testsToRun = onlyTests.length > 0 ? onlyTests : suite.tests;

    // Run each test
    for (const test of testsToRun) {
      if (test.skip) {
        this.results.skipped++;
        suite.results.skipped++;
        if (this.verbose) {
          console.log(`  ⊘ ${test.name} (skipped)`);
        }
        continue;
      }

      await this.runTest(test, suite);
    }

    // Run suite afterAll hooks
    for (const hook of suite.afterAll) {
      await hook();
    }

    this.results.suites.push({
      name: suite.name,
      ...suite.results
    });
  }

  /**
   * Run a single test
   */
  async runTest(test, suite) {
    const startTime = Date.now();

    try {
      // Run beforeEach hooks
      for (const hook of [...this.beforeEachHooks, ...suite.beforeEach]) {
        await hook();
      }

      // Run the test with timeout
      await this.runWithTimeout(test.function, test.timeout);

      // Test passed
      test.result = 'passed';
      test.duration = Date.now() - startTime;
      this.results.passed++;
      suite.results.passed++;

      if (this.verbose) {
        console.log(`  ✓ ${test.name} (${test.duration}ms)`);
      }

    } catch (error) {
      // Test failed
      test.result = 'failed';
      test.error = error;
      test.duration = Date.now() - startTime;
      this.results.failed++;
      suite.results.failed++;

      if (this.verbose) {
        console.log(`  ✗ ${test.name}`);
        console.log(`    ${error.message}`);
        if (error.stack) {
          console.log(`    ${error.stack.split('\n')[1]?.trim()}`);
        }
      }
    } finally {
      // Run afterEach hooks
      for (const hook of [...this.afterEachHooks, ...suite.afterEach]) {
        try {
          await hook();
        } catch (error) {
          console.error('Error in afterEach hook:', error);
        }
      }

      this.results.total++;
    }
  }

  /**
   * Run a function with timeout
   */
  runWithTimeout(fn, timeout) {
    // Check if setTimeout is mocked to execute immediately (like in some of our tests)
    // or if it's the real one.
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timer = setTimeout(() => {
        if (!isResolved) {
          reject(new Error(`Test timeout after ${timeout}ms`));
        }
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          isResolved = true;
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          isResolved = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Print test summary
   */
  printSummary(duration) {
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total:   ${this.results.total}`);
    console.log(`Passed:  ${this.results.passed} ✓`);
    console.log(`Failed:  ${this.results.failed} ✗`);
    console.log(`Skipped: ${this.results.skipped} ⊘`);
    console.log(`Duration: ${duration}ms`);
    console.log('========================================\n');

    if (typeof module !== 'undefined' && module.exports && this.ResourceReporter) {
      console.log(this.ResourceReporter.generateReport());
    }

    if (this.results.failed > 0) {
      console.log('❌ Tests failed');
    } else {
      console.log('✅ All tests passed');
    }
  }

  /**
   * Set verbose mode
   */
  setVerbose(verbose) {
    this.verbose = verbose;
  }

  /**
   * Reset the framework
   */
  reset() {
    this.suites = [];
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      suites: []
    };
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .suite { margin-bottom: 20px; }
    .suite-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .test { padding: 5px; margin: 5px 0; }
    .passed { color: green; }
    .failed { color: red; }
    .skipped { color: gray; }
    .error { background: #ffe6e6; padding: 10px; margin: 5px 0; border-left: 3px solid red; }
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total: ${this.results.total}</p>
    <p class="passed">Passed: ${this.results.passed}</p>
    <p class="failed">Failed: ${this.results.failed}</p>
    <p class="skipped">Skipped: ${this.results.skipped}</p>
  </div>
  ${this.suites.map(suite => `
    <div class="suite">
      <div class="suite-name">${suite.name}</div>
      ${suite.tests.map(test => `
        <div class="test ${test.result || 'skipped'}">
          ${test.result === 'passed' ? '✓' : test.result === 'failed' ? '✗' : '⊘'} 
          ${test.name} 
          ${test.duration ? `(${test.duration}ms)` : ''}
        </div>
        ${test.error ? `<div class="error">${test.error.message}</div>` : ''}
      `).join('')}
    </div>
  `).join('')}
</body>
</html>
    `;
    return html;
  }
}

// Create singleton instance
const testFramework = new TestFramework();

// Bind methods to the instance to allow for destructuring in tests
testFramework.describe = testFramework.describe.bind(testFramework);
testFramework.it = testFramework.it.bind(testFramework);
testFramework.xit = testFramework.xit.bind(testFramework);
testFramework.fit = testFramework.fit.bind(testFramework);
testFramework.beforeEach = testFramework.beforeEach.bind(testFramework);
testFramework.afterEach = testFramework.afterEach.bind(testFramework);
testFramework.beforeAll = testFramework.beforeAll.bind(testFramework);
testFramework.afterAll = testFramework.afterAll.bind(testFramework);
testFramework.run = testFramework.run.bind(testFramework);

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  testFramework.ResourceReporter = require('./resource_reporter.js');
  module.exports = testFramework;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TestFramework = testFramework;
}

console.log('[Test Framework] Lightweight testing framework loaded');
