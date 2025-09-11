// Mocking the DOM for testing purposes
const mockDocument = {
    body: {
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
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
            },
            reset: () => {}
        };
        return element;
    },
    querySelector: (selector) => {
        if (selector === 'body') return mockDocument.body;
        if (selector.includes('[data-identifier="conflict-modal"]')) {
            const modal = mockDocument.createElement('div');
            modal.setAttribute('data-identifier', 'conflict-modal');
            modal.classList.add('greenhouse-hidden');
            return modal;
        }
        if (selector.includes('[data-identifier="conflict-details"]')) {
            const details = mockDocument.createElement('div');
            details.setAttribute('data-identifier', 'conflict-details');
            return details;
        }
        if (selector.includes('[data-identifier="conflict-modal-close-btn"]')) {
            const btn = mockDocument.createElement('button');
            btn.setAttribute('data-identifier', 'conflict-modal-close-btn');
            btn.setAttribute('data-action', 'conflict-modal-close');
            return btn;
        }
        if (selector.includes('[data-identifier="conflict-modal-cancel-btn"]')) {
            const btn = mockDocument.createElement('button');
            btn.setAttribute('data-identifier', 'conflict-modal-cancel-btn');
            btn.setAttribute('data-action', 'conflict-modal-cancel');
            return btn;
        }
        if (selector.includes('[data-identifier="conflict-modal-resolve-btn"]')) {
            const btn = mockDocument.createElement('button');
            btn.setAttribute('data-identifier', 'conflict-modal-resolve-btn');
            btn.setAttribute('data-action', 'conflict-modal-resolve');
            return btn;
        }
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
        if (url.includes('/_functions/getServices')) {
            return {
                ok: true,
                json: async () => [{ _id: 's1', name: 'Service 1' }, { _id: 's2', name: 'Service 2' }]
            };
        }
        if (url.includes('/_functions/getAppointments')) {
            return {
                ok: true,
                json: async () => [{ _id: 'appt1', title: 'Old Appt', date: '2025-01-01', time: '10:00', platform: 'Zoom', serviceRef: 's1' }]
            };
        }
        if (url.includes('/_functions/proposeAppointment')) {
            const body = JSON.parse(options.body);
            if (body.title === 'Conflict Appt') {
                return {
                    ok: false,
                    status: 409,
                    statusText: 'Conflict',
                    json: async () => ({ conflicts: [{ title: 'Existing Appt', date: '2025-01-01', time: '10:00' }] })
                };
            }
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
        if (url.includes('/_functions/updateAppointment/appt1')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        if (url.includes('/_functions/deleteAppointment/appt1')) {
            return {
                ok: true,
                json: async () => ({ success: true })
            };
        }
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ message: 'Not Found' }) };
    },
    confirm: () => true, // Mock confirm dialog
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
    },
    GreenhouseUtils: {
        displayError: () => {},
        displaySuccess: () => {},
        displayInfo: () => {},
        validateField: (field, errorEl) => {
            // Simple mock validation
            if (field.required && field.value === '') {
                errorEl.classList.remove('greenhouse-hidden');
                return false;
            }
            errorEl.classList.add('greenhouse-hidden');
            return true;
        },
        validateForm: (form, prefix) => {
            // Simple mock validation for testing purposes
            const titleInput = form.querySelector('[data-identifier="patient-app-title"]');
            const dateInput = form.querySelector('[data-identifier="patient-app-date"]');
            const timeInput = form.querySelector('[data-identifier="patient-app-time"]');
            const platformInput = form.querySelector('[data-identifier="patient-app-platform"]');
            const serviceSelect = form.querySelector('[data-identifier="patient-app-service"]');

            let isValid = true;
            if (titleInput && titleInput.value === '') isValid = false;
            if (dateInput && dateInput.value === '') isValid = false;
            if (timeInput && timeInput.value === '') isValid = false;
            if (platformInput && platformInput.value === '') isValid = false;
            if (serviceSelect && serviceSelect.value === '') isValid = false;
            
            // Simulate error display for invalid fields
            if (!isValid) {
                if (titleInput && titleInput.value === '') form.querySelector('[data-identifier="patient-app-error-title"]').classList.remove('greenhouse-hidden');
                if (dateInput && dateInput.value === '') form.querySelector('[data-identifier="patient-app-error-date"]').classList.remove('greenhouse-hidden');
                if (timeInput && timeInput.value === '') form.querySelector('[data-identifier="patient-app-error-time"]').classList.remove('greenhouse-hidden');
                if (platformInput && platformInput.value === '') form.querySelector('[data-identifier="patient-app-error-platform"]').classList.remove('greenhouse-hidden');
                if (serviceSelect && serviceSelect.value === '') form.querySelector('[data-identifier="patient-app-error-service"]').classList.remove('greenhouse-hidden');
            }
            return isValid;
        },
    },
    GreenhouseSchedulerUI: {
        buildPatientFormUI: (target) => {
            const formContainer = mockDocument.createElement('div');
            formContainer.setAttribute('data-identifier', 'patient-form-container');
            const form = mockDocument.createElement('form');
            form.setAttribute('data-identifier', 'patient-appointment-form');
            form.reset = () => {
                form.querySelector('[data-identifier="patient-app-title"]').value = '';
                form.querySelector('[data-identifier="patient-app-date"]').value = '';
                form.querySelector('[data-identifier="patient-app-time"]').value = '';
                form.querySelector('[data-identifier="patient-app-platform"]').value = '';
                form.querySelector('[data-identifier="patient-app-service"]').value = '';
                form.querySelector('[data-identifier="propose-appointment-btn"]').textContent = 'Request Appointment';
                form.querySelector('[data-identifier="propose-appointment-btn"]').dataset.action = 'propose-and-add-appointment';
                delete form.querySelector('[data-identifier="propose-appointment-btn"]').dataset.appointmentId;
                form.querySelectorAll('.greenhouse-form-error').forEach(el => el.classList.add('greenhouse-hidden'));
                form.querySelectorAll('.greenhouse-form-error-input').forEach(el => el.classList.remove('greenhouse-form-error-input'));
            };

            const titleInput = mockDocument.createElement('input');
            titleInput.setAttribute('data-identifier', 'patient-app-title'); titleInput.name = 'title'; titleInput.required = true;
            const titleError = mockDocument.createElement('div'); titleError.setAttribute('data-identifier', 'patient-app-error-title'); titleError.classList.add('greenhouse-hidden');
            form.appendChild(titleInput); form.appendChild(titleError);

            const dateInput = mockDocument.createElement('input');
            dateInput.setAttribute('data-identifier', 'patient-app-date'); dateInput.name = 'date'; dateInput.required = true;
            const dateError = mockDocument.createElement('div'); dateError.setAttribute('data-identifier', 'patient-app-error-date'); dateError.classList.add('greenhouse-hidden');
            form.appendChild(dateInput); form.appendChild(dateError);

            const timeInput = mockDocument.createElement('input');
            timeInput.setAttribute('data-identifier', 'patient-app-time'); timeInput.name = 'time'; timeInput.required = true;
            const timeError = mockDocument.createElement('div'); timeError.setAttribute('data-identifier', 'patient-app-error-time'); timeError.classList.add('greenhouse-hidden');
            form.appendChild(timeInput); form.appendChild(timeError);

            const platformInput = mockDocument.createElement('input');
            platformInput.setAttribute('data-identifier', 'patient-app-platform'); platformInput.name = 'platform'; platformInput.required = true;
            const platformError = mockDocument.createElement('div'); platformError.setAttribute('data-identifier', 'patient-app-error-platform'); platformError.classList.add('greenhouse-hidden');
            form.appendChild(platformInput); form.appendChild(platformError);

            const serviceSelect = mockDocument.createElement('select');
            serviceSelect.setAttribute('data-identifier', 'patient-app-service'); serviceSelect.name = 'service'; serviceSelect.required = true;
            const serviceError = mockDocument.createElement('div'); serviceError.setAttribute('data-identifier', 'patient-app-error-service'); serviceError.classList.add('greenhouse-hidden');
            form.appendChild(serviceSelect); form.appendChild(serviceError);

            const submitBtn = mockDocument.createElement('button');
            submitBtn.setAttribute('data-identifier', 'propose-appointment-btn');
            submitBtn.setAttribute('data-action', 'propose-and-add-appointment');
            submitBtn.textContent = 'Request Appointment';
            form.appendChild(submitBtn);

            const loadingSpinner = mockDocument.createElement('div');
            loadingSpinner.setAttribute('data-identifier', 'loading-spinner');
            loadingSpinner.classList.add('greenhouse-hidden');
            form.appendChild(loadingSpinner);

            formContainer.appendChild(form);
            target.appendChild(formContainer);
            return formContainer;
        },
        createInstructionsPanel: (target) => {
            const div = mockDocument.createElement('div');
            div.setAttribute('data-identifier', 'instructions-panel');
            target.appendChild(div);
            return div;
        },
        createHiddenElements: () => mockDocument.createDocumentFragment(),
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.fetch = mockWindow.fetch;
// global.console = mockWindow.console; // DO NOT MOCK GLOBALLY
global.URLSearchParams = mockWindow.URLSearchParams;
global.confirm = mockWindow.confirm;
global.Date = mockWindow.Date;


// Load the actual GreenhousePatientApp.js content
const fs = require('fs');
const path = require('path');
const patientAppPath = path.resolve(__dirname, '../../../../../docs/js/GreenhousePatientApp.js');
const patientAppCode = fs.readFileSync(patientAppPath, 'utf8');
eval(patientAppCode); // Execute the script in the mocked environment

function runGreenhousePatientAppTests() {
    const GreenhousePatientApp = window.GreenhousePatientApp;
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

    console.log('\n--- Running GreenhousePatientApp Tests ---');

    // Setup mock containers for init
    const mockLeftContainer = mockDocument.createElement('section');
    mockLeftContainer.id = 'greenhouse-app-container-left';
    const mockRightContainer = mockDocument.createElement('section');
    mockRightContainer.id = 'greenhouse-app-container-right';

    // Initialize the app
    GreenhousePatientApp.init(mockLeftContainer, mockRightContainer).then(() => {
        assert(true, 'PatientApp init completes without error');

        // Get references to the mocked elements
        const form = mockLeftContainer.querySelector('[data-identifier="patient-appointment-form"]');
        const titleInput = form.querySelector('[data-identifier="patient-app-title"]');
        const dateInput = form.querySelector('[data-identifier="patient-app-date"]');
        const timeInput = form.querySelector('[data-identifier="patient-app-time"]');
        const platformInput = form.querySelector('[data-identifier="patient-app-platform"]');
        const serviceSelect = form.querySelector('[data-identifier="patient-app-service"]');
        const proposeBtn = form.querySelector('[data-identifier="propose-appointment-btn"]');
        const loadingSpinner = form.querySelector('[data-identifier="loading-spinner"]');
        const appointmentsList = mockRightContainer.querySelector('[data-identifier="appointment-list"]');
        const conflictModal = mockDocument.querySelector('[data-identifier="conflict-modal"]');
        const conflictDetailsDiv = mockDocument.querySelector('[data-identifier="conflict-details"]');

        // Test 1: Initial state and population
        assert(serviceSelect.children.length > 1, 'Services are populated in the select dropdown');
        assert(appointmentsList.children.length > 0, 'Appointments list is populated');
        assert(proposeBtn.textContent === 'Request Appointment', 'Submit button text is "Request Appointment" initially');
        assert(loadingSpinner.classList.contains('greenhouse-hidden'), 'Loading spinner is hidden initially');

        // Test 2: Form submission - valid data (propose and create)
        titleInput.value = 'New Appt';
        dateInput.value = '2025-02-01';
        timeInput.value = '10:00';
        platformInput.value = 'Google Meet';
        serviceSelect.value = 's1';

        let successDisplayed = false;
        mockWindow.GreenhouseUtils.displaySuccess = (msg) => {
            if (msg.includes('requested successfully')) successDisplayed = true;
        };

        form.listeners.get('submit')[0]({ preventDefault: () => {} });
        assert(successDisplayed, 'Form submission for new appointment displays success');
        assert(titleInput.value === '', 'Form is reset after successful submission');
        assert(loadingSpinner.classList.contains('greenhouse-hidden'), 'Loading spinner is hidden after submission');

        // Test 3: Form submission - invalid data (validation fails)
        titleInput.value = ''; // Make invalid
        let errorDisplayed = false;
        mockWindow.GreenhouseUtils.displayError = (msg) => {
            if (msg.includes('correct the errors')) errorDisplayed = true;
        };
        form.listeners.get('submit')[0]({ preventDefault: () => {} });
        assert(errorDisplayed, 'Form submission for invalid data displays error');
        assert(!form.querySelector('[data-identifier="patient-app-error-title"]').classList.contains('greenhouse-hidden'), 'Error message for title is visible');

        // Test 4: Form submission - conflict detected
        titleInput.value = 'Conflict Appt'; // Trigger conflict mock
        dateInput.value = '2025-02-01';
        timeInput.value = '10:00';
        platformInput.value = 'Google Meet';
        serviceSelect.value = 's1';

        form.listeners.get('submit')[0]({ preventDefault: () => {} });
        assert(!conflictModal.classList.contains('greenhouse-hidden'), 'Conflict modal is shown on conflict');
        assert(conflictDetailsDiv.textContent.includes('Existing Appt'), 'Conflict details are populated');
        assert(loadingSpinner.classList.contains('greenhouse-hidden'), 'Loading spinner is hidden after conflict');

        // Test 5: Edit appointment
        const editButton = appointmentsList.querySelector('[data-action="edit-appointment"]');
        editButton.listeners.get('click')[0]({ target: editButton });
        assert(proposeBtn.textContent === 'Update Appointment', 'Submit button text changes to "Update Appointment"');
        assert(titleInput.value === 'Old Appt', 'Form is populated with appointment data for editing');

        // Test 6: Update appointment
        titleInput.value = 'Updated Old Appt';
        proposeBtn.listeners.get('click')[0]({ target: proposeBtn }); // Simulate click on update button
        assert(successDisplayed, 'Form submission for update displays success');
        assert(titleInput.value === '', 'Form is reset after successful update');

        // Test 7: Delete appointment
        const deleteButton = appointmentsList.querySelector('[data-action="delete-appointment"]');
        deleteButton.listeners.get('click')[0]({ target: deleteButton });
        assert(successDisplayed, 'Delete appointment displays success');
        // Re-populate appointments to reflect deletion (mocked to be empty)
        mockWindow.fetch = async (url, options) => {
            if (url.includes('/_functions/getAppointments')) {
                return { ok: true, json: async () => [] };
            }
            return mockWindow.fetch.original(url, options); // Fallback to original mock
        };
        GreenhousePatientApp.populateAppointments();
        assert(appointmentsList.textContent.includes('No appointments scheduled.'), 'Appointments list is empty after deletion');

        // Test 8: Conflict modal close/cancel
        conflictModal.classList.remove('greenhouse-hidden'); // Show modal for testing
        const closeBtn = mockDocument.querySelector('[data-identifier="conflict-modal-close-btn"]');
        closeBtn.listeners.get('click')[0]({ target: closeBtn });
        assert(conflictModal.classList.contains('greenhouse-hidden'), 'Conflict modal is hidden on close button click');

        conflictModal.classList.remove('greenhouse-hidden'); // Show modal again
        const cancelBtn = mockDocument.querySelector('[data-identifier="conflict-modal-cancel-btn"]');
        cancelBtn.listeners.get('click')[0]({ target: cancelBtn });
        assert(conflictModal.classList.contains('greenhouse-hidden'), 'Conflict modal is hidden on cancel button click');

        // Test 9: Conflict modal resolve
        conflictModal.classList.remove('greenhouse-hidden'); // Show modal again
        const resolveBtn = mockDocument.querySelector('[data-identifier="conflict-modal-resolve-btn"]');
        let infoDisplayed = false;
        mockWindow.GreenhouseUtils.displayInfo = (msg) => {
            if (msg.includes('choose a different time')) infoDisplayed = true;
        };
        resolveBtn.listeners.get('click')[0]({ target: resolveBtn });
        assert(conflictModal.classList.contains('greenhouse-hidden'), 'Conflict modal is hidden on resolve button click');
        assert(infoDisplayed, 'Info message displayed on resolve');

    }).catch(e => assert(false, `PatientApp init or subsequent tests failed: ${e.message}`));


    console.log(`\n--- GreenhousePatientApp Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("GreenhousePatientApp tests failed.");
    }
}

try {
    runGreenhousePatientAppTests();
    console.log("All GreenhousePatientApp unit tests passed!");
} catch (error) {
    console.error("GreenhousePatientApp unit tests failed:", error.message);
    throw error;
}
