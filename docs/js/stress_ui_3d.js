/**
 * @file stress_ui_3d.js
 * @description 3D Visualization components for the Stress Dynamics Simulation.
 * Supports Macro (Regulatory), Pathway (HPA-Axis), and Systemic (Dynamics) levels.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressUI3D = {
        brainShell: null,
        hpaNodes: [],
        originalRegionColors: {},

        init() {
            // Initialize Brain Shell for Macro View
            if (window.GreenhouseNeuroGeometry) {
                this.brainShell = { vertices: [], faces: [] };
                window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);

                // Cache original colors
                this.originalRegionColors = {};
                if (this.brainShell.regions) {
                    for (const key in this.brainShell.regions) {
                        this.originalRegionColors[key] = this.brainShell.regions[key].color;
                    }
                }
            }

            // Initialize HPA Pathway nodes
            this.hpaNodes = [
                { id: 'hypothalamus', label: 'label_hypothalamus', x: 0, y: 50, z: 0, color: '#ffcc00' },
                { id: 'pituitary', label: 'label_pituitary', x: 0, y: -20, z: 40, color: '#ff9900' },
                { id: 'adrenals', label: 'label_adrenal_glands', x: 0, y: -180, z: -20, color: '#ff3300' }
            ];
        },

        render(ctx, state, camera, projection) {
            const viewModeVal = state.factors.viewMode || 0;
            const viewModes = ['macro', 'pathway', 'systemic'];
            const viewMode = viewModes[Math.round(viewModeVal)] || 'systemic';

            if (!this.brainShell) this.init();

            ctx.save();
            if (viewMode === 'macro') {
                this.renderMacro(ctx, state, camera, projection);
            } else if (viewMode === 'pathway') {
                this.renderPathway(ctx, state, camera, projection);
            } else {
                this.renderSystemic(ctx, state, camera, projection);
            }
            ctx.restore();
        },

        renderMacro(ctx, state, camera, projection) {
            if (!this.brainShell || !window.GreenhouseNeuroBrain) return;

            const load = state.metrics.allostaticLoad;
            const regions = this.brainShell.regions;

            // Highlight PFC and Amygdala
            for (const key in regions) {
                const isPFC = key.toLowerCase().includes('pfc') || key.toLowerCase().includes('frontal');
                const isAmygdala = key.toLowerCase().includes('amygdala') || key.toLowerCase().includes('temporal');

                if (isAmygdala) {
                    // Amygdala: Glowing Red/Orange with load
                    const r = 200 + load * 55;
                    const g = 100 * (1 - load);
                    const b = 50 * (1 - load);
                    regions[key].color = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${0.6 + load * 0.4})`;
                } else if (isPFC) {
                    // PFC: Dimming or Greying out with load
                    const brightness = Math.round(150 * (1 - load));
                    regions[key].color = `rgba(${brightness}, 200, 255, ${0.7 - load * 0.4})`;
                } else {
                    regions[key].color = this.originalRegionColors[key] || 'rgba(100, 150, 255, 0.2)';
                }
            }

            window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, camera, projection, projection.width, projection.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.fillText(t('stress_macro_label'), 20, 60);
        },

        renderPathway(ctx, state, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const load = state.metrics.allostaticLoad;
            const time = state.time || 0;

            camera.rotationY += 0.002;

            const projectedNodes = this.hpaNodes.map(node => {
                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                return { ...node, ...p };
            });

            // Draw Connections (Pathway Tubes)
            ctx.lineWidth = 4;
            for (let i = 0; i < projectedNodes.length - 1; i++) {
                const n1 = projectedNodes[i];
                const n2 = projectedNodes[i + 1];
                if (n1.scale <= 0 || n2.scale <= 0) continue;

                const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
                grad.addColorStop(0, n1.color);
                grad.addColorStop(1, n2.color);

                ctx.beginPath();
                ctx.strokeStyle = grad;
                ctx.globalAlpha = 0.4 + load * 0.6;
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Animated signals
                const signalCount = 3 + Math.floor(load * 10);
                for (let s = 0; s < signalCount; s++) {
                    const progress = ((time * 0.002 + s / signalCount) % 1.0);
                    const sx = n1.x + (n2.x - n1.x) * progress;
                    const sy = n1.y + (n2.y - n1.y) * progress;
                    const ss = 3 * n1.scale * (1 + load);

                    ctx.beginPath();
                    ctx.fillStyle = '#fff';
                    ctx.arc(sx, sy, ss, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw Nodes
            projectedNodes.forEach(node => {
                if (node.scale <= 0) return;
                const size = 20 * node.scale * (1 + load * 0.5);

                ctx.beginPath();
                ctx.fillStyle = node.color;
                ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = `${Math.round(12 * node.scale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(t(node.label), node.x, node.y + size + 15);
            });

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(t('stress_pathway_label'), 20, 60);
        },

        renderSystemic(ctx, state, camera, projection) {
            if (!window.GreenhouseModels3DMath) return;

            const Math3D = window.GreenhouseModels3DMath;
            const metrics = state.metrics;
            const reserve = metrics.resilienceReserve;
            const load = metrics.allostaticLoad;

            // Rotate camera
            camera.rotationY += 0.005;

            // Generate points for a "Resilience Crystal"
            const size = 100 * (0.5 + reserve);
            const vertices = [
                { x: 0, y: size, z: 0 },
                { x: 0, y: -size, z: 0 },
                { x: size, y: 0, z: 0 },
                { x: -size, y: 0, z: 0 },
                { x: 0, y: 0, z: size },
                { x: 0, y: 0, z: -size }
            ];

            const projected = vertices.map(v => Math3D.project3DTo2D(v.x, v.y, v.z, camera, projection));

            // Draw edges
            const edges = [
                [0, 2], [0, 3], [0, 4], [0, 5],
                [1, 2], [1, 3], [1, 4], [1, 5],
                [2, 4], [4, 3], [3, 5], [5, 2]
            ];

            ctx.lineWidth = 2;
            edges.forEach(edge => {
                const p1 = projected[edge[0]];
                const p2 = projected[edge[1]];
                if (p1.scale <= 0 || p2.scale <= 0) return;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                const alpha = Math3D.applyDepthFog(0.6, (p1.depth + p2.depth) / 2);
                ctx.strokeStyle = `rgba(76, 161, 175, ${alpha * reserve})`;
                ctx.stroke();
            });

            // Draw "Allostatic Spikes" if load is high
            if (load > 0.4) {
                const spikeCount = Math.floor(load * 30);
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (i / spikeCount) * Math.PI * 2 + state.time * 0.001;
                    const r = size * (1 + Math.random() * 0.8 * load);
                    const v = {
                        x: Math.cos(angle) * r,
                        y: (Math.random() - 0.5) * r * 2,
                        z: Math.sin(angle) * r
                    };
                    const p = Math3D.project3DTo2D(v.x, v.y, v.z, camera, projection);
                    if (p.scale > 0) {
                        ctx.beginPath();
                        ctx.moveTo(projection.width / 2, projection.height / 2);
                        ctx.lineTo(p.x, p.y);
                        ctx.strokeStyle = `rgba(255, 77, 77, ${0.3 * load * p.scale})`;
                        ctx.stroke();
                    }
                }
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.fillText(t('stress_systemic_label'), 20, 60);
        }
    };

    window.GreenhouseStressUI3D = GreenhouseStressUI3D;
})();
