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
            const data = await window.GreenhouseModelsUtil.PathwayService.loadMetadata();
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

            // Determine source: local xml or kegg
            const source = meta.source || `endpoints/kegg_${id}_raw.xml`; // Simplified fallback
            const data = await window.GreenhouseModelsUtil.PathwayService.loadPathway(source);

            if (data) {
                // Apply 3D Layout (Simplified version of PathwayViewer logic)
                const nodesWithPos = data.nodes.map((n, i) => {
                    const anatomicalMap = {
                        'pfc': { x: 0, y: 80, z: 140 },
                        'striatum': { x: 80, y: 20, z: 40 },
                        'vta': { x: 0, y: -40, z: -20 },
                        'sn': { x: 30, y: -40, z: -10 },
                        'hypothalamus': { x: 0, y: -20, z: 20 },
                        'pituitary': { x: 0, y: -80, z: 60 },
                        'adrenals': { x: 50, y: -180, z: -20 },
                        'gut': { x: 0, y: -300, z: 20 },
                        'blood_stream': { x: -80, y: -150, z: 0 }
                    };
                    const base = anatomicalMap[n.region] || anatomicalMap[meta.regions[0]] || { x: 0, y: 0, z: 0 };
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
