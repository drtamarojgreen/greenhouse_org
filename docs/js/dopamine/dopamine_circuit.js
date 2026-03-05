/**
 * @file dopamine_circuit.js
 * @description Anatomical and circuit integration for Dopamine Simulation.
 * Covers Enhancements 71-80.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.circuitState = {
        pathways: {
            direct: { color: '#ff4d4d', active: false, label: 'Direct Pathway (D1-MSN)' },
            indirect: { color: '#4d79ff', active: false, label: 'Indirect Pathway (D2-MSN)' }
        },
        msnPopulations: {
            d1: [], // 71. Distinct MSN populations
            d2: []
        },
        feedback: { gain: 1.0, sncActivity: 1.0 }, // 78. Feedback Loops
        projections: {
            snc: { x: -350, y: -450, z: -50, label: 'SNc (Nigrostriatal)' },
            vta: { x: 350, y: -450, z: 50, label: 'VTA (Mesolimbic)' },
            pfc: { x: 0, y: -550, z: 200, label: 'PFC (Mesocortical)' }
        },
        compartments: {
            striosome: { active: false, density: 1.5, color: 'rgba(255, 255, 0, 0.1)' },
            matrix: { active: true, density: 1.0, color: 'rgba(0, 255, 255, 0.05)' },
            dorsal: { x: 0, y: -100, label: 'Dorsal Striatum (Motor)' },
            ventral: { x: 0, y: 100, label: 'Ventral Striatum (NAc/Reward)' }
        },
        interneurons: {
            cholinergic: { firing: true, pauseTimer: 0 },
            gabaergic: {
                pv: { x: -150, y: 150, z: 100, active: 0.5, label: 'PV+' },
                som: { x: 150, y: 150, z: -100, active: 0.3, label: 'SOM+' }
            } // 76. GABAergic Interneuron Modulation
        },
        astrocytes: [] // 80. Tripartite Synapse
    };

    // Initialize MSN Populations
    for (let i = 0; i < 10; i++) {
        G.circuitState.msnPopulations.d1.push({
            x: -200 + (Math.random() - 0.5) * 100,
            y: 300 + (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 100
        });
        G.circuitState.msnPopulations.d2.push({
            x: 200 + (Math.random() - 0.5) * 100,
            y: 300 + (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 100
        });
    }

    // Initialize Astrocytes
    for (let i = 0; i < 5; i++) {
        G.circuitState.astrocytes.push({
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 600,
            z: (Math.random() - 0.5) * 200,
            radius: 50 + Math.random() * 50
        });
    }

    // Helper: Draw organic striosome patch
    function drawStriosome(ctx, cx, cy, radius) {
        ctx.beginPath();
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const noise = 1 + Math.sin(angle * 3 + G.state.timer * 0.05) * 0.15;
            const r = radius * noise;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.strokeStyle = "rgba(139, 69, 19, 0.6)";
        ctx.fillStyle = "rgba(139, 69, 19, 0.15)";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // Helper: Populate striosome with MSNs
    function populateStriosome(ctx, cx, cy, radius, count) {
        for (let i = 0; i < count; i++) {
            const angle = (i * 137.5) * (Math.PI / 180);
            const r = Math.sqrt((i + 1) / count) * (radius * 0.7); // Fermat's spiral distribution
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            ctx.fillStyle = "rgba(139, 69, 19, 0.8)";
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Helper: Draw Matrix Lattice Field
    function drawMatrixLattice(ctx, w, h, spacing) {
        ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
        for (let x = spacing / 2; x < w; x += spacing) {
            for (let y = spacing / 2; y < h; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Helper: Draw Matrix Flow Vectors
    function drawMatrixFlow(ctx, w, h, time) {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 20; x < w; x += 40) {
            for (let y = 20; y < h; y += 40) {
                const angle = Math.sin(x * 0.01 + time * 0.02) + Math.cos(y * 0.01 + time * 0.01);
                const dx = Math.cos(angle) * 5;
                const dy = Math.sin(angle) * 5;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + dx, y + dy);
                ctx.stroke();
            }
        }
    }

    // Initialize Realistic Brain Mesh
    G.initRealisticBrain = function() {
        if (window.GreenhouseBrainMeshRealistic) {
            G.circuitState.brainMesh = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
            console.log("Realistic Brain Mesh Generated.");
        }
    };

    G.updateCircuit = function () {
        const state = G.state;
        const cState = G.circuitState;
        const sState = G.synapseState;

        // 71. Direct vs. Indirect
        cState.pathways.direct.active = state.mode.includes('D1');
        cState.pathways.indirect.active = state.mode.includes('D2');

        // 72-73. Pathway specific kinetics
        if (state.mode.includes('SNc') || state.mode.includes('Dorsal') || state.mode === 'Parkinsonian') {
            // Nigrostriatal Pathway: High DAT density
            if (sState) {
                sState.dat.activity = state.mode === 'Parkinsonian' ? 0.2 : 1.5;
                sState.tortuosity = 1.8; // Denser tissue
            }
            // 72. Highlight SNc Projections
            cState.projections.snc.active = true;
            if (cState.projections.vta) cState.projections.vta.active = false;
        } else if (state.mode.includes('VTA') || state.mode.includes('Ventral') || state.mode === 'Schizophrenia') {
            // Mesolimbic Pathway: Lower DAT, more volume transmission
            if (sState) {
                sState.dat.activity = state.mode === 'Schizophrenia' ? 1.0 : 0.6;
                sState.tortuosity = 1.3; // More open space for diffusion
            }
            // 73. Highlight VTA Projections
            cState.projections.vta.active = true;
            if (cState.projections.snc) cState.projections.snc.active = false;
        }

        // 75. Cholinergic Interneuron "Pause" (specifically in Ventral Striatum / NAc)
        const isVentral = state.mode.includes('Ventral') || state.mode.includes('VTA');
        const pauseThreshold = isVentral ? 60 : 120; // Ventral is more sensitive to DA transients
        if (sState && sState.cleftDA.length > pauseThreshold) {
            cState.interneurons.cholinergic.pauseTimer = isVentral ? 100 : 50;
        }
        if (cState.interneurons.cholinergic.pauseTimer > 0) {
            cState.interneurons.cholinergic.pauseTimer--;
            cState.interneurons.cholinergic.firing = false;
        } else {
            cState.interneurons.cholinergic.firing = true;
        }

        // 78. Feedback Loops (Striato-nigral)
        // Activation of direct pathway inhibits SNc (disinhibition of movement)
        // Activation of indirect pathway excites SNc (via STN)
        if (state.signalingActive) {
            if (cState.pathways.direct.active) {
                cState.feedback.sncActivity = Math.max(0.2, cState.feedback.sncActivity - 0.01 * cState.feedback.gain);
            } else if (cState.pathways.indirect.active) {
                cState.feedback.sncActivity = Math.min(2.0, cState.feedback.sncActivity + 0.005 * cState.feedback.gain);
            }
        } else {
            cState.feedback.sncActivity += (1.0 - cState.feedback.sncActivity) * 0.01;
        }

        // Apply feedback to synapse release rate
        if (G.synapseState) {
            G.synapseState.releaseRate = 0.1 * cState.feedback.sncActivity;
        }

        // 76. GABAergic Interneuron Modulation
        if (state.signalingActive) {
            cState.interneurons.gabaergic.pv.active = Math.min(1.0, cState.interneurons.gabaergic.pv.active + 0.01);
            cState.interneurons.gabaergic.som.active = Math.min(1.0, cState.interneurons.gabaergic.som.active + 0.005);
        } else {
            cState.interneurons.gabaergic.pv.active = Math.max(0.1, cState.interneurons.gabaergic.pv.active - 0.005);
            cState.interneurons.gabaergic.som.active = Math.max(0.1, cState.interneurons.gabaergic.som.active - 0.002);
        }

        // Update UI metrics in the right panel
        if (G.rightPanel && G.updateMetric) {
            G.updateMetric(G.rightPanel, 'Circuit Dynamics', 'Cholinergic Firing', cState.interneurons.cholinergic.firing ? 'ACTIVE' : 'PAUSE');
            G.updateMetric(G.rightPanel, 'Circuit Dynamics', 'Compartment', cState.compartments.matrix.active ? 'Matrix' : 'Striosome');
            G.updateMetric(G.rightPanel, 'Circuit Dynamics', 'Active Pathway', cState.pathways.direct.active ? 'Direct' : (cState.pathways.indirect.active ? 'Indirect' : 'None'));
            G.updateMetric(G.rightPanel, 'Circuit Dynamics', 'SNc Feedback', `${(cState.feedback.sncActivity * 100).toFixed(1)}%`);
        }
    };

    G.renderCircuit = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const cState = G.circuitState;

        // 71. Render MSN Populations
        cState.msnPopulations.d1.forEach(msn => {
            const p = project(msn.x, msn.y, msn.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ff4d4d';
                ctx.globalAlpha = cState.pathways.direct.active ? 1.0 : 0.4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });
        cState.msnPopulations.d2.forEach(msn => {
            const p = project(msn.x, msn.y, msn.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#4d79ff';
                ctx.globalAlpha = cState.pathways.indirect.active ? 1.0 : 0.4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 76. Render GABAergic Interneurons
        Object.values(cState.interneurons.gabaergic).forEach(inter => {
            const p = project(inter.x, inter.y, inter.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = inter.label === 'PV+' ? '#ff00ff' : '#00ffff';
                ctx.globalAlpha = inter.active;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - 10 * p.scale);
                ctx.lineTo(p.x + 10 * p.scale, p.y + 10 * p.scale);
                ctx.lineTo(p.x - 10 * p.scale, p.y + 10 * p.scale);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#fff';
                ctx.fillText(inter.label, p.x, p.y - 15 * p.scale);
            }
        });

        // 74. Striosome vs Matrix Visualization (Intracellular/Micro-compartment focus)
        // Optimized Layering: Matrix (Field) -> Striosomes (Islands)

        // Matrix Lattice & Flow Field
        ctx.save();
        drawMatrixLattice(ctx, w, h, 40);
        drawMatrixFlow(ctx, w, h, G.state.timer * 0.5);
        ctx.restore();

        // Organic Striosome Patches
        ctx.save();
        const patchCount = 5;
        for (let i = 0; i < patchCount; i++) {
            const angle = (i / patchCount) * Math.PI * 2 + 0.5;
            const dist = Math.min(w, h) * 0.2;
            const sx = w / 2 + Math.cos(angle) * dist;
            const sy = h / 2 + Math.sin(angle) * dist;
            const radius = 60 + Math.sin(G.state.timer * 0.01 + i) * 5;

            drawStriosome(ctx, sx, sy, radius);
            populateStriosome(ctx, sx, sy, radius, 12);
        }
        ctx.restore();


        // 80. Tripartite Synapse (Astrocytes - Stellate Appearance)
        cState.astrocytes.forEach(a => {
            const pos = project(a.x, a.y, a.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (pos.scale > 0) {
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
                ctx.beginPath();
                // Draw stellate processes
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + G.state.timer * 0.005;
                    const len = a.radius * (0.8 + Math.sin(G.state.timer * 0.02 + i) * 0.2);
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + Math.cos(angle) * len * pos.scale, pos.y + Math.sin(angle) * len * pos.scale);
                }
                ctx.stroke();

                // Central soma
                ctx.fillStyle = 'rgba(0, 200, 200, 0.05)';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, (a.radius / 4) * pos.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

    };

})();
