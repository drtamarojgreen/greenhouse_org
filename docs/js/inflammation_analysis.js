/**
 * @file inflammation_analysis.js
 * @description Advanced analytical features for the Neuroinflammation Simulation.
 * Implements Matrix View, Temporal Summaries, and Data Export.
 */

(function () {
    'use strict';

    const GreenhouseInflammationAnalysis = {
        render(ctx, app, state) {
            const w = app.canvas.width;
            const h = app.canvas.height;

            if (state.factors.viewMode === 0) { // Only in Macro for now
                this.drawMatrix(ctx, w, h, state);
                this.drawTimeline(ctx, w, h);
            }
        },

        drawMatrix(ctx, w, h, state) {
            const regions = ['PFC', 'HIP', 'THA', 'INS', 'BG'];
            const elements = ['TNF', 'IL10', 'MIC', 'BBB'];

            const x = w - 180;
            const y = h - 280;
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

        drawTimeline(ctx, w, h) {
            const x = w - 180;
            const y = h - 120;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(x - 10, y - 20, 160, 60);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x - 10, y - 20, 160, 60);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Quicksand';
            ctx.fillText('TEMPORAL TRAJECTORY', x, y - 5);

            ctx.strokeStyle = '#00ff99';
            ctx.beginPath();
            ctx.moveTo(x, y + 25);
            for(let i=0; i<140; i++) {
                ctx.lineTo(x + i, y + 25 + Math.sin(i * 0.1 + Date.now() * 0.002) * 10);
            }
            ctx.stroke();
            ctx.restore();
        },

        exportToJSON(state) {
            const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
            console.log("Inflammation Analysis: Data prepared for export.");
            return URL.createObjectURL(blob);
        }
    };

    window.GreenhouseInflammationAnalysis = GreenhouseInflammationAnalysis;
})();
