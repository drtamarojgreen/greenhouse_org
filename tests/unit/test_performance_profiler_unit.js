/**
 * @file test_performance_profiler_unit.js
 * @description Unit tests for the Performance Profiler utility.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        performance: {
            now: () => Date.now(),
            memory: {
                usedJSHeapSize: 100 * 1048576,
                jsHeapSizeLimit: 2000 * 1048576
            }
        },
        document: {
            currentScript: null,
            createElement: () => ({ style: {}, appendChild: () => { } }),
            getElementById: () => null,
            body: { appendChild: () => { } }
        },
        requestAnimationFrame: (cb) => { setTimeout(cb, 16); },
        console: { log: () => { } },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Map: Map,
        Set: Set
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/performance_profiler.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('Performance Profiler (Unit)', () => {
    let env;
    let Profiler;

    TestFramework.beforeEach(() => {
        env = createEnv();
        Profiler = env.window.GreenhouseProfiler;
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
        env.window.performance.memory.usedJSHeapSize = 1900 * 1048576; // 95% of limit
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

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
