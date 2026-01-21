/**
 * @file serotonin_receptors.js
 * @description Receptor subtypes and structural biology for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Receptors = {
        subtypes: {
            '5-HT1A': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#4d79ff', constitutiveActivity: 0.1 },
            '5-HT1B': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#3366ff' },
            '5-HT2A': { coupling: 'Gq/11', effect: 'Excitatory', color: '#ff4d4d', rnaEditingVariants: true },
            '5-HT2C': { coupling: 'Gq/11', effect: 'Excitatory', color: '#cc3333', editedIsoforms: ['INI', 'VGV', 'VSV'] },
            '5-HT3': { coupling: 'Ionotropic', effect: 'Excitatory (Na+/K+)', color: '#4dff4d' },
            '5-HT4': { coupling: 'Gs', effect: 'Excitatory', color: '#ff9900' },
            '5-HT5A': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#9933ff' },
            '5-HT6': { coupling: 'Gs', effect: 'Excitatory', color: '#ffff4d' },
            '5-HT7': { coupling: 'Gs', effect: 'Excitatory', color: '#ff4dff' }
        },

        conformationalStates: ['Inactive', 'Intermediate', 'Active'],

        setupReceptorModel() {
            G.state.receptors = Object.keys(this.subtypes).map((type, i) => ({
                type,
                ...this.subtypes[type],
                state: 'Inactive',
                x: (i - 4) * 60,
                y: 0,
                z: 0,
                oligomerizedWith: null,
                palmitoylated: Math.random() > 0.5,
                disulfideBridges: true
            }));

            // Example of Hetero-oligomerization (5-HT2A-mGlu2 placeholder)
            if (G.state.receptors[2]) {
                G.state.receptors[2].oligomerizedWith = 'mGlu2';
            }
        },

        updateReceptorStates() {
            G.state.receptors.forEach(r => {
                // Sodium Allosteric Site (Category 2, #17)
                // Sodium levels modulate 5-HT1A affinity
                r.sodiumModulation = 1.0 - (Math.sin(G.state.timer * 0.01) * 0.2);

                // Palmitoylation effect on membrane localization (Category 2, #18)
                // Modulates stability and lateral movement speed
                const palmitoylEffect = r.palmitoylated ? 1.1 : 1.0;

                // Constitutive activity
                if (r.constitutiveActivity && Math.random() < r.constitutiveActivity * 0.01) {
                    r.state = 'Intermediate';
                }

                // Lipid Bilayer Modulation effect (Category 2, #16)
                const lipidDensity = G.state.lipids ? G.state.lipids.length : 0;
                r.stability = (1.0 + (lipidDensity * 0.001)) * palmitoylEffect;

                // RNA Editing Efficiency for 5-HT2C
                if (r.type === '5-HT2C' && r.editedIsoform) {
                    // INI is most efficient, VSV is least
                    const efficiencyMap = { 'INI': 1.0, 'VGV': 0.7, 'VSV': 0.3 };
                    r.couplingEfficiency = efficiencyMap[r.editedIsoform] || 1.0;
                } else {
                    r.couplingEfficiency = 1.0;
                }

                // Biased Agonism Placeholder
                // If 5-HT2A is bound by a biased ligand, adjust pathway weighting
                if (r.type === '5-HT2A' && r.state === 'Active') {
                    r.pathwayBias = r.biasedLigand ? 1.5 : 1.0; // Boosts Gq vs Beta-Arrestin (abstracted)

                    // Receptor Oligomerization (Category 1, #6)
                    // 5-HT2A-mGlu2 hetero-oligomer complex logic
                    if (r.oligomerizedWith === 'mGlu2') {
                        r.pathwayBias *= 0.8; // Oligomerization modulates coupling efficiency
                    }
                }

                // 5-HT5A Gi/o inhibitory details (Category 1, #5)
                if (r.type === '5-HT5A') {
                    r.inhibitoryPotential = 1.2; // Slightly more potent Gi coupling simulated
                }

                // Conformational State Transition logic (Category 2, #15)
                // Smoothly transition between states visually (simplified logic)
                if (r.state === 'Intermediate' && Math.random() < 0.01) {
                    r.state = 'Active';
                } else if (r.state === 'Active' && Math.random() < 0.005) {
                    r.state = 'Inactive';
                }
            });
        },

        renderReceptors(ctx, project, cam, w, h) {
            G.state.receptors.forEach(r => {
                const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    // Protein Surface Map: Electrostatic Potential (Category 10, #92)
                    // Simplified as a colored "glow" or aura around the receptor
                    const surfaceGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40 * p.scale);
                    surfaceGrad.addColorStop(0, r.state === 'Active' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.1)');
                    surfaceGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = surfaceGrad;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 40 * p.scale, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw 7-TM Helices (simplified)
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 10 * p.scale;

                    for (let j = 0; j < 7; j++) {
                        const hAngle = (j / 7) * Math.PI * 2;
                        const hx = r.x + Math.cos(hAngle) * 15;
                        const hz = r.z + Math.sin(hAngle) * 15;

                        const hTop = project(hx, r.y - 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                        const hBottom = project(hx, r.y + 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });

                        if (hTop.scale > 0 && hBottom.scale > 0) {
                            ctx.globalAlpha = r.state === 'Active' ? 1.0 : 0.6;
                            ctx.beginPath();
                            ctx.moveTo(hTop.x, hTop.y);
                            ctx.lineTo(hBottom.x, hBottom.y);
                            ctx.stroke();

                            // Disulfide Bridges visualization (Category 2, #19)
                            if (r.disulfideBridges && j === 0) {
                                ctx.strokeStyle = '#ffff00';
                                ctx.lineWidth = 2 * p.scale;
                                ctx.beginPath();
                                ctx.moveTo(hTop.x, hTop.y);
                                ctx.bezierCurveTo(hTop.x + 20 * p.scale, hTop.y - 20 * p.scale, hTop.x + 40 * p.scale, hTop.y, hTop.x + 30 * p.scale, hTop.y + 10 * p.scale);
                                ctx.stroke();
                                ctx.strokeStyle = r.color;
                                ctx.lineWidth = 10 * p.scale;
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;

                    // Label
                    ctx.fillStyle = '#fff';
                    ctx.font = `${10 * p.scale}px Arial`;
                    ctx.textAlign = 'center';
                    const label = r.oligomerizedWith ? `${r.type}-${r.oligomerizedWith}` : r.type;
                    ctx.fillText(label, p.x, p.y + 60 * p.scale);

                    if (r.state !== 'Inactive') {
                        ctx.fillStyle = '#00ffcc';
                        ctx.fillText(r.state, p.x, p.y - 50 * p.scale);

                        // Binding Pocket Water Molecules visualization (Category 2, #14)
                        // Simplified as blue sparkles within the pocket area
                        ctx.fillStyle = '#66ccff';
                        for (let k = 0; k < 3; k++) {
                            const wx = p.x + Math.sin(G.state.timer * 0.1 + k) * 5 * p.scale;
                            const wy = p.y - 20 * p.scale + Math.cos(G.state.timer * 0.1 + k) * 5 * p.scale;
                            ctx.beginPath();
                            ctx.arc(wx, wy, 1.5 * p.scale, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            });
        }
    };

    // Integrate with main object
    const oldSetup = G.setupStructuralModel;
    G.setupStructuralModel = function() {
        if (oldSetup) oldSetup.call(G);
        G.Receptors.setupReceptorModel();
    };


    const oldRender = G.render;
    G.render = function() {
        // We override or hook into render.
        // In this case, we'll let the original render run, then add ours.
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        G.Receptors.renderReceptors(ctx, project, cam, w, h);
    };

})();
