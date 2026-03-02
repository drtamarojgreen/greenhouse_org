/**
 * @file test_scheduler_logic.js
 * @description Unit tests for Greenhouse Scheduler core logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => Date.now() },
        Node: { ELEMENT_NODE: 1 },
        document: {
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
        },
        GreenhouseUtils: {
            appState: { isInitialized: false, isLoading: false, baseUrl: './' },
            config: { dom: { observerTimeout: 100, insertionDelay: 0 } },
            waitForElement: async () => ({ innerHTML: '', style: {} }),
            displayError: () => { },
            displaySuccess: () => { },
            loadScript: async () => { }
        },
        GreenhouseSchedulerUI: {
            buildViewSelectorUI: () => { },
            buildPatientCalendarUI: () => { },
            buildPatientFormUI: () => { },
            createInstructionsPanel: () => { },
            buildDashboardLeftPanelUI: () => { },
            buildAdminAppointmentFormUI: () => { },
            createHiddenElements: () => ({})
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/scheduler.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('Greenhouse Scheduler Core (Unit)', () => {
    let env;
    let Scheduler;

    TestFramework.beforeEach(() => {
        env = createEnv();
        Scheduler = env.window.GreenhouseScheduler;
    });

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
            await Scheduler.reinitialize();
            const state = Scheduler.getState();
            assert.isTrue(state.isInitialized);
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
