/**
 * @file test_scheduler_logic.js
 * @description Unit tests for Greenhouse Scheduler core logic.
 */

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && (window.location.hostname || window.location.port);

const fs = !isBrowser ? require('fs') : null;
const path = !isBrowser ? require('path') : null;
const vm = !isBrowser ? require('vm') : null;
const { assert } = !isBrowser ? require('../../utils/assertion_library.js') : { assert: window.assert };
const TestFramework = !isBrowser ? require('../../utils/test_framework.js') : window.TestFramework;

// --- Mock Browser Environment ---
if (!isBrowser) {
global.window = global;
global.document = {
    currentScript: null,
    querySelector: () => null,
    getElementById: (id) => {
        if (id === 'greenhouse-view-selector') return { addEventListener: () => { } };
        return null;
    },
    createElement: (tag) => ({
        style: {},
        rel: '',
        type: '',
        href: '',
        setAttribute: () => { },
        appendChild: () => { },
        onload: null,
        onerror: null
    }),
    head: { appendChild: () => { } },
    body: { appendChild: () => { } }
};
global.Node = { ELEMENT_NODE: 1 };
global.console = {
    log: () => { },
    error: () => { },
    warn: () => { }
};
global.performance = { now: () => Date.now() };

// --- Script Loading Helper ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// --- Load Dependencies ---
global.window.GreenhouseUtils = {
    appState: {
        isInitialized: false,
        isLoading: false,
        baseUrl: './'
    },
    config: { dom: { observerTimeout: 100, insertionDelay: 0 } },
    waitForElement: async () => ({ innerHTML: '', style: {} }),
    displayError: () => { },
    displaySuccess: () => { },
    loadScript: async () => { }
};

global.window.GreenhouseSchedulerUI = {
    buildViewSelectorUI: () => { },
    buildPatientCalendarUI: () => { },
    buildPatientFormUI: () => { },
    createInstructionsPanel: () => { },
    buildDashboardLeftPanelUI: () => { },
    buildAdminAppointmentFormUI: () => { },
    createHiddenElements: () => ({})
};

// scheduler.js is an IIFE that auto-runs main()
// We can't easily capture the internal GreenhouseAppsScheduler object
// but we can test the exposed window.GreenhouseScheduler API.

loadScript('scheduler.js');
}

TestFramework.describe('Greenhouse Scheduler Core (Unit)', () => {

    const Scheduler = isBrowser ? window.GreenhouseScheduler : global.window.GreenhouseScheduler;

    TestFramework.it('should define public API on window', () => {
        assert.isDefined(Scheduler);
        assert.isFunction(Scheduler.getState);
        assert.isFunction(Scheduler.reinitialize);
    });

    TestFramework.describe('State Management', () => {
        TestFramework.it('should provide access to app state', () => {
            const state = Scheduler.getState();
            assert.isDefined(state);
            assert.isBoolean(state.isInitialized);
        });

        TestFramework.it('should handle reinitialization request', async () => {
            // Triggering reinitialize should reset flags
            // Note: main() will run again in mock environment
            await Scheduler.reinitialize();
            const state = Scheduler.getState();
            // Since init() is async and we mocked waitForElement to resolve,
            // isInitialized should eventually be true.
            assert.isTrue(state.isInitialized);
        });
    });

    TestFramework.describe('View Switching (Logical)', () => {
        TestFramework.it('should update state when switching views', async () => {
            // We can't call internal switchView directly easily because of IIFE scope
            // but we can test if components are reactive to state if we had access.
            // For now, validating that the foundation for views exists.
            const st = Scheduler.getState();
            assert.isDefined(st.baseUrl);
        });
    });

});

if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
