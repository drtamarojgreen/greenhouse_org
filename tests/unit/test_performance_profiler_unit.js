/**
 * @file test_performance_profiler_unit.js
 * @description Unit tests for the Performance Profiler utility.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.performance = {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: 100 * 1048576,
        jsHeapSizeLimit: 2000 * 1048576
    }
};
global.document = {
    currentScript: null,
    createElement: () => ({ style: {}, appendChild: () => { } }),
    getElementById: () => null,
    body: { appendChild: () => { } }
};
global.requestAnimationFrame = (cb) => { setTimeout(cb, 16); };
global.console = { log: () => { } };

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/performance_profiler.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('Performance Profiler (Unit)', () => {

    const Profiler = global.window.GreenhouseProfiler;

    TestFramework.beforeEach(() => {
        Profiler.isRunning = false;
        Profiler.warnings = [];
        Profiler.memoryUsage = [];
        Profiler.fps = 60;
    });

    TestFramework.it('should initialize with correct properties', () => {
        assert.isDefined(Profiler);
        assert.isFalse(Profiler.isRunning);
    });

    TestFramework.it('should start monitoring', () => {
        Profiler.start();
        assert.isTrue(Profiler.isRunning);
    });

    TestFramework.it('should record memory usage', () => {
        Profiler.recordMemory();
        assert.hasLength(Profiler.memoryUsage, 1);
        assert.equal(Profiler.memoryUsage[0], 100);
    });

    TestFramework.it('should detect low FPS health warnings', () => {
        Profiler.fps = 10;
        Profiler.checkHealth();
        assert.greaterThan(Profiler.warnings.length, 0);
        assert.contains(Profiler.warnings[0], 'Low FPS');
    });

    TestFramework.it('should detect high memory usage', () => {
        global.window.performance.memory.usedJSHeapSize = 1900 * 1048576; // 95% of limit
        Profiler.checkHealth();
        assert.isTrue(Profiler.warnings.some(w => w.includes('High Memory')));
    });

    TestFramework.it('should generate a report', () => {
        Profiler.memoryUsage = [100, 110, 120];
        Profiler.fps = 58;
        const report = Profiler.generateReport();

        assert.equal(report.averageMemoryMB, '110.00');
        assert.equal(report.finalFPS, 58);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
