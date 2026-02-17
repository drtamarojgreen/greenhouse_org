/**
 * @file inflammation_analysis.js
 * @description Advanced analytical features for the Neuroinflammation Simulation.
 * Implements Matrix View, Temporal Summaries, and Data Export.
 */

(function () {
    'use strict';

    const GreenhouseInflammationAnalysis = {
        render(ctx, app, state, matrixLayout, timelineLayout) {
            const w = app.canvas.width;
            const h = app.canvas.height;

            if (state.factors.viewMode === 0) { // Macro
                this.drawMatrix(ctx, w, h, state, matrixLayout);
                this.drawTimeline(ctx, w, h, state, timelineLayout);
            } else if (state.factors.viewMode === 2) { // Molecular
                this.drawTimeline(ctx, w, h, state, timelineLayout);
            }
        },

        drawMatrix(ctx, w, h, state, layout) {
            const regions = ['PFC', 'HIP', 'THA', 'INS', 'BG'];
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
                    const val = (state.metrics.tnfAlpha || 0.1) * (1 + Math.sin(j * 0.5) * 0.2);
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
            ctx.fillRect(x - 10, y - 20, 160, 80);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x - 10, y - 20, 160, 80);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Quicksand';
            ctx.fillText('TEMPORAL TRAJECTORY', x, y - 5);

            // TNF (Base line)
            this.drawTrace(ctx, x, y + 25, 140, 20, '#ff5533', m.tnfAlpha, 'TNF');

            // Calcium (Item 27)
            this.drawTrace(ctx, x, y + 45, 140, 20, '#00ffcc', (m.calcium - 100) / 400, 'Ca2+');

            // NF-κB (Item 39)
            this.drawTrace(ctx, x, y + 65, 140, 20, '#ffcc00', m.nfkbActivation, 'NF-κB');

            ctx.restore();
        },

        drawTrace(ctx, x, y, w, h, color, val, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for(let i=0; i<w; i++) {
                const tv = val * (0.8 + Math.sin(i * 0.1 + Date.now() * 0.002) * 0.2);
                ctx.lineTo(x + i, y - tv * (h - 5));
            }
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = '7px monospace';
            ctx.fillText(label, x + w - 25, y + 5);
            ctx.globalAlpha = 1.0;
        },

        exportToJSON(state) {
            const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
            console.log("Inflammation Analysis: Data prepared for export.");
            return URL.createObjectURL(blob);
        }
    };

    window.GreenhouseInflammationAnalysis = GreenhouseInflammationAnalysis;
})();
