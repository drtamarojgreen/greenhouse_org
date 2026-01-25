/**
 * @file cognition_analytics.js
 * @description Analytical and visual structural features for the Cognition model.
 * Covers Enhancements 1-6.
 */

(function () {
    'use strict';

    const GreenhouseCognitionAnalytics = {
        init(app) {
            this.app = app;
            console.log('CognitionAnalytics: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Analytical') return;

            if (activeEnhancement.id === 1) this.renderCorticalLayers(ctx);
            if (activeEnhancement.id === 2) this.renderSignalPropagation(ctx);
            if (activeEnhancement.id === 3) this.renderSystemSplit(ctx);
            if (activeEnhancement.id === 4) this.renderAnatomicalTooltips(ctx);
            if (activeEnhancement.id === 5) this.renderLesionMode(ctx);
            if (activeEnhancement.id === 6) this.renderMeSHLinkage(ctx);
        },

        renderCorticalLayers(ctx) {
            const w = this.app.canvas.width;
            ctx.fillStyle = 'rgba(79, 209, 197, 0.2)';
            ctx.font = '12px Arial';
            const layers = ['I. Molecular', 'II. External Granular', 'III. External Pyramidal', 'IV. Internal Granular', 'V. Internal Pyramidal', 'VI. Multiform'];
            layers.forEach((layer, i) => {
                ctx.fillStyle = 'rgba(79, 209, 197, 0.8)';
                ctx.fillText(layer, 20, 100 + i * 25);
                ctx.fillStyle = `rgba(79, 209, 197, ${0.1 + i * 0.15})`;
                ctx.fillRect(150, 85 + i * 25, 120, 20);
                ctx.strokeStyle = '#4fd1c5';
                ctx.strokeRect(150, 85 + i * 25, 120, 20);
            });
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('EXPLODED CORTICAL VIEW', 20, 70);
        },

        renderSignalPropagation(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            this.drawArrow(ctx, w * 0.3, h * 0.6, w * 0.45, h * 0.4);
            this.drawArrow(ctx, w * 0.45, h * 0.4, w * 0.7, h * 0.5);
            ctx.fillStyle = '#39ff14';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('SIGNAL PROPAGATION PATHWAY', 20, 70);
        },

        renderSystemSplit(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(w / 2, 80);
            ctx.lineTo(w / 2, h - 20);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('SYSTEM 1: AUTOMATIC', w * 0.1, 100);
            ctx.fillStyle = '#4da6ff';
            ctx.fillText('SYSTEM 2: EFFORTFUL', w * 0.6, 100);
        },

        renderAnatomicalTooltips(ctx) {
            const w = this.app.canvas.width;
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('ANATOMICAL TOOLTIPS', 20, 70);

            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#4fd1c5';
            ctx.lineWidth = 1;
            ctx.fillRect(w - 240, 50, 220, 80);
            ctx.strokeRect(w - 240, 50, 220, 80);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('Superior Frontal Gyrus', w - 230, 75);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ccc';
            ctx.fillText('Region: Prefrontal Cortex', w - 230, 95);
            ctx.fillText('Function: Executive control, self-awareness', w - 230, 115);
        },

        renderLesionMode(ctx) {
            const w = this.app.canvas.width;
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('LESION STUDY MODE', 20, 70);
            ctx.font = '12px Arial';
            ctx.fillText('Region: Temporal Lobe (Simulated Impairment)', 20, 95);
            ctx.fillStyle = 'rgba(255, 77, 77, 0.2)';
            ctx.fillRect(20, 110, 300, 40);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('Deficit: Auditory processing & Memory encoding', 30, 135);
        },

        renderMeSHLinkage(ctx) {
            const w = this.app.canvas.width;
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('MeSH DATA LINKAGE', 20, 70);

            ctx.fillStyle = 'rgba(0, 40, 40, 0.6)';
            ctx.fillRect(20, 90, 350, 100);
            ctx.strokeRect(20, 90, 350, 100);

            ctx.fillStyle = '#4fd1c5';
            ctx.font = '11px monospace';
            ctx.fillText('> FETCHING RESEARCH TRENDS (2020-2024)...', 30, 115);
            ctx.fillStyle = '#fff';
            ctx.fillText('Top MeSH Terms found in context:', 30, 135);
            ctx.fillText('1. Executive Function (ln: 4.52)', 40, 155);
            ctx.fillText('2. Cerebral Cortex (ln: 4.18)', 40, 175);
        },

        drawArrow(ctx, fromx, fromy, tox, toy) {
            const headlen = 15;
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    };

    window.GreenhouseCognitionAnalytics = GreenhouseCognitionAnalytics;
})();
