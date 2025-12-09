// docs/js/genetic_ui_3d.js
// 3D Visualization for Genetic Algorithm

(function () {
    'use strict';

    const GreenhouseGeneticUI3D = {
        container: null,
        canvas: null,
        ctx: null,
        algo: null,

        camera: {
            x: 0, y: 0, z: -400,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            fov: 500
        },
        projection: {
            width: 800, height: 600,
            near: 10, far: 2000
        },

        isEvolving: false,
        animationFrame: null,

        neurons3D: [],
        connections3D: [],

        init(container, algo) {
            this.container = container;
            this.algo = algo;

            this.setupDOM();
            this.resize();
            this.setupInteraction();

            // Initial Data Map
            this.updateData();

            // Start Render Loop
            this.animate();
        },

        setupDOM() {
            // Controls
            const controls = document.createElement('div');
            controls.className = 'greenhouse-controls-panel';
            controls.style.marginBottom = '15px';
            controls.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                    <button id="gen-pause-btn" class="greenhouse-btn">Pause Evolution</button>
                    <div style="margin-left: auto; font-weight: bold; color: #2c3e50;">
                        Gen: <span id="gen-counter">0</span> | Fitness: <span id="fitness-display">0.00</span>
                    </div>
                </div>
            `;
            this.container.appendChild(controls);

            // Bind Button
            const btn = controls.querySelector('#gen-pause-btn');
            btn.addEventListener('click', () => {
                this.isEvolving = !this.isEvolving;
                btn.textContent = this.isEvolving ? "Pause Evolution" : "Resume Evolution";
                btn.style.background = this.isEvolving ? "" : "#e74c3c";
                btn.style.color = this.isEvolving ? "" : "white";
            });

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '500px';
            this.canvas.style.background = '#0f172a';
            this.canvas.style.borderRadius = '12px';
            this.canvas.style.cursor = 'grab';
            this.container.appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d');

            // Add Start Overlay
            this.addStartOverlay(this.container);

            // Add Explanations
            this.addExplanation(this.container);
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
                <h3 style="margin-top:0;">${util.t('genetic_explanation_title')}</h3>
                <p>${util.t('genetic_explanation_text')}</p>
            `;
            container.appendChild(section);
        },

        addStartOverlay(container) {
            const util = window.GreenhouseModelsUtil;
            const overlay = document.createElement('div');
            overlay.id = 'genetic-start-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '500px'; // Match canvas height
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '10';
            overlay.style.borderRadius = '12px'; // Match canvas border radius

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
                this.isEvolving = true;
                overlay.style.display = 'none';
                if (window.GreenhouseGenetic) window.GreenhouseGenetic.startSimulation();
                // Update pause button text if needed
                const pauseBtn = container.querySelector('#gen-pause-btn');
                if (pauseBtn) {
                    pauseBtn.textContent = "Pause Evolution";
                    pauseBtn.style.background = "";
                    pauseBtn.style.color = "";
                }
            };

            overlay.appendChild(btn);
            // Append to container, but make sure container is relative
            container.style.position = 'relative';
            container.appendChild(overlay);
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;
        },

        setupInteraction() {
            let isDragging = false;
            let lastX = 0, lastY = 0;

            this.canvas.addEventListener('mousedown', e => {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
                if (this.canvas) this.canvas.style.cursor = 'grab';
            });

            window.addEventListener('mousemove', e => {
                if (!isDragging) return;
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;

                this.camera.rotationY += dx * 0.005;
                this.camera.rotationX += dy * 0.005;

                lastX = e.clientX;
                lastY = e.clientY;
            });

            this.canvas.addEventListener('wheel', e => {
                e.preventDefault();
                this.camera.z += e.deltaY * 0.5;
            });
        },

        updateData() {
            if (!this.algo || !this.algo.bestNetwork) return;

            const net = this.algo.bestNetwork;

            // Update UI Counters
            const genCounter = document.getElementById('gen-counter');
            const fitDisplay = document.getElementById('fitness-display');
            if (genCounter) genCounter.textContent = this.algo.generation;
            if (fitDisplay) fitDisplay.textContent = net.fitness.toFixed(2);

            // Map Neurons to 3D Space (if not already mapped or if topology changes)
            // For this demo, we re-map every time to be safe, though optimization would cache positions
            this.neurons3D = net.nodes.map((node, i) => {
                // Spherical Distribution based on layer
                const layerOffset = (node.layer - 1) * 100; // -100, 0, 100
                const angle = (i * Math.PI * 2) / (net.nodes.length / 3) + (node.layer * 0.5);
                const radius = 100;

                return {
                    id: node.id,
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    z: layerOffset,
                    activation: node.activation,
                    type: node.type
                };
            });

            // Map Connections
            this.connections3D = net.connections.map(conn => {
                const n1 = this.neurons3D.find(n => n.id === conn.from);
                const n2 = this.neurons3D.find(n => n.id === conn.to);
                return { from: n1, to: n2, weight: conn.weight };
            }).filter(c => c.from && c.to);
        },

        shouldEvolve() {
            return this.isEvolving;
        },

        animate() {
            this.render();
            // Auto-rotate slightly
            if (this.isEvolving) {
                this.camera.rotationY += 0.002;
            }
            this.animationFrame = requestAnimationFrame(() => this.animate());
        },

        render() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const { width, height } = this.canvas;

            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            if (!window.GreenhouseModels3DMath) return;

            // Draw Grid
            this.drawGrid(ctx);

            // Project Points
            const projectedNeurons = this.neurons3D.map(n => {
                const proj = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                return { ...n, ...proj };
            }).filter(p => p.scale > 0);

            // Draw Connections
            this.connections3D.forEach(conn => {
                const p1 = projectedNeurons.find(p => p.id === conn.from.id);
                const p2 = projectedNeurons.find(p => p.id === conn.to.id);

                if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);

                    const alpha = Math.abs(conn.weight);
                    const color = conn.weight > 0 ? `rgba(100, 200, 255, ${alpha})` : `rgba(255, 100, 100, ${alpha})`;

                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.max(1, Math.abs(conn.weight) * 3);
                    ctx.stroke();
                }
            });

            // Draw Neurons
            projectedNeurons.sort((a, b) => b.depth - a.depth); // Sort by depth
            projectedNeurons.forEach(p => {
                const size = 5 * p.scale;

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);

                // Color based on type and activation
                let color = '#ffffff';
                if (p.type === 'input') color = '#3498db';
                if (p.type === 'output') color = '#2ecc71';
                if (p.type === 'hidden') color = '#9b59b6';

                // Glow if active
                if (Math.abs(p.activation) > 0.1) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Draw Labels
            this.drawLabels(ctx, projectedNeurons);
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

            // Label one random neuron as "Gene" just for demo
            const p = projectedNeurons[0];
            if (p) {
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText(util.t('Gene'), p.x + 15, p.y);

                // Draw line to it
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(p.x + 10, p.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        }
    };

    window.GreenhouseGeneticUI3D = GreenhouseGeneticUI3D;
})();
