/**
 * @file inflammation_signaling.js
 * @description Specialized molecular signaling visualizations for Neuroinflammation.
 * Implements ligand-receptor network overlays, occupancy curves, and threshold indicators.
 */

(function () {
    'use strict';

    const GreenhouseInflammationSignaling = {
        render(ctx, app, state, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const viewMode = state.factors.viewMode;

            if (viewMode !== 2) return; // Only in Molecular view

            if (state.factors.showSignalingNetwork) {
                this.drawSignalingNetwork(ctx, app, state, projection, ui3d);
            }

            if (state.factors.showTranscriptionOverlays) {
                this.drawTranscriptionOverlays(ctx, app, state, projection, ui3d);
            }
        },

        drawSignalingNetwork(ctx, app, state, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            if (!ui3d.molecularCells) return;

            const mast = ui3d.molecularCells.find(c => c.type === 'mast_cell');
            const microglia = ui3d.molecularCells.find(c => c.type === 'microglia');
            const astrocyte = ui3d.molecularCells.find(c => c.type === 'astrocyte');

            if (!mast || !microglia || !astrocyte) return;

            const pMast = Math3D.project3DTo2D(mast.x, mast.y, mast.z, app.camera, projection);
            const pMic = Math3D.project3DTo2D(microglia.x, microglia.y, microglia.z, app.camera, projection);
            const pAst = Math3D.project3DTo2D(astrocyte.x, astrocyte.y, astrocyte.z, app.camera, projection);

            ctx.save();

            // IL-1beta exchange directionality (Item 7)
            this.drawSignalingEdge(ctx, pMast, pMic, '#ff5533', 'IL-1β', state.metrics.tnfAlpha);

            // TNF-alpha pulse from mast to glia (Item 6)
            this.drawSignalingEdge(ctx, pMast, pAst, '#ff8844', 'TNF-α', state.metrics.tnfAlpha * 0.8);

            // ATP / Purinergic Signaling (Item 11)
            this.drawSignalingEdge(ctx, pAst, pMic, '#ffff00', 'ATP', state.metrics.atp / 5.0);

            ctx.restore();
        },

        drawSignalingEdge(ctx, p1, p2, color, label, intensity) {
            if (p1.scale <= 0 || p2.scale <= 0) return;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            ctx.strokeStyle = color;
            ctx.lineWidth = 1 + intensity * 3;
            ctx.globalAlpha = 0.2 + intensity * 0.5;

            // Pulsing line
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -Date.now() * 0.01;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Directional Arrow
            const angle = Math.atan2(dy, dx);
            const arrowSize = 6 + intensity * 4;
            ctx.save();
            ctx.translate(p1.x + dx * 0.7, p1.y + dy * 0.7);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowSize, -arrowSize / 2);
            ctx.lineTo(-arrowSize, arrowSize / 2);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.fillText(label, p1.x + dx * 0.4, p1.y + dy * 0.4);
        },

        drawTranscriptionOverlays(ctx, app, state, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            if (!ui3d.molecularCells) return;

            ui3d.molecularCells.forEach(c => {
                const p = Math3D.project3DTo2D(c.x, c.y, c.z, app.camera, projection);
                if (p.scale <= 0) return;

                ctx.save();
                ctx.translate(p.x, p.y - 60 * p.scale);

                // Activity Curves (Item 39, 40)
                const activity = c.type === 'mast_cell' ? state.metrics.tnfAlpha : state.metrics.nfkbActivation;
                this.drawMiniCurve(ctx, 40 * p.scale, 20 * p.scale, activity, c.type === 'mast_cell' ? 'FcεRI' : 'NF-κB');

                // Threshold indicator (Item 13)
                if (c.type === 'microglia') {
                    this.drawThresholdIndicator(ctx, 40 * p.scale, state.metrics.nlrp3State, 'NLRP3');
                }

                ctx.restore();
            });
        },

        drawMiniCurve(ctx, w, h, val, label) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.strokeRect(-w/2, -h/2, w, h);

            ctx.strokeStyle = '#00ffcc';
            ctx.beginPath();
            ctx.moveTo(-w/2, h/2);
            for(let i=0; i<w; i++) {
                const x = -w/2 + i;
                const y = h/2 - (Math.sin(i * 0.1 + Date.now() * 0.005) * 0.5 + 0.5) * h * val;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '7px monospace';
            ctx.fillText(label, -w/2 + 2, -h/2 + 8);
        },

        drawThresholdIndicator(ctx, w, val, label) {
            const ty = 25;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(-w/2, ty, w, 4);

            const color = val > 0.7 ? '#ff3300' : (val > 0.4 ? '#ffcc00' : '#00ffcc');
            ctx.fillStyle = color;
            ctx.fillRect(-w/2, ty, w * val, 4);

            ctx.font = '7px monospace';
            ctx.fillText(label, -w/2, ty - 2);
        }
    };

    window.GreenhouseInflammationSignaling = GreenhouseInflammationSignaling;
})();
