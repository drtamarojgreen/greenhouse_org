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
            x: 0, y: 0, z: -300,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            fov: 500
        },
        projection: {
            width: 800, height: 600,
            near: 10, far: 2000
        },

        isActive: false,
        rotationSpeed: 0.0002, // Very slow, barely moving
        neurons3D: [],
        connections3D: [],
        particles: [],
        brainShell: null, // Parametric shell data
        neuronMeshes: null, // Cache for neuron 3D models

        // Automatic PiP State
        activeGeneIndex: 0,
        lastFocusChangeTime: 0,
        focusDuration: 5000, // 5 seconds per gene

        // Protein View State
        proteinCache: null, // Cache for generated protein chains
        // Dynamic Visualization State

        lastGeneration: 0,
        eliteParents: [], // Snapshot of previous best network for transition effect
        transitionStartTime: 0,

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
            let isPanning = false;
            let lastX = 0, lastY = 0;

            this.canvas.addEventListener('mousedown', e => {
                // Right click or Shift+Click for Pan
                if (e.button === 2 || e.shiftKey) {
                    isPanning = true;
                    e.preventDefault();
                    this.autoFollow = false; // Disable auto-follow on manual pan
                } else {
                    isDragging = true;
                }
                lastX = e.clientX;
                lastY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            });

            this.canvas.addEventListener('contextmenu', e => e.preventDefault());

            window.addEventListener('mouseup', () => {
                isDragging = false;
                isPanning = false;
                if (this.canvas) this.canvas.style.cursor = 'grab';
            });

            window.addEventListener('mousemove', e => {
                if (isPanning) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;

                    const panScale = Math.abs(this.camera.z) * 0.002;
                    this.camera.x -= dx * panScale;
                    this.camera.y -= dy * panScale;

                    lastX = e.clientX;
                    lastY = e.clientY;
                } else if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;

                    this.camera.rotationY += dx * 0.005;
                    this.camera.rotationX += dy * 0.005;

                    lastX = e.clientX;
                    lastY = e.clientY;
                }
            });

            this.canvas.addEventListener('wheel', e => {
                e.preventDefault();
                const zoomSpeed = Math.abs(this.camera.z) * 0.001 + 5;
                this.camera.z += e.deltaY * 0.1 * zoomSpeed;

                // Clamp
                if (this.camera.z > -50) this.camera.z = -50;
                if (this.camera.z < -3000) this.camera.z = -3000;
            });

            // Handle Clicks
            this.canvas.addEventListener('click', (e) => {
                if (!isDragging && !isPanning) {
                    this.handleMouseClick(e);
                }
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
            // Generate Integrated Topology: Double Helix (Left) + Whole Brain (Right)

            const helixOffset = -200; // Left side
            const brainOffset = 200;  // Right side

            // Initialize Brain Shell if not exists
            if (!this.brainShell) {
                this.initializeBrainShell();
            }

            this.neurons3D = net.nodes.map((node, i) => {
                // Split nodes: First half = Genotype (Helix), Second half = Phenotype (Brain)
                const isGenotype = i < net.nodes.length / 2;

                if (isGenotype) {
                    if (window.GreenhouseGeneticGeometry) {
                        const helixData = window.GreenhouseGeneticGeometry.generateHelixPoints(i, net.nodes.length, helixOffset);
                        return {
                            id: node.id,
                            x: helixData.x,
                            y: helixData.y,
                            z: helixData.z,
                            type: 'gene',
                            strand: helixData.strandIndex,
                            label: i % 10 === 0 ? (i % 20 === 0 ? 'BDNF' : '5-HTTLPR') : null,
                            baseColor: helixData.strandIndex === 0 ? '#A8DADC' : '#F4A261'
                        };
                    }
                    return { id: node.id, x: 0, y: 0, z: 0, type: 'gene', baseColor: '#fff' };
                } else {
                    // Volumetric Brain Topology (Inside Shell)
                    const regionKeys = ['pfc', 'amygdala', 'hippocampus', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'cerebellum', 'brainstem'];
                    const regionKey = regionKeys[i % regionKeys.length];

                    // Get random vertex from the region to place neuron
                    const regionVerticesIndices = this.getRegionVertices(regionKey);
                    let x = brainOffset, y = 0, z = 0;

                    if (regionVerticesIndices.length > 0) {
                        const rndIndex = regionVerticesIndices[Math.floor(Math.random() * regionVerticesIndices.length)];
                        const vertex = this.brainShell.vertices[rndIndex];

                        // Add some internal volume jitter
                        const jitter = 0.8 + Math.random() * 0.2;
                        x = brainOffset + vertex.x * jitter;
                        y = vertex.y * jitter;
                        z = vertex.z * jitter;
                    }

                    // Color mapping
                    const colors = {
                        'pfc': '#E07A5F',
                        'amygdala': '#FF6464',
                        'hippocampus': '#64FF96',
                        'temporalLobe': '#F4A261',
                        'parietalLobe': '#9370DB',
                        'occipitalLobe': '#FFC0CB',
                        'cerebellum': '#40E0D0',
                        'brainstem': '#FFD700'
                    };

                    return {
                        id: node.id,
                        x: x,
                        y: y,
                        z: z,
                        type: 'neuron',
                        region: regionKey,
                        baseColor: colors[regionKey] || '#ffffff'
                    };
                }
            });

            this.initializeConnections(net.connections);

            // Detect Generation Change
            if (this.algo.generation > this.lastGeneration) {
                this.logEvent("Generation Complete");
                this.logEvent("New Traits Evolved");

                // Keep a snapshot of the previous "best" as "elite parents" for a brief transition
                this.eliteParents = [...this.neurons3D];
                this.transitionStartTime = Date.now();

                this.lastGeneration = this.algo.generation;
            }

            // Generate Protein Cache for the active gene (or all genes if needed, but let's do active for now)
            // Actually, we should cache it when activeGeneIndex changes or when data updates.
            // For simplicity, let's just generate it here if it's null or if we want to update it.
            // But wait, updateData is called on every evolution step.
            // We should probably just ensure it's an object.
            if (!this.proteinCache) {
                this.proteinCache = {};
            }
            // We can populate it on demand in drawProteinView, or pre-populate here.
            // Let's pre-populate for the current active gene to be safe.
            const activeGene = this.neurons3D[this.activeGeneIndex];
            if (activeGene && !this.proteinCache[activeGene.id]) {
                this.proteinCache[activeGene.id] = this.generateProteinChain(activeGene.id); // Use ID as seed
            }
        },

        initializeConnections(connections) {
            this.connections3D = connections.map(conn => {
                const fromNeuron = this.neurons3D.find(n => n.id === conn.from);
                const toNeuron = this.neurons3D.find(n => n.id === conn.to);

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
                const radius = Math.max(0.5, Math.abs(conn.weight) * 1.5);
                const mesh = this.generateTubeMesh(fromNeuron, toNeuron, cp, radius, 8);

                return {
                    ...conn,
                    from: fromNeuron,
                    to: toNeuron,
                    controlPoint: cp,
                    mesh: mesh
                };
            }).filter(c => c !== null);
        },

        generateTubeMesh(p1, p2, cp, radius, segments) {
            if (window.GreenhouseGeneticGeometry) {
                return window.GreenhouseGeneticGeometry.generateTubeMesh(p1, p2, cp, radius, segments);
            }
            return { vertices: [], faces: [] };
        },

        logEvent(messageKey) {
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.logEvent(messageKey);
            }
        },

        shouldEvolve() {
            return this.isEvolving;
        },

        animate() {
            this.render();
            // Auto-rotate slightly
            if (this.isEvolving) {
                this.camera.rotationY += this.rotationSpeed;
            }

            // Camera Follow Active Gene (Vertical Scrolling)
            // Only if auto-follow is active (disabled by manual panning)
            if (this.autoFollow !== false) {
                const activeGene = this.neurons3D[this.activeGeneIndex];
                if (activeGene) {
                    // Target Y is negative of gene Y to center it (camera moves opposite to object)
                    // But wait, camera Y moves the camera. If gene is at Y=100, camera needs to be at Y=100 to see it at center?
                    // project3DTo2D: y = (v.y - camera.y) ...
                    // So yes, camera.y should equal gene.y to center it.

                    const targetY = activeGene.y;
                    // Smooth interpolation (Lerp)
                    this.camera.y += (targetY - this.camera.y) * 0.05;
                }
            }

            this.animationFrame = requestAnimationFrame(() => this.animate());
        },

        render() {
            if (!this.ctx || !this.canvas) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update Automatic Focus - REMOVED for Manual Control
            // const now = Date.now();
            // if (now - this.lastFocusChangeTime > this.focusDuration) { ... }

            const activeGene = this.neurons3D[this.activeGeneIndex];

            // --- Viewport Layout ---
            const w = this.canvas.width;
            const h = this.canvas.height;

            // 1. Macro View (Main Helix) - Top Left (Large)
            // Occupies full width, but we render others on top or split?
            // User asked for "system of picture in pictures".
            // Let's do: Main BG is Helix. PiPs are overlays.

            // Draw Main Helix (Full Screen Background)
            this.drawMacroView(ctx, w, h);

            // 2. Micro View (Gene Zoom) - Top Right
            this.drawMicroView(ctx, w - 220, 20, 200, 200, activeGene);

            // 3. Target View (Brain Region) - Bottom Right
            this.drawTargetView(ctx, w - 220, 240, 200, 200, activeGene);

            // 4. Protein View (Polypeptide Chain) - Bottom Left
            this.drawProteinView(ctx, 20, h - 220, 200, 200, activeGene);

            // Draw Stats / Labels
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawOverlayInfo(ctx, w, activeGene);
            }

            // Draw Manual Controls
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawControls(ctx, w, h);
            }
        },

        drawMacroView(ctx, w, h) {
            if (window.GreenhouseGeneticDNA) {
                window.GreenhouseGeneticDNA.drawMacroView(
                    ctx, w, h, this.camera, this.projection, this.neurons3D, this.activeGeneIndex, this.brainShell,
                    this.drawNeuron.bind(this), // Callback for drawing individual genes/neurons
                    this.drawBrainShell.bind(this) // Callback for drawing brain shell
                );
            }
        },

        drawMicroView(ctx, x, y, w, h, activeGene) {
            if (window.GreenhouseGeneticGene) {
                window.GreenhouseGeneticGene.drawMicroView(
                    ctx, x, y, w, h, activeGene, this.activeGeneIndex, this.neuronMeshes,
                    this.drawPiPFrame.bind(this)
                );
            } else if (window.GreenhouseGeneticChromosome) {
                // Fallback or alternative view
                window.GreenhouseGeneticChromosome.drawChromosome(
                    ctx, x, y, w, h, activeGene,
                    this.drawPiPFrame.bind(this)
                );
            }
        },

        drawTargetView(ctx, x, y, w, h, activeGene) {
            if (window.GreenhouseGeneticBrain) {
                window.GreenhouseGeneticBrain.drawTargetView(
                    ctx, x, y, w, h, activeGene, this.activeGeneIndex, this.brainShell,
                    this.drawPiPFrame.bind(this)
                );
            }
        },

        drawProteinView(ctx, x, y, w, h, activeGene) {
            if (window.GreenhouseGeneticProtein) {
                window.GreenhouseGeneticProtein.drawProteinView(
                    ctx, x, y, w, h, activeGene, this.proteinCache,
                    this.drawPiPFrame.bind(this)
                );
            }
        },

        generateProteinChain(seed) {
            if (window.GreenhouseGeneticGeometry) {
                return window.GreenhouseGeneticGeometry.generateProteinChain(seed);
            }
            return { vertices: [] };
        },

        drawPiPFrame(ctx, x, y, w, h, title) {
            ctx.save();
            ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Title
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(title, x + 5, y + 15);

            // Clip
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
        },





        hitTest(mouseX, mouseY) {
            // Check Genes
            for (let i = 0; i < this.neurons3D.length; i++) {
                const n = this.neurons3D[i];
                if (n.type !== 'gene') continue;

                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                if (p.scale > 0) {
                    const dx = mouseX - p.x;
                    const dy = mouseY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Hit radius based on scale
                    if (dist < 10 * p.scale) {
                        return { type: 'gene', index: i, data: n };
                    }
                }
            }
            return null;
        },

        handleMouseClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Check for Gene Click
            const hit = this.hitTest(mouseX, mouseY);
            if (hit && hit.type === 'gene') {
                this.activeGeneIndex = hit.index;
                this.autoFollow = true; // Re-enable auto-follow on selection
                return;
            }

            const w = this.canvas.width;
            const h = this.canvas.height;

            // Check for Protein Click
            // Area: x=20, y=h-220, w=200, h=200
            if (window.GreenhouseGeneticProtein) {
                const protX = 20;
                const protY = h - 220;
                const protW = 200;
                const protH = 200;

                const protHit = window.GreenhouseGeneticProtein.hitTest(
                    mouseX, mouseY, protX, protY, protW, protH,
                    this.neurons3D[this.activeGeneIndex], this.proteinCache
                );

                if (protHit) {
                    console.log("Selected Protein Atom:", protHit);

                    // Toggle Mode
                    const modes = ['ribbon', 'ball-and-stick', 'space-filling'];
                    const currentMode = this.neurons3D[this.activeGeneIndex].proteinMode || 'ribbon';
                    const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];

                    this.neurons3D[this.activeGeneIndex].proteinMode = nextMode;
                    console.log("Switched Protein Mode to:", nextMode);
                    return;
                }
            }

            const btnW = 100;
            const btnH = 30;
            const gap = 20;

            // Previous Button
            const prevX = w / 2 - btnW - gap / 2;
            const prevY = h - 50;
            if (mouseX >= prevX && mouseX <= prevX + btnW && mouseY >= prevY && mouseY <= prevY + btnH) {
                this.activeGeneIndex = (this.activeGeneIndex - 1 + this.neurons3D.length) % this.neurons3D.length;
                this.autoFollow = true;
                return;
            }

            // Next Button
            const nextX = w / 2 + gap / 2;
            const nextY = h - 50;
            if (mouseX >= nextX && mouseX <= nextX + btnW && mouseY >= nextY && mouseY <= nextY + btnH) {
                this.activeGeneIndex = (this.activeGeneIndex + 1) % this.neurons3D.length;
                this.autoFollow = true;
                return;
            }
        },





        neuronMeshes: {}, // Cache for generated neuron meshes
        drawNeuron(ctx, p) {
            if (p.type === 'gene') {
                if (window.GreenhouseGeneticGene) {
                    window.GreenhouseGeneticGene.drawNeuron(ctx, p);
                }
            } else {
                if (window.GreenhouseGeneticBrain) {
                    window.GreenhouseGeneticBrain.drawNeuron(ctx, p, this.neuronMeshes, this.camera, this.projection);
                }
            }
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

        drawBrainShell(ctx, offsetX = 0) {
            if (window.GreenhouseNeuroBrain) {
                ctx.save();
                ctx.translate(offsetX, 0);
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, this.canvas.width, this.canvas.height);
                ctx.restore();
            }
        },

        drawSignalFlow(ctx, projectedNeurons) {
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawSignalFlow(ctx, this.isEvolving);
            }
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
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawLabels(ctx, projectedNeurons);
            }
        },

        drawEventLog(ctx) {
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawEventLog(ctx, this.canvas.height);
            }
        }
    };

    window.GreenhouseGeneticUI3D = GreenhouseGeneticUI3D;
})();
