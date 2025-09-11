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
        };
        return element;
    },
    querySelector: (selector) => {
        if (selector === '#mock-left-target') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-left-target';
            return el;
        }
        if (selector === '#mock-right-target') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-right-target';
            return el;
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
    setTimeout: (fn, delay) => fn(), // Mock setTimeout to execute immediately
    GreenhouseUtils: {
        appState: {
            isInitialized: false,
            isLoading: false,
            currentView: 'patient',
            currentAppInstance: null,
            targetElementLeft: null,
            targetElementRight: null,
            baseUrl: 'http://localhost/',
            targetSelectorLeft: '#mock-left-target',
            targetSelectorRight: null,
            loadedScripts: new Set(),
            errors: []
        },
        config: {
            dom: {
                observerTimeout: 100,
                insertionDelay: 10
            }
        },
        displayError: () => {},
        displaySuccess: () => {},
        displayInfo: () => {},
        waitForElement: async (selector) => {
            const el = mockDocument.createElement('div');
            el.id = selector.replace('#', '');
            return el;
        },
        validateConfiguration: () => true,
        loadScript: async (scriptName, baseUrl, attributes) => {
            // Simulate loading the app script and defining its global variable
            if (scriptName === 'GreenhouseDashboardApp.js') {
                mockWindow.GreenhouseDashboardApp = { init: () => {} };
            } else if (scriptName === 'GreenhouseAdminApp.js') {
                mockWindow.GreenhouseAdminApp = { init: () => {} };
            } else if (scriptName === 'GreenhousePatientApp.js') {
                mockWindow.GreenhousePatientApp = { init: () => {} };
            }
            mockWindow.GreenhouseUtils.appState.loadedScripts.add(scriptName);
            return Promise.resolve();
        }
    },
    GreenhouseSchedulerUI: {
        buildDashboardLeftPanelUI: () => ({ scheduleContainer: mockDocument.createElement('div'), conflictList: mockDocument.createElement('ul'), conflictResolutionArea: mockDocument.createElement('div') }),
        buildDashboardRightPanelUI: () => ({ calendarContainer: mockDocument.createElement('div') }),
        buildAdminFormUI: () => mockDocument.createElement('div'),
        buildPatientFormUI: () => mockDocument.createElement('div'),
        createInstructionsPanel: () => mockDocument.createDocumentFragment(),
        createHiddenElements: () => mockDocument.createDocumentFragment(),
    },
    GreenhouseDashboardApp: null,
    GreenhouseAdminApp: null,
    GreenhousePatientApp: null,
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.console = mockWindow.console;
global.setTimeout = mockWindow.setTimeout;
global.URLSearchParams = mockWindow.URLSearchParams;


// Load the actual scheduler.js content
const fs = require('fs');
const path = require('path');
const schedulerPath = path.resolve(__dirname, '../../../../docs/js/scheduler.js');
const schedulerCode = fs.readFileSync(schedulerPath, 'utf8');
eval(schedulerCode); // Execute the script in the mocked environment

function runSchedulerTests() {
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

    console.log('\n--- Running Scheduler Tests ---');

    // Reset appState before each test
    function resetAppState() {
        mockWindow.GreenhouseUtils.appState.isInitialized = false;
        mockWindow.GreenhouseUtils.appState.isLoading = false;
        mockWindow.GreenhouseUtils.appState.currentView = 'patient';
        mockWindow.GreenhouseUtils.appState.currentAppInstance = null;
        mockWindow.GreenhouseUtils.appState.targetElementLeft = null;
        mockWindow.GreenhouseUtils.appState.targetElementRight = null;
        mockWindow.GreenhouseUtils.appState.loadedScripts.clear();
        mockWindow.GreenhouseUtils.appState.errors = [];
        mockWindow.GreenhouseUtils.appState.targetSelectorLeft = '#mock-left-target';
        mockWindow.GreenhouseUtils.appState.targetSelectorRight = null;
        mockWindow.GreenhouseDashboardApp = null;
        mockWindow.GreenhouseAdminApp = null;
        mockWindow.GreenhousePatientApp = null;
    }

    // Test 1: Scheduler init for Patient view (single panel)
    resetAppState();
    mockWindow.GreenhouseUtils.appState.currentView = 'patient';
    mockWindow.GreenhouseUtils.validateConfiguration = () => true; // Ensure validation passes
    mockWindow.GreenhouseSchedulerUI.buildPatientFormUI = (target) => {
        const div = mockDocument.createElement('div');
        div.setAttribute('data-identifier', 'patient-form-container');
        target.appendChild(div);
        return div;
    };
    mockWindow.GreenhouseSchedulerUI.createInstructionsPanel = (target) => {
        const div = mockDocument.createElement('div');
        div.setAttribute('data-identifier', 'instructions-panel');
        target.appendChild(div);
        return div;
    };
    mockWindow.GreenhousePatientApp = { init: (left, right) => {
        assert(left.id === 'greenhouse-app-container-left', 'PatientApp init receives left container');
        assert(right.children[0].getAttribute('data-identifier') === 'instructions-panel', 'PatientApp init receives right container with instructions');
    }};

    GreenhouseScheduler.reinitialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.isInitialized, 'Scheduler is initialized for Patient view');
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('GreenhousePatientApp.js'), 'PatientApp script is loaded');
        assert(mockWindow.GreenhouseUtils.appState.targetElementLeft.children.length > 0, 'Left target element has children after patient init');
        assert(mockWindow.GreenhouseUtils.appState.targetElementRight.children.length > 0, 'Right target element has children after patient init');
    }).catch(e => assert(false, `Patient init failed: ${e.message}`));

    // Test 2: Scheduler init for Dashboard view (two panels)
    resetAppState();
    mockWindow.GreenhouseUtils.appState.currentView = 'dashboard';
    mockWindow.GreenhouseUtils.appState.targetSelectorRight = '#mock-right-target';
    mockWindow.GreenhouseUtils.validateConfiguration = () => true;
    mockWindow.GreenhouseSchedulerUI.buildDashboardLeftPanelUI = (target) => {
        const div = mockDocument.createElement('div');
        div.setAttribute('data-identifier', 'schedule-container');
        target.appendChild(div);
        return { scheduleContainer: div, conflictList: mockDocument.createElement('ul'), conflictResolutionArea: mockDocument.createElement('div') };
    };
    mockWindow.GreenhouseSchedulerUI.buildDashboardRightPanelUI = (target) => {
        const div = mockDocument.createElement('div');
        div.setAttribute('data-identifier', 'calendar-container');
        target.appendChild(div);
        return { calendarContainer: div };
    };
    mockWindow.GreenhouseDashboardApp = { init: (left, right) => {
        assert(left.id === 'greenhouse-app-container-left', 'DashboardApp init receives left container');
        assert(right.id === 'greenhouse-app-container-right', 'DashboardApp init receives right container');
    }};

    GreenhouseScheduler.reinitialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.isInitialized, 'Scheduler is initialized for Dashboard view');
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('GreenhouseDashboardApp.js'), 'DashboardApp script is loaded');
        assert(mockWindow.GreenhouseUtils.appState.targetElementLeft.children.length > 0, 'Left target element has children after dashboard init');
        assert(mockWindow.GreenhouseUtils.appState.targetElementRight.children.length > 0, 'Right target element has children after dashboard init');
    }).catch(e => assert(false, `Dashboard init failed: ${e.message}`));

    // Test 3: Scheduler init for Admin view (single panel)
    resetAppState();
    mockWindow.GreenhouseUtils.appState.currentView = 'admin';
    mockWindow.GreenhouseUtils.validateConfiguration = () => true;
    mockWindow.GreenhouseSchedulerUI.buildAdminFormUI = (target) => {
        const div = mockDocument.createElement('div');
        div.setAttribute('data-identifier', 'admin-form-container');
        target.appendChild(div);
        return div;
    };
    mockWindow.GreenhouseAdminApp = { init: (left) => {
        assert(left.id === 'greenhouse-app-container-left', 'AdminApp init receives left container');
    }};

    GreenhouseScheduler.reinitialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.isInitialized, 'Scheduler is initialized for Admin view');
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('GreenhouseAdminApp.js'), 'AdminApp script is loaded');
        assert(mockWindow.GreenhouseUtils.appState.targetElementLeft.children.length > 0, 'Left target element has children after admin init');
    }).catch(e => assert(false, `Admin init failed: ${e.message}`));

    // Test 4: Error handling during initialization (e.g., target element not found)
    resetAppState();
    mockWindow.GreenhouseUtils.appState.currentView = 'patient';
    mockWindow.GreenhouseUtils.waitForElement = async () => { throw new Error('Target element not found'); };
    mockWindow.GreenhouseUtils.displayError = (msg) => {
        assert(msg.includes('Target element "undefined" not found'), 'displayError called with correct message on target not found');
    };

    GreenhouseScheduler.reinitialize().then(() => {
        assert(false, 'Scheduler should not initialize on target element error');
    }).catch(e => {
        assert(e.message.includes('Target element not found'), 'Scheduler init rejects on target element error');
        assert(!mockWindow.GreenhouseUtils.appState.isInitialized, 'Scheduler is not initialized after error');
    });

    // Test 5: loadCSS
    resetAppState();
    let cssLoaded = false;
    mockDocument.head = {
        appendChild: (el) => {
            if (el.tagName === 'LINK' && el.href.includes('schedule.css')) {
                cssLoaded = true;
                el.onload(); // Manually trigger onload for mock
            }
        }
    };
    // Temporarily override querySelector to simulate CSS not being loaded
    const originalQuerySelector = mockDocument.querySelector;
    mockDocument.querySelector = (selector) => {
        if (selector.includes('link[href="http://localhost/css/schedule.css"]')) return null;
        return originalQuerySelector(selector);
    };

    GreenhouseScheduler.reinitialize().then(() => {
        assert(cssLoaded, 'loadCSS successfully appends CSS link');
    }).catch(e => assert(false, `loadCSS failed: ${e.message}`))
    .finally(() => {
        mockDocument.querySelector = originalQuerySelector; // Restore original
    });


    console.log(`\n--- Scheduler Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("Scheduler tests failed.");
    }
}

try {
    runSchedulerTests();
    console.log("All Scheduler unit tests passed!");
} catch (error) {
    console.error("Scheduler unit tests failed:", error.message);
    process.exit(1);
}
