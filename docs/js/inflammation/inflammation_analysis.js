/**
 * @file inflammation_analysis.js
 * @description Advanced analytical features for the Neuroinflammation Simulation.
 * Implements Matrix View, Temporal Summaries, and Data Export.
 */

(function () {
    'use strict';

    const GreenhouseInflammationAnalysis = {
        history: {
            tnfAlpha: [], il10: [], bbbIntegrity: [], microgliaActivation: [],
            nfkbActivation: [], calcium: [], neuroprotection: [], stressBurden: [],
            ros: [], timestamp: []
        },
        maxHistory: 36000, // Supports up to 10m at 60fps
        timelineWindow: 200, // 30s at 60fps
        selectedMetrics: ['tnfAlpha', 'il10', 'bbbIntegrity'],

        updateHistory(state) {
            const m = state.metrics;
            const now = Date.now();

            this.history.tnfAlpha.push(m.tnfAlpha);
            this.history.il10.push(m.il10);
            this.history.bbbIntegrity.push(m.bbbIntegrity);
            this.history.microgliaActivation.push(m.microgliaActivation);
            this.history.nfkbActivation.push(m.nfkbActivation || 0);
            this.history.calcium.push(m.calcium || 0);
            this.history.neuroprotection.push(m.neuroprotection || 0);
            this.history.stressBurden.push(m.stressBurden || 0);
            this.history.ros.push(m.ros || 0);
            this.history.timestamp.push(now);

            if (this.history.tnfAlpha.length > this.maxHistory) {
                for (const key in this.history) if (Array.isArray(this.history[key])) this.history[key].shift();
            }
        },

        render(ctx, app, state, matrixLayout, timelineLayout) {
            const w = app.canvas.width;
            const h = app.canvas.height;

            if (state.factors.viewMode === 0) { // Macro
                this.drawMatrix(ctx, w, h, state, matrixLayout);
                this.drawTimeline(ctx, w, h, state, timelineLayout);
            } else if (state.factors.viewMode === 1) { // Micro
                this.drawMatrix(ctx, w, h, state, matrixLayout, true);
                this.drawTimeline(ctx, w, h, state, timelineLayout);
            } else if (state.factors.viewMode === 2) { // Molecular
                this.drawTimeline(ctx, w, h, state, timelineLayout);
            }
        },

        drawMatrix(ctx, w, h, state, layout, isMicro = false) {
            const regions = isMicro ? ['NVU', 'GLI', 'NEU', 'VES'] : ['PFC', 'HIP', 'THA', 'INS', 'BG'];
            const elements = ['TNF', 'IL10', 'MIC', 'BBB'];

            const { x, y } = layout || { x: w - 180, y: h - 280 };
            const size = 25;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x - 10, y - 30, 160, 150);
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.5)';
            ctx.strokeRect(x - 10, y - 30, 160, 150);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 9px Quicksand';
            ctx.fillText('INFLAMMATION MATRIX', x, y - 15);

            ctx.font = '7px monospace';
            regions.forEach((r, i) => ctx.fillText(r, x + 40 + i * size, y));

            elements.forEach((el, i) => {
                ctx.fillStyle = '#fff';
                ctx.fillText(el, x, y + 20 + i * size);
                regions.forEach((r, j) => {
                    // Item 71: Values depend on multiple metrics
                    let val = state.metrics.tnfAlpha;
                    if (el === 'IL10') val = state.metrics.il10;
                    if (el === 'MIC') val = state.metrics.microgliaActivation;
                    if (el === 'BBB') val = 1 - state.metrics.bbbIntegrity;

                    val *= (1 + Math.sin(j * 0.5) * 0.1);
                    ctx.fillStyle = `rgba(255, ${255 * (1 - val)}, 0, ${0.3 + val * 0.7})`;
                    ctx.fillRect(x + 40 + j * size, y + 10 + i * size, size - 2, size - 2);
                });
            });
            ctx.restore();
        },

        drawTimeline(ctx, w, h, state, layout) {
            const { x, y } = layout || { x: w - 180, y: h - 120 };
            const m = state.metrics;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(x - 10, y - 20, 160, 100);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x - 10, y - 20, 160, 100);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Quicksand';
            ctx.fillText('TEMPORAL TRAJECTORY', x, y - 5);

            // Item 74: User-selectable timeline metrics
            const colors = { tnfAlpha: '#ff5533', il10: '#00ff99', bbbIntegrity: '#64d2ff', microgliaActivation: '#ff4444', nfkbActivation: '#ffcc00', calcium: '#ff00ff', neuroprotection: '#ffff66', stressBurden: '#ff9900', ros: '#00ffff' };

            this.selectedMetrics.forEach((metricId, i) => {
                const history = this.history[metricId];
                if (history) {
                    const latest = history[history.length - 1];
                    this.drawTrace(ctx, x, y + 25 + i * 25, 140, 20, colors[metricId] || '#fff', latest, metricId.substring(0, 4).toUpperCase(), history);
                }
            });

            // Item 77: Hover scrub
            const mx = window.GreenhouseInflammationApp.interaction.mouseX;
            const my = window.GreenhouseInflammationApp.interaction.mouseY;
            if (mx >= x && mx <= x + 140 && my >= y && my <= y + 80) {
                const scrubIdx = Math.floor(((mx - x) / 140) * Math.min(this.history.timestamp.length, this.timelineWindow));
                const actualIdx = Math.max(0, this.history.timestamp.length - Math.min(this.history.timestamp.length, this.timelineWindow) + scrubIdx);

                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx, y + 80); ctx.stroke();

                ctx.fillStyle = '#fff'; ctx.font = '7px monospace';
                this.selectedMetrics.forEach((mid, i) => {
                    const val = this.history[mid][actualIdx];
                    if (val !== undefined) ctx.fillText(`${val.toFixed(2)}`, mx + 5, y + 25 + i * 25);
                });
            }

            ctx.restore();
        },

        drawTrace(ctx, x, y, w, h, color, val, label, history) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();

            // Item 73: Replace sinusoidal fake trace with sampled metric history buffers
            const windowSize = Math.min(history.length, this.timelineWindow);
            const step = w / windowSize;
            const startIdx = history.length - windowSize;

            for(let i=0; i<windowSize; i++) {
                const tv = history[startIdx + i];
                const px = x + i * step;
                const py = y - tv * (h - 5);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = '7px monospace';
            ctx.fillText(label, x + w - 25, y + 5);

            // Item 76: Threshold lines
            if (label === 'TNF' && val > 0.7) {
                ctx.strokeStyle = 'rgba(255,0,0,0.5)';
                ctx.setLineDash([2, 2]);
                ctx.beginPath(); ctx.moveTo(x, y - 0.7 * (h - 5)); ctx.lineTo(x + w, y - 0.7 * (h - 5)); ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.globalAlpha = 1.0;
        },

        exportToJSON(state) {
            const exportData = {
                state: state,
                history: this.history,
                exportedAt: new Date().toISOString(),
                version: "1.2.0"
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            this.triggerDownload(url, `inflammation_state_${Date.now()}.json`);
            return { url, size: blob.size, timestamp: exportData.exportedAt };
        },

        exportToCSV(state) {
            let csv = "Timestamp,Metric,Value\n";
            const timestamp = Date.now();
            for (const [key, val] of Object.entries(state.metrics)) {
                csv += `${timestamp},${key},${val}\n`;
            }

            const blob = new Blob([csv], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);
            this.triggerDownload(url, `inflammation_metrics_${Date.now()}.csv`);
            return { url, size: blob.size, timestamp: new Date().toISOString() };
        },

        triggerDownload(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    window.GreenhouseInflammationAnalysis = GreenhouseInflammationAnalysis;
})();
