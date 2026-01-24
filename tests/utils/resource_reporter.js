const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * ResourceReporter
 * Utility to track and report quantitative resource usage in tests.
 */
class ResourceReporter {
    constructor() {
        this.metrics = {
            scripts: {},
            totals: {
                size: 0,
                loadTime: 0
            }
        };
    }

    /**
     * Record metrics for a specific script
     * @param {string} scriptPath - Path to the script file
     * @param {number} loadTime - Time taken to load/execute in ms
     */
    recordScript(scriptPath, loadTime) {
        try {
            const stats = fs.statSync(scriptPath);
            const sizeKB = stats.size / 1024;
            const scriptName = path.basename(scriptPath);

            this.metrics.scripts[scriptName] = {
                sizeKB: parseFloat(sizeKB.toFixed(2)),
                loadTimeMS: parseFloat(loadTime.toFixed(2))
            };

            this.metrics.totals.size += stats.size;
            this.metrics.totals.loadTime += loadTime;
        } catch (error) {
            console.error(`ResourceReporter Error: Could not record metrics for ${scriptPath}`, error.message);
        }
    }

    /**
     * Get the collected metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            totals: {
                sizeKB: parseFloat((this.metrics.totals.size / 1024).toFixed(2)),
                loadTimeMS: parseFloat(this.metrics.totals.loadTime.toFixed(2))
            }
        };
    }

    /**
     * Generate a quantitative report string
     */
    generateReport() {
        let report = '\n=== Quantitative Resource Report ===\n';
        report += `${'Script Name'.padEnd(30)} | ${'Size (KB)'.padStart(10)} | ${'Load Time (ms)'.padStart(15)}\n`;
        report += '-'.repeat(61) + '\n';

        for (const [name, data] of Object.entries(this.metrics.scripts)) {
            report += `${name.padEnd(30)} | ${data.sizeKB.toFixed(2).padStart(10)} | ${data.loadTimeMS.toFixed(2).padStart(15)}\n`;
        }

        const totals = this.getMetrics().totals;
        report += '-'.repeat(61) + '\n';
        report += `${'TOTAL'.padEnd(30)} | ${totals.sizeKB.toFixed(2).padStart(10)} | ${totals.loadTimeMS.toFixed(2).padStart(15)}\n`;

        return report;
    }
}

module.exports = new ResourceReporter();
