// docs/js/neuro_ui_3d.js
// 3D Visualization for Neuro GA

(function () {
    'use strict';

    const GreenhouseNeuroUI3D = {
        canvas: null,
        ctx: null,
        camera: {
            x: 0,
            y: 0,
            z: -800,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            fov: 600
        },
        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 5000
        },
        autoRotate: true,
        rotationSpeed: 0.005,
        neurons: [], // 3D neuron objects
        connections: [], // 3D connection objects
        animationId: null,
        isPlaying: false,

        init(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.error('NeuroUI3D: Container not found', containerSelector);
                return;
            }

            console.log('NeuroUI3D: Canvas build delayed by 5 seconds.');

            setTimeout(() => {
                this.canvas = document.createElement('canvas');
                this.canvas.width = container.offsetWidth;
                this.canvas.height = Math.max(container.offsetHeight, 600); // Default to 600 if 0
                this.canvas.style.width = '100%';
                this.canvas.style.height = '100%';
                this.canvas.style.backgroundColor = '#111';

                container.appendChild(this.canvas);
                this.ctx = this.canvas.getContext('2d');

                this.projection.width = this.canvas.width;
                this.projection.height = this.canvas.height;

                // Handle Resize
                window.addEventListener('resize', () => {
                    if (this.canvas) {
                        this.canvas.width = container.offsetWidth;
                        this.canvas.height = container.offsetHeight;
                        this.projection.width = this.canvas.width;
                        this.projection.height = this.canvas.height;
                    }
                });

                // Add Explanations
                this.addExplanation(container);

                // Add Start Overlay
                this.addStartOverlay(container);

                // Start Animation Loop (but logic depends on isPlaying)
                this.startAnimation();
            }, 5000);
        },

        addExplanation(container) {
            const util = window.GreenhouseModelsUtil;
            if (!util) return;

            const section = document.createElement('div');
            section.style.padding = '20px';
            section.style.background = '#f4f4f9';
            section.style.marginTop = '10px';
            section.style.borderRadius = '8px';
            section.style.color = '#333';
            section.innerHTML = `
                <h3 style="margin-top:0;">${util.t('neuro_explanation_title')}</h3>
                <p>${util.t('neuro_explanation_text')}</p>
            `;
            container.appendChild(section);
        },

        addStartOverlay(container) {
            const util = window.GreenhouseModelsUtil;
            const overlay = document.createElement('div');
            overlay.id = 'neuro-start-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%'; // Cover canvas area
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '10';

            const btn = document.createElement('button');
            btn.textContent = util ? util.t('Start Simulation') : 'Start Simulation';
            btn.style.padding = '15px 30px';
            btn.style.fontSize = '18px';
            btn.style.cursor = 'pointer';
            btn.style.background = '#2ecc71';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';

            btn.onclick = () => {
                this.isPlaying = true;
                overlay.style.display = 'none';
                if (window.GreenhouseNeuroApp) window.GreenhouseNeuroApp.startSimulation();
            };

            overlay.appendChild(btn);
            // Append to container, but make sure container is relative
            container.style.position = 'relative';
            container.appendChild(overlay);
        },

        updateData(genome) {
            // Convert GA genome to visualization data
            // genome.neurons: {x,y,z, id}
            // genome.connections: {from, to, weight}

            this.neurons = genome.neurons.map(n => ({
                ...n,
                // Add visual properties if needed
                radius: 5 + Math.random() * 5
            }));

            this.connections = genome.connections.map(c => {
                // Map indices to actual neuron objects for 3D drawing
                const fromNeuron = this.neurons.find(n => n.id === c.from);
                const toNeuron = this.neurons.find(n => n.id === c.to);
                return {
                    from: fromNeuron,
                    to: toNeuron,
                    weight: c.weight
                };
            }).filter(c => c.from && c.to);
        },

        startAnimation() {
            const animate = () => {
                if (this.autoRotate) {
                    this.camera.rotationY += this.rotationSpeed;
                }
                this.render();
                this.animationId = requestAnimationFrame(animate);
            };
            animate();
        },

        render() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Draw Grid
            this.drawGrid(ctx);

            // Helper for projection (assuming GreenhouseModels3DMath is loaded)
            if (!window.GreenhouseModels3DMath) {
                ctx.fillStyle = 'white';
                ctx.fillText('GreenhouseModels3DMath library missing', 20, 30);
                return;
            }

            // Project Neurons
            const projectedNeurons = [];
            this.neurons.forEach(neuron => {
                const projected = GreenhouseModels3DMath.project3DTo2D(
                    neuron.x, neuron.y, neuron.z,
                    this.camera,
                    this.projection
                );

                if (projected.scale > 0) {
                    projectedNeurons.push({
                        ...neuron,
                        screenX: projected.x,
                        screenY: projected.y,
                        depth: projected.depth,
                        scale: projected.scale
                    });
                }
            });

            // Sort by depth
            projectedNeurons.sort((a, b) => b.depth - a.depth);

            // Draw Connections (behind neurons)
            this.connections.forEach(conn => {
                const fromProj = projectedNeurons.find(n => n.id === conn.from.id);
                const toProj = projectedNeurons.find(n => n.id === conn.to.id);

                if (fromProj && toProj) {
                    const avgDepth = (fromProj.depth + toProj.depth) / 2;
                    const alpha = GreenhouseModels3DMath.applyDepthFog(0.5, avgDepth);

                    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                    ctx.lineWidth = Math.max(0.5, (conn.weight * 2) * fromProj.scale);

                    ctx.beginPath();
                    ctx.moveTo(fromProj.screenX, fromProj.screenY);
                    ctx.lineTo(toProj.screenX, toProj.screenY);
                    ctx.stroke();
                }
            });

            // Draw Neurons
            projectedNeurons.forEach(p => {
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, p.depth);
                const r = p.radius * p.scale;

                ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                const glow = ctx.createRadialGradient(p.screenX, p.screenY, r * 0.5, p.screenX, p.screenY, r * 2);
                glow.addColorStop(0, `rgba(255, 150, 150, ${alpha})`);
                glow.addColorStop(1, 'rgba(255, 150, 150, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.screenX, p.screenY, r * 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Labels
            this.drawLabels(ctx, projectedNeurons);

            // Draw Stats
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '14px monospace';
            ctx.fillText(`Neurons: ${this.neurons.length}`, 20, 30);
            ctx.fillText(`Connections: ${this.connections.length}`, 20, 50);
        },

        drawGrid(ctx) {
            const util = window.GreenhouseModelsUtil;
            if (!window.GreenhouseModels3DMath) return;

            const size = 1000;
            const step = 200;
            const y = 400; // Floor level

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';

            // Draw lines
            for (let x = -size; x <= size; x += step) {
                const p1 = GreenhouseModels3DMath.project3DTo2D(x, y, -size, this.camera, this.projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(x, y, size, this.camera, this.projection);
                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
            for (let z = -size; z <= size; z += step) {
                const p1 = GreenhouseModels3DMath.project3DTo2D(-size, y, z, this.camera, this.projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(size, y, z, this.camera, this.projection);
                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }

            // Axis Labels
            const origin = GreenhouseModels3DMath.project3DTo2D(0, y, 0, this.camera, this.projection);
            const xAxis = GreenhouseModels3DMath.project3DTo2D(size, y, 0, this.camera, this.projection);
            const zAxis = GreenhouseModels3DMath.project3DTo2D(0, y, size, this.camera, this.projection);

            if (origin.scale > 0) {
                if (xAxis.scale > 0) ctx.fillText(util ? util.t('X-Axis') : 'X-Axis', xAxis.x, xAxis.y);
                if (zAxis.scale > 0) ctx.fillText(util ? util.t('Z-Axis') : 'Z-Axis', zAxis.x, zAxis.y);
            }
        },

        drawLabels(ctx, projectedNeurons) {
            const util = window.GreenhouseModelsUtil;
            if (!util || projectedNeurons.length === 0) return;

            // Label one random neuron as "Neuron" just for demo, or the first one
            const p = projectedNeurons[0];
            if (p) {
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText(util.t('Neuron'), p.screenX + 15, p.screenY);

                // Draw line to it
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(p.screenX + 10, p.screenY);
                ctx.lineTo(p.screenX, p.screenY);
                ctx.stroke();
            }
        }
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
