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
        } else if (state.mode.includes('VTA') || state.mode.includes('Ventral') || state.mode === 'Schizophrenia') {
            // Mesolimbic Pathway: Lower DAT, more volume transmission
            if (sState) {
                sState.dat.activity = state.mode === 'Schizophrenia' ? 1.0 : 0.6;
                sState.tortuosity = 1.3; // More open space for diffusion
            }
        }

        // 75. Cholinergic Interneuron "Pause"
        if (sState && sState.cleftDA.length > 100) {
            cState.interneurons.cholinergic.pauseTimer = 50;
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
    };

    G.renderCircuit = function (ctx, project) {
        if (!G.circuitState.brainMesh && window.GreenhouseBrainMeshRealistic) {
            G.initRealisticBrain();
        }

        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const cState = G.circuitState;

        // 79. Realistic 3D Brain Atlas Integration
        if (cState.brainMesh) {
            this.renderRealisticBrain(ctx, project);
        }

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

        // 74. Striosome vs Matrix Visualization
        // Matrix
        ctx.fillStyle = cState.compartments.matrix.color;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w / 4, 0, Math.PI * 2);
        ctx.fill();
        // Striosomes
        ctx.fillStyle = cState.compartments.striosome.color;
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.arc(w/2 + Math.cos(i)*100, h/2 + Math.sin(i)*100, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // 79. Legacy wireframe replaced or augmented by Realistic Mesh in renderRealisticBrain

        // Render some "Atlas" coordinate markers and landmarks
        ctx.fillStyle = 'rgba(150, 150, 255, 0.5)';
        ctx.font = '8px monospace';
        const markers = [
            { label: 'Bregma: 0,0,0', x: 0, y: -100, z: 0 },
            { label: 'AP: +1.2 (Striatum)', x: 0, y: -200, z: 0 },
            { label: 'ML: +1.5', x: 400, y: 0, z: 0 },
            { label: 'DV: -4.5', x: 0, y: 0, z: 400 },
            { label: 'Midbrain (SNc/VTA)', x: 0, y: -500, z: 0 },
            { label: 'Cortex (PFC)', x: 0, y: -600, z: 250 }
        ];
        markers.forEach(m => {
            const p = project(m.x, m.y, m.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) ctx.fillText(m.label, p.x, p.y);
        });

        // Render Projections (SNc/VTA)
        Object.values(cState.projections).forEach(p => {
            const pos = project(p.x, p.y, p.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (pos.scale > 0) {
                ctx.fillStyle = '#aa88ff';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 15 * pos.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `${10 * pos.scale}px Arial`;
                ctx.fillText(p.label, pos.x, pos.y - 20 * pos.scale);

                // Draw axon lines to receptors
                G.state.receptors.forEach(r => {
                    const rPos = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    if (rPos.scale > 0) {
                        ctx.strokeStyle = 'rgba(170, 136, 255, 0.2)';
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y);
                        ctx.lineTo(rPos.x, rPos.y);
                        ctx.stroke();
                    }
                });
            }
        });

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

        // Overlay Circuit Info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Cholinergic Firing: ${cState.interneurons.cholinergic.firing ? 'ACTIVE' : 'PAUSE'}`, w - 10, h - 140);
        ctx.fillText(`Compartment: ${cState.compartments.matrix.active ? 'Matrix' : 'Striosome'}`, w - 10, h - 120);
        ctx.fillText(`Active Pathway: ${cState.pathways.direct.active ? 'Direct' : (cState.pathways.indirect.active ? 'Indirect' : 'None')}`, w - 10, h - 100);
        ctx.fillText(`SNc Activity (Feedback): ${(cState.feedback.sncActivity * 100).toFixed(1)}%`, w - 10, h - 80);
    };

    G.renderRealisticBrain = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const mesh = G.circuitState.brainMesh;
        if (!mesh) return;

        ctx.lineWidth = 1;

        // Draw regions with specific highlighting
        const daLevel = G.synapseState ? G.synapseState.cleftDA.length : 0;
        const phasicGlow = Math.min(0.5, daLevel / 1000);

        mesh.faces.forEach(face => {
            const v1 = mesh.vertices[face[0]];
            const v2 = mesh.vertices[face[1]];
            const v3 = mesh.vertices[face[2]];

            // Simplification: only render if z > 0 for performance or some other heuristic
            // In a real 3D engine we'd do backface culling

            const p1 = project(v1.x, v1.y - 200, v1.z, cam, { width: w, height: h, near: 10, far: 5000 });
            const p2 = project(v2.x, v2.y - 200, v2.z, cam, { width: w, height: h, near: 10, far: 5000 });
            const p3 = project(v3.x, v3.y - 200, v3.z, cam, { width: w, height: h, near: 10, far: 5000 });

            if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                // Determine face color based on region
                let regionColor = 'rgba(100, 100, 200, 0.05)';
                if (v1.region === 'prefrontalCortex') regionColor = `rgba(100, 150, 255, ${0.1 + phasicGlow})`;
                else if (v1.region === 'brainstem') regionColor = `rgba(255, 100, 100, ${0.1 + phasicGlow * 2})`; // Midbrain area

                ctx.fillStyle = regionColor;
                ctx.strokeStyle = 'rgba(150, 150, 255, 0.02)';
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();
                if (G.uxState && !G.uxState.reducedMotion) ctx.stroke();
            }
        });
    };
})();
