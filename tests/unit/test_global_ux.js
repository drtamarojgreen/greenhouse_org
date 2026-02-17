/**
 * @file test_global_ux.js
 * @description Unit tests for global UX patterns across Greenhouse apps.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    body: {
        appendChild: () => {}
    },
    createElement: (tag) => ({
        tag,
        style: {},
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {} },
        setAttribute: function(name, value) { this[name] = value; },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 })
    }),
    querySelector: () => null
};
global.navigator = { userAgent: 'node' };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('models_util.js');

TestFramework.describe('Global UX Patterns', () => {

    TestFramework.it('DiurnalClock should advance time correctly', () => {
        const clock = new window.GreenhouseModelsUtil.DiurnalClock();
        clock.timeInHours = 8.0;

        // Advance 1 biological hour (1000ms real time in current impl)
        clock.update(1000);
        assert.equal(Math.round(clock.timeInHours), 9);

        // Wrap around 24h
        clock.timeInHours = 23.5;
        clock.update(1000);
        assert.equal(clock.timeInHours, 0.5);
        assert.equal(clock.dayCount, 1);
    });

    TestFramework.it('DiurnalClock should return correct resilience recovery multiplier', () => {
        const clock = new window.GreenhouseModelsUtil.DiurnalClock();

        clock.timeInHours = 12.0; // Day
        assert.equal(clock.getResilienceRecoveryMultiplier(), 1.0);

        clock.timeInHours = 2.0; // Night
        assert.equal(clock.getResilienceRecoveryMultiplier(), 2.5);
    });

    TestFramework.it('GreenhouseBioStatus should dispatch events on sync', () => {
        let eventCaught = false;
        global.dispatchEvent = (ev) => {
            if (ev.name === 'greenhouseBioUpdate') eventCaught = true;
        };
        global.CustomEvent = class { constructor(n) { this.name = n; } };

        window.GreenhouseBioStatus.sync('stress', { load: 0.5 });
        assert.isTrue(eventCaught);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
