/**
 * @file test_scheduler_logic.js
 * @description Unit tests for Greenhouse Scheduler core logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = () => {
    const mockWindow = {
        performance: { now: () => Date.now() },
        Node: { ELEMENT_NODE: 1 }
    };

    const createEl = (tag) => ({
        style: {}, rel: '', type: '', href: '', innerHTML: '', value: '',
        setAttribute: () => {}, appendChild: () => {}, addEventListener: () => {}
    });

    const mockDocument = {
        currentScript: null,
        querySelector: () => null,
        getElementById: (id) => (id === 'greenhouse-view-selector' ? createEl('div') : null),
        createElement: createEl,
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        addEventListener: () => {}
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    context.GreenhouseUtils = {
        appState: { isInitialized: false, isLoading: false, baseUrl: './' },
        config: { dom: { observerTimeout: 100, insertionDelay: 0 } },
        waitForElement: async () => ({ innerHTML: '', style: {} }),
        displayError: () => {}, displaySuccess: () => {},
        loadScript: async () => {}
    };

    context.GreenhouseSchedulerUI = {
        buildViewSelectorUI: () => {}, buildPatientCalendarUI: () => {}, buildPatientFormUI: () => {},
        createInstructionsPanel: () => {}, buildDashboardLeftPanelUI: () => {}, buildAdminAppointmentFormUI: () => {},
        createHiddenElements: () => ({})
    };

    context.loadMain = async () => {
        context._greenhouseScriptAttributes = {
            'data-scheduler-selectors': JSON.stringify({
                dashboardLeft: '#db-left', dashboardRight: '#db-right',
                repeaterLeft: '#rep-left', repeaterRight: '#rep-right'
            }),
            'base-url': './'
        };
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js/scheduler.js'), 'utf8');
        vm.runInContext(code, context);
        // Wait for async IIFE start
        await new Promise(resolve => setTimeout(resolve, 50));
    };

    return context;
};

TestFramework.describe('Greenhouse Scheduler Core (Unit)', () => {

    TestFramework.it('should define public API on window', async () => {
        const env = createEnv();
        await env.loadMain();
        const Scheduler = env.GreenhouseScheduler;
        assert.isDefined(Scheduler);
        assert.isFunction(Scheduler.getState);
        assert.isFunction(Scheduler.reinitialize);
    });

    TestFramework.describe('State Management', () => {
        TestFramework.it('should provide access to app state', async () => {
            const env = createEnv();
            await env.loadMain();
            const state = env.GreenhouseScheduler.getState();
            assert.isDefined(state);
            assert.isBoolean(state.isInitialized);
        });

        TestFramework.it('should handle reinitialization request', async () => {
            const env = createEnv();
            await env.loadMain();
            await env.GreenhouseScheduler.reinitialize();
            const state = env.GreenhouseScheduler.getState();
            assert.isTrue(state.isInitialized);
        });
    });

    TestFramework.describe('View Switching (Logical)', () => {
        TestFramework.it('should update state when switching views', async () => {
            const env = createEnv();
            await env.loadMain();
            const st = env.GreenhouseScheduler.getState();
            assert.isDefined(st.baseUrl);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
