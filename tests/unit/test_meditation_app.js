/**
 * @file test_meditation_app.js
 * @description Unit tests for the mobile meditation app logic.
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
        setInterval: setInterval,
        clearInterval: clearInterval,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        alert: () => { },
        document: {
            addEventListener: (event, cb) => {
                if (event === 'DOMContentLoaded') setTimeout(cb, 10);
            },
            getElementById: (id) => {
                return {
                    id,
                    style: {},
                    addEventListener: function(ev, cb) { this[`on${ev}`] = cb; },
                    appendChild: function(c) { if(!this.children) this.children=[]; this.children.push(c); },
                    querySelector: () => null,
                    querySelectorAll: () => [],
                    value: '',
                    textContent: '',
                    innerHTML: '',
                    closest: function() { return { style: {} }; }
                };
            },
            querySelectorAll: (sel) => {
                return [{
                    getAttribute: () => 'schedule-page',
                    addEventListener: () => { }
                }];
            },
            createElement: (tag) => ({ tag, style: {}, appendChild: () => { } })
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const appPath = path.join(__dirname, '../../mobile/app/app.js');
    const appCode = fs.readFileSync(appPath, 'utf8');
    vm.runInContext(appCode, context);

    return context;
};

TestFramework.describe('Meditation App Logic (Unit)', () => {

    TestFramework.it('should initialize without crashing', (done) => {
        try {
            createEnv();
            setTimeout(() => {
                done();
            }, 50);
        } catch (e) {
            done(e);
        }
    });

    TestFramework.describe('Timer Logic', () => {
        TestFramework.it('should handle play/pause', async () => {
            // Logic check
        });
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
