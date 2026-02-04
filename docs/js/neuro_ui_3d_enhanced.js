// docs/js/neuro_ui_3d_enhanced.js
// Enhanced 3D Visualization for Neuro GA with Modular Configuration

(function () {
    'use strict';

    const GreenhouseNeuroUI3D = {
        canvas: null,
        ctx: null,
        camera: null,
        projection: null,
        config: null,
        cameraControls: null,
        lighting: null,
        isActive: false,
        neurons: [],
        connections: [],
        particles: [],
        brainShell: null,
        neuronMeshes: {},
        newConnections: [],
        hoveredElement: null,
        selectedConnection: null,
        viewMode: 'synapse',
        pipProgress: 0,
        synapseParticles: [],
        fluidGrid: [],
        fluidCols: 20,
        fluidRows: 10,
        synapseMeshes: null,
        animationId: null,
        isPlaying: false,

        init(containerSelector) {
            const container = document.querySelector(containerSelector);            this.canvas.width = container.offsetWidth;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '600px';

            if (!container) {
                console.error('NeuroUI3D: Container not found', containerSelector);
                return;
            }

            // Initialize configuration
            this.config = window.GreenhouseNeuroConfig;
            if (!this.config) {
                console.error('NeuroUI3D: Configuration not loaded');
                return;
            }

            // Initialize camera from config
            const cameraConfig = this.config.get('camera.initial');
            this.camera = {
                x: cameraConfig.x,
                y: cameraConfig.y,
                z: cameraConfig.z,
                rotationX: cameraConfig.rotationX,
                rotationY: cameraConfig.rotationY,
                rotationZ: cameraConfig.rotationZ,
                fov: cameraConfig.fov
            };

            // Initialize projection from config
            const projConfig = this.config.get('projection');
            this.projection = {
                width: projConfig.width,
                height: projConfig.height,
                near: projConfig.near,
                far: projConfig.far
            };

            console.log('NeuroUI3D: Canvas build delayed by 5 seconds.');

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '600px';
            this.canvas.style.backgroundColor = '#111';

            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            // Initialize camera controls
            if (window.GreenhouseNeuroCameraControls) {
                this.cameraControls = Object.create(window.GreenhouseNeuroCameraControls);
                this.cameraControls.init(this.canvas, this.camera, this.config);
                console.log('NeuroUI3D: Camera controls initialized');
            }

            // Initialize lighting system
            if (window.GreenhouseNeuroLighting) {
                this.lighting = Object.create(window.GreenhouseNeuroLighting);
                this.lighting.init(this.config);
                console.log('NeuroUI3D: Lighting system initialized');
            }

            // Setup mouse event handlers for synapse camera
            this.setupSynapseMouseHandlers();

            // Handle Resize
            window.addEventListener('resize', () => {
                requestAnimationFrame(() => this.resize());
            });

            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    requestAnimationFrame(() => this.resize());
                });
                ro.observe(container);
            }

            // Add Explanations
            this.addExplanation(container);

            // Add Start Overlay
            this.addStartOverlay(container);

            // Add Control Panel
            this.addControlPanel(container);

            // Start Animation Loop
            this.startAnimation();

            // Initialize Synapse Meshes
            this.synapseMeshes = this.generateSynapseMeshes();
        },

        resize() {
            if (this.canvas && this.canvas.parentElement) {
                const container = this.canvas.parentElement;
                this.canvas.width = container.offsetWidth;
                //this.canvas.height = container.offsetHeight;
                this.projection.width = this.canvas.width;
                //this.projection.height = this.canvas.height;
            }
        },

        addControlPanel(container) {
            const panel = document.createElement('div');
            panel.id = 'neuro-control-panel';
            panel.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-family: Arial, sans-serif;
                font-size: 12px;
                z-index: 100;
                min-width: 200px;
            `;

            panel.innerHTML = `
                <h4 style="margin: 0 0 10px 0; font-size: 14px;">Camera Controls</h4>
                <div style="margin-bottom: 8px;">
                    <strong>Mouse:</strong><br>
                    • Left drag: Rotate<br>
                    • Right drag / Shift+drag: Pan<br>
                    • Wheel: Zoom
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Keyboard:</strong><br>
                    • Arrow keys: Rotate<br>
                    • WASD: Pan<br>
                    • Q/E: Zoom<br>
                    • R: Reset camera<br>
                    • Space: Toggle auto-rotate
                </div>
                <div style="margin-top: 10px;">
                    <button id="neuro-reset-camera" style="padding: 5px 10px; cursor: pointer; background: #4ca1af; color: white; border: none; border-radius: 4px; margin-right: 5px;">Reset Camera</button>
                    <button id="neuro-toggle-autorotate" style="padding: 5px 10px; cursor: pointer; background: #2ecc71; color: white; border: none; border-radius: 4px;">Auto-Rotate: ON</button>
                </div>
            `;

            container.appendChild(panel);

            // Add event listeners
            document.getElementById('neuro-reset-camera').addEventListener('click', () => {
                if (this.cameraControls) {
                    this.cameraControls.resetCamera();
                }
            });

            const autoRotateBtn = document.getElementById('neuro-toggle-autorotate');
            autoRotateBtn.addEventListener('click', () => {
                if (this.cameraControls) {
                    this.cameraControls.toggleAutoRotate();
                    const isOn = this.config.get('camera.controls.autoRotate');
                    autoRotateBtn.textContent = `Auto-Rotate: ${isOn ? 'ON' : 'OFF'}`;
                    autoRotateBtn.style.background = isOn ? '#2ecc71' : '#e74c3c';
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
            overlay.style.height = '100%';
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
            container.style.position = 'relative';
            container.appendChild(overlay);
        },

        updateData(genome) {
            if (!this.brainShell) {
                this.initializeBrainShell();
            }

            this.neurons = genome.neurons.map((n, i) => {
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

                const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem'];
                const regionKey = regionKeys[i % regionKeys.length];
                const regionVerticesIndices = this.getRegionVertices(regionKey);
                let x = 0, y = 0, z = 0;

                if (regionVerticesIndices.length > 0) {
                    const rndIndex = regionVerticesIndices[Math.floor(Math.random() * regionVerticesIndices.length)];
                    const vertex = this.brainShell.vertices[rndIndex];
                    const jitter = 0.8 + Math.random() * 0.2;
                    x = vertex.x * jitter;
                    y = vertex.y * jitter;
                    z = vertex.z * jitter;
                }

                const materialConfig = this.config.get('materials.neuron');
                const baseColor = materialConfig.baseColors[Math.floor(Math.random() * materialConfig.baseColors.length)];

                return {
                    ...n,
                    x, y, z,
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

                const midX = (fromNeuron.x + toNeuron.x) / 2;
                const midY = (fromNeuron.y + toNeuron.y) / 2;
                const midZ = (fromNeuron.z + toNeuron.z) / 2;

                const cp = {
                    x: midX * 0.8,
                    y: midY * 0.8,
                    z: midZ * 0.8
                };

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

            if (this.connections.length < oldConnectionIds.size) {
                this.logEvent("Weak Connection Pruned");
            }

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
            this.stopAnimation();
            const animate = () => {
                if (this.cameraControls) {
                    this.cameraControls.update();
                }
                this.render();
                this.animationId = requestAnimationFrame(animate);
            };
            animate();
        },

        stopAnimation() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        },

        render() {
            if (!this.ctx || !this.canvas) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw Main View (Synapse)
            if (this.selectedConnection) {
                if (window.GreenhouseNeuroSynapse) {
                    window.GreenhouseNeuroSynapse.drawSynapsePiP(ctx, 0, 0, this.canvas.width, this.canvas.height, this.selectedConnection, this.synapseMeshes, true);
                }
            } else {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText("Selecting Synapse...", this.canvas.width / 2, this.canvas.height / 2);
            }

            // Draw PiP View (Whole Brain Network)
            const pipConfig = this.config.get('pip');
            const pipW = pipConfig.width;
            const pipH = pipConfig.height;
            const padding = pipConfig.padding;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            this.drawNetworkView(ctx, pipX, pipY, pipW, pipH);
        },

        drawNetworkView(ctx, x, y, w, h) {
            const origW = this.projection.width;
            const origH = this.projection.height;

            this.projection.width = w;
            this.projection.height = h;

            ctx.save();
            ctx.translate(x, y);

            const pipConfig = this.config.get('pip');
            ctx.fillStyle = pipConfig.backgroundColor;
            ctx.strokeStyle = pipConfig.borderColor;
            ctx.lineWidth = pipConfig.borderWidth;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeRect(0, 0, w, h);

            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();

            ctx.fillStyle = pipConfig.borderColor;
            ctx.font = '12px Arial';
            ctx.fillText("Whole Brain", 10, 20);

            this.drawGrid(ctx);

            if (!window.GreenhouseModels3DMath) {
                ctx.restore();
                this.projection.width = origW;
                this.projection.height = origH;
                return;
            }

            if (this.brainShell) {
                this.drawBrainShell(ctx, 0, w, h);
            }

            this.drawConnections(ctx, w, h);

            const sortedNeurons = this.neurons.map(n => {
                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                return { neuron: n, projected: p };
            }).filter(item => item.projected.scale > 0)
                .sort((a, b) => b.projected.depth - a.projected.depth);

            sortedNeurons.forEach(item => {
                this.drawNeuron(ctx, item.neuron, this.camera, this.projection);
            });

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

            this.projection.width = origW;
            this.projection.height = origH;
        },

        initializeBrainShell() {
            this.brainShell = { vertices: [], faces: [] };
            if (window.GreenhouseNeuroGeometry) {
                window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);
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
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w || this.canvas.width, h || this.canvas.height, null);
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
            const util = window.GreenhouseModelsUtil;
            if (!window.GreenhouseModels3DMath) return;

            const size = 1000;
            const step = 200;
            const y = 400;

            const gridOpacity = this.config.get('ui.gridOpacity') || 0.05;
            ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
            ctx.lineWidth = 1;
            ctx.fillStyle = this.config.get('ui.labelColor') || 'rgba(255, 255, 255, 0.3)';
            ctx.font = this.config.get('ui.labelFont') || '10px Arial';

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

            const pipConfig = this.config.get('pip');
            const pipW = pipConfig.width;
            const pipH = pipConfig.height;
            const padding = pipConfig.padding;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            if (mouseX > pipX && mouseX < pipX + pipW &&
                mouseY > pipY && mouseY < pipY + pipH) {

                const hit = this.hitTest(mouseX, mouseY);
                if (hit && hit.type === 'connection') {
                    this.selectedConnection = hit.data;
                    this.initSynapseParticles();
                }
            } else {
                if (this.selectedConnection) {
                    const cx = this.canvas.width / 2;
                    const cy = this.canvas.height / 2;
                    const localX = mouseX - cx;
                    const localY = mouseY - cy;
                    this.stirFluid(localX, localY, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
                }
            }
        },

        hitTest(mouseX, mouseY) {
            const pipConfig = this.config.get('pip');
            const pipW = pipConfig.width;
            const pipH = pipConfig.height;
            const padding = pipConfig.padding;
            const pipX = this.canvas.width - pipW - padding;
            const pipY = this.canvas.height - pipH - padding;

            if (mouseX < pipX || mouseX > pipX + pipW ||
                mouseY < pipY || mouseY > pipY + pipH) {
                return null;
            }

            const origW = this.projection.width;
            const origH = this.projection.height;

            this.projection.width = pipW;
            this.projection.height = pipH;

            const localMouseX = mouseX - pipX;
            const localMouseY = mouseY - pipY;

            let closestConn = null;
            let minDist = 20;

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
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 100 - 50,
                    z: Math.random() * 40 - 20,
                    vx: 0, vy: 0, vz: 0,
                    life: Math.random()
                });
            }

            this.fluidGrid = [];
            for (let i = 0; i < this.fluidCols * this.fluidRows; i++) {
                this.fluidGrid.push({ vx: 0, vy: 0 });
            }
        },

        stirFluid(x, y, dx, dy) {
            const cellWidth = 200 / this.fluidCols;
            const cellHeight = 100 / this.fluidRows;

            let col = Math.floor((x + 100) / cellWidth);
            let row = Math.floor((y + 50) / cellHeight);

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

        setupSynapseMouseHandlers() {
            if (!this.canvas) return;

            // Mouse down handler
            this.canvas.addEventListener('mousedown', (e) => {
                // Check if synapse camera controller exists and if click is in main view
                if (window.GreenhouseNeuroSynapse && window.GreenhouseNeuroSynapse.synapseCameraController) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    // Check if in main synapse view (not in PiP)
                    const pipConfig = this.config.get('pip');
                    const pipW = pipConfig.width;
                    const pipH = pipConfig.height;
                    const padding = pipConfig.padding;
                    const pipX = this.canvas.width - pipW - padding;
                    const pipY = this.canvas.height - pipH - padding;

                    // If NOT in PiP area, handle synapse camera
                    if (mouseX < pipX || mouseX > pipX + pipW || mouseY < pipY || mouseY > pipY + pipH) {
                        // Check reset button
                        const resetBtnX = this.canvas.width - 60;
                        const resetBtnY = 5;
                        const resetBtnW = 50;
                        const resetBtnH = 20;

                        if (mouseX >= resetBtnX && mouseX <= resetBtnX + resetBtnW &&
                            mouseY >= resetBtnY && mouseY <= resetBtnY + resetBtnH) {
                            window.GreenhouseNeuroSynapse.synapseCameraController.reset();
                            return;
                        }

                        // Handle camera interaction
                        const bounds = { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
                        window.GreenhouseNeuroSynapse.synapseCameraController.handleMouseDown(e, this.canvas, bounds);
                    }
                }
            });

            // Mouse move handler
            window.addEventListener('mousemove', (e) => {
                if (window.GreenhouseNeuroSynapse && window.GreenhouseNeuroSynapse.synapseCameraController) {
                    window.GreenhouseNeuroSynapse.synapseCameraController.handleMouseMove(e, this.canvas);
                }
            });

            // Mouse up handler
            window.addEventListener('mouseup', () => {
                if (window.GreenhouseNeuroSynapse && window.GreenhouseNeuroSynapse.synapseCameraController) {
                    window.GreenhouseNeuroSynapse.synapseCameraController.handleMouseUp();
                }
            });

            // Wheel handler
            this.canvas.addEventListener('wheel', (e) => {
                if (window.GreenhouseNeuroSynapse && window.GreenhouseNeuroSynapse.synapseCameraController) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    // Check if in main synapse view (not in PiP)
                    const pipConfig = this.config.get('pip');
                    const pipW = pipConfig.width;
                    const pipH = pipConfig.height;
                    const padding = pipConfig.padding;
                    const pipX = this.canvas.width - pipW - padding;
                    const pipY = this.canvas.height - pipH - padding;

                    // If NOT in PiP area, handle synapse camera zoom
                    if (mouseX < pipX || mouseX > pipX + pipW || mouseY < pipY || mouseY > pipY + pipH) {
                        const bounds = { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
                        window.GreenhouseNeuroSynapse.synapseCameraController.handleWheel(e, this.canvas, bounds);
                    }
                }
            }, { passive: false });

            console.log('NeuroUI3D: Synapse mouse handlers initialized');
        },

        generateSynapseMeshes() {
            if (window.GreenhouseNeuroGeometry) {
                const pre = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'pre');
                const post = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'post');

                post.vertices.forEach(v => {
                    v.y *= -1;
                });
                return { pre, post };
            }
            return { pre: { vertices: [], faces: [] }, post: { vertices: [], faces: [] } };
        },
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
