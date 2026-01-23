/**
 * @file dopamine_tooltips.js
 * @description Tooltip logic for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.initTooltips = function (container) {
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'dopamine-tooltip';
        this.tooltipEl.style.position = 'absolute';
        this.tooltipEl.style.background = 'rgba(20, 20, 40, 0.9)';
        this.tooltipEl.style.color = '#fff';
        this.tooltipEl.style.padding = '8px';
        this.tooltipEl.style.borderRadius = '4px';
        this.tooltipEl.style.fontSize = '12px';
        this.tooltipEl.style.display = 'none';
        this.tooltipEl.style.pointerEvents = 'none';
        this.tooltipEl.style.zIndex = '200';
        this.tooltipEl.style.maxWidth = '200px';
        this.tooltipEl.style.border = '1px solid #4a5568';
        container.appendChild(this.tooltipEl);

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.handleHover(mouseX, mouseY);
        });
    };

    G.handleHover = function (x, y) {
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;

        let found = null;
        // Check Receptors
        G.state.receptors.forEach(r => {
            const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 30 * p.scale) {
                found = { type: 'receptor', data: r };
            }
        });

        // Check Astrocytes
        if (!found && G.synapseState.astrocytes) {
            G.synapseState.astrocytes.forEach(ast => {
                const p = project(ast.x, ast.y, ast.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < ast.radius * p.scale) {
                    found = { type: 'astrocyte', data: ast };
                }
            });
        }

        // Check Interneurons
        if (!found && G.circuitState.interneurons.gabaergic) {
            Object.values(G.circuitState.interneurons.gabaergic).forEach(inter => {
                const p = project(inter.x, inter.y, inter.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 15 * p.scale) {
                    found = { type: 'interneuron', data: inter };
                }
            });
        }

        // Check Gap Junctions
        if (!found && G.electroState.gapJunctions) {
            G.electroState.gapJunctions.forEach(gj => {
                const p = project(gj.x, gj.y, gj.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 10 * p.scale) {
                    found = { type: 'gap_junction', data: gj };
                }
            });
        }

        // Check G-Proteins
        if (!found && G.molecularState && G.molecularState.gProteins) {
            G.molecularState.gProteins.forEach(gp => {
                const p = project(gp.x, gp.y, gp.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 8 * p.scale) {
                    found = { type: 'gprotein', data: gp };
                }
            });
        }

        // Check Vesicles
        if (!found && G.synapseState && G.synapseState.vesicles) {
            [...G.synapseState.vesicles.rrp, ...G.synapseState.vesicles.reserve].forEach(v => {
                const p = project(v.x, v.y, 0, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 10 * p.scale) {
                    found = { type: 'vesicle', data: v };
                }
            });
        }

        // Check ER
        if (!found && G.molecularState && G.molecularState.er) {
            const er = G.molecularState.er;
            const p = project(er.x, er.y, er.z, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < (er.width / 4) * p.scale) {
                found = { type: 'organelle', data: { label: 'Endoplasmic Reticulum', desc: 'Stores intracellular Ca2+. Regulated by IP3R.' } };
            }
        }

        // Check Projections
        if (!found && G.circuitState && G.circuitState.projections) {
            Object.values(G.circuitState.projections).forEach(proj => {
                const p = project(proj.x, proj.y, proj.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 20 * p.scale) {
                    found = { type: 'projection', data: proj };
                }
            });
        }

        // Check MSNs
        if (!found && G.circuitState && G.circuitState.msnPopulations) {
            ['d1', 'd2'].forEach(type => {
                G.circuitState.msnPopulations[type].forEach(msn => {
                    const p = project(msn.x, msn.y, msn.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    if (dist < 12 * p.scale) {
                        found = { type: 'msn', data: { type: type.toUpperCase(), ...msn } };
                    }
                });
            });
        }

        // Check Striosome Patches (Islands)
        if (!found) {
            const patchCount = 5;
            for (let i = 0; i < patchCount; i++) {
                const angle = (i / patchCount) * Math.PI * 2 + 0.5;
                const distCenter = Math.min(w, h) * 0.2;
                const sx = w / 2 + Math.cos(angle) * distCenter;
                const sy = h / 2 + Math.sin(angle) * distCenter;
                const radius = 60 + Math.sin(G.state.timer * 0.01 + i) * 5;

                const dist = Math.sqrt((sx - x) ** 2 + (sy - y) ** 2);
                if (dist < radius) {
                    found = { type: 'striosome_patch', data: { id: i } };
                    break;
                }
            }
        }

        // Check Matrix Lattice Points
        if (!found) {
            const spacing = 40;
            for (let lx = spacing / 2; lx < w; lx += spacing) {
                for (let ly = spacing / 2; ly < h; ly += spacing) {
                    const dist = Math.sqrt((lx - x) ** 2 + (ly - y) ** 2);
                    if (dist < 5) {
                        found = { type: 'matrix_point', data: {} };
                        break;
                    }
                }
                if (found) break;
            }
        }

        // Check Synthesis Flux
        if (!found && G.synapseState && G.synapseState.synthesis && G.synapseState.synthesis.fluxVisuals) {
            G.synapseState.synthesis.fluxVisuals.forEach(f => {
                const p = project(f.x, f.y, 0, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 15 * p.scale) {
                    found = { type: 'synthesis_flux', data: f };
                }
            });
        }

        // Check Axon Terminal
        if (!found && G.synapseState) {
            const p = project(0, -225, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 100 * p.scale) {
                found = { type: 'axon_terminal', data: {} };
            }
        }

        // Check VMAT2 Glow
        if (!found && G.synapseState) {
            const p = project(0, -225, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 150 * p.scale) {
                found = { type: 'vmat2_gradient', data: {} };
            }
        }

        // Check Obstacles
        if (!found && G.synapseState && G.synapseState.extracellularObstacles) {
            G.synapseState.extracellularObstacles.forEach(obs => {
                const p = project(obs.x, obs.y, obs.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < obs.radius * p.scale) {
                    found = { type: 'obstacle', data: obs };
                }
            });
        }

        // Check Metabolites
        if (!found && G.synapseState && G.synapseState.metabolites && G.synapseState.metabolites.visual) {
            G.synapseState.metabolites.visual.forEach(m => {
                const p = project(m.x, m.y, m.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 15 * p.scale) {
                    found = { type: 'metabolite', data: m };
                }
            });
        }

        // Check Cleft Heatmap
        if (!found && G.synapseState && G.synapseState.cleftDA.length > 5) {
            const p = project(0, -160, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 150 * p.scale) {
                found = { type: 'cleft_heatmap', data: { count: G.synapseState.cleftDA.length } };
            }
        }

        // Check Glutamate
        if (!found && G.synapseState && G.synapseState.glutamate) {
            G.synapseState.glutamate.forEach(glu => {
                const p = project(glu.x, glu.y, glu.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 10 * p.scale) {
                    found = { type: 'glutamate', data: glu };
                }
            });
        }

        // Check Dopamine Particles
        if (!found && G.synapseState && G.synapseState.cleftDA) {
            G.synapseState.cleftDA.forEach(da => {
                const p = project(da.x, da.y, da.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 10 * p.scale) {
                    found = { type: 'dopamine_particle', data: da };
                }
            });
        }

        // Check RGS Proteins
        if (!found && G.molecularState && G.molecularState.rgsProteins && G.molecularState.rgsProteins.visual) {
            G.molecularState.rgsProteins.visual.forEach(rgs => {
                const p = project(rgs.x, rgs.y, rgs.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 15 * p.scale) {
                    found = { type: 'rgs_protein', data: rgs };
                }
            });
        }

        // Check Clathrin Pits & Internalized Receptors
        if (!found && G.molecularState) {
            G.molecularState.clathrinPits.forEach(pit => {
                const p = project(pit.x, pit.y, pit.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < 30 * p.scale) {
                    found = { type: 'clathrin_pit', data: pit };
                }
            });
            if (!found) {
                G.molecularState.internalizedReceptors.forEach(ir => {
                    const p = project(ir.x, ir.y + 50, ir.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    if (dist < 20 * p.scale) {
                        found = { type: 'internalized_receptor', data: ir };
                    }
                });
            }
        }

        // Check cAMP & IP3 & ERK
        if (!found && G.molecularState) {
            G.molecularState.campMicrodomains.forEach(m => {
                const p = project(m.x, m.y, m.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < m.radius * p.scale) {
                    found = { type: 'camp_microdomain', data: m };
                }
            });
            if (!found) {
                G.molecularState.plcPathway.ip3Particles.forEach(ip3 => {
                    const p = project(ip3.x, ip3.y, ip3.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    if (dist < 10 * p.scale) {
                        found = { type: 'ip3_particle', data: ip3 };
                    }
                });
            }
            if (!found) {
                G.molecularState.erkPathway.visual.forEach(erk => {
                    const p = project(erk.x, erk.y, erk.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    if (dist < 15 * p.scale) {
                        found = { type: 'erk_molecule', data: erk };
                    }
                });
            }
            if (!found) {
                G.molecularState.pka.subunits.forEach(pka => {
                    const p = project(pka.x, pka.y, pka.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    if (dist < 10 * p.scale) {
                        found = { type: 'pka_subunit', data: pka };
                    }
                });
            }
        }

        // Check AP Back-propagation Waves
        if (!found && G.electroState && G.electroState.apBackProp > 0) {
            G.state.receptors.forEach(r => {
                const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const waveRadius = 100 * (1 - G.electroState.apBackProp) * p.scale;
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (Math.abs(dist - waveRadius) < 10) {
                    found = { type: 'ap_backprop', data: {} };
                }
            });
        }

        // Check Membrane Potential Graph
        if (!found && G.electroState) {
            const graphXStart = 10;
            const graphXEnd = w / 4;
            const graphY = h - 150;
            if (x >= graphXStart && x <= graphXEnd && y >= graphY - 100 && y <= graphY + 20) {
                found = { type: 'potential_graph', data: { potential: G.electroState.membranePotential } };
            }
        }

        G.hoverTarget = found; // Set global hover target for UX contextual cursor

        if (found) {
            this.tooltipEl.style.left = `${x + 10}px`;
            this.tooltipEl.style.top = `${y + 10}px`;
            this.tooltipEl.style.display = 'block';

            if (found.type === 'receptor') {
                const r = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${r.type} Receptor</strong><br>
                    Class: ${r.type === 'D1' || r.type === 'D5' ? 'D1-like (Gs)' : 'D2-like (Gi)'}<br>
                    IL3 Size: ${r.il3Size} units<br>
                    C-tail: ${r.tailLength} units<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${r.type === 'D1' ? 'Stimulates adenylyl cyclase, increases cAMP.' : 'Inhibits adenylyl cyclase, opens GIRK channels.'}
                        ${G.state.mode === 'Heteromer' ? '<br>Currently in D1-D2 Heteromer state (Gq signaling).' : ''}
                    </div>
                `;
            } else if (found.type === 'astrocyte') {
                this.tooltipEl.innerHTML = `
                    <strong>Astrocyte Process</strong><br>
                    Part of the Tripartite Synapse.<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        Clears extracellular dopamine via reuptake and metabolic pathways (MAO/COMT).
                    </div>
                `;
            } else if (found.type === 'interneuron') {
                const i = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>GABAergic Interneuron (${i.label})</strong><br>
                    Modulates MSN activity.<br>
                    Status: ${(i.active * 100).toFixed(0)}% Active
                `;
            } else if (found.type === 'gap_junction') {
                this.tooltipEl.innerHTML = `
                    <strong>Gap Junction</strong><br>
                    Electrical coupling between interneurons.
                `;
            } else if (found.type === 'gprotein') {
                const gp = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>G-Protein Subunit (${gp.subunit})</strong><br>
                    Type: ${gp.type}<br>
                    Status: ${gp.gtpBound ? 'GTP-bound (Active)' : 'GDP-bound (Inactive)'}<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${gp.type === 'Gs' ? 'Gs: Stimulates adenylyl cyclase (↑cAMP).' :
                          (gp.type === 'Gi' ? 'Gi: Inhibits adenylyl cyclase (↓cAMP).' :
                           'Gq: Activates PLC (↑IP3, ↑Ca2+).')}
                    </div>
                `;
            } else if (found.type === 'vesicle') {
                const v = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>Synaptic Vesicle</strong><br>
                    Filling: ${(v.filled * 100).toFixed(0)}%<br>
                    State: ${v.snareState}
                `;
            } else if (found.type === 'organelle') {
                this.tooltipEl.innerHTML = `
                    <strong>${found.data.label}</strong><br>
                    ${found.data.desc}
                `;
            } else if (found.type === 'projection') {
                this.tooltipEl.innerHTML = `
                    <strong>Projection: ${found.data.label}</strong><br>
                    Anatomical source of dopaminergic input.
                `;
            } else if (found.type === 'axon_terminal') {
                this.tooltipEl.innerHTML = `
                    <strong>Axon Terminal</strong><br>
                    Presynaptic site of dopamine synthesis and release.
                `;
            } else if (found.type === 'obstacle') {
                this.tooltipEl.innerHTML = `
                    <strong>Extracellular Obstacle</strong><br>
                    Increases tortuosity, slowing dopamine diffusion.
                `;
            } else if (found.type === 'metabolite') {
                this.tooltipEl.innerHTML = `
                    <strong>Metabolite</strong><br>
                    Dopamine breakdown product (DOPAC/HVA/3-MT).
                `;
            } else if (found.type === 'glutamate') {
                this.tooltipEl.innerHTML = `
                    <strong>Glutamate</strong><br>
                    Excitatory neurotransmitter co-released with DA.
                `;
            } else if (found.type === 'dopamine_particle') {
                this.tooltipEl.innerHTML = `
                    <strong>Dopamine (DA)</strong><br>
                    Key neuromodulator in reward and motor pathways.
                `;
            } else if (found.type === 'msn') {
                this.tooltipEl.innerHTML = `
                    <strong>Medium Spiny Neuron (${found.data.type})</strong><br>
                    Primary projection neuron of the striatum.<br>
                    ${found.data.type === 'D1' ? 'Direct pathway: Facilitates movement.' : 'Indirect pathway: Inhibits movement.'}
                `;
            } else if (found.type === 'striosome_patch') {
                this.tooltipEl.innerHTML = `
                    <strong>Striosome (Patch)</strong><br>
                    Compartment primarily linked to the limbic system and SNc projections.
                `;
            } else if (found.type === 'matrix_point') {
                this.tooltipEl.innerHTML = `
                    <strong>Matrix Lattice Point</strong><br>
                    Represents the Matrix compartment, involved in sensorimotor integration.
                `;
            } else if (found.type === 'synthesis_flux') {
                this.tooltipEl.innerHTML = `
                    <strong>Dopamine Synthesis Flux</strong><br>
                    Intermediate molecule: ${found.data.type.toUpperCase()}<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        Tyrosine → L-DOPA → Dopamine
                    </div>
                `;
            } else if (found.type === 'vmat2_gradient') {
                this.tooltipEl.innerHTML = `
                    <strong>VMAT2 Proton Gradient</strong><br>
                    Acidic environment driving vesicular dopamine uptake.
                `;
            } else if (found.type === 'cleft_heatmap') {
                this.tooltipEl.innerHTML = `
                    <strong>Synaptic Cleft Concentration</strong><br>
                    DA Molecules: ${found.data.count}<br>
                    Gradient shows diffusion density.
                `;
            } else if (found.type === 'rgs_protein') {
                this.tooltipEl.innerHTML = `
                    <strong>RGS Protein</strong><br>
                    Regulator of G-protein Signaling.<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        Accelerates GTP hydrolysis, terminating G-protein activity.
                    </div>
                `;
            } else if (found.type === 'clathrin_pit') {
                this.tooltipEl.innerHTML = `
                    <strong>Clathrin-Coated Pit</strong><br>
                    Site of receptor internalization (endocytosis).
                `;
            } else if (found.type === 'internalized_receptor') {
                this.tooltipEl.innerHTML = `
                    <strong>Internalized Receptor</strong><br>
                    Receptor moved into the cytosol for sorting/recycling.
                `;
            } else if (found.type === 'camp_microdomain') {
                this.tooltipEl.innerHTML = `
                    <strong>cAMP Microdomain</strong><br>
                    Localized gradient of cyclic AMP.<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        Activates PKA and HCN channels.
                    </div>
                `;
            } else if (found.type === 'ip3_particle') {
                this.tooltipEl.innerHTML = `
                    <strong>IP3 (Inositol Trisphosphate)</strong><br>
                    Second messenger that triggers Ca2+ release from ER.
                `;
            } else if (found.type === 'erk_molecule') {
                this.tooltipEl.innerHTML = `
                    <strong>ERK (Extracellular Signal-Regulated Kinase)</strong><br>
                    Part of the MAPK cascade, involved in gene expression (CREB).
                `;
            } else if (found.type === 'pka_subunit') {
                this.tooltipEl.innerHTML = `
                    <strong>PKA Catalytic Subunit</strong><br>
                    Phosphorylates targets like DARPP-32 and NMDA receptors.
                `;
            } else if (found.type === 'ap_backprop') {
                this.tooltipEl.innerHTML = `
                    <strong>Action Potential Back-propagation</strong><br>
                    Electrical signal traveling back from soma to dendrites.
                `;
            } else if (found.type === 'potential_graph') {
                this.tooltipEl.innerHTML = `
                    <strong>Membrane Potential Graph</strong><br>
                    Current: ${found.data.potential.toFixed(1)} mV<br>
                    Shows the real-time electrical state of the neuron.
                `;
            }
        } else {
            this.tooltipEl.style.display = 'none';
        }
    };

    G.updateTooltips = function () {
        // Any periodic tooltip updates
    };
})();
