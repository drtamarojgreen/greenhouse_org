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
            classList: {
                add: function(cls) { this.className += ` ${cls}`; },
                remove: function(cls) { this.className = this.className.replace(` ${cls}`, ''); },
                contains: function(cls) { return this.className.includes(cls); }
            },
            appendChild: function(child) { this.children.push(child); },
            setAttribute: function(name, value) { this.attributes[name] = value; },
            getAttribute: function(name) { return this.attributes[name]; },
            prepend: function(child) { this.children.unshift(child); }, // Mock prepend
            addEventListener: function(event, handler) {
                if (!this.listeners) this.listeners = new Map();
                let handlers = this.listeners.get(event) || [];
                handlers.push(handler);
                this.listeners.set(event, handlers);
            },
            removeEventListener: () => {},
            querySelector: function(selector) {
                // Simple mock for querySelector within created elements
                for (const child of this.children) {
                    if (child.id === selector.substring(1) || child.getAttribute('data-identifier') === selector.substring(1)) {
                        return child;
                    }
                    // Recursive search for nested elements
                    const found = child.querySelector(selector);
                    if (found) return found;
                }
                return null;
            },
            querySelectorAll: function(selector) {
                const matches = [];
                const traverse = (node) => {
                    if (node.matches && node.matches(selector)) {
                        matches.push(node);
                    }
                    for (const child of node.children) {
                        traverse(child);
                    }
                };
                for (const child of this.children) {
                    traverse(child);
                }
                return matches;
            },
            innerHTML: '',
            remove: () => {},
            matches: function(selector) {
                // Basic matching for ID, class, and data-identifier
                if (selector.startsWith('#')) return this.id === selector.substring(1);
                if (selector.startsWith('.')) return this.className.includes(selector.substring(1));
                if (selector.startsWith('[data-identifier="')) {
                    const attrValue = selector.substring(selector.indexOf('"') + 1, selector.lastIndexOf('"'));
                    return this.getAttribute('data-identifier') === attrValue;
                }
                return this.tagName.toLowerCase() === selector.toLowerCase();
            },
            value: '',
            checked: false,
            name: '',
            type: '',
            required: false,
            closest: function(selector) {
                if (this.matches(selector)) return this;
                // Simple mock for closest, assumes direct parent is form
                if (this.tagName === 'FORM') return this;
                return null;
            }
        };
        return element;
    },
    querySelector: (selector) => {
        if (selector === 'body') return mockDocument.body;
        return null;
    },
    querySelectorAll: (selector) => [],
    createDocumentFragment: () => ({
        children: [],
        appendChild: function(child) { this.children.push(child); },
    })
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
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    },
    fetch: async (url, options) => {
        if (url.includes('/_functions/getAppointmentById/appt123')) {
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
        if (url.includes('/_functions/getServiceTypes')) {
            return {
                ok: true,
                json: async () => [{ _id: 's1', name: 'Service A' }, { _id: 's2', name: 'Service B' }]
            };
        }
        if (url.includes('/_functions/updateAppointment/appt123')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        if (url.includes('/_functions/deleteAppointment/appt123')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ message: 'Not Found' }) };
    },
    confirm: () => true, // Mock confirm dialog
    GreenhouseUtils: {
        displayError: () => {},
        displaySuccess: () => {},
        displayInfo: () => {},
        validateForm: (form, prefix) => {
            // Simple mock validation for testing purposes
            const titleInput = form.querySelector('[data-identifier="admin-app-adminTitle"]');
            return titleInput && titleInput.value !== '';
        },
        validateField: () => true, // Mock as it's not directly called in AdminApp's event handling
    },
    GreenhouseSchedulerUI: {
        buildAdminAppointmentFormUI: (target, appointment, serviceTypes) => {
            const form = mockDocument.createElement('form');
            form.setAttribute('data-identifier', 'admin-appointment-form');
            form.dataset.appointmentId = appointment._id;

            const titleInput = mockDocument.createElement('input');
            titleInput.setAttribute('data-identifier', 'admin-app-adminTitle');
            titleInput.name = 'adminTitle';
            titleInput.value = appointment.title;
            titleInput.required = true;
            form.appendChild(titleInput);

            const confirmedCheckbox = mockDocument.createElement('input');
            confirmedCheckbox.setAttribute('data-identifier', 'admin-app-adminConfirmed');
            confirmedCheckbox.name = 'adminConfirmed';
            confirmedCheckbox.type = 'checkbox';
            confirmedCheckbox.checked = appointment.confirmed;
            form.appendChild(confirmedCheckbox);

            const saveBtn = mockDocument.createElement('button');
            saveBtn.setAttribute('data-action', 'save-changes');
            saveBtn.type = 'submit';
            form.appendChild(saveBtn);

            const deleteBtn = mockDocument.createElement('button');
            deleteBtn.setAttribute('data-action', 'delete-appointment');
            deleteBtn.type = 'button';
            form.appendChild(deleteBtn);

            target.appendChild(form);
            return form;
        }
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.fetch = mockWindow.fetch;
global.console = mockWindow.console;
global.URLSearchParams = mockWindow.URLSearchParams;
global.confirm = mockWindow.confirm;


// Load the actual GreenhouseAdminApp.js content
const fs = require('fs');
const path = require('path');
const adminAppPath = path.resolve(__dirname, '../../../../docs/js/GreenhouseAdminApp.js');
const adminAppCode = fs.readFileSync(adminAppPath, 'utf8');
eval(adminAppCode); // Execute the script in the mocked environment
window.GreenhouseAdminApp = GreenhouseAdminApp; // Expose it globally

function runGreenhouseAdminAppTests() {
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

    console.log('\n--- Running GreenhouseAdminApp Tests ---');

    // Setup mock containers for init
    const mockLeftContainer = mockDocument.createElement('section');
    mockLeftContainer.id = 'greenhouse-app-container-left';

    const mockAdminFormContainer = mockDocument.createElement('div');
    mockAdminFormContainer.setAttribute('data-identifier', 'admin-form-container');
    mockLeftContainer.appendChild(mockAdminFormContainer);

    // Test 1: init function - no appointmentId
    mockWindow.location.search = '';
    GreenhouseAdminApp.init(mockLeftContainer).then(() => {
        assert(mockAdminFormContainer.innerHTML.includes('No appointment ID provided'), 'init displays error when no appointmentId is present');
    }).catch(e => assert(false, `init without appointmentId failed: ${e.message}`));

    // Test 2: init function - with valid appointmentId
    mockWindow.location.search = '?appointmentId=appt123';
    GreenhouseAdminApp.init(mockLeftContainer).then(() => {
        const form = mockAdminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');
        assert(form !== null, 'init builds admin appointment form');
        assert(form.dataset.appointmentId === 'appt123', 'Form has correct appointment ID');
        assert(form.querySelector('[data-identifier="admin-app-adminTitle"]').value === 'Test Appointment', 'Form populates title');
        assert(form.listeners && form.listeners.has('submit'), 'Form has submit listener');
        assert(form.listeners && form.listeners.has('click'), 'Form has click listener');
    }).catch(e => assert(false, `init with appointmentId failed: ${e.message}`));

    // Test 3: handleAction - save-changes (valid)
    mockWindow.location.search = '?appointmentId=appt123';
    GreenhouseAdminApp.init(mockLeftContainer).then(async () => {
        const form = mockAdminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');
        form.querySelector('[data-identifier="admin-app-adminTitle"]').value = 'Updated Title';
        
        let successDisplayed = false;
        mockWindow.GreenhouseUtils.displaySuccess = (msg) => {
            if (msg.includes('updated successfully')) successDisplayed = true;
        };

        await form.listeners.get('submit')[0]({ preventDefault: () => {}, target: form });
        assert(successDisplayed, 'handleAction calls updateAppointment and displays success for valid save');
    }).catch(e => assert(false, `handleAction save-changes (valid) failed: ${e.message}`));

    // Test 4: handleAction - save-changes (invalid)
    mockWindow.location.search = '?appointmentId=appt123';
    GreenhouseAdminApp.init(mockLeftContainer).then(async () => {
        const form = mockAdminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');
        form.querySelector('[data-identifier="admin-app-adminTitle"]').value = ''; // Make invalid
        
        let errorDisplayed = false;
        mockWindow.GreenhouseUtils.displayError = (msg) => {
            if (msg.includes('correct the errors')) errorDisplayed = true;
        };

        await form.listeners.get('submit')[0]({ preventDefault: () => {}, target: form });
        assert(errorDisplayed, 'handleAction displays error for invalid save');
    }).catch(e => assert(false, `handleAction save-changes (invalid) failed: ${e.message}`));

    // Test 5: handleAction - delete-appointment
    mockWindow.location.search = '?appointmentId=appt123';
    GreenhouseAdminApp.init(mockLeftContainer).then(async () => {
        const form = mockAdminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');
        const deleteButton = form.querySelector('[data-action="delete-appointment"]');
        
        let successDisplayed = false;
        mockWindow.GreenhouseUtils.displaySuccess = (msg) => {
            if (msg.includes('deleted successfully')) successDisplayed = true;
        };

        await form.listeners.get('click')[0]({ target: deleteButton });
        assert(successDisplayed, 'handleAction calls deleteAppointment and displays success');
        assert(mockAdminFormContainer.innerHTML.includes('Appointment has been deleted.'), 'Container content updated after deletion');
    }).catch(e => assert(false, `handleAction delete-appointment failed: ${e.message}`));


    console.log(`\n--- GreenhouseAdminApp Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("GreenhouseAdminApp tests failed.");
    }
}

try {
    runGreenhouseAdminAppTests();
    console.log("All GreenhouseAdminApp unit tests passed!");
} catch (error) {
    console.error("GreenhouseAdminApp unit tests failed:", error.message);
    process.exit(1);
}
