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
        projections: {
            snc: { x: -300, y: -400, z: 0, label: 'SNc (Nigrostriatal)' },
            vta: { x: 300, y: -400, z: 0, label: 'VTA (Mesolimbic)' }
        },
        compartments: {
            striosome: { active: false, density: 1.5 },
            matrix: { active: true, density: 1.0 }
        },
        interneurons: {
            cholinergic: { firing: true, pauseTimer: 0 },
            gabaergic: { pv: 0.5, som: 0.3 }
        },
        astrocytes: [] // 80. Tripartite Synapse
    };

    // Initialize Astrocytes
    for (let i = 0; i < 5; i++) {
        G.circuitState.astrocytes.push({
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 600,
            z: (Math.random() - 0.5) * 200,
            radius: 50 + Math.random() * 50
        });
    }

    G.updateCircuit = function () {
        const state = G.state;
        const cState = G.circuitState;
        const sState = G.synapseState;

        // 71. Direct vs. Indirect
        cState.pathways.direct.active = state.mode.includes('D1');
        cState.pathways.indirect.active = state.mode.includes('D2');

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

        // 78. Feedback Loops (Simplified)
        if (cState.pathways.direct.active && state.signalingActive) {
            // Activation of direct pathway inhibits SNc, but here we model it as a closed loop
            // where signaling activity affects the next pulse
        }
    };

    G.renderCircuit = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const cState = G.circuitState;

        // 79. 3D Brain Atlas Integration (Placeholder visual)
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 3, h / 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

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

        // 80. Tripartite Synapse (Astrocytes)
        cState.astrocytes.forEach(a => {
            const pos = project(a.x, a.y, a.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (pos.scale > 0) {
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, a.radius * pos.scale, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        // Overlay Circuit Info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Cholinergic Firing: ${cState.interneurons.cholinergic.firing ? 'ACTIVE' : 'PAUSE'}`, w - 10, h - 140);
        ctx.fillText(`Compartment: ${cState.compartments.matrix.active ? 'Matrix' : 'Striosome'}`, w - 10, h - 120);
        ctx.fillText(`Active Pathway: ${cState.pathways.direct.active ? 'Direct' : (cState.pathways.indirect.active ? 'Indirect' : 'None')}`, w - 10, h - 100);
    };
})();
