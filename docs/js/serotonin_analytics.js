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
            appetiteSuppression: [],
            ec50Data: []
        },
        maxHistory: 100,
        sensitivityData: {},

        updateAnalytics() {
            if (!G.isRunning) return;

            // Pathway Flux Analysis (Category 9, #84)
            // Net flux = Synthesis - Degradation - Reuptake (detailed pool delta)
            const synthesisFlux = G.Transport ? G.Transport.synthesisRate * G.Transport.tphActivity : 0;
            const htpFlux = G.Transport ? G.Transport.htp5 * 0.1 : 0;
            const degradationFlux = G.Transport ? G.Transport.degradationRate * G.Transport.maoActivity : 0;
            this.sensitivityData.netFlux = (synthesisFlux + htpFlux - degradationFlux).toFixed(3);

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
            let occupancy = 0;
            if (G.state.receptors) {
                const occupiedCount = G.state.receptors.filter(r => r.state !== 'Inactive').length;
                occupancy = occupiedCount / G.state.receptors.length;
                this.history.receptorOccupancy.push(occupancy);
                if (this.history.receptorOccupancy.length > this.maxHistory) this.history.receptorOccupancy.shift();
            }

            // EC50 Data Collection (Category 9, #82)
            if (G.state.timer % 10 === 0) {
                this.history.ec50Data.push({ conc: extracellular, resp: occupancy });
                if (this.history.ec50Data.length > 50) this.history.ec50Data.shift();
            }

            // Sensitivity Analysis (Category 9, #86)
            // Correlation between synthesis activity and extracellular tone
            const tph = G.Transport ? G.Transport.tphActivity : 1;
            this.sensitivityData.synthesisDrive = (extracellular / (tph + 0.1)).toFixed(2);
        },

        exportData() {
            // Export simulation data (Category 9, #88)
            const data = {
                timestamp: Date.now(),
                state: G.state,
                history: this.history,
                sensitivity: this.sensitivityData
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `serotonin_sim_export_${data.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },

        renderAnalytics(ctx, w, h) {
            // Status Bar HUD (Category III, #47)
            if (G.showStatusBar) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(0, h - 30, w, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '11px Arial';
                let mood = 'Euthymic';
                if (G.Transport && G.Transport.tphActivity < 0.5) mood = 'Depressed';
                if (G.ssActive) mood = 'Serotonin Syndrome';
                ctx.fillText(`SYSTEM STATUS: ${mood} | 5-HT: ${G.Transport ? G.Transport.vesicle5HT.toFixed(1) : '0'} | FPS: ${G.fps || 0}`, 20, h - 10);
            }

            // Comparison View Data (Category 10, #97)
            if (G.comparisonMode) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fillRect(0, 0, w/2, h);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(w/2, 0, w/2, h);
                ctx.fillStyle = '#fff';
                ctx.fillText('HEALTHY', 50, 30);
                ctx.fillText('PATHOLOGICAL', w - 100, 30);
            }

            // Spatial Heatmap (Category 9, #85)
            // Simplified: Draw a grid and color based on nearby particles
            const gridScale = 20;
            ctx.globalAlpha = 0.15;
            if (G.Kinetics && G.Kinetics.activeLigands) {
                G.Kinetics.activeLigands.forEach(l => {
                    if (l.name === 'Serotonin') {
                        // Project 3D to 2D for heatmap center
                        const cam = G.state.camera;
                        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
                        const p = project(l.x, l.y, l.z, cam, { width: w, height: h, near: 10, far: 5000 });
                        if (p.scale > 0) {
                            ctx.fillStyle = '#00ffcc';
                            ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
                        }
                    }
                });
            }
            ctx.globalAlpha = 1.0;

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

            // Dose-Response Curve (Category 9, #82)
            const drX = startX;
            const drY = startY - 100;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(drX - 5, drY - graphH - 10, graphW + 10, graphH + 20);
            ctx.strokeStyle = '#ff00ff';
            ctx.beginPath();
            const sortedData = [...this.history.ec50Data].sort((a,b) => a.conc - b.conc);
            sortedData.forEach((d, i) => {
                const x = drX + (d.conc / 30) * graphW;
                const y = drY - (d.resp * graphH);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText('EC50 Curve (Conc vs Resp)', drX, drY - graphH - 5);

            // Sensitivity HUD
            ctx.fillText(`Sensitivity (Synth Drive): ${this.sensitivityData.synthesisDrive}`, drX, drY + 20);
            ctx.fillText(`Net Flux: ${this.sensitivityData.netFlux}`, drX, drY + 35);

            // Clinical Metrics (Category 8)
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(`Neurogenesis: ${(this.history.neurogenesisScore.reduce((a,b)=>a+b,0)/this.maxHistory).toFixed(2)}`, padding, h - 40);
            ctx.fillText(`Satiety Level: ${(this.history.appetiteSuppression.reduce((a,b)=>a+b,0)/this.maxHistory * 100).toFixed(0)}%`, padding, h - 25);
        }
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
