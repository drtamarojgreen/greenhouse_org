/**
 * @file test_dopamine_ui.js
 * @description Unit tests for Dopamine UI components and interactions.
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
        navigator: { userAgent: 'node' },
        addEventListener: () => {},
        document: {
            body: {
                style: {},
                appendChild: () => {}
            },
            documentElement: { style: {} },
            createElement: (tag) => ({
                tag,
                className: '',
                style: {},
                appendChild: () => {},
                prepend: () => {},
                setAttribute: function(name, value) { this[name] = value; },
                getAttribute: function(name) { return this[name]; },
                querySelector: (sel) => {
                    if (sel === '.dropdown-content') return { style: { display: 'none' } };
                    return null;
                },
                querySelectorAll: () => [],
                onclick: null,
                innerText: ''
            }),
            getElementById: (id) => ({
                innerHTML: '',
                innerText: '',
                style: {},
                appendChild: () => {}
            }),
            querySelectorAll: () => [],
            addEventListener: () => {}
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const code = fs.readFileSync(path.join(__dirname, '../../docs/js/dopamine_controls.js'), 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('Dopamine UI Components', () => {

    let env;
    let G;

    TestFramework.beforeEach(() => {
        env = createEnv();
        G = env.window.GreenhouseDopamine;
    });

    TestFramework.it('should create UI with controls', () => {
        const container = env.document.createElement('div');
        G.state = { receptors: [], scenarios: {} };
        G.uxState = { highContrast: false, largeScale: false, reducedMotion: false, showPerf: false };
        env.window.GreenhouseUtils = { isMobileUser: () => false };

        G.createUI(container);
        assert.isTrue(true); // Should run without error
    });

    TestFramework.it('should apply color palettes to receptors', () => {
        G.state.receptors = [{ color: '' }, { color: '' }];
        G.applyPalette('deuteranopia');

        assert.notEqual(G.state.receptors[0].color, '');
        assert.equal(G.state.receptors[0].color, '#e69f00');
    });

    TestFramework.it('should update text on language change', () => {
        const mockInfo = { innerHTML: '' };
        env.document.getElementById = (id) => {
            if (id === 'dopamine-info-display') return mockInfo;
            return { innerText: '', style: {} };
        };
        env.window.GreenhouseModelsUtil = { t: (k) => 'T_' + k };

        G.updateLanguage();
        assert.contains(mockInfo.innerHTML, 'T_neuro_dopamine_signaling');
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
