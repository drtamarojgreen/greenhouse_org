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
        animationFrame: null,
        brainShell: null,
        hoveredRegion: null,

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

            const controls3D = document.createElement('div');
            controls3D.id = 'controls-3d';
            controls3D.className = 'greenhouse-controls-panel';
            controls3D.style.cssText = 'margin-bottom: 15px;'; // Add spacing below controls

            this.canvas3D = document.createElement('canvas');
            this.canvas3D.id = 'canvas-3d';
            this.canvas3D.style.cssText = 'width: 100%; height: 400px; background: #1a1a1a; border-radius: 12px; cursor: grab;';

            // Append in new order: title, controls, then canvas
            canvas3DSection.appendChild(canvas3DTitle);
            canvas3DSection.appendChild(controls3D);
            canvas3DSection.appendChild(this.canvas3D);

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

            // Initialize brain shell structure
            this.initializeBrainShell();

            // Convert 2D network layout to 3D positions
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

            // Convert 2D network layout to 3D positions (Brain/Ellipsoid Shape)
            if (this.state.networkLayout && this.state.networkLayout.length > 0) {
                const count = this.state.networkLayout.length;
                this.state.networkLayout.forEach((node, index) => {
                    // Distribute neurons in a volumetric ellipsoid
                    // Golden spiral on a sphere for uniform distribution, then scaled
                    const phi = Math.acos(-1 + (2 * index) / count);
                    const theta = Math.sqrt(count * Math.PI) * phi;
                    
                    // Vary radius slightly to create volume instead of just surface
                    const r = 250 + (Math.random() - 0.5) * 100;

                    this.neurons3D.push({
                        id: node.id || index,
                        type: node.type,
                        x: r * Math.sin(phi) * Math.cos(theta),
                        y: r * 0.7 * Math.cos(phi), // Flattened Y (height)
                        z: r * Math.sin(phi) * Math.sin(theta),
                        activation: node.activation || 0,
                        radius: 8 + Math.random() * 4
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
         * Initializes the 3D brain shell structure
         * Creates a topographical representation of the brain
         */
        initializeBrainShell() {
            // Create a realistic brain shell using parametric equations
            this.brainShell = {
                vertices: [],
                faces: []
            };

            const latitudeBands = 30; // Increased for smoother surface
            const longitudeBands = 30;
            const radiusX = 180; // Width
            const radiusY = 200; // Height
            const radiusZ = 160; // Depth

            // Generate vertices with realistic brain topology
            for (let lat = 0; lat <= latitudeBands; lat++) {
                const theta = (lat * Math.PI) / latitudeBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / longitudeBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    // Base ellipsoid shape
                    let x = radiusX * cosPhi * sinTheta;
                    let y = radiusY * cosTheta;
                    let z = radiusZ * sinPhi * sinTheta;

                    // Normalize position for calculations
                    const normTheta = theta / Math.PI;
                    const normPhi = phi / (2 * Math.PI);

                    // Add realistic brain features
                    
                    // 1. Cerebral hemispheres - slight asymmetry
                    if (x > 0) {
                        x *= 1.08; // Right hemisphere slightly larger
                    }

                    // 2. Frontal lobe - prominent bulge at front
                    if (z > 50 && normTheta > 0.2 && normTheta < 0.7) {
                        const frontBulge = 1 + 0.2 * Math.cos((normTheta - 0.45) * Math.PI * 2);
                        z *= frontBulge;
                        x *= (1 + 0.05 * Math.cos((normTheta - 0.45) * Math.PI * 2));
                    }

                    // 3. Temporal lobes - bulges on sides
                    if (Math.abs(x) > 100 && normTheta > 0.4 && normTheta < 0.7 && z < 50 && z > -50) {
                        const temporalBulge = 1.15;
                        x *= temporalBulge;
                        z *= 0.95;
                    }

                    // 4. Occipital lobe - rounded back
                    if (z < -50 && normTheta > 0.5) {
                        const occipitalCurve = 1 - 0.15 * Math.pow((normTheta - 0.5) * 2, 2);
                        z *= occipitalCurve;
                        y *= (1 - 0.1 * Math.pow((normTheta - 0.5) * 2, 2));
                    }

                    // 5. Parietal lobe - top curve
                    if (y > 100 && normTheta < 0.4) {
                        const parietalCurve = 1 + 0.08 * Math.cos(normTheta * Math.PI * 2);
                        y *= parietalCurve;
                    }

                    // 6. Longitudinal fissure - indent between hemispheres
                    if (Math.abs(x) < 30 && y > 0) {
                        const fissureDepth = 1 - 0.15 * (1 - Math.abs(x) / 30);
                        y *= fissureDepth;
                    }

                    // 7. Sylvian fissure - lateral groove
                    if (Math.abs(x) > 80 && Math.abs(x) < 140 && 
                        z > -30 && z < 30 && y > -50 && y < 50) {
                        const sylvianDepth = 0.92;
                        const distFromCenter = Math.abs(y) / 50;
                        y *= (1 - (1 - sylvianDepth) * (1 - distFromCenter));
                    }

                    // 8. Add subtle surface texture (gyri and sulci)
                    const textureFreq = 8;
                    const textureAmp = 3;
                    const texture = Math.sin(normTheta * textureFreq * Math.PI) * 
                                  Math.sin(normPhi * textureFreq * Math.PI * 2) * textureAmp;
                    
                    const normal = Math.sqrt(x*x + y*y + z*z);
                    if (normal > 0) {
                        x += (x / normal) * texture;
                        y += (y / normal) * texture;
                        z += (z / normal) * texture;
                    }

                    this.brainShell.vertices.push({ x, y, z });
                }
            }

            // Generate faces (triangles)
            for (let lat = 0; lat < latitudeBands; lat++) {
                for (let lon = 0; lon < longitudeBands; lon++) {
                    const first = lat * (longitudeBands + 1) + lon;
                    const second = first + longitudeBands + 1;

                    // Two triangles per quad
                    this.brainShell.faces.push([first, second, first + 1]);
                    this.brainShell.faces.push([second, second + 1, first + 1]);
                }
            }

            // Add brain regions as colored areas
            this.brainShell.regions = {
                prefrontalCortex: {
                    color: 'rgba(100, 150, 255, 0.6)',
                    vertices: this.getRegionVertices('pfc')
                },
                amygdala: {
                    color: 'rgba(255, 100, 100, 0.6)',
                    vertices: this.getRegionVertices('amygdala')
                },
                hippocampus: {
                    color: 'rgba(100, 255, 150, 0.6)',
                    vertices: this.getRegionVertices('hippocampus')
                },
                temporalLobe: {
                    color: 'rgba(255, 165, 0, 0.6)',
                    vertices: this.getRegionVertices('temporalLobe')
                },
                parietalLobe: {
                    color: 'rgba(147, 112, 219, 0.6)',
                    vertices: this.getRegionVertices('parietalLobe')
                },
                occipitalLobe: {
                    color: 'rgba(255, 192, 203, 0.6)',
                    vertices: this.getRegionVertices('occipitalLobe')
                },
                cerebellum: {
                    color: 'rgba(64, 224, 208, 0.6)',
                    vertices: this.getRegionVertices('cerebellum')
                },
                brainstem: {
                    color: 'rgba(255, 215, 0, 0.6)',
                    vertices: this.getRegionVertices('brainstem')
                }
            };
        },

        /**
         * Gets vertices for specific brain regions
         */
        getRegionVertices(region) {
            const indices = [];
            const vertices = this.brainShell.vertices;

            vertices.forEach((vertex, index) => {
                switch (region) {
                    case 'pfc': // Prefrontal cortex - front upper area
                        if (vertex.z > 100 && vertex.y > 0 && vertex.y < 150) {
                            indices.push(index);
                        }
                        break;
                    case 'amygdala': // Amygdala - deep temporal area
                        if (Math.abs(vertex.x) > 80 && Math.abs(vertex.x) < 120 &&
                            vertex.y > -50 && vertex.y < 50 &&
                            vertex.z > -50 && vertex.z < 0) {
                            indices.push(index);
                        }
                        break;
                    case 'hippocampus': // Hippocampus - medial temporal area
                        if (Math.abs(vertex.x) > 60 && Math.abs(vertex.x) < 100 &&
                            vertex.y > -80 && vertex.y < 0 &&
                            vertex.z > -80 && vertex.z < -20) {
                            indices.push(index);
                        }
                        break;
                    case 'temporalLobe': // Temporal lobe - sides, middle-lower
                        if (Math.abs(vertex.x) > 120 && Math.abs(vertex.x) < 180 &&
                            vertex.y > -50 && vertex.y < 80 &&
                            vertex.z > -40 && vertex.z < 40) {
                            indices.push(index);
                        }
                        break;
                    case 'parietalLobe': // Parietal lobe - top middle-back
                        if (vertex.y > 120 && vertex.y < 200 &&
                            vertex.z > -50 && vertex.z < 80 &&
                            Math.abs(vertex.x) < 150) {
                            indices.push(index);
                        }
                        break;
                    case 'occipitalLobe': // Occipital lobe - back
                        if (vertex.z < -80 && vertex.z > -160 &&
                            vertex.y > -50 && vertex.y < 120) {
                            indices.push(index);
                        }
                        break;
                    case 'cerebellum': // Cerebellum - lower back
                        if (vertex.z < -60 && vertex.y < -80 && vertex.y > -150 &&
                            Math.abs(vertex.x) < 120) {
                            indices.push(index);
                        }
                        break;
                    case 'brainstem': // Brainstem - center bottom
                        if (Math.abs(vertex.x) < 40 && vertex.y < -120 &&
                            vertex.z > -40 && vertex.z < 20) {
                            indices.push(index);
                        }
                        break;
                }
            });

            return indices;
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

            // Draw grid for depth reference
            this.draw3DGrid(ctx);

            // Draw brain shell first (background)
            if (this.brainShell) {
                this.drawBrainShell(ctx);
            }

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

            // Draw axis indicators
            this.draw3DAxisIndicators(ctx);
        },

        /**
         * Draws the 3D brain shell
         */
        drawBrainShell(ctx) {
            if (!this.brainShell) return;

            // Project all vertices
            const projectedVertices = this.brainShell.vertices.map(vertex => {
                const projected = GreenhouseModels3DMath.project3DTo2D(
                    vertex.x, vertex.y, vertex.z,
                    this.camera,
                    this.projection
                );
                return {
                    ...projected,
                    originalVertex: vertex
                };
            });

            // Calculate face depths and sort
            const facesWithDepth = this.brainShell.faces.map(face => {
                const v1 = projectedVertices[face.indices[0]];
                const v2 = projectedVertices[face.indices[1]];
                const v3 = projectedVertices[face.indices[2]];
                const avgDepth = (v1.depth + v2.depth + v3.depth) / 3;
                
                return {
                    face: face.indices,
                    depth: avgDepth,
                    vertices: [v1, v2, v3]
                };
            });

            // Sort faces by depth (painter's algorithm)
            facesWithDepth.sort((a, b) => b.depth - a.depth);

            // Draw each face
            facesWithDepth.forEach(({ face, depth, vertices }) => {
                const [v1, v2, v3] = vertices;

                // Calculate face normal for backface culling
                const dx1 = v2.x - v1.x;
                const dy1 = v2.y - v1.y;
                const dx2 = v3.x - v1.x;
                const dy2 = v3.y - v1.y;
                const cross = dx1 * dy2 - dy1 * dx2;

                // Only draw front-facing polygons
                if (cross > 0) {
                    // Determine if this face is part of a colored region
                    let faceColor = 'rgba(128, 128, 128, 0.15)'; // Default gray
                    let isHovered = false;
                    let matchedRegionKey = null;
                    
                    // Check if any vertex is in a brain region
                    for (const regionName in this.brainShell.regions) {
                        const region = this.brainShell.regions[regionName];
                        if (region.vertices.includes(face[0]) || 
                            region.vertices.includes(face[1]) || 
                            region.vertices.includes(face[2])) {
                            faceColor = region.color;
                            
                            // Map region names to keys used in 2D
                            const regionKeyMap = {
                                'prefrontalCortex': 'pfc',
                                'amygdala': 'amygdala',
                                'hippocampus': 'hippocampus',
                                'temporalLobe': 'temporalLobe',
                                'parietalLobe': 'parietalLobe',
                                'occipitalLobe': 'occipitalLobe',
                                'cerebellum': 'cerebellum',
                                'brainstem': 'brainstem'
                            };
                            matchedRegionKey = regionKeyMap[regionName];
                            
                            // Check if this region is hovered in 2D
                            if (this.hoveredRegion === matchedRegionKey) {
                                isHovered = true;
                            }
                            break;
                        }
                    }

                    // Apply depth fog
                    let alpha = GreenhouseModels3DMath.applyDepthFog(0.3, depth);
                    
                    // Enhance alpha for hovered regions
                    if (isHovered) {
                        alpha = Math.min(1, alpha * 3); // Triple the alpha for visibility
                    }
                    
                    const colorMatch = faceColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (colorMatch) {
                        const r = colorMatch[1];
                        const g = colorMatch[2];
                        const b = colorMatch[3];
                        const baseAlpha = colorMatch[4] ? parseFloat(colorMatch[4]) : 1;
                        faceColor = `rgba(${r}, ${g}, ${b}, ${baseAlpha * alpha})`;
                    }

                    // Draw the face
                    ctx.fillStyle = faceColor;
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y);
                    ctx.lineTo(v2.x, v2.y);
                    ctx.lineTo(v3.x, v3.y);
                    ctx.closePath();
                    ctx.fill();

                    // Add glow effect for hovered regions
                    if (isHovered) {
                        ctx.save();
                        ctx.shadowColor = faceColor;
                        ctx.shadowBlur = 20;
                        ctx.fill();
                        ctx.restore();
                    }

                    // Draw wireframe edges for definition
                    ctx.strokeStyle = this.state.darkMode ? 
                        `rgba(200, 200, 200, ${alpha * 0.1})` : 
                        `rgba(100, 100, 100, ${alpha * 0.1})`;
                    ctx.lineWidth = isHovered ? 1 : 0.5; // Thicker lines for hovered regions
                    ctx.stroke();
                }
            });
        },

           /* 
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
        },

        /**
         * Sets the hovered region from 2D environment canvas
         * @param {string} regionKey - The key of the hovered region (pfc, amygdala, hippocampus)
         */
        setHoveredRegion(regionKey) {
            this.hoveredRegion = regionKey;
            
            // Trigger a re-render if 3D view is active
            if (this.isActive) {
                this.render3DView();
            }
        }
    };

    // Export to global scope
    window.GreenhouseModelsUI3D = GreenhouseModelsUI3D;
})();
