/**
 * @file inflammation_ui_3d.js
 * @description Coordinate 3D Visualization components; delegates to specialized mode modules.
 */

(function () {
    'use strict';

    const GreenhouseInflammationUI3D = {
        brainShell: null,
        neurons: [],
        glia: [],
        molecules: [],
        axons: [],
        leukocytes: [],
        synapses: [],
        originalRegionColors: {},
        theme: 'default', // default, deuteranopia, protanopia, tritanopia
        pathwayCache: {},
        currentPathwayNodes: [],
        currentPathwayEdges: [],
        currentPathwayId: null,
        clippingVolume: 1.0,

        init(app) {
            this.app = app;
            if (window.GreenhouseInflammationGeometry) {
                this.brainShell = { vertices: [], faces: [] };
                window.GreenhouseInflammationGeometry.initializeBrainShell(this.brainShell);
                this.originalRegionColors = {};
                if (this.brainShell.regions) {
                    for (const key in this.brainShell.regions) {
                        const region = this.brainShell.regions[key];
                        this.originalRegionColors[key] = region.color;
                        if (region.vertices && region.vertices.length > 0) {
                            let cx = 0, cy = 0, cz = 0;
                            region.vertices.forEach(idx => {
                                const v = this.brainShell.vertices[idx];
                                cx += v.x; cy += v.y; cz += v.z;
                            });
                            region.centroid = { x: cx / region.vertices.length, y: cy / region.vertices.length, z: cz / region.vertices.length };
                        }
                    }
                }
            }
            this.initMicroData();
            this.initMolecularData();
            this.loadPathways();
        },

        async loadPathways() {
            try {
                const data = await window.GreenhouseModelsUtil.PathwayService.loadMetadata(this.app.baseUrl);
                this.availablePathways = data.pathways;
                // Pre-load default pathway for inflammation
                await this.fetchPathway('tryptophan');
            } catch (e) {
                console.error("Inflammation UI: Failed to load pathway metadata", e);
                if (window.GreenhouseInflammationPathway) window.GreenhouseInflammationPathway.error = "Metadata Load Failed";
            }
        },

        async fetchPathway(id) {
            if (this.pathwayCache[id]) {
                this.currentPathwayNodes = this.pathwayCache[id].nodes;
                this.currentPathwayEdges = this.pathwayCache[id].edges;
                this.currentPathwayId = id;
                return;
            }
            const meta = this.availablePathways ? this.availablePathways.find(p => p.id === id) : null;
            if (!meta) {
                if (window.GreenhouseInflammationPathway) window.GreenhouseInflammationPathway.error = "Pathway Not Found: " + id;
                return;
            }

            if (!meta.source) {
                console.log(`Inflammation UI: No source for pathway ${id}, skipping fetch.`);
                return;
            }

            if (window.GreenhouseInflammationPathway) {
                window.GreenhouseInflammationPathway.isLoading = true;
                window.GreenhouseInflammationPathway.error = null;
            }

            let data;
            try {
                if (meta.source.endsWith('.json')) {
                    data = await window.GreenhouseModelsUtil.PathwayService.loadJSONPathway(meta.source, this.app.baseUrl);
                    if (data) {
                        // JSON format might already have compartments/nodes
                        this.pathwayCache[id] = data;
                        this.currentPathwayNodes = data.nodes || data.compartments;
                        this.currentPathwayEdges = data.edges || data.reactions;
                        this.currentPathwayId = id;
                        if (window.GreenhouseInflammationPathway) window.GreenhouseInflammationPathway.isLoading = false;
                        return;
                    }
                } else {
                    data = await window.GreenhouseModelsUtil.PathwayService.loadPathway(meta.source, this.app.baseUrl);
                }
            } catch (e) {
                console.error(`Inflammation UI: Error fetching pathway ${id}`, e);
                if (window.GreenhouseInflammationPathway) {
                    window.GreenhouseInflammationPathway.isLoading = false;
                    window.GreenhouseInflammationPathway.error = "Fetch Failed";
                }
                return;
            }

            if (window.GreenhouseInflammationPathway) window.GreenhouseInflammationPathway.isLoading = false;

            if (data) {
                const nodesWithPos = data.nodes.map((n, i) => {
                    const map = {
                        'pfc': { x: 0, y: 80, z: 140 },
                        'striatum': { x: 80, y: 20, z: 40 },
                        'vta': { x: 0, y: -40, z: -20 },
                        'sn': { x: 30, y: -40, z: -10 },
                        'hypothalamus': { x: 0, y: -20, z: 20 },
                        'pituitary': { x: 0, y: -80, z: 60 },
                        'adrenals': { x: 50, y: -180, z: -20 },
                        'gut': { x: 0, y: -300, z: 20 },
                        'blood_stream': { x: -80, y: -150, z: 0 },
                        'synapse': { x: 0, y: 150, z: 150 },
                        'cytosol': { x: 0, y: 160, z: 150 },
                        'nucleus': { x: 0, y: 170, z: 150 }
                    };
                    const base = map[n.region] || map[meta.regions[0]] || { x: 0, y: 0, z: 0 };
                    return {
                        ...n,
                        x: base.x + (Math.sin(i) * 20),
                        y: base.y + (Math.cos(i) * 20),
                        z: base.z + (Math.sin(i * 0.5) * 10)
                    };
                });
                this.pathwayCache[id] = { nodes: nodesWithPos, edges: data.edges };
                this.currentPathwayNodes = nodesWithPos;
                this.currentPathwayEdges = data.edges;
                this.currentPathwayId = id;
            }
        },

        initMicroData() {
            if (!window.GreenhouseInflammationGeometry) return;
            this.neurons = [];
            for (let i = 0; i < 6; i++) {
                const p1 = { x: -250 + i * 100, y: -150 + Math.random() * 100, z: (Math.random() - 0.5) * 200 };
                const p2 = { x: -250 + i * 100, y: 150 - Math.random() * 100, z: (Math.random() - 0.5) * 200 };
                const cp = { x: p1.x + (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 50, z: (Math.random() - 0.5) * 100 };
                const mesh = window.GreenhouseInflammationGeometry.generateTubeMesh(p1, p2, cp, 4, 12);
                this.neurons.push({ p1, p2, cp, mesh, baseColor: '#4ca1af' });
            }
            this.glia = [];
            for (let i = 0; i < 15; i++) {
                const type = Math.random() > 0.4 ? 'astrocyte' : 'microglia';
                const mesh = window.GreenhouseInflammationGeometry.generateGliaMesh(type, 0.5 + Math.random() * 0.5);
                this.glia.push({
                    x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 500, z: (Math.random() - 0.5) * 400,
                    rotationX: Math.random() * Math.PI, rotationY: Math.random() * Math.PI,
                    size: 15 + Math.random() * 15, type: type, pulseOffset: Math.random() * Math.PI * 2,
                    mesh: mesh
                });
            }
            this.axons = [];
            for (let i = 0; i < this.neurons.length - 1; i++) {
                if (Math.random() > 0.3) this.axons.push({ from: i, to: (i + 1) % this.neurons.length });
            }
            this.leukocytes = [];
            for (let i = 0; i < 12; i++) {
                this.leukocytes.push({
                    x: -500 + Math.random() * 1000,
                    y: 300, // Inside the vessel at bottom
                    z: (Math.random() - 0.5) * 100,
                    vx: 3 + Math.random() * 2,
                    state: 'circulating'
                });
            }
            // 3D Capillary/Vessel Segment (Cylinder)
            this.vesselEndothelium = [];
            for (let i = 0; i < 20; i++) {
                this.vesselEndothelium.push({
                    x: -600 + i * 60, y: 300, z: 0,
                    size: 30, rotationX: Math.PI / 2
                });
            }
            this.synapses = [];
            this.axons.forEach(a => {
                const n1 = this.neurons[a.from];
                const n2 = this.neurons[a.to];
                // Detailed 3D Synapse (Pre and Post)
                const preMesh = window.GreenhouseInflammationGeometry.createSynapseGeometry(15, 8, 'pre');
                const postMesh = window.GreenhouseInflammationGeometry.createSynapseGeometry(18, 8, 'post');
                this.synapses.push({
                    x: n2.p1.x, y: n2.p1.y, z: n2.p1.z,
                    preMesh, postMesh,
                    rotationX: Math.random() * Math.PI, rotationY: Math.random() * Math.PI
                });
            });
            this.glia.forEach(g => {
                g.receptors = [];
                for (let i = 0; i < 5; i++) {
                    g.receptors.push({ angle: Math.random() * Math.PI * 2, type: Math.random() > 0.5 ? 'tnf' : 'il10' });
                }
            });
        },

        initMolecularData() {
            this.molecules = [];
            const Geo = window.GreenhouseInflammationGeometry;
            for (let i = 0; i < 25; i++) { // Significantly reduced for structural focus
                const typeRoll = Math.random();
                let type = 'ion';
                if (typeRoll > 0.85) type = 'pro-cytokine';
                else if (typeRoll > 0.70) type = 'anti-cytokine';
                else if (typeRoll > 0.50) type = 'neurotransmitter';

                const mesh = Geo.generateMoleculeCluster(type, 1.0);
                this.molecules.push({
                    x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 800, z: (Math.random() - 0.5) * 800,
                    vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, vz: (Math.random() - 0.5) * 1.5,
                    type, mesh, history: []
                });
            }
            // 3D Membrane Segment
            this.membrane = Geo.generateLipidBilayerSegment(1200, 800, 15);

            // Anatomically accurate Cells for Molecular View
            this.molecularCells = [];
            // Mast Cell near the membrane
            this.molecularCells.push({
                x: -350, y: 100, z: 200,
                type: 'mast_cell',
                mesh: Geo.generateMastCellMesh(2.0),
                rotationX: 0.5, rotationY: 0.8,
                pulseOffset: Math.random() * Math.PI
            });
            // Astrocyte with endfeet
            this.molecularCells.push({
                x: 400, y: -200, z: -100,
                type: 'astrocyte',
                mesh: Geo.generateGliaMesh('astrocyte', 1.5),
                rotationX: -0.3, rotationY: 1.2,
                pulseOffset: Math.random() * Math.PI
            });
            // Reactive Microglia
            this.molecularCells.push({
                x: 50, y: 300, z: -300,
                type: 'microglia',
                mesh: Geo.generateGliaMesh('microglia', 1.2),
                rotationX: 1.0, rotationY: 0.5,
                pulseOffset: Math.random() * Math.PI
            });
        },

        render(ctx, state, camera, projection) {
            const performanceMode = state.factors.performanceMode === 1;
            this.theme = state.factors.colorTheme || 'default';
            const viewModeVal = state.factors.viewMode || 0;
            const viewMode = ['macro', 'micro', 'molecular', 'pathway'][Math.round(viewModeVal)] || 'macro';
            const activePathId = state.factors.activePathway || 'tryptophan';

            if (viewMode === 'pathway') {
                if (this.currentPathwayId !== activePathId) {
                    this.fetchPathway(activePathId);
                }
                if (window.GreenhouseInflammationPathway) {
                    window.GreenhouseInflammationPathway.render(ctx, state, camera, projection, this);
                }
            } else if (viewMode === 'macro' && window.GreenhouseInflammationMacro) {
                window.GreenhouseInflammationMacro.render(ctx, state, camera, projection, this);
                this.drawRegionConfidence(ctx, state, camera, projection);
            } else if (viewMode === 'micro' && window.GreenhouseInflammationMicro) {
                window.GreenhouseInflammationMicro.render(ctx, state, camera, projection, this);
            } else if (viewMode === 'molecular' && window.GreenhouseInflammationMolecular) {
                window.GreenhouseInflammationMolecular.render(ctx, state, camera, projection, this);
                if (state.factors.showBridgeOverlay) this.drawMolecularToMicroBridge(ctx, state, projection);
            }
        },

        drawMolecularToMicroBridge(ctx, state, projection) {
            ctx.save();
            ctx.fillStyle = 'rgba(100, 255, 200, 0.1)';
            ctx.fillRect(40, 250, 150, 60);
            ctx.strokeStyle = '#00ff99';
            ctx.strokeRect(40, 250, 150, 60);

            ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Quicksand';
            ctx.fillText('MOLECULAR-MICRO BRIDGE', 45, 265);
            ctx.font = '8px monospace';
            const impact = (state.metrics.tnfAlpha * 1.5).toFixed(2);
            ctx.fillText(`SIGNALING IMPACT: ${impact}x`, 45, 280);
            ctx.fillText(`PHENOTYPE SHIFT: ${state.metrics.microgliaActivation > 0.5 ? 'PRO-INFLAM' : 'HOMEOSTATIC'}`, 45, 295);
            ctx.restore();
        },

        checkHover(mx, my, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const viewModeVal = this.app.engine.state.factors.viewMode || 0;
            const viewMode = ['macro', 'micro', 'molecular'][Math.round(viewModeVal)];

            if (viewMode === 'micro') {
                for (const g of this.glia) {
                    const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                    const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                    if (dist < 25 * p.scale) return { id: 'glia', label: g.type === 'astrocyte' ? 'Astrocyte' : 'Microglia', description: g.type === 'astrocyte' ? 'Glia that supports neurons and maintains the blood-brain barrier via endfeet.' : 'Resident immune cell; M1 (reactive) or M2 (resolving) phenotypes.', type: '3d', data: g };
                }
                for (const l of this.leukocytes) {
                    const p = Math3D.project3DTo2D(l.x, l.y, l.z, camera, projection);
                    const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                    if (dist < 15 * p.scale) return { id: 'leukocyte', label: 'Leukocyte', description: 'White blood cell involved in the inflammatory response.', type: '3d', data: l };
                }
                if (my > projection.height * 0.7) return { id: 'bbb', label: 'Blood-Brain Barrier', description: 'Endothelial lining and basement membrane; regulates leukocyte infiltration.', type: '3d' };
            } else if (viewMode === 'molecular') {
                if (my > projection.height * 0.3 && my < projection.height * 0.5) return { id: 'membrane', label: 'Cell Membrane', description: 'Lipid bilayer barrier separating the intracellular and extracellular milieu.', type: '3d' };

                if (this.molecularCells) {
                    for (const c of this.molecularCells) {
                        const p = Math3D.project3DTo2D(c.x, c.y, c.z, camera, projection);
                        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                        if (dist < 40 * p.scale) {
                            let label = 'Cell', desc = 'A biological cell.';
                            if (c.type === 'mast_cell') { label = 'Mast Cell'; desc = 'Immune cell containing granules rich in histamine and cytokines.'; }
                            else if (c.type === 'astrocyte') { label = 'Astrocyte'; desc = 'Star-shaped glial cell that provides structural and metabolic support.'; }
                            else if (c.type === 'microglia') { label = 'Microglia'; desc = 'Resident immune cell of the CNS; monitors and responds to injury.'; }
                            return { id: c.type, label: label, description: desc, type: '3d' };
                        }
                    }
                }

                for (const m of this.molecules) {
                    const p = Math3D.project3DTo2D(m.x, m.y, m.z, camera, projection);
                    const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                    if (dist < 12 * p.scale) {
                        let label = 'Ion', desc = 'Charged particle maintaining cellular electrochemical gradients.';
                        if (m.type === 'pro-cytokine') { label = 'Pro-Cytokine (TNF-α)'; desc = 'Aggressive signaling molecule that promotes inflammatory cascades.'; }
                        else if (m.type === 'anti-cytokine') { label = 'Anti-Cytokine (IL-10)'; desc = 'Protective molecule that resolves inflammation and prevents tissue damage.'; }
                        else if (m.type === 'neurotransmitter') { label = 'Neurotransmitter'; desc = 'Chemical messenger released across synapses to signal between neurons.'; }
                        return { id: 'molecule', label: label, description: desc, type: '3d' };
                    }
                }
            } else if (viewMode === 'macro' && this.brainShell && this.brainShell.regions) {
                for (const key in this.brainShell.regions) {
                    const region = this.brainShell.regions[key];
                    if (region.centroid) {
                        const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                        if (dist < 50 * p.scale && p.depth < 0.7) return { id: 'brain_region', label: region.name, description: window.GreenhouseModelsUtil ? (window.GreenhouseModelsUtil.getRegionDescription(key) || 'Functional brain region.') : 'Brain Region', type: '3d' };
                    }
                }
            }
            return null;
        },

        drawRegionConfidence(ctx, state, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            if (!this.brainShell || !this.brainShell.regions) return;

            ctx.save();
            for (const key in this.brainShell.regions) {
                const region = this.brainShell.regions[key];
                if (region.centroid && key !== 'cortex') {
                    const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                    if (p.scale > 0 && p.depth < 0.6) {
                        const confidence = (state.metrics.regionConfidence || 0.85) * 100;
                        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                        ctx.font = '8px monospace';
                        ctx.fillText(`CONF: ${confidence.toFixed(0)}%`, p.x - 20, p.y + 15);

                        // Hover Halo (Enhancement #11)
                        if (this.app.ui.hoveredElement && this.app.ui.hoveredElement.label === region.name) {
                            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 40 * p.scale * (1 + Math.sin(Date.now() * 0.005) * 0.2), 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }
            }
            ctx.restore();
        },

        roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
            if (fill) ctx.fill(); if (stroke) ctx.stroke();
        }
    };

    window.GreenhouseInflammationUI3D = GreenhouseInflammationUI3D;
})();
