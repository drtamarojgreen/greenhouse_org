/**
 * @file stress_ui_3d.js
 * @description Coordinate 3D Visualization components for Stress; delegates to specialized mode modules.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressUI3D = {
        brainShell: null,
        hpaNodes: [],
        originalRegionColors: {},
        pathwayCache: {},
        currentPathwayNodes: [],
        currentPathwayEdges: [],
        currentPathwayId: null,

        init(app) {
            this.app = app;
            // Initialize Brain Shell for Macro View
            if (window.GreenhouseStressGeometry) {
                this.brainShell = { vertices: [], faces: [] };
                window.GreenhouseStressGeometry.initializeBrainShell(this.brainShell);

                // Cache original colors and calculate centroids
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
                            region.centroid = {
                                x: cx / region.vertices.length,
                                y: cy / region.vertices.length,
                                z: cz / region.vertices.length
                            };
                        }
                    }
                }
            }

            // Initialize HPA Pathway nodes with meshes and regulators
            const Geo = window.GreenhouseNeuroGeometry;
            this.hpaNodes = [
                { id: 'pfc', label: 'label_pfc', x: -80, y: 180, z: 20, color: '#44aaff', type: 'regulator', function: 'inhibitor', mesh: Geo.generateSphere(25, 12) },
                { id: 'amygdala', label: 'label_amygdala', x: 80, y: 150, z: 0, color: '#ff4444', type: 'regulator', function: 'excitor', mesh: Geo.generateSphere(20, 12) },
                { id: 'hippocampus', label: 'label_hippocampus', x: -60, y: 100, z: -40, color: '#44ffaa', type: 'regulator', function: 'inhibitor', mesh: Geo.generateSphere(22, 12) },
                { id: 'hypothalamus', label: 'label_hypothalamus', x: 0, y: 50, z: 0, color: '#ffcc00', type: 'core', mesh: Geo.generateSphere(25, 12) },
                { id: 'pituitary', label: 'label_pituitary', x: 0, y: -20, z: 40, color: '#ff9900', type: 'core', mesh: Geo.generateSphere(18, 12) },
                { id: 'adrenals', label: 'label_adrenal_glands', x: 0, y: -200, z: -20, color: '#ff3300', type: 'core', mesh: Geo.generateSphere(35, 12) }
            ];

            // Load pathway metadata and pre-cache HPA
            this.loadPathways();
        },

        async loadPathways() {
            const baseUrl = (this.app && this.app.baseUrl) ? this.app.baseUrl : '';
            const data = await window.GreenhouseModelsUtil.PathwayService.loadMetadata(baseUrl);
            this.availablePathways = data.pathways;
            // Pre-load HPA for seamless start
            await this.fetchPathway('hpa');
        },

        async fetchPathway(id) {
            if (this.pathwayCache[id]) {
                this.currentPathwayNodes = this.pathwayCache[id].nodes;
                this.currentPathwayEdges = this.pathwayCache[id].edges;
                this.currentPathwayId = id;
                return;
            }
            const meta = this.availablePathways.find(p => p.id === id);
            if (!meta) return;

            // Prevent infinite re-fetching from the render loop while this is async
            this.currentPathwayId = id;

            // Determine source: local xml or kegg
            if (!meta.source) {
                console.log(`Stress UI: No source for pathway ${id}, using default layout.`);
                // We'll proceed with an empty nodes/edges set which will trigger local generation if needed
                // or just skip. For now, we avoid the XHR.
                return;
            }

            const baseUrl = (this.app && this.app.baseUrl) ? this.app.baseUrl : '';
            const isJSON = meta.source.toLowerCase().endsWith('.json');
            const data = isJSON ?
                await window.GreenhouseModelsUtil.PathwayService.loadJSONPathway(meta.source, baseUrl) :
                await window.GreenhouseModelsUtil.PathwayService.loadPathway(meta.source, baseUrl);

            if (data) {
                // Handle various JSON formats (KEGG vs custom Greenhouse)
                let nodes = data.nodes || data.molecules || data.compartments || [];
                let edges = data.edges || data.reactions || [];

                // Standardize node fields
                nodes = nodes.map(n => ({
                    ...n,
                    id: n.id,
                    name: n.name || n.label || n.id,
                    type: n.type || n.class || 'compound'
                }));

                // Apply 3D Layout (Simplified version of PathwayViewer logic)
                const nodesWithPos = nodes.map((n, i) => {
                    const anatomicalMap = {
                        'pfc': { x: 0, y: 80, z: 140 },
                        'striatum': { x: 80, y: 20, z: 40 },
                        'vta': { x: 0, y: -40, z: -20 },
                        'sn': { x: 30, y: -40, z: -10 },
                        'hypothalamus': { x: 0, y: -20, z: 20 },
                        'pituitary': { x: 0, y: -80, z: 60 },
                        'adrenals': { x: 50, y: -180, z: -20 },
                        'gut': { x: 0, y: -300, z: 20 },
                        'blood_stream': { x: -80, y: -150, z: 0 },
                        'neuronal': { x: -20, y: 150, z: 100 },
                        'immune_cells': { x: -100, y: -350, z: 50 },
                        'synapse': { x: 0, y: 150, z: 150 },
                        'cytosol': { x: 0, y: 160, z: 150 },
                        'nucleus': { x: 0, y: 170, z: 150 }
                    };

                    let pos = { x: 0, y: 0, z: 0 };
                    if (n.region && anatomicalMap[n.region]) {
                        const base = anatomicalMap[n.region];
                        pos = {
                            x: base.x + (Math.sin(i) * 20),
                            y: base.y + (Math.cos(i) * 20),
                            z: base.z + (Math.sin(i * 0.5) * 10)
                        };
                    } else if (meta.regions && meta.regions[0] && anatomicalMap[meta.regions[0]]) {
                        const base = anatomicalMap[meta.regions[0]];
                        // If we fall back to a single region, use jittered positions
                        pos = {
                            x: base.x + (Math.sin(i) * 20),
                            y: base.y + (Math.cos(i) * 20),
                            z: base.z + (Math.sin(i * 0.5) * 10)
                        };
                    } else if (n.x !== undefined && n.y !== undefined) {
                        // Fallback to 2D coordinates from KGML/JSON with scaling
                        const scaleFactor = 2.0;
                        pos.x = (n.x - 400) / scaleFactor;
                        pos.y = -(n.y - 400) / scaleFactor;
                        pos.z = (n.type === 'gene') ? 0 : 50;
                    }

                    return { ...n, ...pos };
                });

                // Standardize edges (ensure source/target are strings)
                const standardizedEdges = edges.map(e => ({
                    source: e.source || e.substrate,
                    target: e.target || e.product,
                    type: e.type || 'standard'
                }));

                this.pathwayCache[id] = { nodes: nodesWithPos, edges: standardizedEdges };
                this.currentPathwayNodes = nodesWithPos;
                this.currentPathwayEdges = standardizedEdges;
                this.currentPathwayId = id;
            }
        },

        render(ctx, state, camera, projection) {
            const viewModeVal = state.factors.viewMode || 0;
            const viewMode = ['macro', 'pathway', 'systemic'][Math.round(viewModeVal)] || 'systemic';
            const activePathId = state.factors.activePathway || 'hpa';

            if (viewMode === 'pathway') {
                if (this.currentPathwayId !== activePathId) {
                    this.fetchPathway(activePathId);
                }
                if (window.GreenhouseStressPathway) {
                    window.GreenhouseStressPathway.render(ctx, state, camera, projection, this);
                }
            } else if (viewMode === 'macro' && window.GreenhouseStressMacro) {
                window.GreenhouseStressMacro.render(ctx, state, camera, projection, this);
            } else if (viewMode === 'systemic' && window.GreenhouseStressSystemic) {
                window.GreenhouseStressSystemic.render(ctx, state, camera, projection, this);
            }
        },

        checkHover(mx, my, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            if (!Math3D) return null;

            const viewModeVal = this.app.engine.state.factors.viewMode || 0;
            const viewMode = ['macro', 'pathway', 'systemic'][Math.round(viewModeVal)];

            if (viewMode === 'macro' && this.brainShell) {
                for (const key in this.brainShell.regions) {
                    const region = this.brainShell.regions[key];
                    if (region.centroid) {
                        const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                        const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                        if (dist < 50 * p.scale && p.depth < 0.7) {
                            return { id: key, label: region.name, type: '3d' };
                        }
                    }
                }
            } else if (viewMode === 'pathway') {
                for (const node of this.hpaNodes) {
                    const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                    const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                    if (dist < 25 * p.scale) {
                        return { id: node.id, label: node.label, type: '3d' };
                    }
                }
            } else if (viewMode === 'systemic') {
                if (window.GreenhouseStressSystemic && window.GreenhouseStressSystemic.checkHit) {
                    const hit = window.GreenhouseStressSystemic.checkHit(mx, my, camera, projection);
                    if (hit) return hit;
                }
                // Fallback / Crystal Check
                const p = Math3D.project3DTo2D(0, 0, 0, camera, projection);
                const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                if (dist < 100 * p.scale) {
                    return { id: 'crystal', label: 'Resilience Crystal', type: '3d' };
                }
            }
            return null;
        }
    };

    window.GreenhouseStressUI3D = GreenhouseStressUI3D;
})();
