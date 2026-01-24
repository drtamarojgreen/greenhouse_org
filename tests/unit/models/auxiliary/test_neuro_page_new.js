/**
 * Unit Tests for Neuro Page
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { assert } = require('../../../utils/assertion_library.js');
const TestFramework = require('../../../utils/test_framework.js');

// --- Mock Browser Environment ---
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
    const filePath = path.join(__dirname, '../../../../docs/js', filename);
    const startTime = performance.now();
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
    const duration = performance.now() - startTime;
    if (TestFramework.ResourceReporter) {
        TestFramework.ResourceReporter.recordScript(filePath, duration);
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
TestFramework.run();
