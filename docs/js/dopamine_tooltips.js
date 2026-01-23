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

        // Check Axon Terminal
        if (!found && G.synapseState) {
            const p = project(0, -225, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 100 * p.scale) {
                found = { type: 'axon_terminal', data: {} };
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
                    Status: ${gp.gtpBound ? 'GTP-bound (Active)' : 'GDP-bound (Inactive)'}
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
            }
        } else {
            this.tooltipEl.style.display = 'none';
        }
    };

    G.updateTooltips = function () {
        // Any periodic tooltip updates
    };
})();
