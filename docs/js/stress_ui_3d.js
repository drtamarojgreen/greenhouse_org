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
        },

        render(ctx, state, camera, projection) {
            const viewModeVal = state.factors.viewMode || 0;
            const viewMode = ['macro', 'pathway', 'systemic'][Math.round(viewModeVal)] || 'systemic';

            if (viewMode === 'macro' && window.GreenhouseStressMacro) {
                window.GreenhouseStressMacro.render(ctx, state, camera, projection, this);
            } else if (viewMode === 'pathway' && window.GreenhouseStressPathway) {
                window.GreenhouseStressPathway.render(ctx, state, camera, projection, this);
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
