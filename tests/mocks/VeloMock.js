/**
 * Mock Velo Environment
 *
 * This file provides a mock of the Velo environment for running tests in Node.js.
 * It simulates the Velo $w API as a callable object, which is a more accurate
 * representation of the real Velo API.
 */

class VeloMock {
  constructor() {
    this.dom = {};

    // Bind the context of public methods
    this.createElement = this.createElement.bind(this);

    // Create the callable object for $w
    const w = (selector) => {
      if (this.dom[selector]) {
        return this.dom[selector];
      }

      // Return a generic mock element for selectors that don't exist in our mock DOM.
      // This prevents tests from crashing on selectors for elements we don't care about.
      const mockElement = {
        id: selector.substring(1),
        nonExistent: true,
        _isMock: true,
        _selector: selector,
        onClick: (handler) => { if (handler) handler(); },
        onInput: (handler) => { if (handler) handler(); },
        onChange: (handler) => { if (handler) handler(); },
        updateValidityIndication: () => {},
        resetValidityIndication: () => {},
        show: () => {},
        hide: () => {},
        enable: () => {},
        disable: () => {},
        expand: () => {},
        collapse: () => {},
        src: '',
        text: '',
        value: '',
        checked: false,
        data: [],
        dataset: {},
        onItemReady: (callback) => {
            mockElement.itemReadyCallback = callback;
        },
        _populateRepeater: function(items) {
            this.data = items;
            items.forEach((itemData, index) => {
                const itemScope = {};
                const $item = (itemSelector) => {
                    if (!itemScope[itemSelector]) {
                        itemScope[itemSelector] = {
                            text: '',
                            src: '',
                            value: '',
                        };
                    }
                    return itemScope[itemSelector];
                };
                if (this.itemReadyCallback) {
                    this.itemReadyCallback($item, itemData, index);
                }
            });
        }
      };
      this.dom[selector] = mockElement;
      return mockElement;
    };

    // Attach properties to the function, making it a callable object
    w.onReady = (callback) => {
      // In a test environment, we assume the page is always ready.
      if (callback) {
        callback();
      }
    };

    this.$w = w;
  }

  /**
   * Create a mock DOM element and add it to the DOM
   * @param {string} id - The ID of the element (without the '#')
   * @param {object} properties - The initial properties of the element
   */
  createElement(id, properties = {}) {
    const element = {
      id,
      ...properties,
      onClick: (handler) => {
        if(handler) {
            handler();
        }
      },
       data: [],
       dataset: {},
       onItemReady: (callback) => {
            element.itemReadyCallback = callback;
       },
    };
    this.dom[`#${id}`] = element;
    return element;
  }
}

module.exports = VeloMock;
