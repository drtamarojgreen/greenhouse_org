// Mocking the DOM for testing purposes
const mockDocument = {
    body: {
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
    },
    head: {
        appendChild: () => {},
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
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-left-target';
            return el;
        }
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-right-target';
            return el;
        }
        if (selector === '.wixui-column-strip__column:first-child') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-left-target-fallback';
            return el;
        }
        if (selector === '.wixui-column-strip__column:nth-child(2)') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-right-target-fallback';
            return el;
        }
        return null;
    },
    querySelectorAll: (selector) => [],
    createDocumentFragment: () => ({
        children: [],
        appendChild: function(child) { this.children.push(child); },
    }),
    readyState: 'complete', // Simulate DOMContentLoaded
    addEventListener: (event, handler) => {
        if (event === 'DOMContentLoaded') {
            // Call immediately if DOM is already complete
            handler();
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
            currentView: null,
            currentAppInstance: null,
            targetElementLeft: null,
            targetElementRight: null,
            baseUrl: null,
            targetSelectorLeft: null,
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
        waitForElement: async (selectors) => {
            for (const selector of selectors) {
                const el = mockDocument.querySelector(selector);
                if (el) return el;
            }
            throw new Error('Element not found');
        },
        validateConfiguration: () => true,
        loadScript: async (scriptName, baseUrl, attributes) => {
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
    GreenhouseScheduler: {
        reinitialize: async () => {
            mockWindow.GreenhouseUtils.appState.isInitialized = true;
            mockWindow.GreenhouseUtils.appState.isLoading = false;
            return Promise.resolve();
        }
    },
    GreenhouseBooksApp: { init: () => {} },
    GreenhouseVideosApp: { init: () => {} },
    GreenhouseNewsApp: { init: () => {} },
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
// global.console = mockWindow.console; // DO NOT MOCK THE CONSOLE GLOBALLY
global.setTimeout = mockWindow.setTimeout;
global.URLSearchParams = mockWindow.URLSearchParams;


// Load the actual greenhouse.js content
const fs = require('fs');
const path = require('path');
const greenhousePath = path.resolve(__dirname, '../../../../../docs/js/greenhouse.js');
const greenhouseCode = fs.readFileSync(greenhousePath, 'utf8');
eval(greenhouseCode); // Execute the script in the mocked environment

function runGreenhouseTests() {
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

    console.log('\n--- Running Greenhouse Tests ---');

    // Reset appState before each test
    function resetAppState() {
        mockWindow.GreenhouseUtils.appState.isInitialized = false;
        mockWindow.GreenhouseUtils.appState.isLoading = false;
        mockWindow.GreenhouseUtils.appState.currentView = null;
        mockWindow.GreenhouseUtils.appState.currentAppInstance = null;
        mockWindow.GreenhouseUtils.appState.targetElementLeft = null;
        mockWindow.GreenhouseUtils.appState.targetElementRight = null;
        mockWindow.GreenhouseUtils.appState.baseUrl = null;
        mockWindow.GreenhouseUtils.appState.targetSelectorLeft = null;
        mockWindow.GreenhouseUtils.appState.targetSelectorRight = null;
        mockWindow.GreenhouseUtils.appState.loadedScripts.clear();
        mockWindow.GreenhouseUtils.appState.errors = [];
        mockWindow.location.pathname = '/'; // Default to non-schedule page
        mockWindow.location.search = '';
    }

    // Test 1: loadSchedulerApplication
    resetAppState();
    mockWindow.location.pathname = '/schedule/';
    mockWindow.document.querySelector = (selector) => {
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-left-target';
            return el;
        }
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-right-target';
            return el;
        }
        return null;
    };
    
    // Manually trigger initialize since DOMContentLoaded is mocked to fire immediately
    window.Greenhouse.initialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('schedulerUI.js'), 'schedulerUI.js is loaded for schedule page');
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('scheduler.js'), 'scheduler.js is loaded for schedule page');
        assert(mockWindow.GreenhouseUtils.appState.targetSelectorLeft === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column', 'Correct left selector passed to scheduler');
        assert(mockWindow.GreenhouseUtils.appState.targetSelectorRight === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column:nth-child(2)', 'Correct right selector passed to scheduler');
        assert(mockWindow.GreenhouseUtils.appState.currentView === 'dashboard', 'View is set to dashboard for schedule page');
    }).catch(e => assert(false, `Scheduler application load failed: ${e.message}`));

    // Test 2: loadBooksApplication
    resetAppState();
    mockWindow.location.pathname = '/books/';
    mockWindow.document.querySelector = (selector) => {
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-books-target';
            return el;
        }
        return null;
    };
    window.Greenhouse.initialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('books.js'), 'books.js is loaded for books page');
        assert(mockWindow.GreenhouseUtils.appState.targetSelectorLeft === '#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section', 'Correct selector passed to books app');
    }).catch(e => assert(false, `Books application load failed: ${e.message}`));

    // Test 3: loadVideosApplication (currently commented out in greenhouse.js, so this test will assert it's NOT loaded)
    resetAppState();
    mockWindow.location.pathname = '/videos/';
    window.Greenhouse.initialize().then(() => {
        assert(!mockWindow.GreenhouseUtils.appState.loadedScripts.has('videos.js'), 'videos.js is NOT loaded when commented out');
    }).catch(e => assert(false, `Videos application load failed: ${e.message}`));

    // Test 4: loadNewsApplication
    resetAppState();
    mockWindow.location.pathname = '/news/';
    mockWindow.document.querySelector = (selector) => {
        if (selector === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column') {
            const el = mockDocument.createElement('div');
            el.id = 'mock-news-target';
            return el;
        }
        return null;
    };
    window.Greenhouse.initialize().then(() => {
        assert(mockWindow.GreenhouseUtils.appState.loadedScripts.has('news.js'), 'news.js is loaded for news page');
        assert(mockWindow.GreenhouseUtils.appState.targetSelectorLeft === '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column', 'Correct selector passed to news app');
    }).catch(e => assert(false, `News application load failed: ${e.message}`));

    // Test 5: loadScript (GreenhouseUtils.loadScript is used internally now)
    resetAppState();
    let scriptAppended = false;
    mockWindow.GreenhouseUtils.loadScript = async (scriptName, baseUrl, attributes) => {
        if (scriptName === 'effects.js') {
            scriptAppended = true;
        }
        return Promise.resolve();
    };
    mockWindow.location.pathname = '/'; // Any page
    window.Greenhouse.initialize().then(() => {
        assert(scriptAppended, 'effects.js is loaded on all pages via GreenhouseUtils.loadScript');
    }).catch(e => assert(false, `effects.js load failed: ${e.message}`));


    console.log(`\n--- Greenhouse Tests Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("Greenhouse tests failed.");
    }
}

try {
    runGreenhouseTests();
    console.log("All Greenhouse unit tests passed!");
} catch (error) {
    console.error("Greenhouse unit tests failed:", error.message);
    throw error;
}
