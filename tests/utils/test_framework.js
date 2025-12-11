// tests/utils/test_framework.js

const suiteStack = [];

function describe(description, callback) {
  console.log(description);
  const suite = {
    beforeEach: null,
    parent: suiteStack.length > 0 ? suiteStack[suiteStack.length - 1] : null,
  };
  suiteStack.push(suite);
  callback();
  suiteStack.pop();
}

function it(description, callback) {
  try {
    runBeforeEach(suiteStack[suiteStack.length - 1]);
    callback();
    console.log(`  ✓ ${description}`);
  } catch (error) {
    console.error(`  ✗ ${description}`);
    console.error(error);
    process.exit(1); // Exit on failure
  }
}

function beforeEach(callback) {
  if (suiteStack.length > 0) {
    suiteStack[suiteStack.length - 1].beforeEach = callback;
  }
}

function runBeforeEach(suite) {
  if (suite) {
    // Run parent beforeEach hooks first
    runBeforeEach(suite.parent);
    // Then run the current suite's hook
    if (suite.beforeEach) {
      suite.beforeEach();
    }
  }
}

module.exports = {
  describe,
  it,
  beforeEach,
};
