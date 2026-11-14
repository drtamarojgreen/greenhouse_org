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

            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            if (found.type === 'receptor') {
                const r = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${r.type} ${t('dopamine_receptor_title')}</strong><br>
                    ${t('dopamine_receptor_class')}: ${r.type === 'D1' || r.type === 'D5' ? 'D1-like (Gs)' : 'D2-like (Gi)'}<br>
                    ${t('dopamine_receptor_il3')}: ${r.il3Size} units<br>
                    ${t('dopamine_receptor_ctail')}: ${r.tailLength} units<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${r.type === 'D1' ? t('dopamine_d1_desc') : t('dopamine_d2_desc')}
                        ${G.state.mode === 'Heteromer' ? `<br>${t('dopamine_heteromer_desc')}` : ''}
                    </div>
                `;
            } else if (found.type === 'astrocyte') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_astrocyte_title')}</strong><br>
                    ${t('dopamine_astrocyte_desc')}
                `;
            } else if (found.type === 'interneuron') {
                const i = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_interneuron_title')} (${i.label})</strong><br>
                    ${t('dopamine_interneuron_desc')}<br>
                    ${t('dopamine_status')}: ${(i.active * 100).toFixed(0)}% ${t('dopamine_active')}
                `;
            } else if (found.type === 'gap_junction') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_gap_junction_title')}</strong><br>
                    ${t('dopamine_gap_junction_desc')}
                `;
            } else if (found.type === 'gprotein') {
                const gp = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_gprotein_title')} (${gp.subunit})</strong><br>
                    ${t('dopamine_receptor_class')}: ${gp.type}<br>
                    ${t('dopamine_status')}: ${gp.gtpBound ? t('dopamine_gprotein_bound') : t('dopamine_gprotein_unbound')}<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${gp.type === 'Gs' ? t('dopamine_gs_desc') :
                          (gp.type === 'Gi' ? t('dopamine_gi_desc') :
                           t('dopamine_gq_desc'))}
                    </div>
                `;
            } else if (found.type === 'vesicle') {
                const v = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_vesicle_title')}</strong><br>
                    ${t('dopamine_vesicle_filling')}: ${(v.filled * 100).toFixed(0)}%<br>
                    ${t('dopamine_status')}: ${v.snareState}
                `;
            } else if (found.type === 'organelle') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_organelle_er')}</strong><br>
                    ${t('dopamine_er_desc')}
                `;
            } else if (found.type === 'projection') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_projection_title')}: ${found.data.label}</strong><br>
                    ${t('dopamine_projection_desc')}
                `;
            } else if (found.type === 'axon_terminal') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_axon_terminal_title')}</strong><br>
                    ${t('dopamine_axon_terminal_desc')}
                `;
            } else if (found.type === 'obstacle') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_obstacle_title')}</strong><br>
                    ${t('dopamine_obstacle_desc')}
                `;
            } else if (found.type === 'metabolite') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_metabolite_title')}</strong><br>
                    ${t('dopamine_metabolite_desc')}
                `;
            } else if (found.type === 'glutamate') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_glutamate_title')}</strong><br>
                    ${t('dopamine_glutamate_desc')}
                `;
            } else if (found.type === 'dopamine_particle') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_da_title')}</strong><br>
                    ${t('dopamine_da_desc')}
                `;
            } else if (found.type === 'msn') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_msn_title')} (${found.data.type})</strong><br>
                    ${found.data.type === 'D1' ? t('dopamine_msn_d1_desc') : t('dopamine_msn_d2_desc')}
                `;
            } else if (found.type === 'striosome_patch') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_striosome_title')}</strong><br>
                    ${t('dopamine_striosome_desc')}
                `;
            } else if (found.type === 'matrix_point') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_matrix_title')}</strong><br>
                    ${t('dopamine_matrix_desc')}
                `;
            } else if (found.type === 'synthesis_flux') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_synthesis_title')}</strong><br>
                    ${found.data.type.toUpperCase()}<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${t('dopamine_synthesis_desc')}
                    </div>
                `;
            } else if (found.type === 'vmat2_gradient') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_vmat2_title')}</strong><br>
                    ${t('dopamine_vmat2_desc')}
                `;
            } else if (found.type === 'cleft_heatmap') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_cleft_title')}</strong><br>
                    ${t('dopamine_cleft_desc').replace('{count}', found.data.count)}
                `;
            } else if (found.type === 'rgs_protein') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_rgs_title')}</strong><br>
                    ${t('dopamine_rgs_desc')}
                `;
            } else if (found.type === 'clathrin_pit') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_clathrin_title')}</strong><br>
                    ${t('dopamine_clathrin_desc')}
                `;
            } else if (found.type === 'internalized_receptor') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_internalized_title')}</strong><br>
                    ${t('dopamine_internalized_desc')}
                `;
            } else if (found.type === 'camp_microdomain') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_camp_title')}</strong><br>
                    ${t('dopamine_camp_desc')}
                `;
            } else if (found.type === 'ip3_particle') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_ip3_title')}</strong><br>
                    ${t('dopamine_ip3_desc')}
                `;
            } else if (found.type === 'erk_molecule') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_erk_title')}</strong><br>
                    ${t('dopamine_erk_desc')}
                `;
            } else if (found.type === 'pka_subunit') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_pka_title')}</strong><br>
                    ${t('dopamine_pka_desc')}
                `;
            } else if (found.type === 'ap_backprop') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_ap_backprop_title')}</strong><br>
                    ${t('dopamine_ap_backprop_desc')}
                `;
            } else if (found.type === 'potential_graph') {
                this.tooltipEl.innerHTML = `
                    <strong>${t('dopamine_potential_title')}</strong><br>
                    ${t('dopamine_potential_desc').replace('{value}', found.data.potential.toFixed(1))}
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
