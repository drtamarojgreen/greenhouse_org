/**
 * @file dopamine_analytics.js
 * @description Analytics and tracking for Dopamine Simulation.
 * Covers Enhancements 42 (Metabolite Tracking), 99 (Dose-Response), and 100 (Drug Combinations).
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.analyticsState = {
        history: {
            da: [],
            camp: [],
            potential: [],
            pka: []
        },
        doseResponse: {
            points: [],
            active: false,
            currentDrug: null
        },
        drugCombinations: [],
        maxHistory: 200
    };

    G.updateAnalytics = function () {
        const sState = G.synapseState;
        const mState = G.molecularState;
        const eState = G.electroState;
        const aState = G.analyticsState;

        // Track history
        if (sState) aState.history.da.push(sState.cleftDA.length);
        if (mState) {
            aState.history.camp.push(mState.campMicrodomains.length);
            aState.history.pka.push(mState.pka.cat);
        }
        if (eState) aState.history.potential.push(eState.membranePotential);

        Object.values(aState.history).forEach(h => {
            if (h.length > aState.maxHistory) h.shift();
        });

        // 99. Dose-Response Curve Generation
        // If a drug is selected in pharmacology, simulate its effect across doses
        const pState = G.pharmacologyState;
        if (pState && pState.activeDrugs && pState.activeDrugs.length > 0) {
            aState.doseResponse.active = true;
            const latestDrug = pState.activeDrugs[pState.activeDrugs.length - 1];
            if (aState.doseResponse.currentDrug !== latestDrug.name) {
                aState.doseResponse.currentDrug = latestDrug.name;
                aState.doseResponse.points = [];
                // Generate virtual curve points
                for (let dose = 0.1; dose <= 10; dose += 0.5) {
                    // Simplified Hill equation: Effect = Max * (Dose^n / (EC50^n + Dose^n))
                    const hill = (Math.pow(dose, 2) / (Math.pow(1.0, 2) + Math.pow(dose, 2)));
                    const efficacy = latestDrug.efficacy || 1.0;
                    const effect = efficacy * hill;
                    aState.doseResponse.points.push({ dose, effect });
                }
            }
        } else if (pState && pState.selectedDrug) {
            // Also handle a single selected drug
            aState.doseResponse.active = true;
            if (aState.doseResponse.currentDrug !== pState.selectedDrug.name) {
                aState.doseResponse.currentDrug = pState.selectedDrug.name;
                aState.doseResponse.points = [];
                for (let dose = 0.1; dose <= 10; dose += 0.5) {
                    const hill = (Math.pow(dose, 2) / (Math.pow(1.0, 2) + Math.pow(dose, 2)));
                    aState.doseResponse.points.push({ dose, effect: hill });
                }
            }
        } else {
            aState.doseResponse.active = false;
        }

        // 100. Drug Combination Testing
        if (pState && pState.activeDrugs) {
            aState.drugCombinations = pState.activeDrugs.map(d => d.name);
        }

        // Update UI metrics in the left panel
        if (G.leftPanel && G.updateMetric) {
            if (G.synapseState && G.synapseState.metabolites) {
                const m = G.synapseState.metabolites;
                G.updateMetric(G.leftPanel, 'Metabolites', 'DOPAC (µM)', m.dopac.toFixed(2));
                G.updateMetric(G.leftPanel, 'Metabolites', 'HVA (µM)', m.hva.toFixed(2));
                G.updateMetric(G.leftPanel, 'Metabolites', '3-MT (µM)', m['3mt'].toFixed(2));
            }
        }
    };

    G.renderAnalytics = function (ctx) {
        const w = G.width;
        const h = G.height;
        const aState = G.analyticsState;

        // Render Dose-Response Curve (if active)
        if (aState.doseResponse.active && aState.doseResponse.points.length > 0) {
            const graphW = 150;
            const graphH = 100;
            const startX = w - 170;
            const startY = 150;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(startX, startY, graphW, graphH);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(startX, startY, graphW, graphH);

            ctx.beginPath();
            ctx.strokeStyle = '#00ff00';
            aState.doseResponse.points.forEach((p, i) => {
                const x = startX + (p.dose / 10) * graphW;
                const y = startY + graphH - (p.effect * graphH);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Dose-Response: ${aState.doseResponse.currentDrug}`, startX + graphW/2, startY - 5);
        }

        // Render mini history sparks
        renderSpark(ctx, aState.history.da, 10, 50, 'DA', '#0f0');
        renderSpark(ctx, aState.history.camp, 10, 80, 'cAMP', '#ff0');
    };

    function renderSpark(ctx, data, x, y, label, color) {
        if (!data || data.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const max = Math.max(...data, 1);
        data.forEach((val, i) => {
            const px = x + i * 0.5;
            const py = y - (val / max) * 20;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.fillText(label, x + data.length * 0.5 + 5, y);
    }

})();
