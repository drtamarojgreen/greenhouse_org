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
            value: '', // For input/select elements
            checked: false, // For checkbox
            name: '', // For form fields
            type: '', // For form fields
            required: false, // For form fields
            options: [], // For select elements
            add: function(option) { this.options.push(option); }, // For select elements
            matches: function(selector) {
                // Basic matching for ID, class, and data-identifier
                if (selector.startsWith('#')) return this.id === selector.substring(1);
                if (selector.startsWith('.')) return this.className.includes(selector.substring(1));
                if (selector.startsWith('[data-identifier="')) {
                    const attrValue = selector.substring(selector.indexOf('"') + 1, selector.lastIndexOf('"'));
                    return this.getAttribute('data-identifier') === attrValue;
                }
                return this.tagName.toLowerCase() === selector.toLowerCase();
            }
        };
        if (tagName === 'select') {
            element.options = [];
            element.add = function(option) { this.options.push(option); };
        }
        return element;
    },
    querySelector: (selector) => {
        // Basic mock for document.querySelector
        if (selector === 'body') return mockDocument.body;
        return null;
    },
    querySelectorAll: (selector) => [],
    createDocumentFragment: () => ({
        children: [],
        appendChild: function(child) { this.children.push(child); },
        querySelector: function(selector) {
            for (const child of this.children) {
                if (child.id === selector.substring(1) || child.getAttribute('data-identifier') === selector.substring(1)) {
                    return child;
                }
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
    })
};

// Mock window object
const mockWindow = {
    document: mockDocument,
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    },
    GreenhouseUtils: {
        displayError: () => {},
        displaySuccess: () => {},
        displayInfo: () => {},
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.console = mockWindow.console;


// Load the actual schedulerUI.js content
const fs = require('fs');
const path = require('path');
const schedulerUIPath = path.resolve(__dirname, '../../../../docs/js/schedulerUI.js');
const schedulerUICode = fs.readFileSync(schedulerUIPath, 'utf8');
eval(schedulerUICode); // Execute the script in the mocked environment
window.GreenhouseSchedulerUI = GreenhouseSchedulerUI; // Expose it globally

function runSchedulerUITests() {
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

    console.log('\n--- Running GreenhouseSchedulerUI Tests ---');

    // Test 1: buildSchedulerUI
    const mainContainer = GreenhouseSchedulerUI.buildSchedulerUI();
    assert(mainContainer.tagName === 'SECTION', 'buildSchedulerUI creates a SECTION element');
    assert(mainContainer.id === 'greenhouse-app-container', 'buildSchedulerUI sets correct ID');
    assert(mainContainer.className.includes('greenhouse-scheduler-main-container'), 'buildSchedulerUI sets correct class');

    // Test 2: buildPatientFormUI
    const mockTargetPatient = mockDocument.createElement('div');
    const patientFormContainer = GreenhouseSchedulerUI.buildPatientFormUI(mockTargetPatient);
    assert(patientFormContainer !== null, 'buildPatientFormUI returns a container');
    assert(patientFormContainer.id === 'greenhouse-patient-form', 'buildPatientFormUI sets correct ID');
    assert(patientFormContainer.getAttribute('data-identifier') === 'patient-form-container', 'buildPatientFormUI sets correct data-identifier');
    assert(mockTargetPatient.children.includes(patientFormContainer), 'buildPatientFormUI appends to target element');
    assert(patientFormContainer.querySelector('[data-identifier="patient-appointment-form"]') !== null, 'Patient form contains the appointment form');
    assert(patientFormContainer.querySelector('[data-identifier="patient-app-title"]') !== null, 'Patient form contains title input');
    assert(patientFormContainer.querySelector('[data-identifier="patient-app-error-title"]') !== null, 'Patient form contains title error div');
    assert(patientFormContainer.querySelector('[data-identifier="propose-appointment-btn"]') !== null, 'Patient form contains submit button');
    assert(patientFormContainer.querySelector('[data-identifier="loading-spinner"]') !== null, 'Patient form contains loading spinner');

    // Test 3: buildDashboardLeftPanelUI
    const mockTargetDashboardLeft = mockDocument.createElement('div');
    const { scheduleContainer, conflictList, conflictResolutionArea } = GreenhouseSchedulerUI.buildDashboardLeftPanelUI(mockTargetDashboardLeft);
    assert(scheduleContainer !== null, 'buildDashboardLeftPanelUI returns scheduleContainer');
    assert(scheduleContainer.id === 'greenhouse-dashboard-app-schedule-container', 'scheduleContainer has correct ID');
    assert(scheduleContainer.getAttribute('data-identifier') === 'schedule-container', 'scheduleContainer has correct data-identifier');
    assert(conflictList !== null, 'buildDashboardLeftPanelUI returns conflictList');
    assert(conflictList.id === 'greenhouse-dashboard-app-conflict-list', 'conflictList has correct ID');
    assert(conflictList.getAttribute('data-identifier') === 'conflict-list', 'conflictList has correct data-identifier');
    assert(mockTargetDashboardLeft.children.includes(scheduleContainer), 'scheduleContainer appended to target');
    assert(mockTargetDashboardLeft.children.includes(conflictResolutionArea), 'conflictResolutionArea appended to target');

    // Test 4: buildDashboardRightPanelUI
    const mockTargetDashboardRight = mockDocument.createElement('div');
    const { calendarContainer } = GreenhouseSchedulerUI.buildDashboardRightPanelUI(mockTargetDashboardRight);
    assert(calendarContainer !== null, 'buildDashboardRightPanelUI returns calendarContainer');
    assert(calendarContainer.id === 'greenhouse-dashboard-app-calendar-container', 'calendarContainer has correct ID');
    assert(calendarContainer.getAttribute('data-identifier') === 'calendar-container', 'calendarContainer has correct data-identifier');
    assert(mockTargetDashboardRight.children.includes(calendarContainer), 'calendarContainer appended to target');

    // Test 5: buildAdminFormUI
    const mockTargetAdmin = mockDocument.createElement('div');
    const adminFormContainer = GreenhouseSchedulerUI.buildAdminFormUI(mockTargetAdmin);
    assert(adminFormContainer !== null, 'buildAdminFormUI returns a container');
    assert(adminFormContainer.id === 'greenhouse-admin-form', 'buildAdminFormUI sets correct ID');
    assert(adminFormContainer.getAttribute('data-identifier') === 'admin-form-container', 'buildAdminFormUI sets correct data-identifier');
    assert(mockTargetAdmin.children.includes(adminFormContainer), 'buildAdminFormUI appends to target element');
    assert(adminFormContainer.querySelector('[data-identifier="admin-settings-form"]') !== null, 'Admin form contains the settings form');

    // Test 6: createHiddenElements
    const hiddenFragment = GreenhouseSchedulerUI.createHiddenElements();
    assert(hiddenFragment.children.length > 0, 'createHiddenElements creates child elements');
    assert(hiddenFragment.querySelector('[data-identifier="appointment-list"]') !== null, 'Hidden elements include appointment list');
    assert(hiddenFragment.querySelector('[data-identifier="conflict-modal"]') !== null, 'Hidden elements include conflict modal');
    assert(hiddenFragment.querySelector('[data-identifier="conflict-modal-title"]') !== null, 'Conflict modal has title');
    assert(hiddenFragment.querySelector('[data-identifier="conflict-modal-close-btn"]') !== null, 'Conflict modal has close button');

    // Test 7: createInstructionsPanel
    const mockTargetInstructions = mockDocument.createElement('div');
    const instructionsFragment = GreenhouseSchedulerUI.createInstructionsPanel(mockTargetInstructions);
    assert(instructionsFragment !== null, 'createInstructionsPanel returns a fragment');
    assert(mockTargetInstructions.children.length > 0, 'createInstructionsPanel appends to target element');
    assert(mockTargetInstructions.querySelector('.greenhouse-instructions-title') !== null, 'Instructions panel has a title');
    assert(mockTargetInstructions.querySelector('[data-identifier="instructions-list"]') !== null, 'Instructions panel has instructions list');

    // Test 8: buildAdminAppointmentFormUI
    const mockTargetAdminAppt = mockDocument.createElement('div');
    const mockAppointment = {
        _id: 'appt123',
        title: 'Follow-up',
        start: '2025-03-10T10:00:00Z',
        end: '2025-03-10T11:00:00Z',
        platform: 'Zoom',
        serviceRef: 'svc456',
        confirmed: true,
        conflicts: [],
        firstName: 'Jane',
        lastName: 'Doe',
        contactInfo: 'jane.doe@example.com',
        anonymousId: 'anon789'
    };
    const mockServiceTypes = [{ _id: 'svc456', name: 'Therapy' }];
    const adminApptForm = GreenhouseSchedulerUI.buildAdminAppointmentFormUI(mockTargetAdminAppt, mockAppointment, mockServiceTypes);
    assert(adminApptForm !== null, 'buildAdminAppointmentFormUI returns a form');
    assert(adminApptForm.id === 'greenhouse-admin-app-individual-appointment-form', 'Admin appointment form has correct ID');
    assert(adminApptForm.dataset.appointmentId === 'appt123', 'Admin appointment form has correct appointmentId dataset');
    assert(mockTargetAdminAppt.children.includes(adminApptForm), 'Admin appointment form appended to target');
    assert(adminApptForm.querySelector('[data-identifier="admin-app-adminTitle"]').value === 'Follow-up', 'Admin form populates title correctly');
    assert(adminApptForm.querySelector('[data-identifier="admin-app-adminConfirmed"]').checked === true, 'Admin form populates confirmed checkbox correctly');
    assert(adminApptForm.querySelector('[data-identifier="admin-save-btn"]') !== null, 'Admin form has save button');
    assert(adminApptForm.querySelector('[data-identifier="admin-delete-btn"]') !== null, 'Admin form has delete button');


    console.log(`\n--- GreenhouseSchedulerUI Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("GreenhouseSchedulerUI tests failed.");
    }
}

try {
    runSchedulerUITests();
    console.log("All GreenhouseSchedulerUI unit tests passed!");
} catch (error) {
    console.error("GreenhouseSchedulerUI unit tests failed:", error.message);
    process.exit(1);
}
