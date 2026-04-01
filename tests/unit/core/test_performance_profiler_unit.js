(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Performance Profiler (Unit)', () => {

        const Profiler = window.GreenhouseProfiler;

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
            // Ensure mock memory exists
            if (!window.performance.memory) {
                window.performance.memory = { usedJSHeapSize: 100 * 1048576, jsHeapSizeLimit: 2000 * 1048576 };
            }
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
            if (!window.performance.memory) {
                window.performance.memory = { usedJSHeapSize: 1900 * 1048576, jsHeapSizeLimit: 2000 * 1048576 };
            } else {
                window.performance.memory.usedJSHeapSize = 1900 * 1048576; // 95% of limit
            }
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
})();
