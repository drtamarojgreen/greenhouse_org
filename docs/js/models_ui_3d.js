// docs/js/models_ui_3d.js
// 3D Canvas Rendering Module for Models Visualization
// Implements the fourth canvas with 3D neural network visualization

(function() {
    'use strict';

    const GreenhouseModelsUI3D = {
        canvas3D: null,
        context3D: null,
        camera: {
            x: 0,
            y: 0,
            z: -500,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            fov: 500
        },
        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 2000
        },
        isActive: false,
        autoRotate: false,
        rotationSpeed: 0.005,
        neurons3D: [],
        connections3D: [],
        animationFrame: null,

        /**
         * Initializes the 3D canvas system
         */
        init3DCanvas() {
            if (!window.GreenhouseModels3DMath) {
                console.error('3D Math module not loaded');
                return;
            }

            // Create the 3D canvas container
            const container = document.querySelector('.simulation-left-column');
            if (!container) {
                console.error('Cannot find left column for 3D canvas');
                return;
            }

            // Create 3D canvas section
            const canvas3DSection = document.createElement('div');
            canvas3DSection.id = 'canvas-3d-section';
            canvas3DSection.style.cssText = 'margin-top: 15px; display: none;';

            const canvas3DTitle = document.createElement('h3');
            canvas3DTitle.className = 'greenhouse-panel-title';
            canvas3DTitle.textContent = this.util.t('3d_view_title') || '3D Neural Network View';

            this.canvas3D = document.createElement('canvas');
            this.canvas3D.id = 'canvas-3d';
            this.canvas3D.style.cssText = 'width: 100%; height: 400px; background: #1a1a1a; border-radius: 12px; cursor: grab;';

            const controls3D = document.createElement('div');
            controls3D.id = 'controls-3d';
            controls3D.className = 'greenhouse-controls-panel';

            canvas3DSection.appendChild(canvas3DTitle);
            canvas3DSection.appendChild(this.canvas3D);
            canvas3DSection.appendChild(controls3D);

            // Insert before the environment canvas
            const envCanvas = document.getElementById('canvas-environment');
            if (envCanvas && envCanvas.parentNode) {
                envCanvas.parentNode.insertBefore(canvas3DSection, envCanvas);
            } else {
                container.insertBefore(canvas3DSection, container.firstChild);
            }

            // Get context
            this.context3D = this.canvas3D.getContext('2d');

            // Set up controls
            this.setup3DControls(controls3D);

            // Set up canvas size
            this.resize3DCanvas();

            // Set up mouse interaction
            this.setup3DInteraction();

            // Initialize 3D data structures
            this.initialize3DData();
            
            // Bind the toggle button from environment controls
            this.bind3DToggleButton();
        },

        /**
         * Binds the toggle button from environment controls
         */
        bind3DToggleButton() {
            const toggleBtn = document.getElementById('toggle-3d-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggle3DView());
            }
        },

        /**
         * Sets up the 3D control panel
         */
        setup3DControls(container) {
            const t = (k) => this.util.t(k);
            
            container.innerHTML = `
                <div class="button-group">
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="rotate-3d-btn" disabled>
                        ${t('auto_rotate') || 'Auto Rotate'}
                    </button>
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-camera-btn" disabled>
                        ${t('reset_camera') || 'Reset Camera'}
                    </button>
                </div>
                <div class="control-group" id="3d-camera-controls" style="display: none;">
                    <label>${t('camera_x') || 'Camera X Rotation'}</label>
                    <input type="range" min="-180" max="180" value="0" class="greenhouse-slider" id="camera-x-slider">
                    <label>${t('camera_y') || 'Camera Y Rotation'}</label>
                    <input type="range" min="-180" max="180" value="0" class="greenhouse-slider" id="camera-y-slider">
                    <label>${t('camera_z') || 'Camera Z Position'}</label>
                    <input type="range" min="-1000" max="-100" value="-500" class="greenhouse-slider" id="camera-z-slider">
                    <label>${t('fov') || 'Field of View'}</label>
                    <input type="range" min="200" max="800" value="500" class="greenhouse-slider" id="fov-slider">
                </div>
            `;

            // Bind event listeners
            const rotateBtn = document.getElementById('rotate-3d-btn');
            const resetBtn = document.getElementById('reset-camera-btn');

            rotateBtn.addEventListener('click', () => this.toggleAutoRotate());
            resetBtn.addEventListener('click', () => this.resetCamera());

            // Camera control sliders
            document.getElementById('camera-x-slider').addEventListener('input', (e) => {
                this.camera.rotationX = GreenhouseModels3DMath.degToRad(parseFloat(e.target.value));
                this.render3DView();
            });

            document.getElementById('camera-y-slider').addEventListener('input', (e) => {
                this.camera.rotationY = GreenhouseModels3DMath.degToRad(parseFloat(e.target.value));
                this.render3DView();
            });

            document.getElementById('camera-z-slider').addEventListener('input', (e) => {
                this.camera.z = parseFloat(e.target.value);
                this.render3DView();
            });

            document.getElementById('fov-slider').addEventListener('input', (e) => {
                this.camera.fov = parseFloat(e.target.value);
                this.render3DView();
            });
        },

        /**
         * Sets up mouse interaction for 3D canvas
         */
        setup3DInteraction() {
            let isDragging = false;
            let lastX = 0;
            let lastY = 0;

            this.canvas3D.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                this.canvas3D.style.cursor = 'grabbing';
            });

            this.canvas3D.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;

                this.camera.rotationY += deltaX * 0.005;
                this.camera.rotationX += deltaY * 0.005;

                // Update sliders
                document.getElementById('camera-x-slider').value = GreenhouseModels3DMath.radToDeg(this.camera.rotationX);
                document.getElementById('camera-y-slider').value = GreenhouseModels3DMath.radToDeg(this.camera.rotationY);

                lastX = e.clientX;
                lastY = e.clientY;

                this.render3DView();
            });

            this.canvas3D.addEventListener('mouseup', () => {
                isDragging = false;
                this.canvas3D.style.cursor = 'grab';
            });

            this.canvas3D.addEventListener('mouseleave', () => {
                isDragging = false;
                this.canvas3D.style.cursor = 'grab';
            });

            // Mouse wheel for zoom
            this.canvas3D.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.camera.z += e.deltaY * 0.5;
                this.camera.z = Math.max(-1000, Math.min(-100, this.camera.z));
                document.getElementById('camera-z-slider').value = this.camera.z;
                this.render3DView();
            });
        },

        /**
         * Toggles the 3D view on/off
         */
        toggle3DView() {
            this.isActive = !this.isActive;
            const section = document.getElementById('canvas-3d-section');
            const toggleBtn = document.getElementById('toggle-3d-btn');
            const rotateBtn = document.getElementById('rotate-3d-btn');
            const resetBtn = document.getElementById('reset-camera-btn');
            const cameraControls = document.getElementById('3d-camera-controls');

            if (this.isActive) {
                section.style.display = 'block';
                toggleBtn.textContent = this.util.t('hide_3d') || 'Hide 3D View';
                rotateBtn.disabled = false;
                resetBtn.disabled = false;
                cameraControls.style.display = 'block';
                this.resize3DCanvas();
                this.start3DAnimation();
            } else {
                section.style.display = 'none';
                toggleBtn.textContent = this.util.t('launch_3d') || 'Launch 3D View';
                rotateBtn.disabled = true;
                resetBtn.disabled = true;
                cameraControls.style.display = 'none';
                this.stop3DAnimation();
            }
        },

        /**
         * Toggles auto-rotation
         */
        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate;
            const btn = document.getElementById('rotate-3d-btn');
            btn.textContent = this.autoRotate ? 
                (this.util.t('stop_rotate') || 'Stop Rotation') : 
                (this.util.t('auto_rotate') || 'Auto Rotate');
        },

        /**
         * Resets camera to default position
         */
        resetCamera() {
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.z = -500;
            this.camera.rotationX = 0;
            this.camera.rotationY = 0;
            this.camera.rotationZ = 0;
            this.camera.fov = 500;

            document.getElementById('camera-x-slider').value = 0;
            document.getElementById('camera-y-slider').value = 0;
            document.getElementById('camera-z-slider').value = -500;
            document.getElementById('fov-slider').value = 500;

            this.render3DView();
        },

        /**
         * Resizes the 3D canvas
         */
        resize3DCanvas() {
            if (!this.canvas3D) return;
            this.canvas3D.width = this.canvas3D.offsetWidth;
            this.canvas3D.height = this.canvas3D.offsetHeight;
            this.projection.width = this.canvas3D.width;
            this.projection.height = this.canvas3D.height;
            this.render3DView();
        },

        /**
         * Initializes 3D data structures from 2D network
         */
        initialize3DData() {
            this.neurons3D = [];
            this.connections3D = [];

            // Convert 2D network layout to 3D positions
            if (this.state.networkLayout && this.state.networkLayout.length > 0) {
                this.state.networkLayout.forEach((node, index) => {
                    // Distribute neurons in 3D space
                    const angle = (index / this.state.networkLayout.length) * Math.PI * 2;
                    const radius = 150;
                    const layer = Math.floor(index / 10);
                    
                    this.neurons3D.push({
                        id: node.id || index,
                        type: node.type,
                        x: Math.cos(angle) * radius,
                        y: (layer - 2) * 80,
                        z: Math.sin(angle) * radius,
                        activation: node.activation || 0,
                        radius: 8
                    });
                });

                // Create 3D connections from synapses
                if (this.state.synapses) {
                    this.state.synapses.forEach(synapse => {
                        const fromNeuron = this.neurons3D.find(n => n.id === synapse.from);
                        const toNeuron = this.neurons3D.find(n => n.id === synapse.to);
                        
                        if (fromNeuron && toNeuron) {
                            this.connections3D.push({
                                from: fromNeuron,
                                to: toNeuron,
                                weight: synapse.weight || 1
                            });
                        }
                    });
                }
            }
        },

        /**
         * Updates 3D data from current state
         */
        update3DData() {
            // Update neuron activations
            if (this.state.networkLayout) {
                this.state.networkLayout.forEach((node, index) => {
                    if (this.neurons3D[index]) {
                        this.neurons3D[index].activation = node.activation || 0;
                    }
                });
            }
        },

        /**
         * Starts the 3D animation loop
         */
        start3DAnimation() {
            const animate = () => {
                if (!this.isActive) return;

                if (this.autoRotate) {
                    this.camera.rotationY += this.rotationSpeed;
                    document.getElementById('camera-y-slider').value = 
                        GreenhouseModels3DMath.radToDeg(this.camera.rotationY);
                }

                this.update3DData();
                this.render3DView();

                this.animationFrame = requestAnimationFrame(animate);
            };

            animate();
        },

        /**
         * Stops the 3D animation loop
         */
        stop3DAnimation() {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        },

        /**
         * Renders the 3D view
         */
        render3DView() {
            if (!this.context3D || !this.canvas3D) return;

            const ctx = this.context3D;
            const { width, height } = this.canvas3D;

            // Clear canvas
            ctx.fillStyle = this.state.darkMode ? '#1A1A1A' : '#0A0A0A';
            ctx.fillRect(0, 0, width, height);

            // Draw grid for depth reference
            this.draw3DGrid(ctx);

            // Project and sort neurons by depth
            const projectedNeurons = this.neurons3D.map(neuron => {
                const projected = GreenhouseModels3DMath.project3DTo2D(
                    neuron.x, neuron.y, neuron.z,
                    this.camera,
                    this.projection
                );
                return {
                    ...neuron,
                    screenX: projected.x,
                    screenY: projected.y,
                    depth: projected.depth,
                    scale: projected.scale
                };
            });

            // Sort by depth (painter's algorithm)
            projectedNeurons.sort((a, b) => b.depth - a.depth);

            // Draw connections first (behind neurons)
            this.draw3DConnections(ctx, projectedNeurons);

            // Draw neurons
            this.draw3DNeurons(ctx, projectedNeurons);

            // Draw axis indicators
            this.draw3DAxisIndicators(ctx);
        },

        /**
         * Draws a 3D reference grid
         */
        draw3DGrid(ctx) {
            ctx.strokeStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            const gridSize = 50;
            const gridExtent = 300;

            for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
                const start = GreenhouseModels3DMath.project3DTo2D(
                    x, -100, -gridExtent,
                    this.camera, this.projection
                );
                const end = GreenhouseModels3DMath.project3DTo2D(
                    x, -100, gridExtent,
                    this.camera, this.projection
                );

                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }

            for (let z = -gridExtent; z <= gridExtent; z += gridSize) {
                const start = GreenhouseModels3DMath.project3DTo2D(
                    -gridExtent, -100, z,
                    this.camera, this.projection
                );
                const end = GreenhouseModels3DMath.project3DTo2D(
                    gridExtent, -100, z,
                    this.camera, this.projection
                );

                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }
        },

        /**
         * Draws 3D connections between neurons
         */
        draw3DConnections(ctx, projectedNeurons) {
            this.connections3D.forEach(conn => {
                const fromProj = projectedNeurons.find(n => n.id === conn.from.id);
                const toProj = projectedNeurons.find(n => n.id === conn.to.id);

                if (fromProj && toProj) {
                    const avgDepth = (fromProj.depth + toProj.depth) / 2;
                    const alpha = GreenhouseModels3DMath.applyDepthFog(0.3, avgDepth);

                    ctx.strokeStyle = this.state.darkMode ? 
                        `rgba(100, 150, 255, ${alpha})` : 
                        `rgba(50, 100, 200, ${alpha})`;
                    ctx.lineWidth = 1 + conn.weight;

                    ctx.beginPath();
                    ctx.moveTo(fromProj.screenX, fromProj.screenY);
                    ctx.lineTo(toProj.screenX, toProj.screenY);
                    ctx.stroke();
                }
            });
        },

        /**
         * Draws 3D neurons
         */
        draw3DNeurons(ctx, projectedNeurons) {
            projectedNeurons.forEach(neuron => {
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, neuron.depth);
                const radius = neuron.radius * neuron.scale;

                // Draw shadow for depth
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(neuron.screenX + 2, neuron.screenY + 2, radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw neuron with activation glow
                if (neuron.activation > 0) {
                    const gradient = ctx.createRadialGradient(
                        neuron.screenX, neuron.screenY, 0,
                        neuron.screenX, neuron.screenY, radius * 2
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha * neuron.activation})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(neuron.screenX, neuron.screenY, radius * 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Draw neuron body
                ctx.fillStyle = this.state.darkMode ? 
                    `rgba(150, 200, 255, ${alpha})` : 
                    `rgba(100, 150, 200, ${alpha})`;
                ctx.beginPath();
                ctx.arc(neuron.screenX, neuron.screenY, radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw highlight
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(neuron.screenX - radius * 0.3, neuron.screenY - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });
        },

        /**
         * Draws axis indicators
         */
        draw3DAxisIndicators(ctx) {
            const origin = GreenhouseModels3DMath.project3DTo2D(0, 0, 0, this.camera, this.projection);
            const xAxis = GreenhouseModels3DMath.project3DTo2D(100, 0, 0, this.camera, this.projection);
            const yAxis = GreenhouseModels3DMath.project3DTo2D(0, 100, 0, this.camera, this.projection);
            const zAxis = GreenhouseModels3DMath.project3DTo2D(0, 0, 100, this.camera, this.projection);

            // X axis (red)
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(xAxis.x, xAxis.y);
            ctx.stroke();

            // Y axis (green)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(yAxis.x, yAxis.y);
            ctx.stroke();

            // Z axis (blue)
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(zAxis.x, zAxis.y);
            ctx.stroke();
        }
    };

    // Export to global scope
    window.GreenhouseModelsUI3D = GreenhouseModelsUI3D;
})();
