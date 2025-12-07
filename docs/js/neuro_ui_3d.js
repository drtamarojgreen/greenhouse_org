// docs/js/neuro_ui_3d.js
// 3D Visualization for Neuro GA

(function() {
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

        init(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.error('NeuroUI3D: Container not found', containerSelector);
                return;
            }

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
                this.canvas.width = container.offsetWidth;
                this.canvas.height = container.offsetHeight;
                this.projection.width = this.canvas.width;
                this.projection.height = this.canvas.height;
            });

            this.startAnimation();
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

            // Draw Stats
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '14px monospace';
            ctx.fillText(`Neurons: ${this.neurons.length}`, 20, 30);
            ctx.fillText(`Connections: ${this.connections.length}`, 20, 50);
        }
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
