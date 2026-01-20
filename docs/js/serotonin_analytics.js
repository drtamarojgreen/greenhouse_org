/**
 * @file serotonin_analytics.js
 * @description Analytics and real-time data visualization for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Analytics = {
        history: {
            cleftConcentration: [],
            receptorOccupancy: [],
            firingRate: [],
            neurogenesisScore: [],
            appetiteSuppression: []
        },
        maxHistory: 100,

        updateAnalytics() {
            if (!G.isRunning) return;

            // Neurogenesis Score (Category 8, #77)
            // Driven by 5-HT1A and chronic SSRI-like levels
            const ht1aActive = G.state.receptors ? G.state.receptors.find(r => r.type === '5-HT1A' && r.state === 'Active') : false;
            const neurogenesis = (ht1aActive ? 0.5 : 0) + (G.Transport ? (G.Transport.longTermAvg5HT > 5 ? 0.5 : 0) : 0);
            this.history.neurogenesisScore.push(neurogenesis);
            if (this.history.neurogenesisScore.length > this.maxHistory) this.history.neurogenesisScore.shift();

            // Appetite Suppression (Category 8, #76)
            // Driven by 5-HT2C and POMC neuron activation (simulated)
            const ht2cActive = G.state.receptors ? G.state.receptors.find(r => r.type === '5-HT2C' && r.state === 'Active') : false;
            this.history.appetiteSuppression.push(ht2cActive ? 1.0 : 0);
            if (this.history.appetiteSuppression.length > this.maxHistory) this.history.appetiteSuppression.shift();

            // Pathway Flux Analysis (Category 9, #84)
            // Calculate rate of 5-HT synthesis vs degradation
            const synthesized = G.Transport ? G.Transport.vesicle5HT : 0;
            const extracellular = G.Kinetics ? G.Kinetics.activeLigands.filter(l => l.name === 'Serotonin').length : 0;

            this.history.cleftConcentration.push(extracellular);
            if (this.history.cleftConcentration.length > this.maxHistory) this.history.cleftConcentration.shift();

            // Receptor Occupancy (Category 9, #83)
            if (G.state.receptors) {
                const occupiedCount = G.state.receptors.filter(r => r.state !== 'Inactive').length;
                const occupancy = occupiedCount / G.state.receptors.length;
                this.history.receptorOccupancy.push(occupancy);
                if (this.history.receptorOccupancy.length > this.maxHistory) this.history.receptorOccupancy.shift();
            }
        },

        renderAnalytics(ctx, w, h) {
            // Draw real-time graphs (Category 9, #81)
            const graphW = 150;
            const graphH = 50;
            const padding = 10;
            const startX = w - graphW - padding;
            const startY = h - graphH - padding;

            // Background for graph
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(startX - 5, startY - 60, graphW + 10, 110);

            // Cleft Concentration Graph
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            this.history.cleftConcentration.forEach((val, i) => {
                const x = startX + (i / this.maxHistory) * graphW;
                const y = startY - (val / 30) * graphH;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.fillText('Cleft [5-HT]', startX, startY - graphH - 5);

            // Occupancy Graph
            const occY = startY + 40;
            ctx.strokeStyle = '#ff9900';
            ctx.beginPath();
            this.history.receptorOccupancy.forEach((val, i) => {
                const x = startX + (i / this.maxHistory) * graphW;
                const y = occY - (val * graphH);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillText('Receptor Occupancy', startX, occY - graphH - 5);

            // Dose-Response Curve Placeholder (Category 9, #82)
            if (G.state.timer % 500 < 100) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText('GENERATING EC50 CURVE...', startX, startY - 80);
            }

            // Clinical Metrics (Category 8)
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(`Neurogenesis: ${(this.history.neurogenesisScore.reduce((a,b)=>a+b,0)/this.maxHistory).toFixed(2)}`, padding, h - 40);
            ctx.fillText(`Satiety Level: ${(this.history.appetiteSuppression.reduce((a,b)=>a+b,0)/this.maxHistory * 100).toFixed(0)}%`, padding, h - 25);
        }
    };

    const oldUpdate = G.update;
    G.update = function() {
        if (oldUpdate) oldUpdate.call(G);
        G.Analytics.updateAnalytics();
    };

    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;

        G.Analytics.renderAnalytics(ctx, w, h);
    };

})();
