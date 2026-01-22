/**
 * @file dopamine_scientific.js
 * @description Scientific Dashboard and 100 Enhancements Tracker for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.enhancements = [
        { id: 1, cat: "Molecular", desc: "D1-D2 Heteromerization", status: "Active" },
        { id: 2, cat: "Molecular", desc: "G-Protein Cycle", status: "Active" },
        { id: 3, cat: "Molecular", desc: "GTP/GDP Exchange Rates", status: "Active" },
        { id: 4, cat: "Molecular", desc: "Gs vs. Gi/o Selectivity", status: "Active" },
        { id: 5, cat: "Molecular", desc: "Gq Pathway", status: "Active" },
        { id: 6, cat: "Molecular", desc: "Regulators of G-protein Signaling (RGS)", status: "Active" },
        { id: 7, cat: "Molecular", desc: "Beta-Arrestin Recruitment", status: "Active" },
        { id: 8, cat: "Molecular", desc: "GRK Phosphorylation", status: "Active" },
        { id: 9, cat: "Molecular", desc: "Receptor Internalization", status: "Active" },
        { id: 10, cat: "Molecular", desc: "Receptor Recycling", status: "Active" },
        { id: 11, cat: "Molecular", desc: "Adenylate Cyclase Isoforms (AC5)", status: "Active" },
        { id: 12, cat: "Molecular", desc: "cAMP Microdomains", status: "Active" },
        { id: 13, cat: "Molecular", desc: "PKA Holoenzyme Dynamics", status: "Active" },
        { id: 14, cat: "Molecular", desc: "DARPP-32 Cycle (Thr34/Thr75)", status: "Active" },
        { id: 15, cat: "Molecular", desc: "PP1 Inhibition", status: "Active" },
        { id: 16, cat: "Molecular", desc: "ERK/MAPK Cascade", status: "Active" },
        { id: 17, cat: "Molecular", desc: "Phosphodiesterase (PDE) Activity", status: "Active" },
        { id: 18, cat: "Molecular", desc: "IP3 Dynamics & ER Interaction", status: "Active" },
        { id: 19, cat: "Molecular", desc: "DAG Signaling", status: "Active" },
        { id: 20, cat: "Molecular", desc: "Calmodulin/CaMKII Activation", status: "Active" },
        { id: 21, cat: "Presynaptic", desc: "Tyrosine Hydroxylase (TH) Regulation", status: "Active" },
        { id: 22, cat: "Presynaptic", desc: "L-DOPA Flux", status: "Active" },
        { id: 23, cat: "Presynaptic", desc: "DOPA Decarboxylase (DDC)", status: "Active" },
        { id: 24, cat: "Presynaptic", desc: "VMAT2 Transport", status: "Active" },
        { id: 25, cat: "Presynaptic", desc: "Vesicle Filling Kinetics", status: "Active" },
        { id: 26, cat: "Presynaptic", desc: "Readily Releasable Pool (RRP)", status: "Active" },
        { id: 27, cat: "Presynaptic", desc: "SNARE Complex Assembly", status: "Active" },
        { id: 28, cat: "Presynaptic", desc: "Synaptotagmin Calcium Sensing", status: "Active" },
        { id: 29, cat: "Presynaptic", desc: "Phasic Release Patterns", status: "Active" },
        { id: 30, cat: "Presynaptic", desc: "Tonic Release Levels", status: "Active" },
        { id: 31, cat: "Presynaptic", desc: "D2-Short Autoreceptor Feedback", status: "Active" },
        { id: 32, cat: "Presynaptic", desc: "Ca2+ Channel Inhibition", status: "Active" },
        { id: 33, cat: "Presynaptic", desc: "Kiss-and-Run Fusion", status: "Active" },
        { id: 34, cat: "Presynaptic", desc: "Vesicle Endocytosis", status: "Active" },
        { id: 35, cat: "Presynaptic", desc: "Axon Terminal Geometry", status: "Active" },
        { id: 36, cat: "Synaptic", desc: "DAT-Mediated Reuptake (Na+/Cl-)", status: "Active" },
        { id: 37, cat: "Synaptic", desc: "DAT Phosphorylation", status: "Active" },
        { id: 38, cat: "Synaptic", desc: "Volume Transmission", status: "Active" },
        { id: 39, cat: "Synaptic", desc: "Tortuosity & Extracellular Space", status: "Active" },
        { id: 40, cat: "Synaptic", desc: "Monoamine Oxidase (MAO)", status: "Active" },
        { id: 41, cat: "Synaptic", desc: "COMT Degradation", status: "Active" },
        { id: 42, cat: "Synaptic", desc: "Metabolite Tracking (DOPAC/HVA)", status: "Active" },
        { id: 43, cat: "Synaptic", desc: "Astrocyte Reuptake", status: "Active" },
        { id: 44, cat: "Synaptic", desc: "Competitive Inhibition at DAT", status: "Active" },
        { id: 45, cat: "Synaptic", desc: "Synaptic Cleft Concentration Profile", status: "Active" },
        { id: 46, cat: "Electrophys", desc: "GIRK Channel Activation", status: "Active" },
        { id: 47, cat: "Electrophys", desc: "HCN Channel Modulation (Ih)", status: "Active" },
        { id: 48, cat: "Electrophys", desc: "L-type Ca2+ Channel Modulation", status: "Active" },
        { id: 49, cat: "Electrophys", desc: "NMDA Receptor Potentiation", status: "Active" },
        { id: 50, cat: "Electrophys", desc: "AMPA Receptor Trafficking", status: "Active" },
        { id: 51, cat: "Electrophys", desc: "Nav1.6 Channel Modulation", status: "Active" },
        { id: 52, cat: "Electrophys", desc: "Resting Potential (Kir2)", status: "Active" },
        { id: 53, cat: "Electrophys", desc: "Up-state/Down-state Transitions", status: "Active" },
        { id: 54, cat: "Electrophys", desc: "Action Potential Back-propagation", status: "Active" },
        { id: 55, cat: "Electrophys", desc: "Tonic GABAergic Inhibition", status: "Active" },
        { id: 56, cat: "Electrophys", desc: "SK Channels / AHP", status: "Active" },
        { id: 57, cat: "Electrophys", desc: "Gap Junction Coupling", status: "Active" },
        { id: 58, cat: "Electrophys", desc: "Shunting Inhibition", status: "Active" },
        { id: 59, cat: "Electrophys", desc: "STDP Dopamine-gate", status: "Active" },
        { id: 60, cat: "Electrophys", desc: "Input Resistance Scaling", status: "Active" },
        { id: 61, cat: "Plasticity", desc: "LTP Modeling (D1-MSN)", status: "Active" },
        { id: 62, cat: "Plasticity", desc: "LTD Modeling (D2-MSN)", status: "Active" },
        { id: 63, cat: "Plasticity", desc: "Endocannabinoid (eCB) Signaling", status: "Active" },
        { id: 64, cat: "Plasticity", desc: "Dendritic Spine Remodeling", status: "Active" },
        { id: 65, cat: "Plasticity", desc: "CREB Activation", status: "Active" },
        { id: 66, cat: "Plasticity", desc: "Immediate Early Gene (IEG) Induction", status: "Active" },
        { id: 67, cat: "Plasticity", desc: "DeltaFosB Accumulation", status: "Active" },
        { id: 68, cat: "Plasticity", desc: "Epigenetic Modifications", status: "Active" },
        { id: 69, cat: "Plasticity", desc: "Protein Synthesis", status: "Active" },
        { id: 70, cat: "Plasticity", desc: "BDNF Interaction", status: "Active" },
        { id: 71, cat: "Circuit", desc: "Direct vs. Indirect Pathways", status: "Active" },
        { id: 72, cat: "Circuit", desc: "SNc Projections", status: "Active" },
        { id: 73, cat: "Circuit", desc: "VTA Projections", status: "Active" },
        { id: 74, cat: "Circuit", desc: "Striosome vs. Matrix", status: "Active" },
        { id: 75, cat: "Circuit", desc: "Cholinergic Interneuron Pause", status: "Active" },
        { id: 76, cat: "Circuit", desc: "GABAergic Interneuron Modulation", status: "Active" },
        { id: 77, cat: "Circuit", desc: "Glutamate Co-transmission", status: "Active" },
        { id: 78, cat: "Circuit", desc: "Feedback Loops", status: "Active" },
        { id: 79, cat: "Circuit", desc: "3D Brain Atlas Integration", status: "Active" },
        { id: 80, cat: "Circuit", desc: "Tripartite Synapse", status: "Active" },
        { id: 81, cat: "Clinical", desc: "Parkinsonian DA Depletion", status: "Active" },
        { id: 82, cat: "Clinical", desc: "L-DOPA Induced Dyskinesia", status: "Active" },
        { id: 83, cat: "Clinical", desc: "Schizophrenia D2 Overactivity", status: "Active" },
        { id: 84, cat: "Clinical", desc: "Addiction-Related Plasticity", status: "Active" },
        { id: 85, cat: "Clinical", desc: "ADHD DAT Polymorphisms", status: "Active" },
        { id: 86, cat: "Clinical", desc: "Neuroinflammation Effects", status: "Active" },
        { id: 87, cat: "Clinical", desc: "Alpha-Synuclein Pathology", status: "Active" },
        { id: 88, cat: "Clinical", desc: "Oxidative Stress", status: "Active" },
        { id: 89, cat: "Clinical", desc: "D2 Receptor Supersensitivity", status: "Active" },
        { id: 90, cat: "Clinical", desc: "HPA Axis Interaction", status: "Active" },
        { id: 91, cat: "Pharmacology", desc: "D1 Agonist/Antagonist Library", status: "Active" },
        { id: 92, cat: "Pharmacology", desc: "D2 Agonist/Antagonist Library", status: "Active" },
        { id: 93, cat: "Pharmacology", desc: "Cocaine Simulation", status: "Active" },
        { id: 94, cat: "Pharmacology", desc: "Amphetamine Mechanism", status: "Active" },
        { id: 95, cat: "Pharmacology", desc: "MAO Inhibitors (MAOIs)", status: "Active" },
        { id: 96, cat: "Pharmacology", desc: "Antipsychotic Binding Kinetics", status: "Active" },
        { id: 97, cat: "Pharmacology", desc: "Partial Agonism", status: "Active" },
        { id: 98, cat: "Pharmacology", desc: "Allosteric Modulators (PAMs)", status: "Active" },
        { id: 99, cat: "Pharmacology", desc: "Dose-Response Curve Generation", status: "Active" },
        { id: 100, cat: "Pharmacology", desc: "Drug Combination Testing", status: "Active" }
    ];

    G.showScientificDashboard = function () {
        let modal = document.getElementById('scientific-dashboard-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'scientific-dashboard-modal';
            modal.style.position = 'fixed';
            modal.style.top = '50px';
            modal.style.left = '50px';
            modal.style.right = '50px';
            modal.style.bottom = '50px';
            modal.style.backgroundColor = 'rgba(10, 10, 30, 0.95)';
            modal.style.color = '#fff';
            modal.style.zIndex = '1000';
            modal.style.padding = '20px';
            modal.style.borderRadius = '15px';
            modal.style.border = '2px solid #4fd1c5';
            modal.style.overflowY = 'auto';
            modal.style.display = 'none';
            document.body.appendChild(modal);
        }

        const stats = G.getSimulationStats();

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4fd1c5; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #4fd1c5;">Scientific Analysis Dashboard</h2>
                <button onclick="document.getElementById('scientific-dashboard-modal').style.display='none'" style="background: #f56565; color: #fff; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">Close</button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; grid-column: span 2;">
                    <div style="display: flex; justify-content: space-between;">
                        <h3 style="margin-top: 0;">Real-Time Time-Series Analytics</h3>
                        <h3 style="margin-top: 0;">Spatial DA Map (Top-Down)</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <canvas id="scientific-time-series" width="600" height="150" style="width: 70%; border: 1px solid #4fd1c5;"></canvas>
                        <canvas id="scientific-spatial-map" width="200" height="150" style="width: 25%; border: 1px solid #4fd1c5;"></canvas>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                    <h3>Live Bio-Metrics</h3>
                    <p>Membrane Potential: ${G.electroState ? G.electroState.membranePotential.toFixed(2) : -80} mV</p>
                    <p>Synaptic Strength: ${G.plasticityState ? G.plasticityState.synapticStrength.toFixed(3) : 1.000}</p>
                    <p>DOPAC Levels: ${G.synapseState ? G.synapseState.metabolites.dopac.toFixed(3) : 0} µM</p>
                    <p>HVA Levels: ${G.synapseState ? G.synapseState.metabolites.hva.toFixed(3) : 0} µM</p>
                    <p>DARPP-32 (pThr34): ${G.molecularState ? (G.molecularState.darpp32.thr34 * 100).toFixed(1) : 0}%</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                    <h3>Circuit Summary</h3>
                    <p>Active Pathway: ${G.state.mode}</p>
                    <p>SNc Feedback Loop: ${G.circuitState ? (G.circuitState.feedback.sncActivity * 100).toFixed(1) : 100}%</p>
                    <p>Spine Density: ${G.plasticityState ? G.plasticityState.spineDensity.toFixed(3) : 1.000}</p>
                    <p>DeltaFosB (Accumulated): ${G.plasticityState ? G.plasticityState.deltaFosB.toFixed(5) : 0}</p>
                </div>
            </div>

            <h3>100 Proposed Enhancements Tracking</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px;">
                ${G.enhancements.map(e => `
                    <div style="padding: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid ${e.status === 'Active' ? '#48bb78' : '#cbd5e0'}; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9em;"><strong style="color: #4fd1c5;">${e.id}.</strong> ${e.desc}</span>
                        <span style="font-size: 0.7em; padding: 2px 5px; border-radius: 3px; background: ${e.status === 'Active' ? '#2f855a' : '#4a5568'};">${e.status}</span>
                    </div>
                `).join('')}
            </div>
        `;

        modal.style.display = 'block';

        // Start live chart update
        if (G._sciChartInterval) clearInterval(G._sciChartInterval);
        G._sciChartInterval = setInterval(() => {
            const canvas = document.getElementById('scientific-time-series');
            const sCanvas = document.getElementById('scientific-spatial-map');
            if (!canvas || !sCanvas) {
                clearInterval(G._sciChartInterval);
                return;
            }
            const ctx = canvas.getContext('2d');
            const sCtx = sCanvas.getContext('2d');
            const data = G.analyticsState ? G.analyticsState.history : null;
            if (!data) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw cAMP (Yellow)
            drawSeries(ctx, data.camp, '#ffff00', 'cAMP', 0);
            // Draw DA (Green)
            drawSeries(ctx, data.da, '#00ff00', 'DA Conc', 40);
            // Draw Potential (Cyan)
            drawSeries(ctx, data.potential, '#00ffff', 'Potential', 80, -90, 40);

            // 45. Spatial DA Map Rendering (Top-down view of synaptic volume)
            sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
            sCtx.fillStyle = '#000';
            sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
            if (G.synapseState && G.synapseState.cleftDA) {
                sCtx.globalAlpha = 0.5;
                G.synapseState.cleftDA.forEach(da => {
                    const sx = (da.x + 300) / 600 * sCanvas.width;
                    const sy = (da.z + 150) / 300 * sCanvas.height;
                    sCtx.fillStyle = '#0f0';
                    sCtx.beginPath();
                    sCtx.arc(sx, sy, 2, 0, Math.PI * 2);
                    sCtx.fill();
                });
                sCtx.globalAlpha = 1.0;
            }
        }, 100);
    };

    function drawSeries(ctx, series, color, label, yOffset, minVal = 0, maxVal = 50) {
        if (!series || series.length < 2) return;
        const w = ctx.canvas.width;
        const h = 40;
        ctx.strokeStyle = color;
        ctx.beginPath();
        series.forEach((v, i) => {
            const x = (i / 200) * w;
            const norm = (v - minVal) / (maxVal - minVal);
            const y = yOffset + h - (norm * h);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '10px Arial';
        ctx.fillText(label, 5, yOffset + 10);
    }

    G.getSimulationStats = function() {
        // Collect real-time data for the dashboard
        return {
            potential: G.electroState ? G.electroState.membranePotential : -80,
            strength: G.plasticityState ? G.plasticityState.synapticStrength : 1.0
        };
    };

})();
