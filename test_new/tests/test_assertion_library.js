/**
 * Unit Tests for Custom Assertion Library
 *
 * Test cases for each assertion in the custom assertion library.
 */

// Load assertion library and test framework
const { assert, AssertionError } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Create a new test suite
TestFramework.describe('Assertion Library', () => {

  // Test isTrue and isFalse
  TestFramework.describe('isTrue / isFalse', () => {
    TestFramework.it('should assert true values', () => {
      assert.isTrue(true);
      assert.isTrue(1);
      assert.isTrue('hello');
    });

    TestFramework.it('should throw for false values', () => {
      assert.throws(() => assert.isTrue(false), AssertionError);
      assert.throws(() => assert.isTrue(0), AssertionError);
      assert.throws(() => assert.isTrue(''), AssertionError);
    });

    TestFramework.it('should assert false values', () => {
      assert.isFalse(false);
      assert.isFalse(0);
      assert.isFalse('');
    });

    TestFramework.it('should throw for true values', () => {
      assert.throws(() => assert.isFalse(true), AssertionError);
      assert.throws(() => assert.isFalse(1), AssertionError);
      assert.throws(() => assert.isFalse('hello'), AssertionError);
    });
  });

  // Test equal and notEqual
  TestFramework.describe('equal / notEqual', () => {
    TestFramework.it('should assert strict equality', () => {
      assert.equal(1, 1);
      assert.equal('hello', 'hello');
      assert.equal(true, true);
    });

    TestFramework.it('should throw for unequal values', () => {
      assert.throws(() => assert.equal(1, 2), AssertionError);
      assert.throws(() => assert.equal('hello', 'world'), AssertionError);
      assert.throws(() => assert.equal(true, false), AssertionError);
      assert.throws(() => assert.equal(1, '1'), AssertionError); // strict equality
    });

    TestFramework.it('should assert strict inequality', () => {
      assert.notEqual(1, 2);
      assert.notEqual('hello', 'world');
      assert.notEqual(true, false);
      assert.notEqual(1, '1');
    });

    TestFramework.it('should throw for equal values', () => {
      assert.throws(() => assert.notEqual(1, 1), AssertionError);
      assert.throws(() => assert.notEqual('hello', 'hello'), AssertionError);
      assert.throws(() => assert.notEqual(true, true), AssertionError);
    });
  });

  // Test deepEqual
  TestFramework.describe('deepEqual', () => {
    TestFramework.it('should assert deep equality for objects', () => {
      assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
      assert.deepEqual({ a: { b: 1 } }, { a: { b: 1 } });
    });

    TestFramework.it('should assert deep equality for arrays', () => {
      assert.deepEqual([1, 2, 3], [1, 2, 3]);
      assert.deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }]);
    });

    TestFramework.it('should throw for unequal objects', () => {
      assert.throws(() => assert.deepEqual({ a: 1 }, { a: 2 }), AssertionError);
      assert.throws(() => assert.deepEqual({ a: 1 }, { b: 1 }), AssertionError);
    });
  });

  // Test isNull and isNotNull
  TestFramework.describe('isNull / isNotNull', () => {
    TestFramework.it('should assert null values', () => {
      assert.isNull(null);
    });

    TestFramework.it('should throw for non-null values', () => {
      assert.throws(() => assert.isNull(undefined), AssertionError);
      assert.throws(() => assert.isNull(0), AssertionError);
      assert.throws(() => assert.isNull(''), AssertionError);
    });

    TestFramework.it('should assert non-null values', () => {
      assert.isNotNull(undefined);
      assert.isNotNull(0);
      assert.isNotNull('hello');
    });

    TestFramework.it('should throw for null values', () => {
      assert.throws(() => assert.isNotNull(null), AssertionError);
    });
  });

  // Test isUndefined and isDefined
  TestFramework.describe('isUndefined / isDefined', () => {
    TestFramework.it('should assert undefined values', () => {
      assert.isUndefined(undefined);
    });

    TestFramework.it('should throw for defined values', () => {
      assert.throws(() => assert.isUndefined(null), AssertionError);
      assert.throws(() => assert.isUndefined(0), AssertionError);
    });

    TestFramework.it('should assert defined values', () => {
      assert.isDefined(null);
      assert.isDefined(0);
    });

    TestFramework.it('should throw for undefined values', () => {
      assert.throws(() => assert.isDefined(undefined), AssertionError);
    });
  });

  // Test isType and specific type assertions
  TestFramework.describe('isType', () => {
    TestFramework.it('should assert correct types', () => {
      assert.isType('hello', 'string');
      assert.isType(123, 'number');
      assert.isType(true, 'boolean');
      assert.isType({}, 'object');
      assert.isType([], 'object'); // Note: isArray is more specific
      assert.isType(() => {}, 'function');
    });

    TestFramework.it('should throw for incorrect types', () => {
      assert.throws(() => assert.isType(123, 'string'), AssertionError);
      assert.throws(() => assert.isType('hello', 'number'), AssertionError);
    });

    TestFramework.it('should use specific type assertions', () => {
      assert.isString('hello');
      assert.isNumber(123);
      assert.isBoolean(true);
      assert.isFunction(() => {});
      assert.isObject({});
      assert.isArray([]);
    });
  });

  // Test array assertions
  TestFramework.describe('Array Assertions', () => {
    TestFramework.it('should assert array length', () => {
      assert.hasLength([1, 2, 3], 3);
    });

    TestFramework.it('should throw for incorrect length', () => {
      assert.throws(() => assert.hasLength([1, 2], 3), AssertionError);
    });

    TestFramework.it('should assert array includes value', () => {
      assert.includes([1, 2, 3], 2);
    });

    TestFramework.it('should throw if array does not include value', () => {
      assert.throws(() => assert.includes([1, 2, 3], 4), AssertionError);
    });
  });

  // Test string assertions
  TestFramework.describe('String Assertions', () => {
    TestFramework.it('should assert string contains substring', () => {
      assert.contains('hello world', 'world');
    });

    TestFramework.it('should throw if string does not contain substring', () => {
      assert.throws(() => assert.contains('hello', 'world'), AssertionError);
    });

    TestFramework.it('should assert string matches regex', () => {
      assert.matches('hello', /ell/);
    });

    TestFramework.it('should throw if string does not match regex', () => {
      assert.throws(() => assert.matches('hello', /world/), AssertionError);
    });
  });

  // Test throws and throwsAsync
  TestFramework.describe('throws / throwsAsync', () => {
    TestFramework.it('should assert that function throws an error', () => {
      assert.throws(() => { throw new Error('test error') });
      assert.throws(() => { throw new Error('test error') }, 'test');
      assert.throws(() => { throw new Error('test error') }, /error/);
    });

    TestFramework.it('should throw if function does not throw', () => {
      assert.throws(() => assert.throws(() => {}), AssertionError);
    });

    TestFramework.it('should assert that async function throws an error', async () => {
      await assert.throwsAsync(async () => { throw new Error('async error') });
    });

    TestFramework.it('should throw if async function does not throw', async () => {
      await assert.throwsAsync(async () => assert.throwsAsync(async () => {}), AssertionError);
    });
  });

  // Test number comparisons
  TestFramework.describe('Number Comparisons', () => {
    TestFramework.it('should assert greater than', () => {
      assert.greaterThan(5, 3);
    });

    TestFramework.it('should assert less than', () => {
      assert.lessThan(3, 5);
    });

    TestFramework.it('should assert in range', () => {
      assert.inRange(5, 3, 7);
    });
  });

});

// Run the tests
TestFramework.run();
