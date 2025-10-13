/**
 * Custom Assertion Library
 * 
 * Provides assertion functions for testing without external dependencies.
 * Includes assertions for values, types, DOM elements, and async operations.
 */

class AssertionError extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

const assert = {
  /**
   * Assert that a value is truthy
   */
  isTrue(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new AssertionError(message, true, value);
    }
  },

  /**
   * Assert that a value is falsy
   */
  isFalse(value, message = 'Expected value to be falsy') {
    if (value) {
      throw new AssertionError(message, false, value);
    }
  },

  /**
   * Assert strict equality
   */
  equal(actual, expected, message) {
    if (actual !== expected) {
      const msg = message || `Expected ${actual} to equal ${expected}`;
      throw new AssertionError(msg, expected, actual);
    }
  },

  /**
   * Assert strict inequality
   */
  notEqual(actual, expected, message) {
    if (actual === expected) {
      const msg = message || `Expected ${actual} to not equal ${expected}`;
      throw new AssertionError(msg, `not ${expected}`, actual);
    }
  },

  /**
   * Assert deep equality for objects and arrays
   */
  deepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
      const msg = message || `Expected ${actualStr} to deep equal ${expectedStr}`;
      throw new AssertionError(msg, expected, actual);
    }
  },

  /**
   * Assert that a value is null
   */
  isNull(value, message = 'Expected value to be null') {
    if (value !== null) {
      throw new AssertionError(message, null, value);
    }
  },

  /**
   * Assert that a value is not null
   */
  isNotNull(value, message = 'Expected value to not be null') {
    if (value === null) {
      throw new AssertionError(message, 'not null', value);
    }
  },

  /**
   * Assert that a value is undefined
   */
  isUndefined(value, message = 'Expected value to be undefined') {
    if (value !== undefined) {
      throw new AssertionError(message, undefined, value);
    }
  },

  /**
   * Assert that a value is not undefined
   */
  isDefined(value, message = 'Expected value to be defined') {
    if (value === undefined) {
      throw new AssertionError(message, 'defined', value);
    }
  },

  /**
   * Assert type of value
   */
  isType(value, type, message) {
    const actualType = typeof value;
    if (actualType !== type) {
      const msg = message || `Expected type ${type} but got ${actualType}`;
      throw new AssertionError(msg, type, actualType);
    }
  },

  /**
   * Assert that value is a string
   */
  isString(value, message = 'Expected value to be a string') {
    this.isType(value, 'string', message);
  },

  /**
   * Assert that value is a number
   */
  isNumber(value, message = 'Expected value to be a number') {
    this.isType(value, 'number', message);
  },

  /**
   * Assert that value is a boolean
   */
  isBoolean(value, message = 'Expected value to be a boolean') {
    this.isType(value, 'boolean', message);
  },

  /**
   * Assert that value is a function
   */
  isFunction(value, message = 'Expected value to be a function') {
    this.isType(value, 'function', message);
  },

  /**
   * Assert that value is an object
   */
  isObject(value, message = 'Expected value to be an object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new AssertionError(message, 'object', typeof value);
    }
  },

  /**
   * Assert that value is an array
   */
  isArray(value, message = 'Expected value to be an array') {
    if (!Array.isArray(value)) {
      throw new AssertionError(message, 'array', typeof value);
    }
  },

  /**
   * Assert that array has specific length
   */
  hasLength(array, length, message) {
    if (!Array.isArray(array)) {
      throw new AssertionError('Value is not an array', 'array', typeof array);
    }
    if (array.length !== length) {
      const msg = message || `Expected array length ${length} but got ${array.length}`;
      throw new AssertionError(msg, length, array.length);
    }
  },

  /**
   * Assert that array includes value
   */
  includes(array, value, message) {
    if (!Array.isArray(array)) {
      throw new AssertionError('Value is not an array', 'array', typeof array);
    }
    if (!array.includes(value)) {
      const msg = message || `Expected array to include ${value}`;
      throw new AssertionError(msg, `includes ${value}`, array);
    }
  },

  /**
   * Assert that string contains substring
   */
  contains(string, substring, message) {
    if (typeof string !== 'string') {
      throw new AssertionError('Value is not a string', 'string', typeof string);
    }
    if (!string.includes(substring)) {
      const msg = message || `Expected "${string}" to contain "${substring}"`;
      throw new AssertionError(msg, `contains "${substring}"`, string);
    }
  },

  /**
   * Assert that string matches regex
   */
  matches(string, regex, message) {
    if (typeof string !== 'string') {
      throw new AssertionError('Value is not a string', 'string', typeof string);
    }
    if (!regex.test(string)) {
      const msg = message || `Expected "${string}" to match ${regex}`;
      throw new AssertionError(msg, `matches ${regex}`, string);
    }
  },

  /**
   * Assert that function throws an error
   */
  throws(fn, expectedError, message) {
    let thrown = false;
    let actualError = null;

    try {
      fn();
    } catch (error) {
      thrown = true;
      actualError = error;
    }

    if (!thrown) {
      const msg = message || 'Expected function to throw an error';
      throw new AssertionError(msg, 'error thrown', 'no error');
    }

    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (!actualError.message.includes(expectedError)) {
          const msg = message || `Expected error message to include "${expectedError}"`;
          throw new AssertionError(msg, expectedError, actualError.message);
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(actualError.message)) {
          const msg = message || `Expected error message to match ${expectedError}`;
          throw new AssertionError(msg, expectedError, actualError.message);
        }
      }
    }
  },

  /**
   * Assert that async function throws an error
   */
  async throwsAsync(fn, expectedError, message) {
    let thrown = false;
    let actualError = null;

    try {
      await fn();
    } catch (error) {
      thrown = true;
      actualError = error;
    }

    if (!thrown) {
      const msg = message || 'Expected async function to throw an error';
      throw new AssertionError(msg, 'error thrown', 'no error');
    }

    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (!actualError.message.includes(expectedError)) {
          const msg = message || `Expected error message to include "${expectedError}"`;
          throw new AssertionError(msg, expectedError, actualError.message);
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(actualError.message)) {
          const msg = message || `Expected error message to match ${expectedError}`;
          throw new AssertionError(msg, expectedError, actualError.message);
        }
      }
    }
  },

  /**
   * Assert that DOM element exists
   */
  elementExists(selector, message) {
    const element = document.querySelector(selector);
    if (!element) {
      const msg = message || `Expected element "${selector}" to exist`;
      throw new AssertionError(msg, 'element exists', 'element not found');
    }
    return element;
  },

  /**
   * Assert that DOM element has class
   */
  hasClass(element, className, message) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      throw new AssertionError('Element not found', 'element', null);
    }
    if (!element.classList.contains(className)) {
      const msg = message || `Expected element to have class "${className}"`;
      throw new AssertionError(msg, className, element.className);
    }
  },

  /**
   * Assert that DOM element has attribute
   */
  hasAttribute(element, attribute, value, message) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      throw new AssertionError('Element not found', 'element', null);
    }
    if (!element.hasAttribute(attribute)) {
      const msg = message || `Expected element to have attribute "${attribute}"`;
      throw new AssertionError(msg, attribute, 'attribute not found');
    }
    if (value !== undefined) {
      const actualValue = element.getAttribute(attribute);
      if (actualValue !== value) {
        const msg = message || `Expected attribute "${attribute}" to be "${value}"`;
        throw new AssertionError(msg, value, actualValue);
      }
    }
  },

  /**
   * Assert that DOM element has text content
   */
  hasText(element, text, message) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      throw new AssertionError('Element not found', 'element', null);
    }
    const actualText = element.textContent.trim();
    if (!actualText.includes(text)) {
      const msg = message || `Expected element to contain text "${text}"`;
      throw new AssertionError(msg, text, actualText);
    }
  },

  /**
   * Assert that DOM element is visible
   */
  isVisible(element, message) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      throw new AssertionError('Element not found', 'element', null);
    }
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0';
    if (!isVisible) {
      const msg = message || 'Expected element to be visible';
      throw new AssertionError(msg, 'visible', 'hidden');
    }
  },

  /**
   * Assert that DOM element is hidden
   */
  isHidden(element, message) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) {
      throw new AssertionError('Element not found', 'element', null);
    }
    const style = window.getComputedStyle(element);
    const isHidden = style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.opacity === '0';
    if (!isHidden) {
      const msg = message || 'Expected element to be hidden';
      throw new AssertionError(msg, 'hidden', 'visible');
    }
  },

  /**
   * Assert that value is greater than
   */
  greaterThan(actual, expected, message) {
    if (actual <= expected) {
      const msg = message || `Expected ${actual} to be greater than ${expected}`;
      throw new AssertionError(msg, `> ${expected}`, actual);
    }
  },

  /**
   * Assert that value is less than
   */
  lessThan(actual, expected, message) {
    if (actual >= expected) {
      const msg = message || `Expected ${actual} to be less than ${expected}`;
      throw new AssertionError(msg, `< ${expected}`, actual);
    }
  },

  /**
   * Assert that value is within range
   */
  inRange(value, min, max, message) {
    if (value < min || value > max) {
      const msg = message || `Expected ${value} to be between ${min} and ${max}`;
      throw new AssertionError(msg, `${min}-${max}`, value);
    }
  }
};

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { assert, AssertionError };
}

// Make available globally
window.assert = assert;
window.AssertionError = AssertionError;

console.log('[Assertion Library] Custom assertion library loaded');
