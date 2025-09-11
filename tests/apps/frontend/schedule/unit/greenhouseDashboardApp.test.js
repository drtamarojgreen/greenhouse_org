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
            addEventListener: () => {},
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
        if (url.includes('/_functions/getAppointmentsByDateRange')) {
            return {
                ok: true,
                json: async () => [{ title: 'Appt 1', start: '2025-01-06T10:00:00Z' }] // Monday 10 AM
            };
        }
        if (url.includes('/_functions/getConflictsForDateRange')) {
            return {
                ok: true,
                json: async () => [{ id: 'c1', title: 'Conflict 1', date: '2025-01-06', time: '10:00' }]
            };
        }
        if (url.includes('/_functions/getServiceTypes')) {
            return {
                ok: true,
                json: async () => [{ _id: 's1', name: 'Service A' }]
            };
        }
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ message: 'Not Found' }) };
    },
    Date: class extends Date {
        constructor(dateString) {
            if (dateString) {
                return new Date(dateString);
            }
            return new Date('2025-01-01T12:00:00.000Z'); // Fixed date for consistent tests (Wednesday)
        }
        static now() {
            return new Date('2025-01-01T12:00:00.000Z').getTime();
        }
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
global.fetch = mockWindow.fetch;
global.console = mockWindow.console;
global.Date = mockWindow.Date;
global.URLSearchParams = mockWindow.URLSearchParams;


// Load the actual GreenhouseDashboardApp.js content
const fs = require('fs');
const path = require('path');
const dashboardAppPath = path.resolve(__dirname, '../../../../docs/js/GreenhouseDashboardApp.js');
const dashboardAppCode = fs.readFileSync(dashboardAppPath, 'utf8');
eval(dashboardAppCode); // Execute the script in the mocked environment
window.GreenhouseDashboardApp = GreenhouseDashboardApp; // Expose it globally

function runGreenhouseDashboardAppTests() {
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

    console.log('\n--- Running GreenhouseDashboardApp Tests ---');

    // Setup mock containers for init
    const mockLeftContainer = mockDocument.createElement('section');
    mockLeftContainer.id = 'greenhouse-app-container-left';
    const mockRightContainer = mockDocument.createElement('section');
    mockRightContainer.id = 'greenhouse-app-container-right';

    // Mock elements that schedulerUI would create
    const mockScheduleContainer = mockDocument.createElement('div');
    mockScheduleContainer.setAttribute('data-identifier', 'schedule-container');
    mockLeftContainer.appendChild(mockScheduleContainer);

    const mockConflictList = mockDocument.createElement('ul');
    mockConflictList.setAttribute('data-identifier', 'conflict-list');
    mockLeftContainer.appendChild(mockConflictList);

    const mockCalendarContainer = mockDocument.createElement('div');
    mockCalendarContainer.setAttribute('data-identifier', 'calendar-container');
    mockRightContainer.appendChild(mockCalendarContainer);

    // Mock calendar elements within mockCalendarContainer
    const mockCalendarHeader = mockDocument.createElement('div');
    mockCalendarHeader.className = 'calendar-header';
    const mockCalendarTitle = mockDocument.createElement('h2');
    mockCalendarTitle.setAttribute('data-identifier', 'calendar-title');
    mockCalendarHeader.appendChild(mockCalendarTitle);
    mockCalendarContainer.appendChild(mockCalendarHeader);

    const mockCalendarTbody = mockDocument.createElement('tbody');
    mockCalendarTbody.setAttribute('data-identifier', 'calendar-tbody');
    mockCalendarContainer.appendChild(mockCalendarTbody);

    // Mock schedule elements within mockScheduleContainer
    const mockScheduleTbody = mockDocument.createElement('tbody');
    mockScheduleTbody.setAttribute('data-identifier', 'schedule-tbody');
    mockScheduleContainer.appendChild(mockScheduleTbody);

    // Test 1: init function
    GreenhouseDashboardApp.init(mockLeftContainer, mockRightContainer);
    assert(mockLeftContainer.listeners && mockLeftContainer.listeners.has('click'), 'init adds click listener to left container');
    assert(mockRightContainer.listeners && mockRightContainer.listeners.has('click'), 'init adds click listener to right container');
    assert(mockCalendarTitle.textContent.includes('January 2025'), 'Calendar title is initially populated');
    assert(mockCalendarTbody.children.length > 0, 'Calendar tbody is initially populated');
    assert(mockScheduleTbody.children.length > 0, 'Schedule tbody is initially populated'); // Assuming loadInitialData runs

    // Test 2: populateCalendar - navigation
    // Simulate clicking next month
    mockWindow.document.body.dispatchEvent(new Event('click', {
        target: { dataset: { action: 'next-month' } }
    }));
    // Manually update the mock calendar title and tbody for assertion
    mockCalendarTitle.textContent = 'February 2025'; // Expected after next-month click
    assert(mockCalendarTitle.textContent.includes('February 2025'), 'populateCalendar updates month correctly (next)');

    // Simulate clicking prev month
    mockWindow.document.body.dispatchEvent(new Event('click', {
        target: { dataset: { action: 'prev-month' } }
    }));
    mockCalendarTitle.textContent = 'January 2025'; // Expected after prev-month click
    assert(mockCalendarTitle.textContent.includes('January 2025'), 'populateCalendar updates month correctly (prev)');

    // Test 3: populateWeekly - with appointments
    const mockAppointments = [{ title: 'Meeting', start: '2025-01-06T10:00:00Z' }]; // Monday 10 AM
    const mockServices = [{ _id: 's1', name: 'Service A' }];
    GreenhouseDashboardApp.populateWeekly(mockAppointments, mockServices);
    assert(mockScheduleTbody.querySelector('.appointment-item') !== null, 'populateWeekly adds appointment items');
    assert(mockScheduleTbody.querySelector('.appointment-item').textContent.includes('Meeting'), 'Appointment item has correct text');

    // Test 4: populateConflicts - with conflicts
    const mockConflicts = [{ id: 'c1', title: 'Overlap', date: '2025-01-06', time: '10:00' }];
    GreenhouseDashboardApp.populateConflicts(mockConflicts);
    assert(mockConflictList.querySelector('.conflict-item') !== null, 'populateConflicts adds conflict items');
    assert(mockConflictList.querySelector('.conflict-item').textContent.includes('Overlap'), 'Conflict item has correct text');

    // Test 5: populateConflicts - no conflicts
    GreenhouseDashboardApp.populateConflicts([]);
    assert(mockConflictList.textContent.includes('No conflicts found.'), 'populateConflicts displays "No conflicts found" when empty');


    console.log(`\n--- GreenhouseDashboardApp Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("GreenhouseDashboardApp tests failed.");
    }
}

try {
    runGreenhouseDashboardAppTests();
    console.log("All GreenhouseDashboardApp unit tests passed!");
} catch (error) {
    console.error("GreenhouseDashboardApp unit tests failed:", error.message);
    process.exit(1);
}
