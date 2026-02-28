/**
 * @file test_meditation_app.js
 * @description Unit tests for the mobile meditation app logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Standard Environment Builder ---
const createEnv = () => {
    const mockWindow = {
        alert: () => {},
        setInterval: setInterval,
        clearInterval: clearInterval,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout
    };

    const createEl = (tag) => ({
        tagName: tag.toUpperCase(), id: '', style: {}, children: [], value: '', textContent: '', innerHTML: '',
        addEventListener: function(e, cb) { this[`on${e}`] = cb; },
        appendChild: function(c) { this.children.push(c); return c; },
        querySelector: () => null, querySelectorAll: () => [],
        closest: () => ({ style: {} }),
        getAttribute: () => tag === 'schedule-page' ? 'schedule-page' : null
    });

    const mockDocument = {
        addEventListener: (e, cb) => { if(e === 'DOMContentLoaded') setTimeout(cb, 10); },
        getElementById: (id) => { const el = createEl('div'); el.id = id; return el; },
        querySelectorAll: () => [createEl('div')],
        createElement: createEl,
        body: createEl('body'), head: createEl('head')
    };

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    context.loadApp = () => {
        const code = fs.readFileSync(path.join(__dirname, '../../mobile/app/app.js'), 'utf8');
        vm.runInContext(code, context);
    };

    return context;
};

TestFramework.describe('Meditation App Logic (Unit)', () => {

    TestFramework.it('should initialize without crashing', (done) => {
        const env = createEnv();
        try {
            env.loadApp();
            setTimeout(() => {
                done();
            }, 50);
        } catch (e) {
            done(e);
        }
    });

    TestFramework.describe('Timer Logic', () => {
        TestFramework.it('should handle play/pause', async () => {
            // Mock elements
            const playBtn = { textContent: 'Play', addEventListener: function(ev, cb) { this.onclick = cb; } };
            const sceneTimer = { textContent: '15:00' };
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
