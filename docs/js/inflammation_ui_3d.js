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
        },

        initMicroData() {
            if (!window.GreenhouseNeuroGeometry) return;
            this.neurons = [];
            for (let i = 0; i < 6; i++) {
                const p1 = { x: -250 + i * 100, y: -150 + Math.random() * 100, z: (Math.random() - 0.5) * 200 };
                const p2 = { x: -250 + i * 100, y: 150 - Math.random() * 100, z: (Math.random() - 0.5) * 200 };
                const cp = { x: p1.x + (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 50, z: (Math.random() - 0.5) * 100 };
                const mesh = window.GreenhouseNeuroGeometry.generateTubeMesh(p1, p2, cp, 4, 12);
                this.neurons.push({ p1, p2, cp, mesh, baseColor: '#4ca1af' });
            }
            this.glia = [];
            for (let i = 0; i < 15; i++) {
                const type = Math.random() > 0.4 ? 'astrocyte' : 'microglia';
                const mesh = window.GreenhouseNeuroGeometry.generateGliaMesh(type, 0.5 + Math.random() * 0.5);
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
                const preMesh = window.GreenhouseNeuroGeometry.createSynapseGeometry(15, 8, 'pre');
                const postMesh = window.GreenhouseNeuroGeometry.createSynapseGeometry(18, 8, 'post');
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
            const Geo = window.GreenhouseNeuroGeometry;
            for (let i = 0; i < 150; i++) { // Reduced count for performance with meshes
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
        },

        render(ctx, state, camera, projection) {
            const viewModeVal = state.factors.viewMode || 0;
            const viewMode = ['macro', 'micro', 'molecular'][Math.round(viewModeVal)] || 'macro';

            if (viewMode === 'macro' && window.GreenhouseInflammationMacro) {
                window.GreenhouseInflammationMacro.render(ctx, state, camera, projection, this);
            } else if (viewMode === 'micro' && window.GreenhouseInflammationMicro) {
                window.GreenhouseInflammationMicro.render(ctx, state, camera, projection, this);
            } else if (viewMode === 'molecular' && window.GreenhouseInflammationMolecular) {
                window.GreenhouseInflammationMolecular.render(ctx, state, camera, projection, this);
            }
        },

        checkHover(mx, my, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const viewModeVal = this.app.engine.state.factors.viewMode || 0;
            const viewMode = ['macro', 'micro', 'molecular'][Math.round(viewModeVal)];

            if (viewMode === 'micro') {
                for (const g of this.glia) {
                    const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                    const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                    if (dist < 25 * p.scale) return { id: 'glia', label: g.type === 'astrocyte' ? 'Astrocyte' : 'Microglia', description: g.type === 'astrocyte' ? 'Glia that supports neurons and maintains the blood-brain barrier via endfeet.' : 'Resident immune cell; M1 (reactive) or M2 (resolving) phenotypes.', type: '3d' };
                }
                if (my > projection.height * 0.7) return { id: 'bbb', label: 'Blood-Brain Barrier', description: 'Endothelial lining and basement membrane; regulates leukocyte infiltration.', type: '3d' };
            } else if (viewMode === 'molecular') {
                if (my > projection.height * 0.3 && my < projection.height * 0.5) return { id: 'membrane', label: 'Cell Membrane', description: 'Lipid bilayer barrier separating the intracellular and extracellular milieu.', type: '3d' };
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
