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
            z: -600,
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
        isActive: false,
        autoRotate: true,
        rotationSpeed: 0.0002, // Very slow, barely moving
        neurons: [], // 3D neuron objects
        connections: [], // 3D connection objects
        particles: [],
        brainShell: null, // Parametric shell data
        neuronMeshes: {}, // Cache for base neuron meshes
        newConnections: [], // List of {conn, timestamp} for pulsing effect

        // Camera State
        velocityX: 0,
        velocityY: 0,
        isDragging: false,

        animationId: null,
        isPlaying: false,
        // ... (rest of state)

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

                // Setup Interaction (Mouse/Wheel)
                this.setupInteraction();

                // Add Explanations
                this.addExplanation(container);

                // Add Start Overlay
                this.addStartOverlay(container);

                // Start Animation Loop (but logic depends on isPlaying)
                this.startAnimation();

                // Initialize Synapse Meshes
                this.synapseMeshes = this.generateSynapseMeshes();
            }, 5000);
        },

        setupInteraction() {
            let lastX = 0, lastY = 0;
            let isPanning = false;

            this.canvas.addEventListener('mousedown', e => {
                // Right click or Shift+Click for Pan
                if (e.button === 2 || e.shiftKey) {
                    isPanning = true;
                    e.preventDefault(); // Prevent context menu
                } else {
                    this.isDragging = true;
                }

                lastX = e.clientX;
                lastY = e.clientY;
                this.autoRotate = false; // Stop auto-rotate on interaction
                this.velocityX = 0;
                this.velocityY = 0;
            });

            this.canvas.addEventListener('contextmenu', e => e.preventDefault()); // Block context menu

            window.addEventListener('mousemove', e => {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                if (isPanning) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;

                    // Pan Camera (Move X/Y opposite to drag)
                    // Scale factor depends on Z depth roughly
                    const panScale = Math.abs(this.camera.z) * 0.002;
                    this.camera.x -= dx * panScale;
                    this.camera.y -= dy * panScale;

                    lastX = e.clientX;
                    lastY = e.clientY;
                } else if (this.isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;

                    this.camera.rotationY += dx * 0.005;
                    this.camera.rotationX += dy * 0.005;

                    this.velocityX = dx * 0.005;
                    this.velocityY = dy * 0.005;

                    lastX = e.clientX;
                    lastY = e.clientY;
                } else {
                    // Hover Check
                    const hit = this.hitTest(mouseX, mouseY);
                    if (hit) {
                        this.hoveredElement = hit;
                        this.canvas.style.cursor = 'pointer';
                    } else {
                        this.hoveredElement = null;
                        this.canvas.style.cursor = 'default';
                    }
                }
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
                isPanning = false;
            });

            this.canvas.addEventListener('wheel', e => {
                e.preventDefault();
                // Zoom towards mouse pointer? For now just simple Z zoom
                const zoomSpeed = Math.abs(this.camera.z) * 0.001 + 5;
                this.camera.z += e.deltaY * 0.1 * zoomSpeed;

                // Clamp Zoom
                if (this.camera.z > -50) this.camera.z = -50;
                if (this.camera.z < -2000) this.camera.z = -2000;
            });

            // Handle Clicks (for selection)
            this.canvas.addEventListener('click', (e) => {
                // Only handle click if not dragging/panning
                if (!this.isDragging && !isPanning && Math.abs(this.velocityX) < 0.001) {
                    this.handleMouseClick(e);
                }
            });
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
                // Assign to a region based on index
                const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem'];
                const regionKey = regionKeys[i % regionKeys.length];

                // Get random vertex from the region to place neuron
                const regionVerticesIndices = this.getRegionVertices(regionKey);
                let x = 0, y = 0, z = 0;

                if (regionVerticesIndices.length > 0) {
                    const rndIndex = regionVerticesIndices[Math.floor(Math.random() * regionVerticesIndices.length)];
                    const vertex = this.brainShell.vertices[rndIndex];

                    // Add some internal volume jitter (move towards center)
                    const jitter = 0.8 + Math.random() * 0.2; // 80-100% of radius
                    x = vertex.x * jitter;
                    y = vertex.y * jitter;
                    z = vertex.z * jitter;
                }

                // Color mapping
                const colors = {
                    'pfc': '#E07A5F',
                    'parietalLobe': '#F2CC8F',
                    'occipitalLobe': '#81B29A',
                    'temporalLobe': '#F4A261',
                    'cerebellum': '#A8DADC',
                    'brainstem': '#457B9D'
                };

                return {
                    ...n,
                    x: x,
                    y: y,
                    z: z,
                    region: regionKey,
                    baseColor: colors[regionKey] || '#ffffff',
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
                const radius = Math.max(0.8, Math.abs(conn.weight) * 4.0);
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

            // Auto Rotate or Inertia
            if (this.autoRotate && this.isActive) {
                this.camera.rotationY += this.rotationSpeed;
            } else if (!this.isDragging) {
                // Apply Inertia
                this.camera.rotationY += this.velocityX;
                this.camera.rotationX += this.velocityY;

                // Friction
                this.velocityX *= 0.95;
                this.velocityY *= 0.95;

                // Stop if very slow
                if (Math.abs(this.velocityX) < 0.0001) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.0001) this.velocityY = 0;
            }

            // --- Draw Main Network View ---
            // Draw Grid
            this.drawGrid(ctx);

            // Helper for projection (assuming GreenhouseModels3DMath is loaded)
            if (!window.GreenhouseModels3DMath) {
                ctx.fillStyle = 'white';
                ctx.fillText('GreenhouseModels3DMath library missing', 20, 30);
                return;
            }

            // Draw Brain Shell (Wireframe)
            if (this.brainShell) {
                this.drawBrainShell(ctx);
            }

            // Draw Connections (True 3D Tubes)
            this.drawConnections(ctx);

            // Highlight Hovered Connection
            if (this.hoveredElement && this.hoveredElement.type === 'connection') {
                const conn = this.hoveredElement.data;
                if (conn.controlPoint) {
                    const p = GreenhouseModels3DMath.project3DTo2D(conn.controlPoint.x, conn.controlPoint.y, conn.controlPoint.z, this.camera, this.projection);
                    if (p.scale > 0) {
                        ctx.save();
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#00ffcc';
                        ctx.fillStyle = '#00ffcc';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();

                        // Tooltip
                        const text = `Weight: ${conn.weight.toFixed(3)}`;
                        const width = ctx.measureText(text).width + 10;

                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillRect(p.x + 10, p.y - 25, width, 20);
                        ctx.strokeStyle = '#00ffcc';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(p.x + 10, p.y - 25, width, 20);

                        ctx.fillStyle = '#fff';
                        ctx.font = '12px monospace';
                        ctx.fillText(text, p.x + 15, p.y - 11);
                    }
                }
            }

            // Project and Sort Neurons
            // const projectedNeurons = [];
            // this.neurons.forEach(n => {
            //     const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
            //     if (p.scale > 0) {
            //         projectedNeurons.push({ ...n, ...p });
            //     }
            // });

            // projectedNeurons.sort((a, b) => b.depth - a.depth);

            // Draw Neurons (Tetrahedrons)
            // We need to pass the original 3D neuron object, not the projected one, 
            // because drawNeuron needs World Space coordinates to translate the mesh correctly.
            // But we sorted by depth using the projected list.
            // So 'projectedNeurons' contains { ...n, ...p }. 
            // n.x is World X. p.x is Screen X.
            // Wait, 'projectedNeurons' merged them. 
            // If n.x and p.x collided, we have a problem.
            // In updateData, we set n.x, n.y, n.z.
            // project3DTo2D returns { x, y, z (depth), scale }.
            // So p.x overwrites n.x!

            // FIX: Don't overwrite World coordinates in projectedNeurons.
            const sortedNeurons = this.neurons.map(n => {
                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                return { neuron: n, projected: p };
            }).filter(item => item.projected.scale > 0)
                .sort((a, b) => b.projected.depth - a.projected.depth);

            sortedNeurons.forEach(item => {
                this.drawNeuron(ctx, item.neuron, this.camera, this.projection);
            });

            // Draw Labels
            // this.drawLabels(ctx, sortedNeurons.map(i => ({...i.neuron, screenX: i.projected.x, screenY: i.projected.y})));

            // Draw Labels
            const projectedNeurons = sortedNeurons.map(item => ({
                ...item.neuron,
                x: item.projected.x,
                y: item.projected.y
            }));
            if (window.GreenhouseNeuroStats) {
                window.GreenhouseNeuroStats.drawLabels(ctx, projectedNeurons);
            }

            // Draw Stats
            if (window.GreenhouseNeuroStats) {
                window.GreenhouseNeuroStats.drawStats(ctx, this.neurons.length, this.connections.length);
            }

            // Draw Event Log
            if (window.GreenhouseNeuroStats) {
                window.GreenhouseNeuroStats.drawEventLog(ctx, this.canvas.height);
            }

            // --- Draw PiP Synapse View (if active) ---
            if (this.viewMode === 'synapse' && this.selectedConnection) {
                this.drawSynapsePiP(ctx);
            }
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

        drawBrainShell(ctx, offset) {
            if (window.GreenhouseNeuroBrain) {
                ctx.save();
                ctx.translate(offset || 0, 0);
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, this.canvas.width, this.canvas.height);
                ctx.restore();
            }
        },

        drawNeuron(ctx, neuron, camera, projection) {
            if (window.GreenhouseNeuroNeuron) {
                window.GreenhouseNeuroNeuron.drawNeuron(ctx, neuron, camera, projection);
            }
        },

        drawConnections(ctx) {
            if (window.GreenhouseNeuroSynapse) {
                window.GreenhouseNeuroSynapse.drawConnections(ctx, this.connections, this.neurons, this.camera, this.projection, this.canvas.width, this.canvas.height);
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







        handleMouseClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.viewMode === 'synapse') {
                // Check for PiP Close Button (Top Right of PiP)
                const pipWidth = 300;
                const pipHeight = 250;
                const padding = 20;
                const x = this.canvas.width - pipWidth - padding;
                const y = this.canvas.height - pipHeight - padding;

                // Close Button Area
                if (mouseX > x + pipWidth - 30 && mouseX < x + pipWidth &&
                    mouseY > y && mouseY < y + 30) {
                    this.viewMode = 'network';
                    this.selectedConnection = null;
                    return;
                }

                // Stir Fluid (if click is inside PiP)
                if (mouseX > x && mouseX < x + pipWidth &&
                    mouseY > y && mouseY < y + pipHeight) {
                    const cx = x + pipWidth / 2;
                    const cy = y + pipHeight / 2;
                    const localX = mouseX - cx;
                    const localY = mouseY - cy;
                    this.stirFluid(localX, localY, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
                    return; // Don't process network clicks if inside PiP
                }
            }

            const hit = this.hitTest(mouseX, mouseY);
            if (hit && hit.type === 'connection') {
                this.selectedConnection = hit.data;
                this.viewMode = 'synapse';
                this.initSynapseParticles();
            }
        },

        hitTest(mouseX, mouseY) {
            // Check Connections
            let closestConn = null;
            let minDist = 20; // Hit radius

            this.connections.forEach(conn => {
                if (!conn.controlPoint) return;

                const p = GreenhouseModels3DMath.project3DTo2D(conn.controlPoint.x, conn.controlPoint.y, conn.controlPoint.z, this.camera, this.projection);

                if (p.scale > 0) {
                    const dx = mouseX - p.x;
                    const dy = mouseY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < minDist) {
                        minDist = dist;
                        closestConn = conn;
                    }
                }
            });

            if (closestConn) {
                this.selectedConnection = closestConn;
                this.viewMode = 'synapse';
                this.initSynapseParticles();
            }
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
            if (window.GreenhouseNeuroGeometry) {
                // Pre-synaptic: Bouton (Type 'pre')
                const pre = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'pre');
                // Post-synaptic: Spine (Type 'post')
                const post = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'post');

                // Rotate post to face pre
                post.vertices.forEach(v => {
                    v.y *= -1; // Flip Y
                });
                return { pre, post };
            }
            return { pre: { vertices: [], faces: [] }, post: { vertices: [], faces: [] } };
        },
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
