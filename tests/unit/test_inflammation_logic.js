/**
 * @file test_inflammation_logic.js
 * @description Unit tests for Inflammation Model logic.
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
        requestAnimationFrame: () => { },
        addEventListener: () => { },
        dispatchEvent: () => { },
        CustomEvent: class { constructor(name, options) { this.name = name; this.detail = options ? options.detail : null; } },
        document: {
            createElement: (tag) => ({
                tag,
                tagName: tag.toUpperCase(),
                getContext: () => ({
                    fillRect: () => {}, fillText: () => {}, beginPath: () => {},
                    moveTo: () => {}, lineTo: () => {}, quadraticCurveTo: () => {},
                    closePath: () => {}, fill: () => {}, stroke: () => {},
                    measureText: () => ({ width: 10 }), save: () => {}, restore: () => {}
                }),
                appendChild: () => {},
                style: {}
            }),
            querySelector: () => ({
                appendChild: () => {},
                innerHTML: '',
                offsetWidth: 1000,
                style: {}
            }),
            body: { appendChild: () => {} },
            currentScript: null
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const scripts = ['models_util.js', 'inflammation_config.js', 'inflammation_app.js'];
    scripts.forEach(s => {
        const code = fs.readFileSync(path.join(__dirname, '../../docs/js', s), 'utf8');
        vm.runInContext(code, context);
    });

    return context;
};

TestFramework.describe('Inflammation Model Logic', () => {
    let env;
    let app;
    let engine;

    TestFramework.beforeEach(() => {
        env = createEnv();
        app = env.window.GreenhouseInflammationApp;
        app.init(env.document.querySelector('div'));
        engine = app.engine;
    });

    TestFramework.it('TNF-alpha should increase with pathogenic triggers', () => {
        engine.state.metrics.tnfAlpha = 0.1;
        const initialTnf = engine.state.metrics.tnfAlpha;

        engine.state.factors.pathogenActive = 1;
        engine.state.factors.chronicStress = 1;
        engine.state.factors.cleanDiet = 0;
        engine.state.factors.socialSupport = 0;
        engine.state.factors.exerciseRegular = 0;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.greaterThan(engine.state.metrics.tnfAlpha, initialTnf);
    });

    TestFramework.it('IL-10 should respond to exercise', () => {
        engine.state.metrics.il10 = 0.05;
        const initialIl10 = engine.state.metrics.il10;

        engine.state.factors.exerciseRegular = 1;
        engine.state.factors.cleanDiet = 0;
        engine.state.factors.socialSupport = 0;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.greaterThan(engine.state.metrics.il10, initialIl10);
    });

    TestFramework.it('Neuroprotection should decrease when TNF-alpha is high', () => {
        engine.state.metrics.tnfAlpha = 0.8;
        engine.state.metrics.il10 = 0.1;
        engine.state.metrics.neuroprotection = 0.9;
        const initialNeuro = engine.state.metrics.neuroprotection;

        for (let i = 0; i < 50; i++) {
            app.updateModel(engine.state, 0.1);
        }

        assert.lessThan(engine.state.metrics.neuroprotection, initialNeuro);
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
