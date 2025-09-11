// Mocking the DOM for testing purposes
const mockDocument = {
    body: {
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
    },
    createElement: (tagName) => {
        const element = {
            tagName: tagName.toUpperCase(),
            id: '',
            className: '',
            textContent: '',
            style: {},
            dataset: {},
            attributes: {},
            children: [],
            appendChild: function(child) { this.children.push(child); },
            setAttribute: function(name, value) { this.attributes[name] = value; },
            getAttribute: function(name) { return this.attributes[name]; },
            classList: {
                add: function(cls) { this.className += ` ${cls}`; },
                remove: function(cls) { this.className = this.className.replace(` ${cls}`, ''); },
                contains: function(cls) { return this.className.includes(cls); }
            },
            addEventListener: () => {},
            removeEventListener: () => {},
            click: () => {},
            focus: () => {},
            blur: () => {},
            value: '', // For input/select elements
            checked: false, // For checkbox
            name: '', // For form fields
            type: '', // For form fields
            required: false, // For form fields
            trim: function() { return this.value.trim(); } // For form fields
        };
        if (tagName === 'script') {
            element.currentScript = element; // Mock document.currentScript
        }
        return element;
    },
    querySelector: (selector) => {
        if (selector.includes('script[data-script-name="')) {
            // Simulate script already in DOM check
            return null; // For now, assume script is not in DOM
        }
        // Basic mock for other queries, can be extended
        return null;
    },
    querySelectorAll: (selector) => {
        // Basic mock for querySelectorAll
        return [];
    },
    currentScript: {
        getAttribute: (attr) => {
            if (attr === 'data-target-selector-left') return '#mock-left-target';
            if (attr === 'data-target-selector-right') return '#mock-right-target';
            if (attr === 'data-base-url') return 'http://localhost/';
            if (attr === 'data-view') return 'patient';
            return null;
        }
    }
};

// Mock window object
const mockWindow = {
    document: mockDocument,
    location: {
        search: '',
        pathname: '/schedule/'
    },
    URLSearchParams: class {
        constructor(search) {
            this.params = {};
            if (search) {
                search.substring(1).split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    this.params[key] = value;
                });
            }
        }
        get(key) {
            return this.params[key];
        }
    },
    GreenhouseUtils: null, // Will be assigned later
    GreenhouseSchedulerUI: null, // Will be assigned later
    GreenhousePatientApp: null, // Will be assigned later
    GreenhouseAdminApp: null, // Will be assigned later
    GreenhouseDashboardApp: null, // Will be assigned later
    fetch: async (url, options) => {
        // Mock fetch for API calls
        if (url.includes('/_functions/getServices')) {
            return {
                ok: true,
                json: async () => [{ _id: 's1', name: 'Service 1' }, { _id: 's2', name: 'Service 2' }]
            };
        }
        if (url.includes('/_functions/getAppointments')) {
            return {
                ok: true,
                json: async () => []
            };
        }
        if (url.includes('/_functions/proposeAppointment')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        if (url.includes('/_functions/createAppointment')) {
            return {
                ok: true,
                json: async () => ({ success: true, _id: 'newAppt1' })
            };
        }
        if (url.includes('/_functions/updateAppointment')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        if (url.includes('/_functions/deleteAppointment')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        if (url.includes('/_functions/getAppointmentById')) {
            return {
                ok: true,
                json: async () => ({
                    _id: 'appt123',
                    title: 'Test Appointment',
                    start: '2025-12-01T10:00:00Z',
                    end: '2025-12-01T11:00:00Z',
                    platform: 'Zoom',
                    serviceRef: 's1',
                    confirmed: false,
                    conflicts: [],
                    firstName: 'John',
                    lastName: 'Doe',
                    contactInfo: 'john.doe@example.com',
                    anonymousId: 'anon123'
                })
            };
        }
        if (url.includes('/_functions/getConflictsForDateRange')) {
            return {
                ok: true,
                json: async () => []
            };
        }
        if (url.includes('/_functions/getAppointmentsByDateRange')) {
            return {
                ok: true,
                json: async () => []
            };
        }
        if (url.includes('/_functions/getServiceTypes')) {
            return {
                ok: true,
                json: async () => [{ _id: 's1', name: 'Service 1' }, { _id: 's2', name: 'Service 2' }]
            };
        }
        // Mock for loading scripts
        if (url.endsWith('.js')) {
            return {
                ok: true,
                text: async () => `window.${url.split('/').pop().replace('.js', '')} = (function(){ return { init: function(){} }; })();`
            };
        }
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ message: 'Not Found' }) };
    },
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    },
    setTimeout: (fn, delay) => fn(), // Mock setTimeout to execute immediately
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    MutationObserver: class {
        constructor(callback) { this.callback = callback; }
        observe() { this.callback(); } // Trigger immediately for tests
        disconnect() {}
    },
    Date: class extends Date {
        constructor(dateString) {
            if (dateString) {
                return new Date(dateString);
            }
            return new Date('2025-01-01T12:00:00.000Z'); // Fixed date for consistent tests
        }
        static now() {
            return new Date('2025-01-01T12:00:00.000Z').getTime();
        }
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.fetch = mockWindow.fetch;
// global.console = mockWindow.console; // DO NOT MOCK GLOBALLY
global.setTimeout = mockWindow.setTimeout;
global.clearTimeout = mockWindow.clearTimeout;
global.setInterval = mockWindow.setInterval;
global.clearInterval = mockWindow.clearInterval;
global.MutationObserver = mockWindow.MutationObserver;
global.Date = mockWindow.Date;
global.URLSearchParams = mockWindow.URLSearchParams;


// Load the actual GreenhouseUtils.js content
const fs = require('fs');
const path = require('path');
const greenhouseUtilsPath = path.resolve(__dirname, '../../../../../docs/js/GreenhouseUtils.js');
const greenhouseUtilsCode = fs.readFileSync(greenhouseUtilsPath, 'utf8');
eval(greenhouseUtilsCode); // Execute the script in the mocked environment

function runGreenhouseUtilsTests() {
    const GreenhouseUtils = window.GreenhouseUtils;
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            passed++;
            console.log(`PASS: ${message}`);
        } else {
            failed++;
            console.error(`FAIL: ${message}`);
        }
    }

    console.log('\n--- Running GreenhouseUtils Tests ---');

    // Test 1: displayMessage (smoke test for function existence and basic call)
    try {
        GreenhouseUtils.displayInfo('Test info message');
        assert(true, 'displayInfo does not throw an error');
    } catch (e) {
        assert(false, `displayInfo threw an error: ${e.message}`);
    }

    // Test 2: waitForElement - element found immediately
    const mockElement = mockDocument.createElement('div');
    mockElement.id = 'test-element';
    mockDocument.querySelector = (selector) => {
        if (selector === '#test-element') return mockElement;
        return null;
    };
    GreenhouseUtils.waitForElement('#test-element')
        .then(el => assert(el === mockElement, 'waitForElement resolves when element exists immediately'))
        .catch(e => assert(false, `waitForElement failed: ${e.message}`));

    // Test 3: waitForElement - element found via MutationObserver (mocked to trigger immediately)
    mockDocument.querySelector = (selector) => null; // Reset
    GreenhouseUtils.waitForElement('#new-element')
        .then(el => assert(el !== null, 'waitForElement resolves via MutationObserver'))
        .catch(e => assert(false, `waitForElement failed via observer: ${e.message}`));

    // Test 4: validateConfiguration - valid config
    mockWindow.document.currentScript.getAttribute = (attr) => {
        if (attr === 'data-target-selector-left') return '#left';
        if (attr === 'data-base-url') return 'http://base/';
        if (attr === 'data-view') return 'patient';
        return null;
    };
    assert(GreenhouseUtils.validateConfiguration(), 'validateConfiguration returns true for valid patient config');
    assert(GreenhouseUtils.appState.baseUrl === 'http://base/', 'validateConfiguration sets baseUrl correctly');

    // Test 5: validateConfiguration - missing base URL
    mockWindow.document.currentScript.getAttribute = (attr) => {
        if (attr === 'data-target-selector-left') return '#left';
        if (attr === 'data-view') return 'patient';
        return null;
    };
    assert(!GreenhouseUtils.validateConfiguration(), 'validateConfiguration returns false for missing base URL');

    // Test 6: loadScript - successful load
    let scriptLoaded = false;
    mockDocument.body.appendChild = (el) => {
        if (el.tagName === 'SCRIPT' && el.dataset.scriptName === 'test-script.js') {
            scriptLoaded = true;
        }
    };
    GreenhouseUtils.loadScript('test-script.js', 'http://localhost/')
        .then(() => assert(scriptLoaded, 'loadScript successfully appends script to body'))
        .catch(e => assert(false, `loadScript failed: ${e.message}`));

    // Test 7: validateField - required field empty
    const mockField1 = mockDocument.createElement('input');
    mockField1.name = 'testField1';
    mockField1.required = true;
    mockField1.value = '';
    const mockErrorEl1 = mockDocument.createElement('div');
    assert(!GreenhouseUtils.validateField(mockField1, mockErrorEl1), 'validateField returns false for empty required field');
    assert(mockErrorEl1.textContent.includes('required'), 'validateField sets error message for empty required field');

    // Test 8: validateField - valid required field
    const mockField2 = mockDocument.createElement('input');
    mockField2.name = 'testField2';
    mockField2.required = true;
    mockField2.value = 'some value';
    const mockErrorEl2 = mockDocument.createElement('div');
    assert(GreenhouseUtils.validateField(mockField2, mockErrorEl2), 'validateField returns true for valid required field');
    assert(mockErrorEl2.classList.contains('greenhouse-hidden'), 'validateField hides error for valid field');

    // Test 9: validateField - invalid date (past date)
    const mockField3 = mockDocument.createElement('input');
    mockField3.name = 'dateField';
    mockField3.type = 'date';
    mockField3.required = true;
    mockField3.value = '2024-01-01'; // Past date
    const mockErrorEl3 = mockDocument.createElement('div');
    assert(!GreenhouseUtils.validateField(mockField3, mockErrorEl3), 'validateField returns false for past date');
    assert(mockErrorEl3.textContent.includes('future date'), 'validateField sets error message for past date');

    // Test 10: validateField - valid date (future date)
    const mockField4 = mockDocument.createElement('input');
    mockField4.name = 'dateField';
    mockField4.type = 'date';
    mockField4.required = true;
    mockField4.value = '2026-01-01'; // Future date
    const mockErrorEl4 = mockDocument.createElement('div');
    assert(GreenhouseUtils.validateField(mockField4, mockErrorEl4), 'validateField returns true for future date');

    // Test 11: validateField - invalid time format
    const mockField5 = mockDocument.createElement('input');
    mockField5.name = 'timeField';
    mockField5.type = 'time';
    mockField5.required = true;
    mockField5.value = '25:00'; // Invalid time
    const mockErrorEl5 = mockDocument.createElement('div');
    assert(!GreenhouseUtils.validateField(mockField5, mockErrorEl5), 'validateField returns false for invalid time format');
    assert(mockErrorEl5.textContent.includes('valid time'), 'validateField sets error message for invalid time format');

    // Test 12: validateField - valid time format
    const mockField6 = mockDocument.createElement('input');
    mockField6.name = 'timeField';
    mockField6.type = 'time';
    mockField6.required = true;
    mockField6.value = '14:30'; // Valid time
    const mockErrorEl6 = mockDocument.createElement('div');
    assert(GreenhouseUtils.validateField(mockField6, mockErrorEl6), 'validateField returns true for valid time format');

    // Test 13: validateForm - all fields valid
    const mockForm1 = mockDocument.createElement('form');
    const input1 = mockDocument.createElement('input');
    input1.name = 'field1'; input1.required = true; input1.value = 'val1';
    const error1 = mockDocument.createElement('div'); error1.setAttribute('data-identifier', 'test-error-field1');
    mockForm1.appendChild(input1); mockForm1.appendChild(error1);

    const input2 = mockDocument.createElement('input');
    input2.name = 'field2'; input2.required = true; input2.value = 'val2';
    const error2 = mockDocument.createElement('div'); error2.setAttribute('data-identifier', 'test-error-field2');
    mockForm1.appendChild(input2); mockForm1.appendChild(error2);

    mockForm1.querySelectorAll = (selector) => {
        if (selector === 'input[required], select[required]') return [input1, input2];
        if (selector === '[data-identifier="test-error-field1"]') return error1;
        if (selector === '[data-identifier="test-error-field2"]') return error2;
        return [];
    };
    assert(GreenhouseUtils.validateForm(mockForm1, 'test-error-'), 'validateForm returns true for a valid form');

    // Test 14: validateForm - one field invalid
    const mockForm2 = mockDocument.createElement('form');
    const input3 = mockDocument.createElement('input');
    input3.name = 'field3'; input3.required = true; input3.value = ''; // Invalid
    const error3 = mockDocument.createElement('div'); error3.setAttribute('data-identifier', 'test-error-field3');
    mockForm2.appendChild(input3); error3.classList.add('greenhouse-hidden'); mockForm2.appendChild(error3);

    const input4 = mockDocument.createElement('input');
    input4.name = 'field4'; input4.required = true; input4.value = 'val4';
    const error4 = mockDocument.createElement('div'); error4.setAttribute('data-identifier', 'test-error-field4');
    mockForm2.appendChild(input4); error4.classList.add('greenhouse-hidden'); mockForm2.appendChild(error4);

    mockForm2.querySelectorAll = (selector) => {
        if (selector === 'input[required], select[required]') return [input3, input4];
        if (selector === '[data-identifier="test-error-field3"]') return error3;
        if (selector === '[data-identifier="test-error-field4"]') return error4;
        return [];
    };
    assert(!GreenhouseUtils.validateForm(mockForm2, 'test-error-'), 'validateForm returns false for an invalid form');
    assert(!error3.classList.contains('greenhouse-hidden'), 'validateForm shows error for invalid field');


    console.log(`\n--- GreenhouseUtils Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("GreenhouseUtils tests failed.");
    }
}

try {
    runGreenhouseUtilsTests();
    console.log("All GreenhouseUtils unit tests passed!");
} catch (error) {
    console.error("GreenhouseUtils unit tests failed:", error.message);
    throw error;
}
