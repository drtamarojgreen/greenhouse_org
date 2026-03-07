/**
 * @file test_global_ux.js
 * @description Unit tests for global UX patterns across Greenhouse apps.
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
    if (isBrowser) {
        if (filename.includes('models_util.js') && window.GreenhouseModelsUtil) return;
    }
    if (!isBrowser) {
        const filePath = path.join(__dirname, '../../../docs/js', filename);
        const code = fs.readFileSync(filePath, 'utf8');
        vm.runInThisContext(code);
    }
}

loadScript('models_util.js');
}

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
        if (isBrowser) {
            window.addEventListener('greenhouseBioUpdate', () => { eventCaught = true; }, { once: true });
            window.GreenhouseBioStatus.sync('stress', { load: 0.5 });
            assert.isTrue(eventCaught);
            return;
        }
        global.dispatchEvent = (ev) => {
            if (ev.name === 'greenhouseBioUpdate') eventCaught = true;
        };
        global.CustomEvent = class { constructor(n) { this.name = n; } };

        window.GreenhouseBioStatus.sync('stress', { load: 0.5 });
        assert.isTrue(eventCaught);
    });

});

if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
