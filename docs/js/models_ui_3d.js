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
        particles: [],
        shellContours: [], // 3D topological shell
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
                    <input type="range" min="-2000" max="1000" value="-500" class="greenhouse-slider" id="camera-z-slider">
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
                this.camera.z = Math.max(-2000, Math.min(1000, this.camera.z));
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
            this.particles = [];
            this.shellContours = [];

            // Initialize background particles (stars/dust)
            for (let i = 0; i < 200; i++) {
                this.particles.push({
                    x: (Math.random() - 0.5) * 3000,
                    y: (Math.random() - 0.5) * 3000,
                    z: (Math.random() - 0.5) * 3000,
                    size: Math.random() * 2 + 0.5,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }

            // Check if Brain SVG data is available
            if (window.GreenhouseModelsBrainSVG) {
                this.generateTopologicalShellAndNeurons(window.GreenhouseModelsBrainSVG);
            } else {
                 console.warn('Brain SVG data not found, falling back to spherical distribution.');
                 this.generateSphericalDistribution();
            }
        },

        /**
         * Generates spherical distribution (Fallback)
         */
        generateSphericalDistribution() {
             if (this.state.networkLayout && this.state.networkLayout.length > 0) {
                const count = this.state.networkLayout.length;
                this.state.networkLayout.forEach((node, index) => {
                    const phi = Math.acos(-1 + (2 * index) / count);
                    const theta = Math.sqrt(count * Math.PI) * phi;
                    const r = 250 + (Math.random() - 0.5) * 100;

                    this.neurons3D.push({
                        id: node.id || index,
                        type: node.type,
                        x: r * Math.sin(phi) * Math.cos(theta),
                        y: r * 0.7 * Math.cos(phi),
                        z: r * Math.sin(phi) * Math.sin(theta),
                        activation: node.activation || 0,
                        radius: 8 + Math.random() * 4
                    });
                });
                this.initializeConnections();
            }
        },

        /**
         * Generates 3D topological shell and places neurons inside based on 2D SVG
         */
        generateTopologicalShellAndNeurons(svgPath) {
            // 1. Create offscreen canvas for path analysis
            const width = 1536;
            const height = 1024;
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width;
            offCanvas.height = height;
            const ctx = offCanvas.getContext('2d');

            const path = new Path2D(svgPath);

            // Draw filled path to canvas for hit testing logic via pixel scanning
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height); // Clear with white
            ctx.fillStyle = '#000000'; // Draw shape in black
            ctx.fill(path);

            // 2. Extract Perimeter Points (simplified)
            // We scan horizontal lines to find the min/max X for each Y
            // This creates a set of 'ribs' or slices
            const perimeterPoints = [];
            const stepY = 20; // Scan every 20 pixels vertically

            // SVG dimensions are roughly centered around 768, 512
            const centerX = width / 2;
            const centerY = height / 2;
            const scale = 0.5; // Scale down for 3D view

            // Scan to build contour map
            // We will create contours along the Y axis for the shell
            // NOTE: The user asked for a topological outline derived from the 2D image.
            // A simple extrusion is boring. A tapered extrusion looks like a brain volume.

            // Instead of full pixel scan (slow), we can use isPointInPath which is available on the Context
            // This is lighter than getImageData for large canvases in some envs, but getPixelData is good for batch.
            // Let's use isPointInPath for random sampling which is robust.

            // --- Generate Shell Contours ---
            // We create Z-slices. For each Z slice, we shrink the SVG path.
            const numSlices = 7;
            const maxDepth = 120;

            for (let i = 0; i < numSlices; i++) {
                // Z coordinates from -maxDepth to +maxDepth
                const t = i / (numSlices - 1); // 0 to 1
                const z = (t - 0.5) * 2 * maxDepth; // e.g. -100 to 100

                // Scale factor determines the size of the slice at this depth
                // Use a semi-circle or ellipsoid profile: sqrt(1 - z^2)
                // At z=0, scale is 1. At z=max, scale is small (e.g. 0.3)
                const depthRatio = Math.abs(z) / (maxDepth * 1.2); // slightly larger max to avoid zero size
                const contourScale = Math.sqrt(Math.max(0, 1 - depthRatio * depthRatio)) * scale;

                const slicePoints = [];
                // Sample the perimeter of the SVG path
                // Since we can't iterate path segments easily, we ray-cast
                // Scan angles around the center
                const numSegments = 60;
                for (let j = 0; j < numSegments; j++) {
                    const theta = (j / numSegments) * Math.PI * 2;

                    // Ray cast from center to find edge
                    // Binary search for the edge
                    let rMin = 0;
                    let rMax = 800; // Max radius covers screen
                    let rEdge = 0;

                    // Optimization: coarse search then fine
                    for (let k = 0; k < 8; k++) {
                        const mid = (rMin + rMax) / 2;
                        const testX = centerX + Math.cos(theta) * mid;
                        const testY = centerY + Math.sin(theta) * mid;
                        if (ctx.isPointInPath(path, testX, testY)) {
                            rMin = mid;
                            rEdge = mid;
                        } else {
                            rMax = mid;
                        }
                    }

                    if (rEdge > 0) {
                         slicePoints.push({
                            x: (Math.cos(theta) * rEdge) * contourScale,
                            y: (Math.sin(theta) * rEdge) * contourScale, // Invert Y later? Canvas Y is down. 3D Y is up/down.
                            z: z
                        });
                    }
                }

                if (slicePoints.length > 0) {
                    this.shellContours.push(slicePoints);
                }
            }

            // --- Generate Neurons inside the volume ---
            // Use Rejection Sampling
            if (this.state.networkLayout && this.state.networkLayout.length > 0) {
                const targetCount = this.state.networkLayout.length;
                let generatedCount = 0;
                const maxAttempts = targetCount * 50;
                let attempts = 0;

                while (generatedCount < targetCount && attempts < maxAttempts) {
                    attempts++;
                    // Random point in SVG box
                    const rx = Math.random() * width;
                    const ry = Math.random() * height;

                    if (ctx.isPointInPath(path, rx, ry)) {
                         // Point is inside 2D shape. Now determine Z limits.
                         // Calculate "distance from center" to taper Z
                         // Approximate radius normalized
                         const dx = rx - centerX;
                         const dy = ry - centerY;
                         const dist = Math.sqrt(dx*dx + dy*dy);
                         const maxR = 500; // approx max radius of brain on screen
                         const normDist = Math.min(1, dist / maxR);

                         // Thickness curve
                         const zLimit = maxDepth * Math.sqrt(1 - normDist * normDist) * 0.8;
                         const rz = (Math.random() * 2 - 1) * zLimit;

                         const node = this.state.networkLayout[generatedCount];

                         this.neurons3D.push({
                            id: node.id || generatedCount,
                            type: node.type,
                            x: (rx - centerX) * scale,
                            y: (ry - centerY) * scale,
                            z: rz,
                            activation: node.activation || 0,
                            radius: 8 + Math.random() * 4
                        });

                        generatedCount++;
                    }
                }

                // Fallback if we couldn't place enough neurons (e.g. SVG path issues)
                if (generatedCount < targetCount) {
                     console.warn(`Could only place ${generatedCount}/${targetCount} neurons inside SVG. Filling rest randomly.`);
                     for (let i = generatedCount; i < targetCount; i++) {
                        const node = this.state.networkLayout[i];
                        this.neurons3D.push({
                            id: node.id || i,
                            type: node.type,
                            x: (Math.random() - 0.5) * 500,
                            y: (Math.random() - 0.5) * 300,
                            z: (Math.random() - 0.5) * 200,
                            activation: node.activation || 0,
                            radius: 8 + Math.random() * 4
                        });
                     }
                }

                this.initializeConnections();
            }
        },

        initializeConnections() {
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

            // Draw background particles (stars/dust)
            this.draw3DParticles(ctx);

            // Draw Topological Shell
            this.drawTopologicalShell(ctx);

            // Project and sort neurons by depth
            const projectedNeurons = [];
            this.neurons3D.forEach(neuron => {
                const projected = GreenhouseModels3DMath.project3DTo2D(
                    neuron.x, neuron.y, neuron.z,
                    this.camera,
                    this.projection
                );

                // Check if projected point is behind camera (scale < 0)
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

            // Sort by depth (painter's algorithm)
            projectedNeurons.sort((a, b) => b.depth - a.depth);

            // Draw connections first (behind neurons)
            this.draw3DConnections(ctx, projectedNeurons);

            // Draw neurons
            this.draw3DNeurons(ctx, projectedNeurons);

            // Draw axis indicators (optional, can be toggled)
            // this.draw3DAxisIndicators(ctx);
        },

        /**
         * Draws the topological wireframe shell of the brain
         */
        drawTopologicalShell(ctx) {
            if (!this.shellContours || this.shellContours.length === 0) return;

            ctx.save();
            ctx.lineWidth = 1;

            // Draw each contour loop
            this.shellContours.forEach((contour, index) => {
                // Vary opacity based on depth/index
                // We want a holographic look
                ctx.strokeStyle = this.state.darkMode ?
                    `rgba(100, 255, 150, ${0.1 + index * 0.02})` : // Greenish for "Greenhouse"
                    `rgba(50, 150, 100, ${0.15 + index * 0.02})`;

                ctx.beginPath();
                let firstPoint = null;

                contour.forEach((pt, i) => {
                    const proj = GreenhouseModels3DMath.project3DTo2D(
                        pt.x, pt.y, pt.z,
                        this.camera,
                        this.projection
                    );

                    if (proj.scale > 0) {
                        if (i === 0) {
                            ctx.moveTo(proj.x, proj.y);
                            firstPoint = proj;
                        } else {
                            ctx.lineTo(proj.x, proj.y);
                        }
                    }
                });

                if (firstPoint) {
                    ctx.lineTo(firstPoint.x, firstPoint.y); // Close loop
                }
                ctx.stroke();
            });

            // Optional: Draw longitudinal lines connecting contours (Ribs)
            // This adds more structure
            const segments = 20; // Draw a line every N points
            const pointsPerContour = this.shellContours[0].length;

            ctx.strokeStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

            for (let i = 0; i < pointsPerContour; i += Math.floor(pointsPerContour / segments)) {
                ctx.beginPath();
                let penDown = false;

                this.shellContours.forEach(contour => {
                    const pt = contour[i];
                    if (!pt) return;
                     const proj = GreenhouseModels3DMath.project3DTo2D(
                        pt.x, pt.y, pt.z,
                        this.camera,
                        this.projection
                    );

                    if (proj.scale > 0) {
                        if (!penDown) {
                            ctx.moveTo(proj.x, proj.y);
                            penDown = true;
                        } else {
                            ctx.lineTo(proj.x, proj.y);
                        }
                    }
                });
                ctx.stroke();
            }

            ctx.restore();
        },

        /**
         * Draws background particles
         */
        draw3DParticles(ctx) {
            if (!this.particles) return;

            this.particles.forEach(p => {
                 const projected = GreenhouseModels3DMath.project3DTo2D(
                    p.x, p.y, p.z,
                    this.camera,
                    this.projection
                );

                if (projected.scale > 0) {
                    const alpha = Math.min(1, p.opacity * projected.scale);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    const size = p.size * projected.scale;
                    ctx.beginPath();
                    ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
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
