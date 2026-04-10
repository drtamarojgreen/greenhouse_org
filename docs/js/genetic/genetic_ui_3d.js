// docs/js/genetic/genetic_ui_3d.js
// Enhanced 3D Visualization for Genetic Algorithm

(function () {
    'use strict';

    const GENE_SYMBOLS = ["BDNF", "SLC6A4", "DRD2", "HTR2A", "COMT", "DISC1", "NRG1", "DAOA", "GRIN2A", "GRIK2", "HOMER1", "NTRK2", "SHANK3", "OXTR", "MAOA", "CHRNA7", "GABRA1", "SYP", "MBP", "APOE", "TREM2", "CACNA1C", "FOXP2"];

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseGeneticUI3D = {
        container: null,
        canvas: null,
        ctx: null,
        algo: null,

        cameras: [
            { x: 0, y: -100, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 },
            { x: 0, y: 0, z: -200, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -100, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 400 },
            { x: 0, y: 0, z: -300, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 }
        ],
        projection: { width: 800, height: 600, near: 10, far: 2000 },

        isActive: false,
        rotationSpeed: 0.001,
        neurons3D: [],
        connections3D: [],
        brainShell: null,
        activeGeneIndex: 0,
        mainCameraController: null,

        init(container, algo, selector = null) {
            if (algo && typeof algo !== 'string') this.algo = algo;
            this.container = container;
            this.camera = this.cameras[0];

            if (window.GreenhouseGeneticPiPControls) window.GreenhouseGeneticPiPControls.init(window.GreenhouseGeneticConfig, this.cameras);
            if (window.GreenhouseGeneticCameraController) this.mainCameraController = new window.GreenhouseGeneticCameraController(this.camera, window.GreenhouseGeneticConfig);

            this.setupDOM();
            this.resize();
            this.setupInteraction();

            window.addEventListener('resize', () => requestAnimationFrame(() => this.resize()));
            window.addEventListener('greenhouseLanguageChanged', () => this.refreshUIText());

            this.startAnimation();
            this.updateData();
        },

        setupDOM() {
            const controls = document.createElement('div');
            controls.className = 'greenhouse-controls-panel';
            controls.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                    <button id="gen-pause-btn" class="greenhouse-btn greenhouse-btn-primary">${t('Pause Evolution')}</button>
                    <div id="gen-label-container" style="margin-left: auto; font-weight: bold; color: #2c3e50;">
                        ${t('gen')}: <span id="gen-counter">0</span> | ${t('fitness')}: <span id="fitness-display">0.00</span>
                    </div>
                </div>
            `;
            this.container.appendChild(controls);

            const btn = controls.querySelector('#gen-pause-btn');
            btn.addEventListener('click', () => {
                this.isEvolving = !this.isEvolving;
                btn.textContent = this.isEvolving ? t("Pause Evolution") : t("Resume Evolution");
            });

            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '500px';
            this.canvas.style.background = '#050510';
            this.canvas.style.borderRadius = '12px';
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            // Initialize Post-Processor
            if (window.GreenhousePostProcessor) {
                window.GreenhousePostProcessor.init(this.canvas);
            }

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
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:500px;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.6);z-index:10;border-radius:12px;';
            const btn = document.createElement('button');
            btn.textContent = t('Start Simulation');
            btn.style.cssText = 'padding:15px 30px;font-size:18px;cursor:pointer;background:#E0E0E0;border:none;border-radius:5px;font-weight:bold;';
            btn.onclick = () => { this.isEvolving = true; overlay.style.display = 'none'; if (window.GreenhouseGenetic) window.GreenhouseGenetic.startSimulation(); };
            overlay.appendChild(btn);
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
                if (window.GreenhouseGeneticPiPControls?.handleMouseDown(e, this.canvas)) return;
                this.mainCameraController?.handleMouseDown(e);
            });
            window.addEventListener('mouseup', () => {
                window.GreenhouseGeneticPiPControls?.handleMouseUp();
                this.mainCameraController?.handleMouseUp();
            });
            window.addEventListener('mousemove', e => {
                if (window.GreenhouseGeneticPiPControls?.handleMouseMove(e)) return;
                this.mainCameraController?.handleMouseMove(e);
            });
            this.canvas.addEventListener('wheel', e => {
                if (window.GreenhouseGeneticPiPControls?.handleWheel(e, this.canvas)) return;
                e.preventDefault();
                this.mainCameraController?.handleWheel(e);
            }, { passive: false });
        },

        updateData() {
            if (!this.algo?.bestNetwork) return;
            const net = this.algo.bestNetwork;
            if (!this.brainShell) {
                this.brainShell = { vertices: [], faces: [] };
                window.GreenhouseGeneticGeometry?.initializeBrainShell(this.brainShell);
            }
            this.neurons3D = net.nodes.map((node, i) => {
                const isGenotype = i < net.nodes.length / 2;
                if (isGenotype) {
                    const helixData = window.GreenhouseGeneticGeometry?.generateHelixPoints(i, net.nodes.length, -400);
                    return { ...node, x: helixData.x, y: helixData.y, z: helixData.z, type: 'gene', strand: helixData.strandIndex, label: GENE_SYMBOLS[i % GENE_SYMBOLS.length], baseColor: '#E0E0E0' };
                } else {
                    const regionKeys = ['pfc', 'amygdala', 'hippocampus', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'cerebellum', 'brainstem'];
                    const regionKey = regionKeys[i % regionKeys.length];
                    const vertices = window.GreenhouseGeneticGeometry?.getRegionVertices(this.brainShell, regionKey) || [];
                    const v = this.brainShell.vertices[vertices[i % vertices.length]] || { x: 0, y: 0, z: 0 };
                    return { ...node, x: v.x * 0.8, y: v.y * 0.8, z: v.z * 0.8, type: 'neuron', region: regionKey, baseColor: '#E0E0E0' };
                }
            });
        },

        startAnimation() {
            const animate = () => {
                this.mainCameraController?.update();
                window.GreenhouseGeneticPiPControls?.update();
                this.render();
                requestAnimationFrame(animate);
            };
            animate();
        },

        render() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const config = window.GreenhouseGeneticConfig;
            const post = window.GreenhousePostProcessor;

            // 1. Prepare Frame (e.g. TAA Jitter)
            let jitter = { x: 0, y: 0 };
            if (post && config) {
                jitter = post.prepareFrame(config.get('effects'));
            }

            // 2. Draw Background
            if (post && config) {
                post.drawBackground(config.get('ui.background'), config.get('ui'));
            } else {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

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
            this.drawSynapticCues(ctx);

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
                ctx.fillStyle = '#D0D0D0';
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

            const geneLabel = (activeGene && activeGene.label) ? ` (${t(activeGene.label)})` : "";

            // 2. PiP 1: DNA Double Helix - Top Left
            this.drawDNAHelixPiP(ctx, leftPipX, gap, pipW, pipH, helixState, (ctx, x, y, w, h) => drawPiPFrame(ctx, x, y, w, h, t('pip_dna') + geneLabel));
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.drawControls(ctx, leftPipX, gap, pipW, pipH, 'helix');
            }

            // 3. PiP 2: Micro View (Gene Structure) - Top Right
            this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene,
                this.activeGeneIndex, this.neuronMeshes, (ctx, x, y, w, h) => drawPiPFrame(ctx, x, y, w, h, t('pip_micro') + geneLabel), microState);
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, gap, pipW, pipH, 'micro');
            }

            // 4. PiP 3: Protein View - Middle Right
            const proteinY = gap + pipH + gap;
            this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene,
                this.proteinCache, (ctx, x, y, w, h) => drawPiPFrame(ctx, x, y, w, h, t('pip_protein') + geneLabel), proteinState);
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, proteinY, pipW, pipH, 'protein');
            }

            // 5. PiP 4: Target View (Brain Region) - Bottom Right
            const targetY = gap + pipH + gap + pipH + gap;
            this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene,
                this.activeGeneIndex, this.brainShell, (ctx, x, y, w, h) => drawPiPFrame(ctx, x, y, w, h, t('pip_target') + geneLabel), { ...targetState, activeGene: activeGene });
            if (window.GreenhouseGeneticPiPControls) {
                window.GreenhouseGeneticPiPControls.drawControls(ctx, rightPipX, targetY, pipW, pipH, 'target');
            }

            // Draw Stats / Labels
            if (window.GreenhouseGeneticStats) {
                window.GreenhouseGeneticStats.drawOverlayInfo(ctx, w, activeGene);
            }

            // --- Apply Advanced Post-Processing ---
            if (post && config) {
                post.applyEffects(config.get('effects'), this.camera);
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

            // Navigation only cycles through 'gene' types (first half of neurons3D)
            const geneCount = this.neurons3D.filter(n => n.type === 'gene').length;
            if (geneCount === 0) return;

            // Previous Button
            const prevX = w / 2 - btnW - btnGap / 2;
            const prevY = h - 50;
            if (mouseX >= prevX && mouseX <= prevX + btnW && mouseY >= prevY && mouseY <= prevY + btnH) {
                this.activeGeneIndex = (this.activeGeneIndex - 1 + geneCount) % geneCount;
                this.autoFollow = true;
                return;
            }

            // Next Button
            const nextX = w / 2 + btnGap / 2;
            const nextY = h - 50;
            if (mouseX >= nextX && mouseX <= nextX + btnW && mouseY >= nextY && mouseY <= nextY + btnH) {
                this.activeGeneIndex = (this.activeGeneIndex + 1) % geneCount;
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

        drawSynapticCues(ctx) {
            if (!this.neurons3D) return;
            const neurons = this.neurons3D.filter(n => n.type === 'neuron');

            neurons.forEach(n => {
                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                if (p.scale > 0.4) {
                    // Draw "Synaptic Spark" to represent activity at junctions
                    const activation = n.activation ?? 0;
                    if (activation > 0.5) {
                        const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
                        ctx.save();
                        ctx.globalAlpha = (activation - 0.5) * 2 * pulse * GreenhouseModels3DMath.applyDepthFog(1, p.depth);
                        ctx.fillStyle = '#FFF';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 4 * p.scale, 0, Math.PI * 2);
                        ctx.fill();

                        // Halo
                        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10 * p.scale);
                        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }
            });
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
                drawPiPFrame(ctx, x, y, w, h, t("pip_dna"));
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
                ctx.fillStyle = '#E0E0E0';
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

                // Draw label for the active gene
                const currentActiveGene = this.neurons3D[this.activeGeneIndex];
                if (currentActiveGene && currentActiveGene.type === 'gene' && currentActiveGene.label) {
                    ctx.fillStyle = '#E0E0E0';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(t(currentActiveGene.label), w / 2, h - 20);
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

                    // Draw with gradient and geometric coding
                    const drawSegment = (x1, y1, x2, y2, color, type, isStart) => {
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

                        // Geometric Coding at junction
                        if (!isStart) {
                            ctx.fillStyle = color;
                            ctx.save();
                            ctx.translate(x1, y1);
                            const size = thickness * 0.8;
                            if (type === 0) { // Adenine (Box)
                                ctx.fillRect(-size/2, -size/2, size, size);
                            } else if (type === 1) { // Thymine (Triangle Up)
                                ctx.beginPath();
                                ctx.moveTo(0, -size/2); ctx.lineTo(size/2, size/2); ctx.lineTo(-size/2, size/2);
                                ctx.fill();
                            } else if (type === 2) { // Cytosine (Diamond)
                                ctx.beginPath();
                                ctx.moveTo(0, -size/2); ctx.lineTo(size/2, 0); ctx.lineTo(0, size/2); ctx.lineTo(-size/2, 0);
                                ctx.closePath(); ctx.fill();
                            } else { // Guanine (Hexagon)
                                ctx.beginPath();
                                for(let k=0; k<6; k++) {
                                    const ang = k * Math.PI / 3;
                                    ctx.lineTo(size/2 * Math.cos(ang), size/2 * Math.sin(ang));
                                }
                                ctx.closePath(); ctx.fill();
                            }
                            ctx.restore();
                        }
                    };

                    drawSegment(p1.x, p1.y, midX, midY, color1, type, true);
                    drawSegment(midX, midY, p2.x, p2.y, color2, type, false);
                }
            }

            // Draw backbone (two strands)
            for (let s = 0; s < 2; s++) {
                const strandNodes = dnaGenes.filter(n => n.strand === s);
                if (strandNodes.length < 2) continue;

                const strandColor = config ?
                    (s === 0 ? config.get('materials.dna.strand1Color') : config.get('materials.dna.strand2Color')) :
                    (s === 0 ? '#E0E0E0' : '#D0D0D0');

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

            ctx.strokeStyle = '#A0AEC0';
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
            ctx.strokeStyle = '#A0AEC0';
            ctx.lineWidth = 2;
            ctx.strokeRect(w / 2 - 30, h / 2 - 15, 60, 30);

            // Draw rotation value as whole number
            ctx.fillStyle = '#A0AEC0';
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

                // Determine base color from weight (Monochromatic)
                const weight = conn.weight;
                const positiveColor = [224, 224, 224]; // Silver
                const negativeColor = [160, 174, 192]; // Muted Gray
                const baseColor = weight > 0 ? positiveColor : negativeColor;

                // Nerve Aesthetics: High transparency, glowing highlights
                const alpha = Math.min(0.4, Math.abs(weight) * 0.3);

                const projectedVertices = mesh.vertices.map(v =>
                    GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, this.camera, this.projection)
                );

                // Nerve Pulse Animation logic - Slower and more organic (0.0005 instead of 0.001)
                const pulseT = (Date.now() * 0.0005 + (conn.from.id % 10) * 0.1) % 1.0;

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

                        // Pulse alpha reduced for subtler look
                        ctx.fillStyle = isPulse ? `rgba(255, 255, 255, ${alpha * 1.5})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
