/**
 * Unit Tests for Neuro Page
 */

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && (window.location.hostname || window.location.port);

const fs = !isBrowser ? require('fs') : null;
const path = !isBrowser ? require('path') : null;
const vm = !isBrowser ? require('vm') : null;
const { performance } = !isBrowser ? require('perf_hooks') : { performance: window.performance };
const { assert } = !isBrowser ? require('../../utils/assertion_library.js') : { assert: window.assert };
const TestFramework = !isBrowser ? require('../../utils/test_framework.js') : window.TestFramework;

// --- Mock Browser Environment ---
if (!isBrowser) {
global.window = global;
global.document = {
    getElementById: () => ({
        addEventListener: () => { },
        getContext: () => ({
            save: () => { },
            restore: () => { },
            translate: () => { },
            rotate: () => { },
            scale: () => { },
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            rect: () => { },
            clip: () => { },
            fillText: () => { },
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => ({ addColorStop: () => { } }),
            clearRect: () => { },
            fillRect: () => { },
            strokeRect: () => { }
        }),
        width: 800,
        height: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    }),
    createElement: () => ({
        getContext: () => ({})
    }),
    querySelectorAll: () => [],
    currentScript: {
        getAttribute: () => 'test'
    }
};
global.addEventListener = () => { };
global.console = console;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// --- Helper to Load Scripts ---
function loadScript(filename) {
    if (isBrowser) return;
    const filePath = path.join(__dirname, '../../../docs/js', filename);
    const startTime = performance.now();
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
    const duration = performance.now() - startTime;
    if (TestFramework.ResourceReporter) {
        TestFramework.ResourceReporter.recordScript(filePath, duration);
    }
}
}

// --- Test Suites ---

TestFramework.describe('Neuro Page', () => {

    TestFramework.it('should load neuro.js and report resources', () => {
        loadScript('neuro.js');
        assert.isTrue(true);
    });

});

// Run the tests
if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
