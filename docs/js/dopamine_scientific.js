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
        { id: 79, cat: "Circuit", desc: "Intracellular Coordinate Mapping", status: "Active" },
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
            modal.style.top = '30px';
            modal.style.left = '30px';
            modal.style.right = '30px';
            modal.style.bottom = '30px';
            modal.style.backgroundColor = 'rgba(10, 10, 30, 0.98)';
            modal.style.color = '#fff';
            modal.style.zIndex = '1000';
            modal.style.padding = '25px';
            modal.style.borderRadius = '20px';
            modal.style.border = '2px solid #4fd1c5';
            modal.style.overflowY = 'auto';
            modal.style.display = 'none';
            modal.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4fd1c5; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #4fd1c5; font-size: 24px; letter-spacing: 1px;">SCIENTIFIC ANALYSIS DASHBOARD</h2>
                <button onclick="document.getElementById('scientific-dashboard-modal').style.display='none'" style="background: #f56565; color: #fff; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">CLOSE</button>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px;">
                <!-- Analytics Section -->
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(79, 209, 197, 0.3);">
                    <h3 style="margin-top: 0; color: #4fd1c5;">Real-Time Kinematics</h3>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                        <div>
                            <span style="font-size: 12px; color: #aaa;">Signal Transduction (cAMP/DA/Potential)</span>
                            <canvas id="scientific-time-series" width="600" height="150" style="width: 100%; border: 1px solid rgba(255,255,255,0.1); margin-top: 5px;"></canvas>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: start;">
                            <div style="flex: 1;">
                                <span style="font-size: 12px; color: #aaa;">Spatial DA Flux (X-Z Projection)</span>
                                <canvas id="scientific-spatial-map" width="200" height="150" style="width: 100%; border: 1px solid rgba(255,255,255,0.1); margin-top: 5px;"></canvas>
                            </div>
                            <div style="flex: 2; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                                <h4 style="margin: 0 0 10px 0; color: #fff; font-size: 14px;">Scientific Abstract</h4>
                                <p style="font-size: 11px; line-height: 1.4; color: #ccc; margin: 0;">
                                    This simulation models high-fidelity intracellular dopamine signaling and <b>striatal gating logic</b>.
                                    <b>Brown Neurons</b> represent <b>Striosome</b> (patch) compartments at the cellular level.
                                    The surrounding <b>Cyan Lattice</b> represents the <b>Matrix</b> environment.
                                    The <b>Green Halo</b> visualizes <b>Volume Transmission</b>, where DA diffuses beyond the synaptic cleft.
                                    <br><br><i>Disclaimer: Conceptual educational model; not a diagnostic or molecular simulation.</i>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Live Metrics Section -->
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(79, 209, 197, 0.3);">
                    <h3 style="margin-top: 0; color: #4fd1c5;">Live Bio-Metrics</h3>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <div style="display: flex; justify-content: space-between;"><span>Potential:</span> <span id="val-potential" style="color: #0ff;">-80 mV</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Synaptic Weight:</span> <span id="val-weight" style="color: #ff0;">1.000</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>DOPAC / HVA:</span> <span id="val-metabolites" style="color: #f0f;">0.00 / 0.00</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>DARPP-32 pT34:</span> <span id="val-darpp" style="color: #0f0;">0.0%</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>DeltaFosB:</span> <span id="val-fosb" style="color: #f99;">0.000</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>SNc Feedback:</span> <span id="val-snc" style="color: #99f;">100%</span></div>
                        <div style="display: flex; justify-content: space-between;"><span>Spine Density:</span> <span id="val-spine" style="color: #fff;">1.000</span></div>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: rgba(0,255,0,0.1); border-radius: 8px; font-size: 11px; color: #9f9;">
                        <strong>System Status:</strong> 100 Enhancements Integrated. High-fidelity molecular and circuit dynamics active.
                    </div>
                </div>
            </div>

            <h3 style="color: #4fd1c5; border-bottom: 1px solid rgba(79, 209, 197, 0.3); padding-bottom: 10px;">100 Physiological Enhancements Tracking</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-top: 15px;">
                ${G.enhancements.map(e => `
                    <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 4px solid ${e.status === 'Active' ? '#48bb78' : '#cbd5e0'}; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 10px; color: #888; text-transform: uppercase;">${e.cat}</span>
                            <span style="font-size: 12px; font-weight: 500;"><strong style="color: #4fd1c5; margin-right: 5px;">${e.id}.</strong> ${e.desc}</span>
                        </div>
                        <span style="font-size: 9px; padding: 3px 8px; border-radius: 4px; background: ${e.status === 'Active' ? 'rgba(72, 187, 120, 0.2)' : '#4a5568'}; color: ${e.status === 'Active' ? '#48bb78' : '#fff'}; border: 1px solid ${e.status === 'Active' ? '#48bb78' : 'transparent'};">${e.status}</span>
                    </div>
                `).join('')}
            </div>
        `;

        modal.style.display = 'block';

        if (G._sciChartInterval) clearInterval(G._sciChartInterval);
        G._sciChartInterval = setInterval(() => {
            const canvas = document.getElementById('scientific-time-series');
            const sCanvas = document.getElementById('scientific-spatial-map');
            if (!canvas || !sCanvas) {
                clearInterval(G._sciChartInterval);
                return;
            }

            // Update Metric Text
            if (G.electroState) document.getElementById('val-potential').innerText = `${G.electroState.membranePotential.toFixed(1)} mV`;
            if (G.plasticityState) document.getElementById('val-weight').innerText = G.plasticityState.synapticStrength.toFixed(3);
            if (G.synapseState) document.getElementById('val-metabolites').innerText = `${G.synapseState.metabolites.dopac.toFixed(2)} / ${G.synapseState.metabolites.hva.toFixed(2)}`;
            if (G.molecularState) document.getElementById('val-darpp').innerText = `${(G.molecularState.darpp32.thr34 * 100).toFixed(1)}%`;
            if (G.plasticityState) document.getElementById('val-fosb').innerText = G.plasticityState.deltaFosB.toFixed(5);
            if (G.circuitState) document.getElementById('val-snc').innerText = `${(G.circuitState.feedback.sncActivity * 100).toFixed(0)}%`;
            if (G.plasticityState) document.getElementById('val-spine').innerText = G.plasticityState.spineDensity.toFixed(3);

            const ctx = canvas.getContext('2d');
            const sCtx = sCanvas.getContext('2d');
            const data = G.analyticsState ? G.analyticsState.history : null;
            if (!data) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawSeries(ctx, data.camp, '#ffff00', 'cAMP (pM)', 0);
            drawSeries(ctx, data.da, '#00ff00', 'DA Conc (nM)', 40);
            drawSeries(ctx, data.potential, '#00ffff', 'Membrane (mV)', 80, -90, 40);

            sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
            sCtx.fillStyle = '#000';
            sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
            if (G.synapseState && G.synapseState.cleftDA) {
                sCtx.globalAlpha = 0.6;
                G.synapseState.cleftDA.forEach(da => {
                    const sx = (da.x + 300) / 600 * sCanvas.width;
                    const sy = (da.z + 150) / 300 * sCanvas.height;
                    sCtx.fillStyle = '#0f0';
                    sCtx.beginPath();
                    sCtx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                    sCtx.fill();
                });
                sCtx.globalAlpha = 1.0;
            }
            // Draw cleft boundaries in map
            sCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            sCtx.strokeRect(0, 0, sCanvas.width, sCanvas.height);
        }, 100);
    };

    function drawSeries(ctx, series, color, label, yOffset, minVal = 0, maxVal = 50) {
        if (!series || series.length < 2) return;
        const w = ctx.canvas.width;
        const h = 35;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
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
        ctx.font = 'bold 9px Arial';
        ctx.fillText(label, 5, yOffset + 10);
    }
})();
