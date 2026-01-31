// docs/js/genetic_ui_3d.js
// 3D Visualization for Genetic Algorithm

(function () {
    'use strict';

    const GreenhouseGeneticUI3D = {
        container: null,
        canvas: null,
        ctx: null,
        algo: null,

        cameras: [
            // Main camera
            { x: 0, y: -100, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            // PiP cameras: helix, micro, protein, target
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 }
        ],
        projection: {
            width: 800, height: 600,
            near: 10, far: 2000
        },

        isActive: false,
        rotationSpeed: 0.005, // Slower rotation
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

        mainCameraController: null,

        init(container, algo, selector = null) {
            // Support (container, selector) re-init signature where algo might be missing or passed differently
            // But here the signature is tricky because `algo` is needed.
            // The utility calls: appInstance[reinitFunctionName](container, selector)
            // So if `init(container, selector)` is called, `algo` becomes the selector string.
            // We need to store `algo` on the instance to survive re-init.

            if (algo && typeof algo !== 'string') {
                this.algo = algo;
            }

            if (typeof algo === 'string' && !selector) {
                selector = algo;
            }

            this.container = container;
            this.isEvolving = false; // Don't start until button pressed

            // Set main camera to cameras[0]
            this.camera = this.cameras[0];

            // Initialize PiP Controls with cameras array FIRST
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.init(window.GreenhouseGeneticConfig, this.cameras);
            }

            // Initialize Main Camera Controller
            if (window.GreenhouseGeneticCameraController) {
                this.mainCameraController = new window.GreenhouseGeneticCameraController(
                    this.camera,
                    window.GreenhouseGeneticConfig
                );
            }

            this.setupDOM();
            this.resize();
            this.setupInteraction();

            // Add Resize Listeners
            window.addEventListener('resize', () => {
                requestAnimationFrame(() => this.resize());
            });

            // Handle Language Change
            window.addEventListener('greenhouse:language-changed', () => {
                this.refreshUIText();
            });

            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    requestAnimationFrame(() => this.resize());
                });
                ro.observe(this.container);
            }

            this.startAnimation();

            // Initial Data Map
            this.updateData();

            // Resilience using shared GreenhouseUtils
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
                window.GreenhouseUtils.startSentinel(container, selector, this, 'init');
            }
        },

        startAnimation() {
            this.stopAnimation();
            this.animate();
        },

        stopAnimation() {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        },

        refreshUIText() {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const btn = document.getElementById('gen-pause-btn');
            if (btn) {
                btn.textContent = this.isEvolving ? t("Pause Evolution") : t("Resume Evolution");
            }
            const genLabel = document.getElementById('gen-label-container');
            if (genLabel) {
                genLabel.innerHTML = `${t('gen')}: <span id="gen-counter">${this.algo ? this.algo.generation : 0}</span> | ${t('fitness')}: <span id="fitness-display">${this.algo && this.algo.bestNetwork ? this.algo.bestNetwork.fitness.toFixed(2) : '0.00'}</span>`;
            }

            const startBtn = document.querySelector('#genetic-start-overlay button');
            if (startBtn) {
                startBtn.textContent = t('Start Simulation');
            }

            const explanation = document.getElementById('genetic-explanation');
            if (explanation) {
                explanation.innerHTML = `
                    <h3 style="margin-top:0;">${t('genetic_explanation_title')}</h3>
                    <p>${t('genetic_explanation_text')}</p>
                `;
            }
        },

        setupDOM() {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

            // Controls
            const controls = document.createElement('div');
            if (isMobile) controls.style.display = 'none';
            controls.className = 'greenhouse-controls-panel';
            controls.style.marginBottom = '15px';
            controls.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                    <button id="gen-pause-btn" class="greenhouse-btn">${t('Pause Evolution')}</button>
                    <div id="gen-label-container" style="margin-left: auto; font-weight: bold; color: #2c3e50;">
                        ${t('gen')}: <span id="gen-counter">0</span> | ${t('fitness')}: <span id="fitness-display">0.00</span>
                    </div>
                </div>
            `;
            this.container.appendChild(controls);

            // Bind Button
            const btn = controls.querySelector('#gen-pause-btn');
            btn.addEventListener('click', () => {
                this.isEvolving = !this.isEvolving;
                btn.textContent = this.isEvolving ? t("Pause Evolution") : t("Resume Evolution");
                btn.style.background = this.isEvolving ? "" : "#e74c3c";
                btn.style.color = this.isEvolving ? "" : "white";
            });

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'main-canvas';
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
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
            if (!util || isMobile) return;

            const section = document.createElement('div');
            section.id = 'genetic-explanation';
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
            overlay.style.display = 'flex'; // SHOW BY DEFAULT - user must click to start
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

                if (window.GreenhouseGenetic) {
                    window.GreenhouseGenetic.startSimulation();
                }

                // Update pause button text if needed
                const pauseBtn = container.querySelector('#gen-pause-btn');
                if (pauseBtn) {
                    pauseBtn.textContent = t("Pause Evolution");
                    pauseBtn.style.background = "";
                    pauseBtn.style.color = "";
                }

                // Start animation loop
                this.startAnimation();
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
            this.canvas.addEventListener('mousedown', e => {
                // 1. Check PiP Controls first. If handled, stop processing.
                if (window.GreenhouseGeneticPiPControls) {
                    if (window.GreenhouseGeneticPiPControls.handleMouseDown(e, this.canvas)) {
                        // Deactivate main controller while PiP is active
                        if (this.mainCameraController) this.mainCameraController.isListening = false;
                        return;
                    }
                }

                // 2. Main Camera Controls
                if (this.mainCameraController) {
                    this.mainCameraController.isListening = true;
                    this.mainCameraController.handleMouseDown(e);
                    this.autoFollow = false; // Disable auto-follow on manual interaction
                    this.canvas.style.cursor = 'grabbing';
                }
            });

            this.canvas.addEventListener('contextmenu', e => e.preventDefault());

            window.addEventListener('mouseup', () => {
                // PiP Controls
                if (window.GreenhouseGeneticPiPControls) {
                    window.GreenhouseGeneticPiPControls.handleMouseUp();
                }

                // Main Camera Controls
                if (this.mainCameraController) {
                    this.mainCameraController.handleMouseUp();
                    // Re-enable main controller listening on mouse up
                    this.mainCameraController.isListening = true;
                }

                if (this.canvas) this.canvas.style.cursor = 'grab';
            });

            window.addEventListener('mousemove', e => {
                // Remove excessive mouse move logging

                // PiP Controls
                if (window.GreenhouseGeneticPiPControls) {
                    // If the PiP controls handled the event, do not proceed.
                    if (window.GreenhouseGeneticPiPControls.handleMouseMove(e)) {
                        return;
                    }
                }

                // Main Camera Controls
                if (this.mainCameraController) {
                    this.mainCameraController.handleMouseMove(e);
                }
            });

            this.canvas.addEventListener('wheel', e => {
                // PiP Controls
                if (window.GreenhouseGeneticPiPControls) {
                    // If the PiP controls handled the event, do not proceed.
                    if (window.GreenhouseGeneticPiPControls.handleWheel(e, this.canvas)) {
                        return;
                    }
                }

                e.preventDefault();

                // Main Camera Controls
                if (this.mainCameraController) {
                    this.mainCameraController.handleWheel(e);
                }
            }, { passive: false });

            // Handle Clicks
            this.canvas.addEventListener('click', (e) => {
                // Check PiP Reset Button - need to scale coordinates
                if (window.GreenhouseGeneticPiPControls) {
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = this.canvas.width / rect.width;
                    const scaleY = this.canvas.height / rect.height;
                    const mouseX = (e.clientX - rect.left) * scaleX;
                    const mouseY = (e.clientY - rect.top) * scaleY;
                    const resetPiP = window.GreenhouseGeneticPiPControls.checkResetButton(mouseX, mouseY, this.canvas.width, this.canvas.height);
                    if (resetPiP) {
                        window.GreenhouseGeneticPiPControls.resetPiP(resetPiP);
                        return;
                    }
                }

                // Only handle click if not dragging
                if (this.mainCameraController && !this.mainCameraController.isDragging && !this.mainCameraController.isPanning) {
                    this.handleMouseClick(e);
                }
            });

            // Keyboard Controls (Optional, pass to main controller)
            window.addEventListener('keydown', e => {
                if (this.mainCameraController) this.mainCameraController.handleKeyDown(e);
            });
            window.addEventListener('keyup', e => {
                if (this.mainCameraController) this.mainCameraController.handleKeyUp(e);
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

            const helixOffset = -400; // Far Left
            const brainOffset = 0;    // Center of World

            // Initialize Brain Shell if not exists
            if (!this.brainShell) {
                this.initializeBrainShell();
            }

            // Use canonical region names that match the geometry data from neuro_ui_3d_geometry.js
            const regionKeys = ['pfc', 'amygdala', 'hippocampus', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'cerebellum', 'brainstem'];
            this.neurons3D = net.nodes.map((node, i) => {
                // Split nodes: First half = Genotype (Helix), Second half = Phenotype (Brain)
                const isGenotype = i < net.nodes.length / 2;

                // Determine the corresponding brain region for this gene/neuron pair.
                // The gene at index `i` corresponds to the neuron at index `i + half`,
                // so they share the same region logic.
                const correspondingIndex = isGenotype ? i + (net.nodes.length / 2) : i;
                const regionKey = regionKeys[correspondingIndex % regionKeys.length];

                if (isGenotype) {
                    if (window.GreenhouseGeneticGeometry) {
                        const helixData = window.GreenhouseGeneticGeometry.generateHelixPoints(i, net.nodes.length, helixOffset);
                        return {
                            id: node.id,
                            x: helixData.x,
                            y: helixData.y,
                            z: helixData.z,
                            type: 'gene',
                            region: regionKey, // Assign the target region to the gene
                            strand: helixData.strandIndex,
                            label: i % 10 === 0 ? (i % 20 === 0 ? 'BDNF' : '5-HTTLPR') : null,
                            baseColor: helixData.strandIndex === 0 ? '#A8DADC' : '#F4A261'
                        };
                    }
                    return { id: node.id, x: 0, y: 0, z: 0, type: 'gene', region: regionKey, baseColor: '#fff' };
                } else {
                    // Volumetric Brain Topology (Inside Shell)
                    // regionKey is already calculated above

                    // Get random vertex from the region to place neuron
                    const regionVerticesIndices = this.getRegionVertices(regionKey);
                    let x = brainOffset, y = 0, z = 0;

                    if (regionVerticesIndices.length > 0) {
                        // NEW: Stable Positioning based on Node ID instead of Math.random()
                        const idNum = typeof node.id === 'string' ? node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : node.id;
                        const rndIndex = regionVerticesIndices[idNum % regionVerticesIndices.length];
                        const vertex = this.brainShell.vertices[rndIndex];

                        // Add some internal volume jitter - also stable based on ID
                        const jitterX = 0.7 + ((idNum * 13) % 100) / 333;
                        const jitterY = 0.7 + ((idNum * 17) % 100) / 333;
                        const jitterZ = 0.7 + ((idNum * 19) % 100) / 333;
                        x = brainOffset + vertex.x * jitterX;
                        y = vertex.y * jitterY;
                        z = vertex.z * jitterZ;
                    }

                    // Color mapping
                    // Color mapping - "Cool Science" Palette (Blues/Teals/Purples)
                    const coolSciencePalette = ['#00FFFF', '#1E90FF', '#00CED1', '#4169E1', '#7B68EE'];
                    const baseColor = coolSciencePalette[Math.floor(Math.random() * coolSciencePalette.length)];

                    return {
                        id: node.id,
                        x: x,
                        y: y,
                        z: z,
                        type: 'neuron',
                        region: regionKey,
                        baseColor: baseColor
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
                    x: midX * 0.5, // Pull more aggressively towards center
                    y: midY * 0.5,
                    z: midZ * 0.5
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
            // Update Main Camera BEFORE rendering
            if (this.mainCameraController) {
                this.mainCameraController.update();
            }

            // Fallback auto-rotate if no controller or if isEvolving
            if (!this.mainCameraController && this.isEvolving) {
                this.camera.rotationY += this.rotationSpeed;
            }

            // Update PiP Cameras
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.update();
            }

            // Camera Follow Active Gene (Vertical Scrolling)
            // Only if auto-follow is active (disabled by manual panning)
            if (this.autoFollow !== false) {
                const activeGene = this.neurons3D[this.activeGeneIndex];
                if (activeGene) {
                    const targetY = activeGene.y;
                    this.camera.y += (targetY - this.camera.y) * 0.05;
                }
            }

            // Render AFTER all camera updates
            this.render();

            this.animationFrame = requestAnimationFrame(() => this.animate());
        },

        render() {
            if (!this.ctx || !this.canvas) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const activeGene = this.neurons3D[this.activeGeneIndex];

            // --- Viewport Layout ---
            const w = this.canvas.width;
            const h = this.canvas.height;

            // 1. Main View: Brain (Target) - Center
            // The user requested "Brain in the center".
            // We use the main camera controller for this.

            // Draw Brain as Main Background
            this.drawTargetView(ctx, 0, 0, w, h, activeGene,
                this.activeGeneIndex, this.brainShell, null, { camera: this.camera, activeGene: activeGene }); // Pass main camera

            //this.activeGeneIndex, this.brainShell, null, { camera: this.camera }); // Pass main camera
            this.drawConnections(ctx);
            // Helper to draw PiP Frame & Label
            const drawPiPFrame = (ctx, x, y, w, h, title) => {
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, w, h);

                // Background for Title
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x, y, w, 20);

                // Title
                ctx.fillStyle = '#00ffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(title, x + 5, y + 10);
                ctx.restore();
            };

            // PiP Configuration
            const pipW = 200;
            const pipH = 150;
            const gap = 10;

            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

            if (!isMobile) {
                const leftPipX = gap;
                const rightPipX = w - pipW - gap;

                // Get PiP States
                let helixState = { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 };
                let microState = { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 };
                let proteinState = { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 };
                let targetState = { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 };

                if (window.GreenhouseGeneticPiPControls) {
                    helixState = window.GreenhouseGeneticPiPControls.getState('helix');
                    microState = window.GreenhouseGeneticPiPControls.getState('micro');
                    proteinState = window.GreenhouseGeneticPiPControls.getState('protein');
                    targetState = window.GreenhouseGeneticPiPControls.getState('target');
                }

                // 2. PiP 1: DNA Double Helix - Top Left
                this.drawDNAHelixPiP(ctx, leftPipX, gap, pipW, pipH, helixState, drawPiPFrame);
                if (window.GreenhouseGeneticPiPControls) {
                    window.GreenhouseGeneticPiPControls.drawControls(ctx, leftPipX, gap, pipW, pipH, 'helix');
                }

                // 3. PiP 2: Micro View (Gene Structure) - Top Right
                this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene,
                    this.activeGeneIndex, this.neuronMeshes, drawPiPFrame, microState);
                if (window.GreenhouseGeneticPiPControls) {
                    window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, gap, pipW, pipH, 'micro');
                }

                // 4. PiP 3: Protein View - Middle Right
                const proteinY = gap + pipH + gap;
                this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene,
                    this.proteinCache, drawPiPFrame, proteinState);
                if (window.GreenhouseGeneticPiPControls) {
                    window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, proteinY, pipW, pipH, 'protein');
                }

                // 5. PiP 4: Target View (Brain Region) - Bottom Right
                const targetY = gap + pipH + gap + pipH + gap;
                this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene,
                    this.activeGeneIndex, this.brainShell, drawPiPFrame, { ...targetState, activeGene: activeGene });
                if (window.GreenhouseGeneticPiPControls) {
                    window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, targetY, pipW, pipH, 'target');
                }
            }

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
                this.projectedGenes = window.GreenhouseGeneticDNA.drawMacroView(
                    ctx, w, h, this.camera, this.projection, this.neurons3D, this.activeGeneIndex, this.brainShell,
                    this.drawNeuron.bind(this), // Callback for drawing individual genes/neurons
                    this.drawBrainShell.bind(this) // Callback for drawing brain shell
                );
            }
        },

        drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback, cameraState) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();

            if (window.GreenhouseGeneticGene) {
                window.GreenhouseGeneticGene.drawMicroView(
                    ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes,
                    drawPiPFrameCallback, cameraState
                );
            } else if (window.GreenhouseGeneticChromosome) {
                // Fallback or alternative view
                window.GreenhouseGeneticChromosome.drawChromosome(
                    ctx, x, y, w, h, activeGene,
                    drawPiPFrameCallback
                );
            }
            ctx.restore();
        },

        drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
            if (window.GreenhouseGeneticBrain) {
                window.GreenhouseGeneticBrain.drawTargetView(
                    ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell,
                    drawPiPFrameCallback, cameraState
                );
            }
            ctx.restore();
        },

        drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback, cameraState) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
            if (window.GreenhouseGeneticProtein) {
                window.GreenhouseGeneticProtein.drawProteinView(
                    ctx, x, y, w, h, activeGene, proteinCache,
                    drawPiPFrameCallback, cameraState
                );
            }
            ctx.restore();
        },

        generateProteinChain(seed) {
            if (window.GreenhouseGeneticGeometry) {
                return window.GreenhouseGeneticGeometry.generateProteinChain(seed);
            }
            return { vertices: [] };
        },

        drawPiPFrame(ctx, x, y, w, h, title) {
            ctx.save();

            // Background
            ctx.fillStyle = 'rgba(10, 10, 20, 0.9)'; // Slightly more opaque
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Title
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(title, x + 5, y + 15);

            // Clip Content
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
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            // Check for Gene Click
            const hit = this.hitTest(mouseX, mouseY);
            if (hit && hit.type === 'gene') {
                this.activeGeneIndex = hit.index;
                this.autoFollow = false; // Disable old auto-follow

                if (this.mainCameraController) {
                    // Cinematic Transition to Gene
                    this.mainCameraController.flyTo({
                        x: this.camera.x, // Keep X
                        y: hit.data.y,    // Center Y on gene
                        z: -200,          // Zoom in slightly
                        rotationX: this.camera.rotationX,
                        rotationY: this.camera.rotationY
                    }, 1500);
                } else {
                    this.autoFollow = true; // Fallback
                }
                return;
            }

            const w = this.canvas.width;
            const h = this.canvas.height;

            // PiP Configuration (Must match render)
            const pipW = 200;
            const pipH = 150;
            const gap = 10;
            const pipX = w - pipW - gap;

            // Check for Protein Click (Middle Right)
            if (window.GreenhouseGeneticProtein) {
                const protX = pipX;
                const protY = gap + pipH + gap;
                const protW = pipW;
                const protH = pipH;

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
            const btnGap = 20;

            // Previous Button
            const prevX = w / 2 - btnW - btnGap / 2;
            const prevY = h - 50;
            if (mouseX >= prevX && mouseX <= prevX + btnW && mouseY >= prevY && mouseY <= prevY + btnH) {
                this.activeGeneIndex = (this.activeGeneIndex - 1 + this.neurons3D.length) % this.neurons3D.length;
                this.autoFollow = true;
                return;
            }

            // Next Button
            const nextX = w / 2 + btnGap / 2;
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
            if (window.GreenhouseGeneticGeometry) {
                window.GreenhouseGeneticGeometry.initializeBrainShell(this.brainShell);
            }
        },

        getRegionVertices(regionKey) {
            if (window.GreenhouseGeneticGeometry) {
                return window.GreenhouseGeneticGeometry.getRegionVertices(this.brainShell, regionKey);
            }
            return [];
        },

        drawBrainShell(ctx, offsetX = 0) {
            if (window.GreenhouseGeneticBrain) {
                const activeGene = this.neurons3D[this.activeGeneIndex];
                ctx.save();
                ctx.translate(offsetX, 0);
                window.GreenhouseGeneticBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, this.canvas.width, this.canvas.height, activeGene);
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
                // Use captured projectedGenes if available, otherwise use passed arg (which might be empty)
                const data = this.projectedGenes || projectedNeurons;
                window.GreenhouseGeneticStats.drawLabels(ctx, data);
            }
        },

        drawEventLog(ctx) {
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawEventLog(ctx, this.canvas.height);
            }
        },

        /**
         * Draw DNA Double Helix in PiP
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - PiP X position
         * @param {number} y - PiP Y position
         * @param {number} w - PiP width
         * @param {number} h - PiP height
         * @param {Object} cameraState - Camera state for this PiP
         * @param {Function} drawPiPFrame - Callback to draw PiP frame
         */
        drawDNAHelixPiP(ctx, x, y, w, h, cameraState, drawPiPFrame) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();
            // Draw PiP frame with title
            if (drawPiPFrame) {
                drawPiPFrame(ctx, x, y, w, h, "DNA Double Helix");
            }

            // Use the specific camera for this PiP - no fallback
            if (!cameraState || !cameraState.camera) {
                ctx.restore();
                return;
            }
            const pipCamera = cameraState.camera;

            const pipProjection = {
                width: w,
                height: h,
                near: 10,
                far: 2000
            };

            // Get DNA genes (first half of neurons)
            const dnaGenes = this.neurons3D.filter(n => n.type === 'gene');

            if (dnaGenes.length === 0) {
                // Debug: Show message if no genes
                ctx.save();
                ctx.translate(x, y);
                ctx.fillStyle = '#FF0000';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("No DNA genes found", w / 2, h / 2);
                ctx.fillText(`Total neurons: ${this.neurons3D.length}`, w / 2, h / 2 + 20);
                ctx.restore();
                return;
            }

            // Draw DNA using genetic_ui_3d_dna module
            if (window.GreenhouseGeneticDNA) {
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.clip();

                // Draw helix connections (backbone and base pairs)
                this.drawDNAConnections(ctx, dnaGenes, pipCamera, pipProjection, w, h);

                // Draw gene nodes
                const projectedGenes = [];
                dnaGenes.forEach((n, i) => {
                    const p = GreenhouseModels3DMath.project3DTo2D(
                        n.x, // Don't offset - genes are already positioned
                        n.y,
                        n.z,
                        pipCamera,
                        pipProjection
                    );

                    if (p.scale > 0) {
                        projectedGenes.push({ ...n, ...p });
                    }
                });

                // Sort by depth
                projectedGenes.sort((a, b) => b.depth - a.depth);

                // Draw genes
                projectedGenes.forEach(p => {
                    const config = window.GreenhouseGeneticConfig;
                    const baseColors = config ? config.get('materials.dna.baseColors') : null;

                    // Determine base pair type
                    const geneIndex = dnaGenes.findIndex(g => g.id === p.id);
                    const pairIndex = Math.floor(geneIndex / 2);
                    const type = pairIndex % 4;

                    let color;
                    if (baseColors) {
                        switch (type) {
                            case 0: color = p.strand === 0 ? baseColors.A : baseColors.T; break;
                            case 1: color = p.strand === 0 ? baseColors.T : baseColors.A; break;
                            case 2: color = p.strand === 0 ? baseColors.C : baseColors.G; break;
                            case 3: color = p.strand === 0 ? baseColors.G : baseColors.C; break;
                        }
                    } else {
                        color = p.baseColor;
                    }

                    // Draw gene sphere
                    const radius = 4 * p.scale;
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(0.7, color);
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Add glow
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                });

                // Draw label
                if (dnaGenes[0] && dnaGenes[0].label) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(dnaGenes[0].label, w / 2, h - 20);
                }

                ctx.restore();
            }
            ctx.restore();
        },

        /**
         * Draw DNA connections (backbone and base pairs) in PiP
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Array} dnaGenes - DNA gene nodes
         * @param {Object} camera - Camera object
         * @param {Object} projection - Projection object
         * @param {number} w - Width
         * @param {number} h - Height
         */
        drawDNAConnections(ctx, dnaGenes, camera, projection, w, h) {
            if (dnaGenes.length < 2) return;

            const config = window.GreenhouseGeneticConfig;
            const lighting = window.GreenhouseGeneticLighting;

            // Draw base pairs (rungs)
            for (let i = 0; i < dnaGenes.length; i += 2) {
                if (i + 1 >= dnaGenes.length) break;

                const n1 = dnaGenes[i];
                const n2 = dnaGenes[i + 1];

                const p1 = GreenhouseModels3DMath.project3DTo2D(
                    n1.x, n1.y, n1.z, camera, projection
                );
                const p2 = GreenhouseModels3DMath.project3DTo2D(
                    n2.x, n2.y, n2.z, camera, projection
                );

                if (p1.scale > 0 && p2.scale > 0) {
                    const avgScale = (p1.scale + p2.scale) / 2;
                    const thickness = 6 * avgScale;

                    // Get colors from config
                    const baseColors = config ? config.get('materials.dna.baseColors') : null;
                    const pairIndex = i / 2;
                    const type = pairIndex % 4;

                    let color1, color2;
                    if (baseColors) {
                        switch (type) {
                            case 0: color1 = baseColors.A; color2 = baseColors.T; break;
                            case 1: color1 = baseColors.T; color2 = baseColors.A; break;
                            case 2: color1 = baseColors.C; color2 = baseColors.G; break;
                            case 3: color1 = baseColors.G; color2 = baseColors.C; break;
                        }
                    } else {
                        color1 = n1.baseColor;
                        color2 = n2.baseColor;
                    }

                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    // Draw with gradient
                    const drawSegment = (x1, y1, x2, y2, color) => {
                        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
                        gradient.addColorStop(0.5, color);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    };

                    drawSegment(p1.x, p1.y, midX, midY, color1);
                    drawSegment(midX, midY, p2.x, p2.y, color2);
                }
            }

            // Draw backbone (two strands)
            for (let s = 0; s < 2; s++) {
                const strandNodes = dnaGenes.filter(n => n.strand === s);
                if (strandNodes.length < 2) continue;

                const strandColor = config ?
                    (s === 0 ? config.get('materials.dna.strand1Color') : config.get('materials.dna.strand2Color')) :
                    (s === 0 ? '#00D9FF' : '#FF6B9D');

                for (let i = 0; i < strandNodes.length - 1; i++) {
                    const n1 = strandNodes[i];
                    const n2 = strandNodes[i + 1];

                    const p1 = GreenhouseModels3DMath.project3DTo2D(
                        n1.x, n1.y, n1.z, camera, projection
                    );
                    const p2 = GreenhouseModels3DMath.project3DTo2D(
                        n2.x, n2.y, n2.z, camera, projection
                    );

                    if (p1.scale > 0 && p2.scale > 0) {
                        const avgScale = (p1.scale + p2.scale) / 2;
                        const thickness = 4 * avgScale;

                        // Gradient for 3D effect
                        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                        gradient.addColorStop(0, strandColor);
                        gradient.addColorStop(0.5, strandColor);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        },

        /**
         * Draw a rotating 3D cube to test rotation
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - PiP X position
         * @param {number} y - PiP Y position
         * @param {number} w - PiP width
         * @param {number} h - PiP height
         * @param {Object} cameraState - Camera state for this PiP
         */
        drawRotatingCube(ctx, x, y, w, h, cameraState) {
            ctx.save();
            ctx.translate(x, y);

            // Get rotation from camera state
            const rotY = cameraState.camera?.rotationY || cameraState.rotationY || 0;
            const rotX = cameraState.camera?.rotationX || cameraState.rotationX || 0;

            // Define cube vertices in 3D space
            const size = 20;
            const cubeVertices = [
                { x: -size, y: -size, z: -size },
                { x: size, y: -size, z: -size },
                { x: size, y: size, z: -size },
                { x: -size, y: size, z: -size },
                { x: -size, y: -size, z: size },
                { x: size, y: -size, z: size },
                { x: size, y: size, z: size },
                { x: -size, y: size, z: size }
            ];

            // Simple camera for the cube
            const cubeCamera = {
                x: 0,
                y: 0,
                z: -100,
                rotationX: rotX,
                rotationY: rotY,
                rotationZ: 0,
                fov: 200
            };

            const cubeProjection = {
                width: w,
                height: h,
                near: 10,
                far: 500
            };

            // Project vertices
            const projected = cubeVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, cubeCamera, cubeProjection)
            );

            // Draw cube edges
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0], // Front face
                [4, 5], [5, 6], [6, 7], [7, 4], // Back face
                [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
            ];

            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 2;

            edges.forEach(([i, j]) => {
                const p1 = projected[i];
                const p2 = projected[j];

                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // Draw rotation value inside the cube (center of PiP)
            const rotDegrees = Math.round((rotY * 180 / Math.PI) % 360);

            // Draw background box for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(w / 2 - 30, h / 2 - 15, 60, 30);

            // Draw border
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 2;
            ctx.strokeRect(w / 2 - 30, h / 2 - 15, 60, 30);

            // Draw rotation value as whole number
            ctx.fillStyle = '#FF00FF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${rotDegrees}°`, w / 2, h / 2);

            ctx.restore();
        },
        drawConnections(ctx) {
            if (!this.connections3D || this.connections3D.length === 0 || !window.GreenhouseModels3DMath || !window.GreenhouseGeneticLighting) {
                return;
            }

            ctx.save();

            const lightDirection = window.GreenhouseGeneticLighting.getDirectionalLight();

            // Sort connections by the average depth of their endpoints.
            // This is an approximation for correct transparency, but much better than nothing.
            const sortedConnections = this.connections3D
                .map(conn => {
                    const avgZ = (conn.from.z + conn.to.z) / 2;
                    return { ...conn, avgZ };
                })
                .sort((a, b) => b.avgZ - a.avgZ);

            sortedConnections.forEach(conn => {
                // Skip drawing connections to or from the 'gene' type display
                if (conn.from.type === 'gene' || conn.to.type === 'gene') return;
                const mesh = conn.mesh;

                // Determine base color from weight
                const weight = conn.weight;
                const positiveColor = [0, 242, 255]; // Electric Cyan
                const negativeColor = [255, 48, 48]; // Pulse Red
                const baseColor = weight > 0 ? positiveColor : negativeColor;

                // Nerve Aesthetics: High transparency, glowing highlights
                const alpha = Math.min(0.4, Math.abs(weight) * 0.3);

                const projectedVertices = mesh.vertices.map(v =>
                    GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, this.camera, this.projection)
                );

                // Nerve Pulse Animation logic
                const pulseT = (Date.now() * 0.001 + (conn.from.id % 10) * 0.1) % 1.0;

                mesh.faces.forEach((faceIndices, fIdx) => {
                    const p1 = projectedVertices[faceIndices[0]];
                    const p2 = projectedVertices[faceIndices[1]];
                    const p3 = projectedVertices[faceIndices[2]];

                    const isVisible = p1.scale > 0 && p2.scale > 0 && p3.scale > 0;
                    const isFrontFacing = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) < 0;

                    if (isVisible && isFrontFacing) {
                        const v1 = mesh.vertices[faceIndices[0]];
                        const v2 = mesh.vertices[faceIndices[1]];
                        const v3 = mesh.vertices[faceIndices[2]];

                        const normal = GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                        const brightness = GreenhouseModels3DMath.calculateDiffuse(normal, lightDirection, 0.3);

                        // Pulse effect: certain longitudinal rings light up
                        const segmentIndex = Math.floor(fIdx / (16)); // Assuming 8 segments * 2 faces
                        const isPulse = Math.abs(segmentIndex / 10 - pulseT) < 0.1;

                        const r = Math.floor(baseColor[0] * brightness);
                        const g = Math.floor(baseColor[1] * brightness);
                        const b = Math.floor(baseColor[2] * brightness);

                        ctx.fillStyle = isPulse ? `rgba(255, 255, 255, ${alpha * 2})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
                        ctx.strokeStyle = ctx.fillStyle;
                        ctx.lineWidth = 0.2;

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.lineTo(p3.x, p3.y);
                        ctx.closePath();
                        ctx.fill();
                    }
                });
            });

            ctx.restore();
        },


    };

    window.GreenhouseGeneticUI3D = GreenhouseGeneticUI3D;
})();
