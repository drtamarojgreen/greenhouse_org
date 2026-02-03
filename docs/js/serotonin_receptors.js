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
            '5-HT1A': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#4d79ff', constitutiveActivity: 0.1, pdb: '7E2Y', architecture: 'GPCR-A', tmHelices: 7, il3Length: 30, cTailLength: 40 },
            '5-HT1B': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#3366ff', pdb: '6A93', architecture: 'GPCR-A', tmHelices: 7, il3Length: 10, cTailLength: 15 },
            '5-HT1D': { coupling: 'Gi/o', effect: 'Inhibitory (Presynaptic)', color: '#3399ff', pdb: '7E2Z', architecture: 'GPCR-A', tmHelices: 7, il3Length: 10, cTailLength: 15 },
            '5-HT1E': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#6699ff', architecture: 'GPCR-A', tmHelices: 7, il3Length: 15, cTailLength: 20 },
            '5-HT1F': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#9999ff', pdb: '7EXD', architecture: 'GPCR-A', tmHelices: 7, il3Length: 15, cTailLength: 20 },
            '5-HT2A': { coupling: 'Gq/11', effect: 'Excitatory', color: '#ff4d4d', rnaEditingVariants: true, pdb: '6WIV', architecture: 'GPCR-A', tmHelices: 7, il3Length: 12, cTailLength: 25 },
            '5-HT2C': { coupling: 'Gq/11', effect: 'Excitatory', color: '#cc3333', editedIsoforms: ['INI', 'VGV', 'VSV'], architecture: 'GPCR-A', tmHelices: 7, il3Length: 12, cTailLength: 25 },
            '5-HT3': { coupling: 'Ionotropic', effect: 'Excitatory (Na+/K+)', color: '#4dff4d', architecture: 'Pentameric', subunits: 5, poreRadius: 10 },
            '5-HT4': { coupling: 'Gs', effect: 'Excitatory', color: '#ff9900', spliceVariants: ['a', 'b', 'c'], architecture: 'GPCR-A', tmHelices: 7, il3Length: 10, cTailLength: 35 },
            '5-HT5A': { coupling: 'Gi/o', effect: 'Inhibitory', color: '#9933ff', architecture: 'GPCR-A', tmHelices: 7, il3Length: 20, cTailLength: 30 },
            '5-HT6': { coupling: 'Gs', effect: 'Excitatory', color: '#ffff4d', architecture: 'GPCR-A', tmHelices: 7, il3Length: 15, cTailLength: 25 },
            '5-HT7': { coupling: 'Gs', effect: 'Excitatory', color: '#ff4dff', spliceVariants: ['a', 'b', 'd'], architecture: 'GPCR-A', tmHelices: 7, il3Length: 15, cTailLength: 45 }
        },

        conformationalStates: ['Inactive', 'Intermediate', 'Active'],

        // RNA Editing Efficiency Maps (Category 1, #8)
        rnaEditingMaps: {
            '5-HT2C': { 'INI': 1.0, 'VGV': 0.7, 'VSV': 0.3 }
        },

        setupReceptorModel() {
            G.state.receptors = Object.keys(this.subtypes).map((type, i) => {
                const r = {
                    type,
                    ...this.subtypes[type],
                    state: 'Inactive',
                    x: (i - 4) * 60,
                    y: 0,
                    z: 0,
                    oligomerizedWith: null,
                    palmitoylated: Math.random() > 0.5,
                    disulfideBridges: true
                };

                // Assign random RNA editing isoform to 5-HT2C
                if (type === '5-HT2C') {
                    r.editedIsoform = this.subtypes[type].editedIsoforms[Math.floor(Math.random() * 3)];
                    r.couplingEfficiency = this.rnaEditingMaps['5-HT2C'][r.editedIsoform];
                }
                // Alternative Splicing (Category 1, #9)
                if (this.subtypes[type].spliceVariants) {
                    r.spliceVariant = this.subtypes[type].spliceVariants[Math.floor(Math.random() * this.subtypes[type].spliceVariants.length)];
                }
                return r;
            });

            // Example of Hetero-oligomerization (5-HT2A-mGlu2 placeholder)
            if (G.state.receptors[2]) {
                G.state.receptors[2].oligomerizedWith = 'mGlu2';
            }
        },

        updateReceptorStates() {
            if (!G.state.receptors) return;
            G.state.receptors.forEach(r => {
                // Sodium Allosteric Site (Category 2, #17)
                // Sodium levels modulate 5-HT1A affinity
                // Higher sodium = lower agonist affinity for 5-HT1A
                const sodiumLevel = 1.0 + Math.sin(G.state.timer * 0.005) * 0.5;
                r.sodiumModulation = r.type === '5-HT1A' ? (1.0 / sodiumLevel) : 1.0;

                // Lipid Bilayer Modulation effect (Category 2, #16)
                // Cholesterol level modulates 5-HT1A stability and coupling
                const cholesterol = G.cholesterolLevel || 1.0;
                const lipidDensity = G.state.lipids ? G.state.lipids.length : 0;
                const cholesterolMod = r.type === '5-HT1A' ? (cholesterol * 1.2) : 1.0;

                // Palmitoylation effect on membrane localization (Category 2, #18)
                // Modulates stability and lateral movement speed
                const palmitoylEffect = r.palmitoylated ? 1.1 : 1.0;

                // Constitutive activity
                if (r.constitutiveActivity && Math.random() < r.constitutiveActivity * 0.01) {
                    r.state = 'Intermediate';
                }

                r.stability = (1.0 + (lipidDensity * 0.001)) * palmitoylEffect * cholesterolMod;

                // RNA Editing Efficiency for 5-HT2C
                if (r.type === '5-HT2C' && r.editedIsoform) {
                    // INI is most efficient, VSV is least
                    const efficiencyMap = { 'INI': 1.0, 'VGV': 0.7, 'VSV': 0.3 };
                    r.couplingEfficiency = efficiencyMap[r.editedIsoform] || 1.0;
                } else {
                    r.couplingEfficiency = 1.0;
                }

                // Biased Agonism Logic (Category 1, #10)
                // ligands can selectively activate G-protein vs beta-arrestin
                if (r.state === 'Active') {
                    // Biased agonism weighting
                    if (r.biasedLigand) {
                        r.gProteinActivation = r.biasedLigand === 'G-Biased' ? 1.5 : 0.5;
                        r.betaArrestinRecruitment = r.biasedLigand === 'Arrestin-Biased' ? 1.5 : 0.5;
                    } else {
                        r.gProteinActivation = 1.0;
                        r.betaArrestinRecruitment = 1.0;
                    }

                    r.pathwayBias = r.gProteinActivation; // For legacy signaling hooks

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

        renderMembraneChannels(ctx, project, cam, w, h) {
            // Electrophysiological Channels (Category 6, #51, #53)
            const channels = [
                { type: 'HCN', color: '#ffcc00', x: -200, y: 0, z: 100 },
                { type: 'SK', color: '#00ccff', x: 200, y: 0, z: 150 },
                { type: 'BK', color: '#0066ff', x: 250, y: 0, z: -50 }
            ];

            channels.forEach(ch => {
                const p = project(ch.x, ch.y, ch.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.strokeStyle = ch.color;
                    ctx.lineWidth = 3 * p.scale;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8 * p.scale, 0, Math.PI * 2);
                    ctx.stroke();

                    // Channel activity "glow"
                    const activity = (ch.type === 'HCN' ? (G.Signaling ? G.Signaling.cAMP : 0) : (G.Signaling ? G.Signaling.calcium : 0)) * 0.1;
                    if (activity > 0.1) {
                        ctx.fillStyle = ch.color;
                        ctx.globalAlpha = Math.min(0.5, activity);
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.fillStyle = '#fff';
                    ctx.font = `${8 * p.scale}px Arial`;
                    ctx.fillText(ch.type, p.x, p.y - 12 * p.scale);
                }
            });
        },

        renderReceptors(ctx, project, cam, w, h) {
            // Render additional membrane components
            this.renderMembraneChannels(ctx, project, cam, w, h);

            // Lipid Bilayer Visualization (Cholesterol)
            if (G.cholesterolLevel > 1.2) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.05)';
                ctx.fillRect(0, h / 2 - 50, w, 100);
            }

            // Molecular Composition visualization (Category II, #30)
            const drawMolecularComposition = (r, p) => {
                if (cam.zoom > 2.0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    for (let n = 0; n < 15; n++) {
                        const residueX = p.x + Math.sin(n + G.state.timer * 0.05) * 20 * p.scale;
                        const residueY = p.y + (n - 7) * 8 * p.scale;
                        ctx.beginPath();
                        ctx.arc(residueX, residueY, 3 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = '#fff';
                    ctx.font = `${8 * p.scale}px Arial`;
                    ctx.fillText('Amino Acid Residues', p.x, p.y + 110 * p.scale);
                }
            };

            // Subtype-Specific Glyphs (Accessibility #12)
            const drawGlyph = (type, x, y, size) => {
                ctx.beginPath();
                if (type.startsWith('5-HT1')) {
                    // Triangle
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x + size, y + size);
                    ctx.lineTo(x - size, y + size);
                } else if (type.startsWith('5-HT2')) {
                    // Square
                    ctx.rect(x - size, y - size, size * 2, size * 2);
                } else if (type === '5-HT3') {
                    // Hexagon
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
                    }
                } else if (type.startsWith('5-HT5')) {
                    // Diamond
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x + size, y);
                    ctx.lineTo(x, y + size);
                    ctx.lineTo(x - size, y);
                } else {
                    // Circle/Star
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                }
                ctx.closePath();
                ctx.stroke();
            };

            // Molecular Dynamics (MD) Integration playback placeholder (Category 2, #20)
            if (G.mdActive) {
                ctx.fillStyle = '#fff';
                ctx.fillText('MD TRAJECTORY PLAYBACK: frame ' + (G.state.timer % 100), 20, 20);
            }

            G.state.receptors.forEach(r => {
                const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    // Legend Highlight Effect (#95)
                    const isHighlighted = G.Legend && G.Legend.highlightedItem === r.type;
                    if (isHighlighted) {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3 * p.scale;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 60 * p.scale, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // Protein Surface Map: Physical Morphology
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
                    ctx.beginPath();
                    if (r.architecture === 'Pentameric') {
                        ctx.arc(p.x, p.y, 50 * p.scale, 0, Math.PI * 2);
                    } else {
                        ctx.arc(p.x, p.y, 40 * p.scale, 0, Math.PI * 2);
                    }
                    ctx.fill();

                    // Draw Architecture-Specific Elements
                    if (r.architecture === 'Pentameric') {
                        // 5-HT3 Pentameric Pore
                        ctx.strokeStyle = '#888';
                        ctx.lineWidth = 5 * p.scale;
                        for (let j = 0; j < 5; j++) {
                            const angle = (j / 5) * Math.PI * 2 + (G.state.timer * 0.01);
                            const sx = p.x + Math.cos(angle) * 30 * p.scale;
                            const sy = p.y + Math.sin(angle) * 30 * p.scale;
                            ctx.beginPath();
                            ctx.arc(sx, sy, 15 * p.scale, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                        // Pore center
                        ctx.fillStyle = r.state === 'Active' ? '#4dff4d' : '#222';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // GPCR 7-TM Bundle
                        ctx.strokeStyle = '#aaa';
                        ctx.lineWidth = 12 * p.scale;
                        for (let j = 0; j < 7; j++) {
                            const hAngle = (j / 7) * Math.PI * 2;
                            const hx = r.x + Math.cos(hAngle) * 15;
                            const hz = r.z + Math.sin(hAngle) * 15;
                            const hTop = project(hx, r.y - 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                            const hBottom = project(hx, r.y + 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                            if (hTop.scale > 0 && hBottom.scale > 0) {
                                ctx.beginPath();
                                ctx.moveTo(hTop.x, hTop.y);
                                ctx.lineTo(hBottom.x, hBottom.y);
                                ctx.stroke();
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;

                    // GPCR-G Protein Interface (Category 2, #12)
                    // GPCR-G Protein Interface (Category 2, #12)
                    if (r.state === 'Active' && r.coupling !== 'Ionotropic') {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2 * p.scale;
                        ctx.beginPath();
                        ctx.moveTo(p.x - 10 * p.scale, p.y + 40 * p.scale);
                        ctx.lineTo(p.x + 10 * p.scale, p.y + 60 * p.scale);
                        ctx.stroke();
                        ctx.fillStyle = '#ccc';
                        ctx.fillText(r.coupling + ' alpha subunit', p.x, p.y + 75 * p.scale);
                    }

                    // Cryo-EM Structural details (Category 2, #11)
                    if (r.pdb) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.font = `${8 * p.scale}px Arial`;
                        ctx.fillText(`PDB: ${r.pdb}`, p.x, p.y - 70 * p.scale);
                    }

                    // Draw Molecular Composition detail
                    drawMolecularComposition(r, p);

                    // Label
                    ctx.fillStyle = '#fff';
                    ctx.font = `${10 * p.scale}px Arial`;
                    ctx.textAlign = 'center';
                    const label = (r.oligomerizedWith ? `${r.type}-${r.oligomerizedWith}` : r.type) + (r.spliceVariant ? `(${r.spliceVariant})` : '');
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
    G.setupStructuralModel = function () {
        if (oldSetup) oldSetup.call(G);
        G.Receptors.setupReceptorModel();
    };


    const oldRender = G.render;
    G.render = function (...args) {
        // We override or hook into render.
        // In this case, we'll let the original render run, then add ours.
        if (oldRender) oldRender.apply(G, args);

        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state ? G.state.camera : null;

        if (!ctx || !w || !h || !cam) return;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        if (G.state && G.state.receptors) {
            G.Receptors.renderReceptors(ctx, project, cam, w, h);
        }
    };

})();
