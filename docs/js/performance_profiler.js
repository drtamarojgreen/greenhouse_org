/**
 * @file performance_profiler.js
 * @description Utility for profiling performance (FPS, Memory, Init Time) of Greenhouse simulations.
 */

(function () {
    'use strict';

    window.GreenhouseProfiler = {
        startTime: performance.now(),
        frameCount: 0,
        lastTime: performance.now(),
        fps: 0,
        memoryUsage: [],
        warnings: [],
        isRunning: false,
        testResults: {},

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.startTime = performance.now();
            this.lastTime = this.startTime;
            this.frameCount = 0;
            this.loop();
            console.log('GreenhouseProfiler: Started monitoring.');
        },

        stop() {
            this.isRunning = false;
            this.generateReport();
        },

        loop() {
            if (!this.isRunning) return;

            const now = performance.now();
            this.frameCount++;

            if (now >= this.lastTime + 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = now;
                this.checkHealth();
            }

            if (this.frameCount % 60 === 0) { // Check memory every ~60 frames
                this.recordMemory();
            }

            requestAnimationFrame(() => this.loop());
        },

        recordMemory() {
            if (performance.memory) {
                const usedJSHeapSize = performance.memory.usedJSHeapSize / 1048576; // MB
                this.memoryUsage.push(usedJSHeapSize);
            }
        },

        checkHealth() {
            if (this.fps < 15) {
                this.warnings.push(`Low FPS detected: ${this.fps} at ${((performance.now() - this.startTime) / 1000).toFixed(1)}s`);
            }
            if (performance.memory) {
                const limit = performance.memory.jsHeapSizeLimit / 1048576;
                const used = performance.memory.usedJSHeapSize / 1048576;
                if (used > limit * 0.9) {
                    this.warnings.push(`High Memory Usage: ${used.toFixed(1)}MB (Limit: ${limit.toFixed(1)}MB)`);
                }
            }
        },

        generateReport() {
            const avgMemory = this.memoryUsage.length ? (this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length).toFixed(2) : 'N/A';
            const uptime = ((performance.now() - this.startTime) / 1000).toFixed(2);

            const report = {
                status: this.warnings.length === 0 ? 'PASS' : 'WARN',
                uptimeSeconds: uptime,
                averageMemoryMB: avgMemory,
                finalFPS: this.fps,
                warnings: this.warnings
            };

            console.log('GreenhouseProfiler Report:', report);
            window.GreenhouseTestReport = report; // Expose for external tools

            // Render visible report on screen for manual verification
            this.renderOverlay(report);

            return report;
        },

        renderOverlay(report) {
            const id = 'greenhouse-profiler-overlay';
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.style.position = 'fixed';
                el.style.bottom = '10px';
                el.style.right = '10px';
                el.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                el.style.color = '#00ff00';
                el.style.padding = '10px';
                el.style.borderRadius = '5px';
                el.style.fontFamily = 'monospace';
                el.style.fontSize = '12px';
                el.style.zIndex = '9999';
                el.style.pointerEvents = 'none';
                document.body.appendChild(el);
            }

            el.innerHTML = `
                <strong>Greenhouse Performance Report</strong><br>
                Status: <span style="color:${report.status === 'PASS' ? '#00ff00' : '#ff0000'}">${report.status}</span><br>
                FPS: ${report.finalFPS}<br>
                Avg Mem: ${report.averageMemoryMB} MB<br>
                Uptime: ${report.uptimeSeconds}s<br>
                ${report.warnings.length ? '<br>Warnings:<br>' + report.warnings.map(w => `- ${w}`).join('<br>') : ''}
            `;
        }
    };

    // Auto-start if configured
    if (document.currentScript && document.currentScript.getAttribute('data-auto-start') === 'true') {
        window.GreenhouseProfiler.start();
    }

})();
