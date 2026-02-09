/**
 * @file inflammation_ui_3d.js
 * @description 3D Visualization components for the Neuroinflammation Simulation.
 * Supports Macro (Brain), Micro (Cellular), and Molecular levels.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationUI3D = {
        brainShell: null,
        neurons: [],
        glia: [],
        molecules: [],
        originalRegionColors: {},

        init(app) {
            this.app = app;
            // Initialize Brain Shell for Macro View
            if (window.GreenhouseNeuroGeometry) {
                this.brainShell = { vertices: [], faces: [] };
                window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);

                // Cache original colors for restoration
                this.originalRegionColors = {};
                if (this.brainShell.regions) {
                    for (const key in this.brainShell.regions) {
                        this.originalRegionColors[key] = this.brainShell.regions[key].color;
                    }
                }
            }

            // Initialize Micro View (Neurons and Glia)
            this.initMicroData();

            // Initialize Molecular View
            this.initMolecularData();
        },

        initMicroData() {
            if (!window.GreenhouseNeuroGeometry) return;
            this.neurons = [];
            for (let i = 0; i < 3; i++) {
                const p1 = { x: -150 + i * 100, y: -100, z: (Math.random() - 0.5) * 100 };
                const p2 = { x: -150 + i * 100, y: 100, z: (Math.random() - 0.5) * 100 };
                const cp = { x: p1.x + 50, y: 0, z: 50 };
                const mesh = window.GreenhouseNeuroGeometry.generateTubeMesh(p1, p2, cp, 5, 8);
                this.neurons.push({ p1, p2, cp, mesh, baseColor: '#4ca1af' });
            }

            this.glia = [];
            for (let i = 0; i < 5; i++) {
                this.glia.push({
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 300,
                    z: (Math.random() - 0.5) * 200,
                    rotationX: Math.random() * Math.PI,
                    rotationY: Math.random() * Math.PI,
                    size: 15 + Math.random() * 10,
                    type: Math.random() > 0.5 ? 'astrocyte' : 'microglia'
                });
            }
        },

        initMolecularData() {
            this.molecules = [];
            for (let i = 0; i < 100; i++) {
                this.molecules.push({
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 400,
                    z: (Math.random() - 0.5) * 400,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    vz: (Math.random() - 0.5) * 2,
                    type: Math.random() > 0.7 ? 'cytokine' : 'ion',
                    size: 2 + Math.random() * 4
                });
            }
        },

        render(ctx, state, camera, projection) {
            const tone = state.metrics.inflammatoryTone;
            const viewModeVal = state.factors.viewMode || 0;
            const viewModes = ['macro', 'micro', 'molecular'];
            const viewMode = viewModes[Math.round(viewModeVal)] || 'macro';

            ctx.save();
            if (viewMode === 'macro') {
                this.renderMacro(ctx, tone, camera, projection);
            } else if (viewMode === 'micro') {
                this.renderMicro(ctx, tone, camera, projection);
            } else {
                this.renderMolecular(ctx, tone, camera, projection);
            }
            ctx.restore();
        },

        renderMacro(ctx, tone, camera, projection) {
            if (!this.brainShell || !window.GreenhouseNeuroBrain) return;

            // Shift colors of regions based on tone
            const regions = this.brainShell.regions;
            for (const key in regions) {
                if (tone > 0.4) {
                    // Inflame: Redder/more opaque
                    const r = Math.min(255, 100 + tone * 255);
                    const g = 150 * (1 - tone);
                    const b = 255 * (1 - tone);
                    const a = 0.4 + tone * 0.4;
                    regions[key].color = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
                } else {
                    // Healthy: Restore cached colors
                    regions[key].color = this.originalRegionColors[key] || 'rgba(100, 150, 255, 0.4)';
                }
            }

            window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, camera, projection, projection.width, projection.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.fillText(t('inflam_macro_label'), 20, 30);
        },

        renderMicro(ctx, tone, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;

            // Draw Neurons
            this.neurons.forEach(n => {
                const alpha = tone > 0.6 ? 0.3 : 0.8; // Signaling dims as inflammation rises
                ctx.strokeStyle = `rgba(76, 161, 175, ${alpha})`;
                ctx.lineWidth = 2;

                n.mesh.faces.forEach(face => {
                    const p1 = Math3D.project3DTo2D(n.mesh.vertices[face[0]].x, n.mesh.vertices[face[0]].y, n.mesh.vertices[face[0]].z, camera, projection);
                    const p2 = Math3D.project3DTo2D(n.mesh.vertices[face[1]].x, n.mesh.vertices[face[1]].y, n.mesh.vertices[face[1]].z, camera, projection);
                    const p3 = Math3D.project3DTo2D(n.mesh.vertices[face[2]].x, n.mesh.vertices[face[2]].y, n.mesh.vertices[face[2]].z, camera, projection);

                    if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.lineTo(p3.x, p3.y);
                        ctx.stroke();
                    }
                });
            });

            // Draw Glia
            this.glia.forEach(g => {
                const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                if (p.scale <= 0) return;

                const size = g.size * p.scale * (1 + tone);
                const color = g.type === 'astrocyte'
                    ? `rgba(255, ${Math.round(255 * (1 - tone))}, 100, 0.8)`
                    : `rgba(200, 100, 255, 0.8)`;

                ctx.beginPath();
                // Star shape for astrocyte
                if (g.type === 'astrocyte') {
                    const spikes = 6;
                    for (let i = 0; i < spikes * 2; i++) {
                        const r = i % 2 === 0 ? size : size * 0.4;
                        const angle = (i / spikes) * Math.PI + g.rotationY;
                        const px = p.x + Math.cos(angle) * r;
                        const py = p.y + Math.sin(angle) * r;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                } else {
                    ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
                }
                ctx.fillStyle = color;
                ctx.fill();

                if (tone > 0.5) {
                    ctx.shadowBlur = 15 * tone;
                    ctx.shadowColor = 'red';
                }
            });

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.fillText(t('inflam_micro_label'), 20, 30);
        },

        renderMolecular(ctx, tone, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;

            this.molecules.forEach(m => {
                // Drift
                m.x += m.vx * (1 + tone);
                m.y += m.vy * (1 + tone);
                m.z += m.vz * (1 + tone);

                // Wrap
                if (Math.abs(m.x) > 300) m.x *= -0.9;
                if (Math.abs(m.y) > 200) m.y *= -0.9;
                if (Math.abs(m.z) > 200) m.z *= -0.9;

                const p = Math3D.project3DTo2D(m.x, m.y, m.z, camera, projection);
                if (p.scale <= 0) return;

                const alpha = Math3D.applyDepthFog(0.8, p.depth);

                if (m.type === 'cytokine') {
                    // Cytokines are orange/red and grow with tone
                    ctx.fillStyle = `rgba(255, ${Math.round(100 * (1 - tone))}, 0, ${alpha})`;
                    const s = m.size * (1 + tone);
                    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
                } else {
                    // Ions are blue
                    ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, m.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Arial';
            ctx.fillText(t('inflam_mol_label'), 20, 30);
        }
    };

    window.GreenhouseInflammationUI3D = GreenhouseInflammationUI3D;
})();
