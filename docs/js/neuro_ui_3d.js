// docs/js/neuro_ui_3d.js
// 3D Visualization for Neuro GA

(function () {
    'use strict';

    const GreenhouseNeuroUI3D = {
        canvas: null,
        ctx: null,
        // Camera Controllers
        networkCameraController: null,
        synapseCameraController: null,

        // Cameras
        camera: { // Network Camera
            x: 0, y: 0, z: -600,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            fov: 600
        },
        synapseCamera: { // Synapse Camera
            x: 0, y: 0, z: -200,
            rotationX: 0.2, rotationY: 0, rotationZ: 0,
            fov: 400
        },

        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 5000
        },
        isActive: false,

        // ... (rest of state)

        init(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.error('NeuroUI3D: Container not found', containerSelector);
                return;
            }

            // Initialize Controllers
            if (window.GreenhouseGeneticCameraController) {
                // Network Controller
                this.networkCameraController = new window.GreenhouseGeneticCameraController(
                    this.camera,
                    window.GreenhouseGeneticConfig // Reuse config or create mock if needed
                );

                // Synapse Controller
                this.synapseCameraController = new window.GreenhouseGeneticCameraController(
                    this.synapseCamera,
                    window.GreenhouseGeneticConfig
                );
                // Synapse view usually rotates slowly by default
                this.synapseCameraController.autoRotate = true;
            }

            console.log('NeuroUI3D: Canvas build delayed by 5 seconds.');

            setTimeout(() => {
                this.canvas = document.createElement('canvas');
                this.canvas.width = container.offsetWidth;
                this.canvas.height = Math.max(container.offsetHeight, 600);
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

                // Setup Interaction (Mouse/Wheel)
                this.setupInteraction();

                // Add Explanations
                this.addExplanation(container);

                // Add Start Overlay
                this.addStartOverlay(container);

                // Start Animation Loop
                this.startAnimation();

                // Initialize Synapse Meshes
                this.synapseMeshes = this.generateSynapseMeshes();
            }, 5000);
        },

        setupInteraction() {
            this.canvas.addEventListener('mousedown', e => {
                // Calculate Scaled Coordinates
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                // Check PiP Bounds (Network View is PiP when Synapse is active)
                const isPiP = this.isMouseOverPiP(mouseX, mouseY);

                if (this.selectedConnection) {
                    // Synapse View is Main, Network is PiP
                    if (isPiP) {
                        if (this.networkCameraController) this.networkCameraController.handleMouseDown(e);
                    } else {
                        if (this.synapseCameraController) this.synapseCameraController.handleMouseDown(e);
                    }
                } else {
                    // Network View is Main
                    if (this.networkCameraController) this.networkCameraController.handleMouseDown(e);
                }
            });

            this.canvas.addEventListener('contextmenu', e => e.preventDefault());

            window.addEventListener('mousemove', e => {
                // Delegate to active controller(s)
                if (this.networkCameraController && (this.networkCameraController.isDragging || this.networkCameraController.isPanning)) {
                    this.networkCameraController.handleMouseMove(e);
                }
                if (this.synapseCameraController && (this.synapseCameraController.isDragging || this.synapseCameraController.isPanning)) {
                    this.synapseCameraController.handleMouseMove(e);
                }

                // Hover Logic
                if (!this.isDragging) {
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = this.canvas.width / rect.width;
                    const scaleY = this.canvas.height / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;

                    const hit = this.hitTest(mouseX, mouseY);
                    if (hit) {
                        this.canvas.style.cursor = 'pointer';
                    } else {
                        this.canvas.style.cursor = 'default';
                    }
                }
            });

            window.addEventListener('mouseup', () => {
                if (this.networkCameraController) this.networkCameraController.handleMouseUp();
                if (this.synapseCameraController) this.synapseCameraController.handleMouseUp();
            });

            this.canvas.addEventListener('wheel', e => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                const isPiP = this.isMouseOverPiP(mouseX, mouseY);

                if (this.selectedConnection) {
                    if (isPiP) {
                        if (this.networkCameraController) this.networkCameraController.handleWheel(e);
                    } else {
                        if (this.synapseCameraController) this.synapseCameraController.handleWheel(e);
                    }
                } else {
                    if (this.networkCameraController) this.networkCameraController.handleWheel(e);
                }
            }, { passive: false });

            // Handle Clicks
            this.canvas.addEventListener('click', (e) => {
                // Only handle click if not dragging
                const isDragging = (this.networkCameraController && this.networkCameraController.isDragging) ||
                    (this.synapseCameraController && this.synapseCameraController.isDragging);

                if (!isDragging) {
                    this.handleMouseClick(e);
                }
            });
        },

        isMouseOverPiP(mouseX, mouseY) {
            if (!this.canvas) return false;

            // PiP Bounds (Same as in render)
            const pipW = 300;
            const pipH = 250;
            const padding = 20;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            return (mouseX > pipX && mouseX < pipX + pipW &&
                mouseY > pipY && mouseY < pipY + pipH);
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

            // Generate Whole Brain Topology
            // We will map the linear genome nodes to specific brain regions based on their index/layer

            // Initialize Brain Shell if not exists
            if (!this.brainShell) {
                this.initializeBrainShell();
            }

            this.neurons = genome.neurons.map((n, i) => {
                // Check if neuron already exists to preserve position
                const existingNeuron = this.neurons.find(existing => existing.id === n.id);
                if (existingNeuron) {
                    return {
                        ...n,
                        x: existingNeuron.x,
                        y: existingNeuron.y,
                        z: existingNeuron.z,
                        region: existingNeuron.region,
                        baseColor: existingNeuron.baseColor,
                        radius: existingNeuron.radius
                    };
                }

                // Assign to a region based on index
                const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem'];
                const regionKey = regionKeys[i % regionKeys.length];

                // Get random vertex from the region to place neuron
                const regionVerticesIndices = this.getRegionVertices(regionKey);
                let x = 0, y = 0, z = 0;

                if (regionVerticesIndices.length > 0) {
                    // Use a deterministic seed based on ID if possible, or just random for new ones
                    // For now, random is fine for NEW neurons
                    const rndIndex = regionVerticesIndices[Math.floor(Math.random() * regionVerticesIndices.length)];
                    const vertex = this.brainShell.vertices[rndIndex];

                    // Add some internal volume jitter (move towards center)
                    const jitter = 0.8 + Math.random() * 0.2; // 80-100% of radius
                    x = vertex.x * jitter;
                    y = vertex.y * jitter;
                    z = vertex.z * jitter;
                }

                // Color mapping - "Cool Science" Palette (Blues/Teals/Purples)
                const coolSciencePalette = ['#00FFFF', '#1E90FF', '#00CED1', '#4169E1', '#7B68EE'];
                const baseColor = coolSciencePalette[Math.floor(Math.random() * coolSciencePalette.length)];

                return {
                    ...n,
                    x: x,
                    y: y,
                    z: z,
                    region: regionKey,
                    baseColor: baseColor,
                    radius: 6 + Math.random() * 4
                };
            });

            this.initializeConnections(genome.connections);
        },

        initializeConnections(connections) {
            const oldConnectionIds = new Set(this.connections.map(c => c.id));
            this.connections = connections.map(conn => {
                const fromNeuron = this.neurons.find(n => n.id === conn.from);
                const toNeuron = this.neurons.find(n => n.id === conn.to);

                if (!fromNeuron || !toNeuron) return null;

                // Calculate Control Point (Midpoint + Offset towards center)
                const midX = (fromNeuron.x + toNeuron.x) / 2;
                const midY = (fromNeuron.y + toNeuron.y) / 2;
                const midZ = (fromNeuron.z + toNeuron.z) / 2;

                const cp = {
                    x: midX * 0.8,
                    y: midY * 0.8,
                    z: midZ * 0.8
                };

                // Generate Tube Mesh
                const radius = Math.max(0.8, Math.abs(conn.weight) * 12.0);
                const mesh = this.generateTubeMesh(fromNeuron, toNeuron, cp, radius, 8);

                const connectionId = `${conn.from}-${conn.to}`;
                if (!oldConnectionIds.has(connectionId)) {
                    this.newConnections.push({
                        conn: { from: fromNeuron, to: toNeuron, weight: conn.weight, id: connectionId, controlPoint: cp },
                        timestamp: Date.now()
                    });
                    this.logEvent("Synapse Created");
                }

                return {
                    ...conn,
                    from: fromNeuron,
                    to: toNeuron,
                    controlPoint: cp,
                    mesh: mesh,
                    id: connectionId
                };
            }).filter(c => c !== null);

            // Log pruning
            if (this.connections.length < oldConnectionIds.size) {
                this.logEvent("Weak Connection Pruned");
            }

            // Auto-select the first connection to show Synapse View immediately
            if (this.connections.length > 0 && !this.selectedConnection) {
                setTimeout(() => {
                    this.selectedConnection = this.connections[0];
                    this.viewMode = 'synapse';
                    console.log("Auto-selected connection for Synapse View");
                }, 1000);
            }
        },

        generateTubeMesh(p1, p2, cp, radius, segments) {
            if (window.GreenhouseNeuroGeometry) {
                return window.GreenhouseNeuroGeometry.generateTubeMesh(p1, p2, cp, radius, segments);
            }
            return { vertices: [], faces: [] };
        },

        logEvent(messageKey) {
            if (window.GreenhouseNeuroStats) {
                window.GreenhouseNeuroStats.logEvent(messageKey);
            }
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
            if (!this.ctx || !this.canvas) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update Controllers (Physics & Auto-Rotate)
            if (this.networkCameraController) this.networkCameraController.update();
            if (this.synapseCameraController) this.synapseCameraController.update();

            // Sync Camera State from Controllers
            // The controllers mutate the camera objects directly, so we don't need to copy back manually
            // unless we are doing something special.

            // Handle Transitions (FlyTo)
            if (this.isTransitioning) {
                const now = Date.now();
                const progress = Math.min(1.0, (now - this.transitionStart) / this.transitionDuration);

                // Ease In Out Cubic
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.camera.x = this.startState.x + (this.targetState.x - this.startState.x) * ease;
                this.camera.y = this.startState.y + (this.targetState.y - this.startState.y) * ease;
                this.camera.z = this.startState.z + (this.targetState.z - this.startState.z) * ease;
                this.camera.rotationX = this.startState.rotationX + (this.targetState.rotationX - this.startState.rotationX) * ease;
                this.camera.rotationY = this.startState.rotationY + (this.targetState.rotationY - this.startState.rotationY) * ease;

                if (progress >= 1.0) {
                    this.isTransitioning = false;
                    if (this.transitionCallback) {
                        this.transitionCallback();
                        this.transitionCallback = null;
                    }
                }
            }

            // --- Draw Main View (Synapse) ---
            if (this.selectedConnection) {
                // Draw Synapse as Main View (Full Screen)
                if (window.GreenhouseNeuroSynapse) {
                    window.GreenhouseNeuroSynapse.drawSynapsePiP(ctx, 0, 0, this.canvas.width, this.canvas.height, this.selectedConnection, this.synapseMeshes, true, this.synapseCamera);
                }
            } else {
                // Fallback if no connection selected (shouldn't happen with auto-select)
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText("Selecting Synapse...", this.canvas.width / 2, this.canvas.height / 2);
            }

            // --- Draw PiP View (Whole Brain Network) ---
            const pipW = 300;
            const pipH = 250;
            const padding = 20;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            this.drawNetworkView(ctx, pipX, pipY, pipW, pipH);
        },

        drawNetworkView(ctx, x, y, w, h) {
            // Save original projection
            const origW = this.projection.width;
            const origH = this.projection.height;

            // Set projection to PiP size
            this.projection.width = w;
            this.projection.height = h;

            ctx.save();
            ctx.translate(x, y);

            // Draw Frame & Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.strokeStyle = '#4ca1af';
            ctx.lineWidth = 2;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeRect(0, 0, w, h);

            // Clip
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();

            // Label
            ctx.fillStyle = '#4ca1af';
            ctx.font = '12px Arial';
            ctx.fillText("Whole Brain", 10, 20);

            // Draw Grid
            this.drawGrid(ctx);

            // Helper for projection
            if (!window.GreenhouseModels3DMath) {
                ctx.restore();
                this.projection.width = origW;
                this.projection.height = origH;
                return;
            }

            // Draw Brain Shell (Wireframe)
            if (this.brainShell) {
                this.drawBrainShell(ctx, 0, w, h); // Pass w, h
            }

            // Draw Connections (True 3D Tubes)
            this.drawConnections(ctx, w, h); // Pass w, h

            // Project and Sort Neurons
            const sortedNeurons = this.neurons.map(n => {
                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                return { neuron: n, projected: p };
            }).filter(item => item.projected.scale > 0)
                .sort((a, b) => b.projected.depth - a.projected.depth);

            sortedNeurons.forEach(item => {
                this.drawNeuron(ctx, item.neuron, this.camera, this.projection);
            });

            // Draw Labels in PiP
            if (window.GreenhouseNeuroStats) {
                const labeledNeurons = sortedNeurons.map(item => ({
                    ...item.neuron,
                    x: item.projected.x,
                    y: item.projected.y,
                    region: item.neuron.region
                }));
                window.GreenhouseNeuroStats.drawLabels(ctx, labeledNeurons);
            }

            ctx.restore();

            // Restore projection
            this.projection.width = origW;
            this.projection.height = origH;
        },



        neuronMeshes: {}, // Cache for neuron meshes



        initializeBrainShell() {
            this.brainShell = { vertices: [], faces: [] };
            if (window.GreenhouseNeuroGeometry) {
                window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);
            }
        },

        computeRegionsAndBoundaries() {
            if (window.GreenhouseNeuroGeometry) {
                window.GreenhouseNeuroGeometry.computeRegionsAndBoundaries(this.brainShell);
            }
        },

        getRegionVertices(regionKey) {
            if (window.GreenhouseNeuroGeometry) {
                return window.GreenhouseNeuroGeometry.getRegionVertices(this.brainShell, regionKey);
            }
            return [];
        },

        drawBrainShell(ctx, offset, w, h) {
            if (window.GreenhouseNeuroBrain) {
                ctx.save();
                ctx.translate(offset || 0, 0);
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w || this.canvas.width, h || this.canvas.height);
                ctx.restore();
            }
        },

        drawNeuron(ctx, neuron, camera, projection) {
            if (window.GreenhouseNeuroNeuron) {
                window.GreenhouseNeuroNeuron.drawNeuron(ctx, neuron, camera, projection);
            }
        },

        drawConnections(ctx, w, h) {
            if (window.GreenhouseNeuroSynapse) {
                window.GreenhouseNeuroSynapse.drawConnections(ctx, this.connections, this.neurons, this.camera, this.projection, w || this.canvas.width, h || this.canvas.height);
            }
        },



        drawGrid(ctx) {
            // ... (existing grid code, maybe lower opacity)
            const util = window.GreenhouseModelsUtil;
            if (!window.GreenhouseModels3DMath) return;

            const size = 1000;
            const step = 200;
            const y = 400; // Floor level

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // Very subtle
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '10px Arial'; // Smaller font

            // ... (rest of grid drawing logic same as before but with new styles)
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







        // Transition State
        isTransitioning: false,
        transitionStart: 0,
        transitionDuration: 0,
        startState: null,
        targetState: null,
        transitionCallback: null,

        flyTo(target, duration = 1000, callback = null) {
            this.isTransitioning = true;
            this.transitionStart = Date.now();
            this.transitionDuration = duration;
            this.transitionCallback = callback;

            this.startState = { ...this.camera };
            this.targetState = { ...this.camera, ...target };

            // Stop other movements
            this.velocityX = 0;
            this.velocityY = 0;
            this.isDragging = false;
            this.autoRotate = false;
        },

        handleMouseClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // PiP Bounds
            const pipW = 300;
            const pipH = 250;
            const padding = 20;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            // Check if click is inside PiP (Network View)
            if (mouseX > pipX && mouseX < pipX + pipW &&
                mouseY > pipY && mouseY < pipY + pipH) {

                const hit = this.hitTest(mouseX, mouseY);
                if (hit && hit.type === 'connection') {
                    // Cinematic Transition (Phase 5)
                    // Fly to the connection
                    const target = {
                        x: hit.data.controlPoint.x,
                        y: hit.data.controlPoint.y,
                        z: hit.data.controlPoint.z - 200, // Zoom in
                        // Keep rotation or align? Keep for now.
                    };

                    this.flyTo(target, 1500, () => {
                        this.selectedConnection = hit.data;
                        this.initSynapseParticles(); // Reset particles for new synapse
                    });
                }
            } else {
                // Click is on Main View (Synapse) -> Stir Fluid
                // Stir Fluid
                if (this.selectedConnection) {
                    // Map mouse to fluid grid (centered)
                    // Main view is full screen, centered at width/2, height/2
                    const cx = this.canvas.width / 2;
                    const cy = this.canvas.height / 2;
                    const localX = mouseX - cx;
                    const localY = mouseY - cy;
                    this.stirFluid(localX, localY, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
                }
            }
        },

        hitTest(mouseX, mouseY) {
            // PiP Bounds
            const pipW = 300;
            const pipH = 250;
            const padding = 20;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            // Only check hits if inside PiP
            if (mouseX < pipX || mouseX > pipX + pipW ||
                mouseY < pipY || mouseY > pipY + pipH) {
                return null;
            }

            // Save original projection
            const origW = this.projection.width;
            const origH = this.projection.height;

            // Set projection to PiP size
            this.projection.width = pipW;
            this.projection.height = pipH;

            // Local Mouse Coords relative to PiP
            const localMouseX = mouseX - pipX;
            const localMouseY = mouseY - pipY;

            // Check Connections
            let closestConn = null;
            let minDist = 20; // Hit radius

            this.connections.forEach(conn => {
                if (!conn.controlPoint) return;

                const p = GreenhouseModels3DMath.project3DTo2D(conn.controlPoint.x, conn.controlPoint.y, conn.controlPoint.z, this.camera, this.projection);

                if (p.scale > 0) {
                    const dx = localMouseX - p.x;
                    const dy = localMouseY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < minDist) {
                        minDist = dist;
                        closestConn = conn;
                    }
                }
            });

            // Restore projection
            this.projection.width = origW;
            this.projection.height = origH;

            if (closestConn) {
                return { type: 'connection', data: closestConn };
            }
            return null;
        },

        initSynapseParticles() {
            this.synapseParticles = [];
            for (let i = 0; i < 100; i++) {
                this.synapseParticles.push({
                    x: Math.random() * 200 - 100, // Cleft width
                    y: Math.random() * 100 - 50,
                    z: Math.random() * 40 - 20,
                    vx: 0, vy: 0, vz: 0,
                    life: Math.random()
                });
            }

            // Initialize Fluid Grid
            this.fluidGrid = [];
            for (let i = 0; i < this.fluidCols * this.fluidRows; i++) {
                this.fluidGrid.push({ vx: 0, vy: 0 });
            }
        },

        releaseVesicle() {
            // Release from Pre-synaptic terminal (Left side)
            // Position: Surface of the bulb (approx x=-50, y=0)
            const y = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 20;

            this.synapseParticles.push({
                x: -50, // Surface
                y: y,
                z: z,
                vx: 2 + Math.random(), // Shoot out
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 0.5,
                life: 1.0,
                type: 'neurotransmitter'
            });
        },

        updateFluid() {
            // Simple fluid solver (diffusion + advection)
            const dt = 0.1;
            const viscosity = 0.02;

            // Diffuse
            for (let i = 0; i < this.fluidGrid.length; i++) {
                const cell = this.fluidGrid[i];
                cell.vx *= 0.99; // Decay
                cell.vy *= 0.99;
            }

            // Apply to particles
            const cellWidth = 200 / this.fluidCols;
            const cellHeight = 100 / this.fluidRows;

            this.synapseParticles.forEach(p => {
                // Map position to grid
                let col = Math.floor((p.x + 100) / cellWidth);
                let row = Math.floor((p.y + 50) / cellHeight);
                col = Math.max(0, Math.min(this.fluidCols - 1, col));
                row = Math.max(0, Math.min(this.fluidRows - 1, row));

                const index = row * this.fluidCols + col;
                const cell = this.fluidGrid[index];

                // Apply fluid force
                p.vx += cell.vx * 0.1;
                p.vy += cell.vy * 0.1;

                // Brownian Motion
                p.vx += (Math.random() - 0.5) * 0.2;
                p.vy += (Math.random() - 0.5) * 0.2;
                p.vz += (Math.random() - 0.5) * 0.2;

                // Drag
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.vz *= 0.95;
            });
        },

        stirFluid(x, y, dx, dy) {
            const cellWidth = 200 / this.fluidCols;
            const cellHeight = 100 / this.fluidRows;

            // Map screen coordinates (relative to center) to grid
            let col = Math.floor((x + 100) / cellWidth);
            let row = Math.floor((y + 50) / cellHeight);

            // Stir radius
            const radius = 2;
            for (let r = -radius; r <= radius; r++) {
                for (let c = -radius; c <= radius; c++) {
                    const curRow = row + r;
                    const curCol = col + c;

                    if (curRow >= 0 && curRow < this.fluidRows && curCol >= 0 && curCol < this.fluidCols) {
                        const index = curRow * this.fluidCols + curCol;
                        this.fluidGrid[index].vx += dx * 0.5;
                        this.fluidGrid[index].vy += dy * 0.5;
                    }
                }
            }
        },

        drawSynapsePiP(ctx) {
            if (window.GreenhouseNeuroSynapse) {
                const pipWidth = 300;
                // Draw Synapse PiP (if active)
                if (this.viewMode === 'synapse' && this.selectedConnection) {
                    // Animate Opening
                    if (!this.pipProgress) this.pipProgress = 0;
                    if (this.pipProgress < 1) {
                        this.pipProgress += 0.05;
                        if (this.pipProgress > 1) this.pipProgress = 1;
                    }

                    // Ease Out Back
                    const t = this.pipProgress;
                    const scale = 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2); // BackOut easing? No, simpler:
                    const ease = 1 - Math.pow(1 - t, 3); // Cubic Ease Out

                    const w = 300 * ease;
                    const h = 250 * ease;

                    // Bottom Right
                    const x = this.canvas.width - w - 20;
                    const y = this.canvas.height - h - 20;

                    GreenhouseNeuroSynapse.drawSynapsePiP(ctx, x, y, w, h, this.selectedConnection, this.synapseMeshes);
                } else {
                    this.pipProgress = 0;
                }
            }
        },

        generateSynapseMeshes() {
            // Manually generate organic bulbous shapes for synapse
            // Pre-synaptic: Bulbous head with narrowing neck (Top)
            // Post-synaptic: Matching receiving bulb (Bottom)

            const createBulb = (isPre) => {
                const vertices = [];
                const faces = [];
                const rings = 40; // High resolution
                const segments = 40;
                const length = 90; // 115 - 25
                const neckRadius = 60;

                // Surge Function Parameters (Log-Normal / Gamma approximation)
                // r(x) = neck + A * x^k * e^(-bx)
                // Peak at x=30, Amplitude adds ~30 to radius
                const k = 2;
                const b = 0.066;
                const A = 1.0;

                for (let i = 0; i <= rings; i++) {
                    const u = i / rings; // 0 to 1
                    const xVal = u * length; // Position along axis (0 to 90)

                    // Radius Profile r(x)
                    let r = neckRadius + A * Math.pow(xVal, k) * Math.exp(-b * xVal);

                    // Face Rounding (Superellipse Taper at the end)
                    if (u > 0.85) {
                        const t = (u - 0.85) / 0.15;
                        r *= Math.sqrt(1 - t * t); // Circular cap rounding
                    }

                    // 3D Generation: Polar Rotation around X-axis (Model Space)
                    // Then mapped to World Space (Y-axis aligned)

                    for (let j = 0; j <= segments; j++) {
                        const v = j / segments;
                        const theta = v * Math.PI * 2;

                        // Model Space (Aligned along X+)
                        // my, mz are radial. mx is axial.
                        const my = r * Math.cos(theta);
                        const mz = r * Math.sin(theta);

                        // Transform to World Space
                        let wx, wy, wz;

                        if (isPre) {
                            // Pre-synaptic: Neck at -115, Face at -25
                            // Map Model X (0 to 90) to World Y (-115 to -25)
                            wx = my;
                            wy = -140 + xVal;
                            wz = mz;
                        } else {
                            // Post-synaptic: Neck at 115, Face at 25
                            // Map Model X (0 to 90) to World Y (115 to 25)
                            wx = my;
                            wy = 140 - xVal;
                            wz = mz;
                        }

                        vertices.push({ x: wx, y: wy, z: wz });
                    }
                }

                // Generate Faces
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const row1 = i * (segments + 1);
                        const row2 = (i + 1) * (segments + 1);

                        const v1 = row1 + j;
                        const v2 = row1 + j + 1;
                        const v3 = row2 + j;
                        const v4 = row2 + j + 1;

                        faces.push([v1, v2, v3]);
                        faces.push([v2, v4, v3]);
                    }
                }

                return { vertices, faces };
            };

            const pre = createBulb(true);
            const post = createBulb(false);

            return { pre, post };
        },
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
