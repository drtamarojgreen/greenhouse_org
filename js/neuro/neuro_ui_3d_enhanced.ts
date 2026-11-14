/**
 * @file neuro_ui_3d_enhanced.ts
 * @description Enhanced 3D Visualization for Neuro GA with Modular Configuration for Neuro simulation.
 */

/// <reference path="../types/globals.d.ts" />

export interface ADHDEffects {
    noiseParticles: any[];
    jitterAmount: number;
    fatigueLevel: number;
    fovMultiplier: number;
}

export const GreenhouseNeuroUI3D = {
    canvas: null as any as HTMLCanvasElement,
    ctx: null as any as CanvasRenderingContext2D,
    camera: null as any as Greenhouse.Camera,
    projection: null as any as Greenhouse.Projection,
    config: null as any,
    cameraControls: null as any,
    lighting: null as any,
    isActive: false,
    neurons: [] as any[],
    connections: [] as any[],
    particles: [] as any[],
    brainShell: null as any,
    neuronMeshes: {} as Record<string, any>,
    newConnections: [] as any[],
    hoveredElement: null as any,
    selectedConnection: null as any,
    viewMode: 'synapse',
    pipProgress: 0,
    synapseParticles: [] as any[],
    fluidGrid: [] as any[],
    fluidCols: 20,
    fluidRows: 10,
    synapseMeshes: null as any,
    animationId: null as number | null,
    isPlaying: false,
    tooltipEl: null as any as HTMLElement,
    adhdEffects: {
        noiseParticles: [],
        jitterAmount: 0,
        fatigueLevel: 0,
        fovMultiplier: 1.0
    } as ADHDEffects,
    autoRotate: false,

    init(containerSelector: string | HTMLElement) {
        const container = (typeof containerSelector === 'string') ? document.querySelector(containerSelector) : containerSelector;
        if (!container) {
            console.error('NeuroUI3D: Container not found', containerSelector);
            return;
        }

        // Initialize configuration
        this.config = (window as any).GreenhouseNeuroConfig;
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
            rotationZ: cameraConfig.rotationZ || 0,
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
        this.canvas.width = (container as HTMLElement).offsetWidth || 800;
        this.canvas.height = 600;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '600px';
        this.canvas.style.backgroundColor = '#111';

        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d')!;

        // Initialize Tooltip Element
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.style.cssText = `
            position: absolute;
            display: none;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px;
            border: 1px solid #A0AEC0;
            border-radius: 4px;
            pointer-events: none;
            font-family: 'Quicksand', sans-serif;
            font-size: 12px;
            z-index: 1000;
            max-width: 250px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        `;
        container.appendChild(this.tooltipEl);

        this.projection.width = this.canvas.width;
        this.projection.height = this.canvas.height;

        // Initialize camera controls
        if ((window as any).GreenhouseNeuroCameraControls) {
            this.cameraControls = Object.create((window as any).GreenhouseNeuroCameraControls);
            this.cameraControls.init(this.canvas, this.camera, this.config);
            console.log('NeuroUI3D: Camera controls initialized');
        }

        // Initialize lighting system
        if ((window as any).GreenhouseNeuroLighting) {
            this.lighting = Object.create((window as any).GreenhouseNeuroLighting);
            this.lighting.init(this.config);
            console.log('NeuroUI3D: Lighting system initialized');
        }

        // Setup mouse event handlers for synapse camera
        this.setupSynapseMouseHandlers();

        // Tooltip Move Handler
        this.canvas.addEventListener('mousemove', (e) => this.handleTooltipMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            if (this.tooltipEl) this.tooltipEl.style.display = 'none';
        });

        // Handle Resize
        window.addEventListener('resize', () => {
            requestAnimationFrame(() => this.resize());
        });

        if ((window as any).ResizeObserver) {
            const ro = new (window as any).ResizeObserver(() => {
                requestAnimationFrame(() => this.resize());
            });
            ro.observe(container);
        }

        // Start Animation Loop
        this.startAnimation();

        // Initialize Synapse Meshes
        this.synapseMeshes = this.generateSynapseMeshes();
    },

    resize() {
        if (this.canvas && this.canvas.parentElement) {
            const container = this.canvas.parentElement;
            this.canvas.width = container.offsetWidth;
            this.projection.width = this.canvas.width;
        }
    },

    addControlPanel(container: HTMLElement) {
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
                <button id="neuro-reset-camera" style="padding: 5px 10px; cursor: pointer; background: #A0AEC0; color: white; border: none; border-radius: 4px; margin-right: 5px;">Reset Camera</button>
                <button id="neuro-toggle-autorotate" style="padding: 5px 10px; cursor: pointer; background: #E0E0E0; color: white; border: none; border-radius: 4px;">Auto-Rotate: ON</button>
            </div>
        `;

        container.appendChild(panel);

        // Add event listeners
        document.getElementById('neuro-reset-camera')!.addEventListener('click', () => {
            if (this.cameraControls) {
                this.cameraControls.resetCamera();
            }
        });

        const autoRotateBtn = document.getElementById('neuro-toggle-autorotate')!;
        autoRotateBtn.addEventListener('click', () => {
            if (this.cameraControls) {
                this.cameraControls.toggleAutoRotate();
                const isOn = this.config.get('camera.controls.autoRotate');
                autoRotateBtn.textContent = `Auto-Rotate: ${isOn ? 'ON' : 'OFF'}`;
                autoRotateBtn.style.background = isOn ? '#E0E0E0' : '#A0AEC0';
            }
        });
    },

    addExplanation(container: HTMLElement) {
        const util = (window as any).GreenhouseModelsUtil;
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

    addStartOverlay(container: HTMLElement) {
        const util = (window as any).GreenhouseModelsUtil;
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
        btn.style.background = '#E0E0E0';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';

        btn.onclick = () => {
            this.isPlaying = true;
            overlay.style.display = 'none';
            if ((window as any).GreenhouseNeuroApp) (window as any).GreenhouseNeuroApp.startSimulation();
        };

        overlay.appendChild(btn);
        container.style.position = 'relative';
        container.appendChild(overlay);
    },

    updateData(genome: any) {
        if (!this.brainShell) {
            this.initializeBrainShell();
        }

        const existingMap = new Map();
        for (let i = 0; i < this.neurons.length; i++) {
            existingMap.set(this.neurons[i].id, this.neurons[i]);
        }

        this.neurons = genome.neurons.map((n: any, i: number) => {
            const existingNeuron = existingMap.get(n.id);
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

            const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem', 'motorCortex'];
            const regionKey = regionKeys[i % regionKeys.length];
            const regionVerticesIndices = this.getRegionVertices(regionKey === 'motorCortex' ? 'parietalLobe' : regionKey);
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

    initializeConnections(connections: any[]) {
        const oldConnectionIds = new Set(this.connections.map(c => c.id));
        const neuronMap = new Map();
        for (let i = 0; i < this.neurons.length; i++) {
            neuronMap.set(this.neurons[i].id, this.neurons[i]);
        }

        this.connections = connections.map(conn => {
            const fromNeuron = neuronMap.get(conn.from);
            const toNeuron = neuronMap.get(conn.to);

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

    generateTubeMesh(p1: Greenhouse.Point3D, p2: Greenhouse.Point3D, cp: Greenhouse.Point3D, radius: number, segments: number) {
        if ((window as any).GreenhouseNeuroGeometry) {
            return (window as any).GreenhouseNeuroGeometry.generateTubeMesh(p1, p2, cp, radius, segments);
        }
        return { vertices: [], faces: [] };
    },

    logEvent(messageKey: string) {
        if ((window as any).GreenhouseNeuroStats) {
            (window as any).GreenhouseNeuroStats.logEvent(messageKey);
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

        const ga = (window as any).GreenhouseNeuroApp?.ga;
        const adhd = ga?.adhdConfig;

        // ADHD: Time Perception Distortion (Enhancement 12)
        if (adhd?.activeEnhancements?.has(12)) {
            if (Math.random() < 0.05) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        // ADHD: Sustained Attention Decay (Enhancement 7)
        if (adhd?.activeEnhancements?.has(7)) {
            ctx.globalAlpha = Math.max(0.3, adhd.sustainedAttention);
        }

        // ADHD: Attentional Blink (Enhancement 1)
        if (adhd?.activeEnhancements?.has(1) && adhd.blinkCooldown > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Skip further rendering to simulate perception "blink"
            if (adhd.blinkCooldown > 2) return;
        }

        // ADHD: Global Jitter (Enhancement 14/40)
        let shakeX = 0, shakeY = 0;
        const jitterFactor = adhd?.activeEnhancements?.has(40) ? 0.2 : 1.0;

        if (adhd?.activeEnhancements?.has(14)) {
            shakeX = (Math.random() - 0.5) * 5 * jitterFactor;
            shakeY = (Math.random() - 0.5) * 5 * jitterFactor;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        // ADHD: Task-Switching Latency (Enhancement 6)
        if (adhd?.activeEnhancements?.has(6) && adhd.taskSwitchingLatency > 0) {
            ctx.filter = 'blur(4px)';
        }

        // ADHD: Hyperfocus Tunneling (Enhancement 20)
        if (adhd?.activeEnhancements?.has(20)) {
            const grad = ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, 100, this.canvas.width / 2, this.canvas.height / 2, 400);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // ADHD: Signal-to-Noise Ratio (Enhancement 2)
        if (adhd?.activeEnhancements?.has(2)) {
            this.drawNoiseParticles(ctx);
        }

        // ADHD: Treatment - Therapeutic Alliance Glow (Enhancement 49)
        if (adhd?.activeEnhancements?.has(49)) {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'gold';
        }

        // ADHD: Pathology - Neuroinflammation (Enhancement 65)
        if (adhd?.activeEnhancements?.has(65)) {
            ctx.fillStyle = 'rgba(100, 50, 0, 0.4)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Main View (Synapse)
        if (this.selectedConnection) {
            if ((window as any).GreenhouseNeuroSynapse) {
                (window as any).GreenhouseNeuroSynapse.drawSynapsePiP(ctx, 0, 0, this.canvas.width, this.canvas.height, this.selectedConnection, this.synapseMeshes, true);
            }
        } else {
            const t = (k: string) => (window as any).GreenhouseModelsUtil ? (window as any).GreenhouseModelsUtil.t(k) : k;
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.font = '16px Quicksand, sans-serif';
            ctx.fillText(t('selecting_synapse'), this.canvas.width / 2, this.canvas.height / 2);
        }

        // Draw PiP View (Whole Brain Network)
        const pipConfig = this.config.get('pip');
        const pipW = pipConfig.width;
        const pipH = pipConfig.height;
        const padding = pipConfig.padding;
        const pipX = this.canvas.width - pipW - padding;
        const pipY = this.canvas.height - pipH - padding;

        this.drawNetworkView(ctx, pipX, pipY, pipW, pipH);

        // ADHD: Executive Function Gating Visuals (Enhancement 10)
        if (adhd?.activeEnhancements?.has(10)) {
            this.drawGatingVisuals(ctx, pipX, pipY, pipW, pipH);
        }

        // ADHD: Emotional Lability Spikes (Enhancement 11)
        if (adhd?.activeEnhancements?.has(11) && Math.random() < 0.1) {
            this.drawAmygdalaSpike(ctx, pipX, pipY, pipW, pipH);
        }

        // ADHD: Response Variability Graph (Enhancement 17)
        if (adhd?.activeEnhancements?.has(17)) {
            this.drawResponseVariabilityGraph(ctx, 20, 20, 150, 60, ga);
        }

        // ADHD: Distractibility Index (Enhancement 15)
        if (adhd?.activeEnhancements?.has(15)) {
            this.drawDistractibilityIndex(ctx, 20, 90, ga);
        }

        // ADHD: Hereditability Tree (Enhancement 92)
        if (adhd?.activeEnhancements?.has(92)) {
            this.drawHereditabilityTree(ctx, 20, 230, ga);
        }

        // ADHD: Executive Assistant UI (Enhancement 42)
        if (adhd?.activeEnhancements?.has(42)) {
            this.drawExecutiveAssistant(ctx, ga);
        }

        // ADHD: Impulse Inhibition Meter (Enhancement 25)
        if (adhd?.activeEnhancements?.has(25)) {
            this.drawImpulseInhibitionMeter(ctx, 20, 130, ga);
        }

        // ADHD: Glutamate/GABA Imbalance Meter (Enhancement 62)
        if (adhd?.activeEnhancements?.has(62)) {
            this.drawGlutamateGabaMeter(ctx, 20, 180, ga);
        }

        if (adhd?.activeEnhancements?.has(49)) {
            ctx.restore();
        }

        if (adhd?.activeEnhancements?.has(14)) {
            ctx.restore();
        }

        ctx.filter = 'none'; // Reset filter

        // --- Draw UI Overlay (High Quality Canvas UI) ---
        if ((window as any).GreenhouseNeuroApp && (window as any).GreenhouseNeuroApp.drawUI) {
            (window as any).GreenhouseNeuroApp.drawUI(ctx, this.canvas.width, this.canvas.height);
        }
    },

    drawTargets(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const ga = (window as any).GreenhouseNeuroApp?.ga;
        if (!ga || !ga.targetPoints) return;

        ga.targetPoints.forEach((target: Greenhouse.Point3D, i: number) => {
            const proj = (window as any).GreenhouseModels3DMath.project3DTo2D(target.x, target.y, target.z, this.camera, { width: w, height: h, near: 10, far: 1000 });
            if (proj.scale > 0) {
                const age = ga.adhdConfig.targetAges[i] || 0;

                // ADHD: Reward Delay Discounting (Enhancement 5)
                // Targets fade from green to red as they age
                let r = 0, g = 255, b = 0;
                if (ga.adhdConfig.activeEnhancements.has(5)) {
                    const factor = Math.min(1, age / 100);
                    r = Math.floor(255 * factor);
                    g = Math.floor(255 * (1 - factor));
                }

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 4 * proj.scale, 0, Math.PI * 2);
                ctx.fill();

                // Glow for salience
                ctx.save();
                ctx.shadowBlur = 10 * proj.scale;
                ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
                ctx.stroke();
                ctx.restore();
            }
        });
    },

    drawAmygdalaSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        const amygCenter = { x: -30, y: 150, z: 50 }; // Approximate Amygdala world coords
        const proj = (window as any).GreenhouseModels3DMath.project3DTo2D(amygCenter.x, amygCenter.y, amygCenter.z, this.camera, { width: w, height: h, near: 10, far: 1000 });

        if (proj.scale > 0) {
            ctx.save();
            ctx.translate(x + proj.x, y + proj.y);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 * proj.scale);
            grad.addColorStop(0, 'rgba(224, 224, 224, 0.8)');
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 50 * proj.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    drawResponseVariabilityGraph(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ga: any) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#A0AEC0';
        ctx.strokeRect(0, 0, w, h);

        ctx.beginPath();
        ctx.moveTo(0, h/2);
        for(let i=0; i<w; i++) {
            const val = Math.sin(i * 0.1 + Date.now() * 0.01) * 10 * (ga?.adhdConfig?.snr || 1);
            ctx.lineTo(i, h/2 + val);
        }
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("Fitness Variance", 5, 12);
        ctx.restore();
    },

    drawDistractibilityIndex(ctx: CanvasRenderingContext2D, x: number, y: number, ga: any) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 150, 25);
        ctx.strokeStyle = '#ff9800';
        ctx.strokeRect(0, 0, 150, 25);

        const index = Math.floor((ga?.adhdConfig?.snr || 0) * 100);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Distractibility: ${index}%`, 10, 17);
        ctx.restore();
    },

    drawExecutiveAssistant(ctx: CanvasRenderingContext2D, ga: any) {
        const target = ga?.targetPoints[0];
        if (!target) return;
        const proj = (window as any).GreenhouseModels3DMath.project3DTo2D(target.x, target.y, target.z, this.camera, this.projection);
        if (proj.scale > 0) {
            ctx.save();
            ctx.strokeStyle = '#E0E0E0';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 20 * proj.scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#E0E0E0';
            ctx.font = '10px Arial';
            ctx.fillText("TARGET FOCUS", proj.x + 25, proj.y);
            ctx.restore();
        }
    },

    drawHereditabilityTree(ctx: CanvasRenderingContext2D, x: number, y: number, ga: any) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 150, 60);
        ctx.strokeStyle = '#A0AEC0';
        ctx.strokeRect(0, 0, 150, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("Hereditability Tree", 5, 12);

        // Draw a simple branch
        ctx.strokeStyle = '#A0AEC0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(75, 55); ctx.lineTo(75, 35);
        ctx.lineTo(50, 20); ctx.moveTo(75, 35); ctx.lineTo(100, 20);
        ctx.stroke();

        ctx.fillStyle = '#A0AEC0';
        ctx.beginPath(); ctx.arc(75, 55, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(50, 20, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(100, 20, 3, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    drawGlutamateGabaMeter(ctx: CanvasRenderingContext2D, x: number, y: number, ga: any) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 150, 40);
        ctx.strokeStyle = '#8bc34a';
        ctx.strokeRect(0, 0, 150, 40);

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("Glutamate / GABA", 5, 12);

        const ratio = ga?.adhdConfig?.glutamateGabaRatio || 1.0;
        const displayRatio = Math.min(1.0, ratio / 2.0); // Scaled for display

        ctx.fillStyle = '#444';
        ctx.fillRect(10, 20, 130, 10);
        ctx.fillStyle = '#8bc34a';
        ctx.fillRect(10, 20, 130 * displayRatio, 10);
        ctx.restore();
    },

    drawImpulseInhibitionMeter(ctx: CanvasRenderingContext2D, x: number, y: number, ga: any) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 150, 40);
        ctx.strokeStyle = '#D0D0D0';
        ctx.strokeRect(0, 0, 150, 40);

        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("Impulse Inhibition", 5, 12);

        // Ratio of gold to silver connections in the network
        const connections = ga?.population[0]?.connections || [];
        const excitatory = connections.filter((c: any) => c.weight > 0).length;
        const inhibitory = connections.filter((c: any) => c.weight < 0).length;
        const total = (excitatory + inhibitory) || 1;
        const ratio = inhibitory / total;

        ctx.fillStyle = '#444';
        ctx.fillRect(10, 20, 130, 10);
        ctx.fillStyle = '#D0D0D0';
        ctx.fillRect(10, 20, 130 * ratio, 10);
        ctx.restore();
    },

    drawGatingVisuals(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        // Draw a "gate" over the PFC region in the network view
        const pfcCenter = { x: 50, y: 100, z: 200 }; // Approximate PFC world coords
        const proj = (window as any).GreenhouseModels3DMath.project3DTo2D(pfcCenter.x, pfcCenter.y, pfcCenter.z, this.camera, { width: w, height: h, near: 10, far: 1000 });

        if (proj.scale > 0) {
            ctx.save();
            ctx.translate(x + proj.x, y + proj.y);
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-20, -10); ctx.lineTo(20, -10);
            ctx.moveTo(-20, 10); ctx.lineTo(20, 10);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 51, 51, 0.3)';
            ctx.fillRect(-20, -10, 40, 20);
            ctx.restore();
        }
    },

    drawNoiseParticles(ctx: CanvasRenderingContext2D) {
        const ga = (window as any).GreenhouseNeuroApp?.ga;
        const adhd = ga?.adhdConfig;

        // ADHD: Digital Detox Mode (Enhancement 39)
        if (adhd?.activeEnhancements.has(39)) return;

        // ADHD: Interference Sensitivity (Enhancement 8)
        const count = adhd?.activeEnhancements.has(8) ? 150 : 50;

        if (this.adhdEffects.noiseParticles.length < count) {
            for (let i = 0; i < count; i++) {
                this.adhdEffects.noiseParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    alpha: Math.random() * 0.5
                });
            }
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.adhdEffects.noiseParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawNetworkView(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
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

        const t = (k: string) => (window as any).GreenhouseModelsUtil ? (window as any).GreenhouseModelsUtil.t(k) : k;
        ctx.fillStyle = pipConfig.borderColor;
        ctx.font = '800 10px Quicksand, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(t('whole_brain_title').toUpperCase(), 15, 15);

        this.drawGrid(ctx);
        this.drawTargets(ctx, w, h);

        if (!(window as any).GreenhouseModels3DMath) {
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
            const p = (window as any).GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
            return { neuron: n, projected: p };
        }).filter(item => item.projected.scale > 0)
            .sort((a, b) => b.projected.depth - a.projected.depth);

        sortedNeurons.forEach(item => {
            this.drawNeuron(ctx, item.neuron, this.camera, this.projection);
        });

        if ((window as any).GreenhouseNeuroStats) {
            const labeledNeurons = sortedNeurons.map(item => ({
                ...item.neuron,
                x: item.projected.x,
                y: item.projected.y,
                region: item.neuron.region
            }));
            (window as any).GreenhouseNeuroStats.drawLabels(ctx, labeledNeurons);
        }

        ctx.restore();

        this.projection.width = origW;
        this.projection.height = origH;
    },

    initializeBrainShell() {
        this.brainShell = { vertices: [], faces: [] };
        if ((window as any).GreenhouseNeuroGeometry) {
            (window as any).GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);

            // ADHD: PFC Thinning (Enhancement 72)
            const ga = (window as any).GreenhouseNeuroApp?.ga;
            if (ga?.adhdConfig?.activeEnhancements.has(72)) {
                const pfcIndices = this.getRegionVertices('pfc');
                pfcIndices.forEach(idx => {
                    const v = this.brainShell.vertices[idx];
                    v.x *= 0.9; v.y *= 0.9; v.z *= 0.9; // Shrink PFC volume
                });
            }
        }
    },

    getRegionVertices(regionKey: string) {
        if ((window as any).GreenhouseNeuroGeometry) {
            return (window as any).GreenhouseNeuroGeometry.getRegionVertices(this.brainShell, regionKey);
        }
        return [];
    },

    drawBrainShell(ctx: CanvasRenderingContext2D, offset: number, w: number, h: number) {
        if ((window as any).GreenhouseNeuroBrain) {
            ctx.save();
            ctx.translate(offset || 0, 0);
            (window as any).GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w || this.canvas.width, h || this.canvas.height, null);
            ctx.restore();
        }
    },

    drawNeuron(ctx: CanvasRenderingContext2D, neuron: any, camera: Greenhouse.Camera, projection: Greenhouse.Projection) {
        if ((window as any).GreenhouseNeuroNeuron) {
            const ga = (window as any).GreenhouseNeuroApp?.ga;
            const adhd = ga?.adhdConfig;

            // ADHD: Hyperactive Firing Mode (Enhancement 3) / Binaural Beat Sync (Enhancement 38)
            // Pulse speed is handled inside drawNeuron if we pass a frequency
            let pulseFreq = adhd?.activeEnhancements?.has(3) ? 0.01 : 0.005;
            if (adhd?.activeEnhancements?.has(38)) {
                pulseFreq = 0.008 + Math.sin(Date.now() * 0.005) * 0.002;
            }

            // ADHD: Cognitive Fatigue Shader (Enhancement 19)
            let colorOverride = null;
            if (adhd?.activeEnhancements?.has(19)) {
                const fatigue = adhd?.fatigue || 0;
                if (fatigue > 0.5) {
                    colorOverride = '#333'; // Darken
                }
            }

            // ADHD: Hypofrontality (52) / Striatal Hyper-Reactivity (53)
            if (adhd?.activeEnhancements?.has(52) && neuron.region === 'pfc') {
                ctx.globalAlpha *= 0.4;
            }
            if (adhd?.activeEnhancements?.has(53) && (neuron.region === 'striatum' || neuron.region === 'brainstem')) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'yellow';
            }

            // ADHD: Vigilance Waxing/Waning (Enhancement 13)
            let alphaOverride = 1.0;
            if (adhd?.activeEnhancements?.has(13)) {
                alphaOverride = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.001));
            }

            // ADHD: Motor Restlessness Particles (Enhancement 14) / Side Effect Jitters (47)
            let jitter = 0;
            if (adhd?.activeEnhancements?.has(14) && neuron.region === 'motorCortex') jitter = 2;
            if (adhd?.activeEnhancements?.has(47)) jitter = 4;

            if (jitter > 0) {
                neuron.x += (Math.random() - 0.5) * jitter;
                neuron.y += (Math.random() - 0.5) * jitter;
            }

            const isHovered = this.hoveredElement && this.hoveredElement.type === 'neuron' && this.hoveredElement.data.id === neuron.id;

            ctx.save();
            ctx.globalAlpha *= alphaOverride;
            (window as any).GreenhouseNeuroNeuron.drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq, isHovered);
            ctx.restore();

            if (adhd?.activeEnhancements.has(53) && (neuron.region === 'striatum' || neuron.region === 'brainstem')) {
                ctx.restore();
            }
        }
    },

    drawConnections(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if ((window as any).GreenhouseNeuroSynapse) {
            const ga = (window as any).GreenhouseNeuroApp?.ga;
            const adhd = ga?.adhdConfig;

            // ADHD: Basal Ganglia Feedback Error (Enhancement 75)
            if (adhd?.activeEnhancements.has(75) && Math.random() < 0.02) {
                // Draw infinite loops (visual glitch on connections)
                ctx.save();
                ctx.strokeStyle = 'cyan';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(w/2, h/2, 50, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // ADHD: White Matter Integrity Loss (Enhancement 56)
            const whiteMatterLoss = ga?.adhdConfig?.activeEnhancements.has(56);
            const scale = whiteMatterLoss ? 0.5 : 1.0;

            ctx.save();
            ctx.scale(scale, scale);
            (window as any).GreenhouseNeuroSynapse.drawConnections(ctx, this.connections, this.neurons, this.camera, this.projection, w || this.canvas.width, h || this.canvas.height);
            ctx.restore();
        }
    },

    drawGrid(ctx: CanvasRenderingContext2D) {
        const util = (window as any).GreenhouseModelsUtil;
        if (!(window as any).GreenhouseModels3DMath) return;

        const ga = (window as any).GreenhouseNeuroApp?.ga;
        // ADHD: Environmental Scaffolding (Enhancement 45)
        const scaffolding = ga?.adhdConfig?.activeEnhancements.has(45);

        const size = 1000;
        const step = scaffolding ? 100 : 200;
        const y = 400;

        const gridOpacity = scaffolding ? 0.2 : (this.config.get('ui.gridOpacity') || 0.05);
        ctx.strokeStyle = scaffolding ? '#A0AEC0' : `rgba(255, 255, 255, ${gridOpacity})`;
        ctx.lineWidth = 1;
        ctx.fillStyle = this.config.get('ui.labelColor') || 'rgba(255, 255, 255, 0.3)';
        ctx.font = this.config.get('ui.labelFont') || '10px Arial';

        for (let x = -size; x <= size; x += step) {
            const p1 = (window as any).GreenhouseModels3DMath.project3DTo2D(x, y, -size, this.camera, this.projection);
            const p2 = (window as any).GreenhouseModels3DMath.project3DTo2D(x, y, size, this.camera, this.projection);
            if (p1.scale > 0 && p2.scale > 0) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        for (let z = -size; z <= size; z += step) {
            const p1 = (window as any).GreenhouseModels3DMath.project3DTo2D(-size, y, z, this.camera, this.projection);
            const p2 = (window as any).GreenhouseModels3DMath.project3DTo2D(size, y, z, this.camera, this.projection);
            if (p1.scale > 0 && p2.scale > 0) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        const origin = (window as any).GreenhouseModels3DMath.project3DTo2D(0, y, 0, this.camera, this.projection);
        const xAxis = (window as any).GreenhouseModels3DMath.project3DTo2D(size, y, 0, this.camera, this.projection);
        const zAxis = (window as any).GreenhouseModels3DMath.project3DTo2D(0, y, size, this.camera, this.projection);

        if (origin.scale > 0) {
            if (xAxis.scale > 0) ctx.fillText(util ? util.t('X-Axis') : 'X-Axis', xAxis.x, xAxis.y);
            if (zAxis.scale > 0) ctx.fillText(util ? util.t('Z-Axis') : 'Z-Axis', zAxis.x, zAxis.y);
        }
    },

    handleMouseClick(e: MouseEvent) {
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
            mouseY > pipY && mouseY < pipH + pipY) {

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

    hitTest(mouseX: number, mouseY: number) {
        // Reset hover state
        this.hoveredElement = null;

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

        // Check Neurons first
        let closestNeuron = null;
        let minNeuronDist = 15;

        this.neurons.forEach(n => {
            const p = (window as any).GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
            if (p.scale > 0) {
                const dx = localMouseX - p.x;
                const dy = localMouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minNeuronDist) {
                    minNeuronDist = dist;
                    closestNeuron = n;
                }
            }
        });

        if (closestNeuron) {
            this.hoveredElement = { type: 'neuron', data: closestNeuron };
            // Restore projection
            this.projection.width = origW;
            this.projection.height = origH;
            return this.hoveredElement;
        }

        let closestConn = null;
        let minDist = 20;

        this.connections.forEach(conn => {
            if (!conn.controlPoint) return;

            const p = (window as any).GreenhouseModels3DMath.project3DTo2D(conn.controlPoint.x, conn.controlPoint.y, conn.controlPoint.z, this.camera, this.projection);

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
            this.hoveredElement = { type: 'connection', data: closestConn };
            return this.hoveredElement;
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

    stirFluid(x: number, y: number, dx: number, dy: number) {
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
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            // Check if synapse camera controller exists and if click is in main view
            if ((window as any).GreenhouseNeuroSynapse && (window as any).GreenhouseNeuroSynapse.synapseCameraController) {
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
                if (mouseX < pipX || mouseX > pipX + pipW || mouseY < pipY || mouseY > pipH + pipY) {
                    // Check reset button
                    const resetBtnX = this.canvas.width - 60;
                    const resetBtnY = 5;
                    const resetBtnW = 50;
                    const resetBtnH = 20;

                    if (mouseX >= resetBtnX && mouseX <= resetBtnX + resetBtnW &&
                        mouseY >= resetBtnY && mouseY <= resetBtnY + resetBtnH) {
                        (window as any).GreenhouseNeuroSynapse.synapseCameraController.reset();
                        return;
                    }

                    // Handle camera interaction
                    const bounds = { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
                    (window as any).GreenhouseNeuroSynapse.synapseCameraController.handleMouseDown(e, this.canvas, bounds);
                }
            }
        });

        // Mouse move handler
        window.addEventListener('mousemove', (e: MouseEvent) => {
            if ((window as any).GreenhouseNeuroSynapse && (window as any).GreenhouseNeuroSynapse.synapseCameraController) {
                (window as any).GreenhouseNeuroSynapse.synapseCameraController.handleMouseMove(e, this.canvas);
            }
        });

        // Mouse up handler
        window.addEventListener('mouseup', () => {
            if ((window as any).GreenhouseNeuroSynapse && (window as any).GreenhouseNeuroSynapse.synapseCameraController) {
                (window as any).GreenhouseNeuroSynapse.synapseCameraController.handleMouseUp();
            }
        });

        // Wheel handler
        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            if ((window as any).GreenhouseNeuroSynapse && (window as any).GreenhouseNeuroSynapse.synapseCameraController) {
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
                if (mouseX < pipX || mouseX > pipX + pipW || mouseY < pipY || mouseY > pipH + pipY) {
                    const bounds = { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height };
                    (window as any).GreenhouseNeuroSynapse.synapseCameraController.handleWheel(e, this.canvas, bounds);
                }
            }
        }, { passive: false });

        console.log('NeuroUI3D: Synapse mouse handlers initialized');
    },

    handleTooltipMove(e: MouseEvent) {
        const ga = (window as any).GreenhouseNeuroApp?.ga;
        const activeEnhancements = ga?.adhdConfig?.activeEnhancements;
        if (!this.tooltipEl || !activeEnhancements || !activeEnhancements.size) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const t = (k: string) => (window as any).GreenhouseModelsUtil ? (window as any).GreenhouseModelsUtil.t(k) : k;
        const data = (window as any).GreenhouseADHDData;
        if (!data) return;

        let tooltipContent = "";

        // Check for hits on ADHD specific visualizations

        // Check Synapse View components if in main view
        if (!tooltipContent && (window as any).GreenhouseNeuroSynapse && this.selectedConnection) {
            const pipConfig = this.config.get('pip');
            // If NOT in PiP area, we are in main view
            if (x < this.canvas.width - pipConfig.width - 20 || y < this.canvas.height - pipConfig.height - 20) {
                 const synapseCamera = (window as any).GreenhouseNeuroSynapse.synapseCameraController?.getCamera() || {
                    x: 0, y: 0, z: -200, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 400
                 };
                 tooltipContent = (window as any).GreenhouseNeuroSynapse.checkSynapseHover(x, y, this.canvas.width, this.canvas.height, synapseCamera, activeEnhancements);
            }
        }

        // 1. Noise Particles (SNR - ID 2)
        if (activeEnhancements.has(2)) {
            const hitNoise = this.adhdEffects.noiseParticles.find((p: any) => {
                return Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < 10;
            });
            if (hitNoise) {
                tooltipContent = `<strong>${t(`adhd_enh_2_name`)}</strong><br>${t(`adhd_enh_2_desc`)}`;
            }
        }

        // 2. Cognitive Fatigue Shader (ID 19) - Show if hovering near dark nodes
        if (!tooltipContent && activeEnhancements.has(19)) {
            // This is a global effect, but we can show it when hovering the main view
            const pipConfig = this.config.get('pip');
            if (x < this.canvas.width - pipConfig.width - 20) {
                 const fatigue = (window as any).GreenhouseNeuroApp?.ga?.adhdConfig?.fatigue || 0;
                 if (fatigue > 0.5) {
                    tooltipContent = `<strong>${t(`adhd_enh_19_name`)}</strong><br>${t(`adhd_enh_19_desc`)}`;
                 }
            }
        }

        // 3. Vigilance (ID 13) - Oscillating nodes
        if (!tooltipContent && activeEnhancements.has(13)) {
             tooltipContent = `<strong>${t(`adhd_enh_13_name`)}</strong><br>${t(`adhd_enh_13_desc`)}`;
        }

        // 4. Meters
        if (!tooltipContent) {
            if (x > 20 && x < 170) {
                if (y > 130 && y < 170 && activeEnhancements.has(25)) {
                    tooltipContent = `<strong>Impulse Inhibition</strong><br>Ratio of inhibitory to excitatory signals in the network. Low inhibition models impulsive connection bursts.`;
                } else if (y > 180 && y < 220 && activeEnhancements.has(62)) {
                    tooltipContent = `<strong>Glutamate/GABA Balance</strong><br>The primary excitatory/inhibitory chemical balance. Imbalance models hyper-reactivity and sensory overload.`;
                } else if (y > 230 && y < 290 && activeEnhancements.has(92)) {
                    tooltipContent = `<strong>Hereditability Tree</strong><br>Visualizing the genetic lineage of the most successful neural networks across generations.`;
                }
            }
        }

        if (tooltipContent) {
            this.tooltipEl.innerHTML = tooltipContent;
            this.tooltipEl.style.display = 'block';
            this.tooltipEl.style.left = (e.clientX + 15) + 'px';
            this.tooltipEl.style.top = (e.clientY + 15) + 'px';
        } else {
            this.tooltipEl.style.display = 'none';
        }
    },

    resetCamera() {
        if (this.cameraControls) this.cameraControls.resetCamera();
        console.log("NeuroUI3D: Camera Reset");
    },

    toggleAutoRotate() {
        if (this.cameraControls) {
            this.cameraControls.toggleAutoRotate();
            this.autoRotate = this.config.get('camera.controls.autoRotate');
        }
        console.log("NeuroUI3D: Auto-Rotate", this.autoRotate);
    },

    generateSynapseMeshes() {
        if ((window as any).GreenhouseNeuroGeometry) {
            const pre = (window as any).GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'pre');
            const post = (window as any).GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'post');

            post.vertices.forEach((v: any) => {
                v.y *= -1;
            });
            return { pre, post };
        }
        return { pre: { vertices: [], faces: [] }, post: { vertices: [], faces: [] } };
    },
};

(window as any).GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
