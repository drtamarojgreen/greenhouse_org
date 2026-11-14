/**
 * @file neuro_ui_3d.ts
 * @description Enhanced 3D Visualization for Neuro GA in Neuro simulation.
 */

/// <reference path="../types/globals.d.ts" />

export const GreenhouseNeuroUI3D = {
    canvas: null as any as HTMLCanvasElement,
    ctx: null as any as CanvasRenderingContext2D,
    networkCameraController: null as any,
    synapseCameraController: null as any,

    camera: { x: 0, y: 0, z: -600, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 } as Greenhouse.Camera,
    synapseCamera: { x: 0, y: 0, z: -200, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 400 } as Greenhouse.Camera,

    projection: { width: 800, height: 600, near: 10, far: 5000 } as Greenhouse.Projection,
    isActive: false,
    neurons: [] as any[],
    connections: [] as any[],
    autoRotate: true,
    rotationSpeed: 0.001, // Item 58: Capped speed
    viewMode: 'network',
    selectedConnection: null as any,
    synapseMeshes: null as any,
    brainShell: null as any,

    // Item 24: Contrast/Saturation Sliders
    settings: {
        contrast: 1.0,
        saturation: 1.0,
        lightingMode: 'clinical'
    },

    init(containerSelector: string | HTMLElement) {
        const container = (typeof containerSelector === 'string') ? document.querySelector(containerSelector) : containerSelector;
        if (!container) return;

        if ((window as any).NeuroSynapseCameraController) {
            this.networkCameraController = new (window as any).NeuroSynapseCameraController(this.camera, (window as any).GreenhouseNeuroConfig);
            this.synapseCameraController = new (window as any).NeuroSynapseCameraController(this.synapseCamera, (window as any).GreenhouseNeuroConfig);
            this.synapseCameraController.autoRotate = true;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.width = (container as HTMLElement).offsetWidth || 1000;
        this.canvas.height = 750;

        // Initialize Post-Processor
        if ((window as any).GreenhousePostProcessor) {
            (window as any).GreenhousePostProcessor.init(this.canvas);
        }

        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.backgroundColor = '#050510';
        this.canvas.style.display = 'block';

        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d')!;
        this.projection.width = this.canvas.width;
        this.projection.height = this.canvas.height;

        window.addEventListener('resize', () => {
            if (this.canvas && container) {
                this.canvas.width = (container as HTMLElement).offsetWidth;
                this.canvas.height = 750;
                this.projection.width = this.canvas.width;
                this.projection.height = this.canvas.height;
            }
        });

        this.setupInteraction();
        this.addStartOverlay(container as HTMLElement);
        this.startAnimation();
        this.synapseMeshes = this.generateSynapseMeshes();
    },

    setupInteraction() {
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width, scaleY = this.canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX, mouseY = (e.clientY - rect.top) * scaleY;
            const isPiP = this.isMouseOverPiP(mouseX, mouseY);

            if (this.selectedConnection) {
                if (isPiP) this.networkCameraController?.handleMouseDown(e, this.canvas);
                else this.synapseCameraController?.handleMouseDown(e, this.canvas);
            } else {
                this.networkCameraController?.handleMouseDown(e, this.canvas);
            }
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            this.networkCameraController?.handleMouseMove(e, this.canvas);
            this.synapseCameraController?.handleMouseMove(e, this.canvas);
        });

        window.addEventListener('mouseup', () => {
            this.networkCameraController?.handleMouseUp();
            this.synapseCameraController?.handleMouseUp();
        });

        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            if (this.isMouseOverPiP(mouseX, mouseY)) this.networkCameraController?.handleWheel(e, this.canvas);
            else this.synapseCameraController?.handleWheel(e, this.canvas);
        }, { passive: false });

        this.canvas.addEventListener('click', (e: MouseEvent) => {
            if (!this.networkCameraController?.isDragging && !this.synapseCameraController?.isDragging) {
                this.handleMouseClick(e);
            }
        });
    },

    isMouseOverPiP(mouseX: number, mouseY: number) {
        const pipW = 300, pipH = 250, padding = 20;
        const pipX = this.canvas.width - pipW - padding, pipY = this.canvas.height - pipH - padding;
        return (mouseX > pipX && mouseX < pipX + pipW && mouseY > pipY && mouseY < pipY + pipH);
    },

    addStartOverlay(container: HTMLElement) {
        const util = (window as any).GreenhouseModelsUtil;
        const overlay = document.createElement('div');
        overlay.id = 'neuro-start-overlay';
        overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.6);z-index:10;';
        const btn = document.createElement('button');
        btn.textContent = util ? util.t('Start Simulation') : 'Start Simulation';
        btn.style.cssText = 'padding:15px 30px;font-size:18px;cursor:pointer;background:#E0E0E0;color:#222;border:none;border-radius:5px;font-weight:bold;';
        btn.onclick = () => { overlay.style.display = 'none'; if ((window as any).GreenhouseNeuroApp) (window as any).GreenhouseNeuroApp.startSimulation(); };
        overlay.appendChild(btn);
        container.style.position = 'relative';
        container.appendChild(overlay);
    },

    updateData(genome: any) {
        if (!genome) return;
        if (!this.brainShell) this.initializeBrainShell();
        this.neurons = genome.neurons.map((n: any, i: number) => {
            const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem'];
            const regionKey = regionKeys[i % regionKeys.length];
            const regionVerticesIndices = this.getRegionVertices(regionKey);
            let x = 0, y = 0, z = 0;
            if (regionVerticesIndices.length > 0) {
                const vertex = this.brainShell.vertices[regionVerticesIndices[Math.floor(Math.random() * regionVerticesIndices.length)]];
                const jitter = 0.85;
                x = vertex.x * jitter; y = vertex.y * jitter; z = vertex.z * jitter;
            }
            return { ...n, x, y, z, region: regionKey, baseColor: '#E0E0E0', radius: 6 + Math.random() * 4 };
        });
        this.initializeConnections(genome.connections);
    },

    initializeConnections(connections: any[]) {
        this.connections = connections.map(conn => {
            const fromNeuron = this.neurons.find(n => n.id === conn.from), toNeuron = this.neurons.find(n => n.id === conn.to);
            if (!fromNeuron || !toNeuron) return null;
            const cp = { x: (fromNeuron.x + toNeuron.x) * 0.4, y: (fromNeuron.y + toNeuron.y) * 0.4, z: (fromNeuron.z + toNeuron.z) * 0.4 };
            return { ...conn, from: fromNeuron, to: toNeuron, controlPoint: cp, mesh: (window as any).GreenhouseNeuroGeometry?.generateTubeMesh(fromNeuron, toNeuron, cp, Math.abs(conn.weight) * 10, 8) };
        }).filter(c => c);

        if (this.connections.length > 0 && !this.selectedConnection) {
            this.selectedConnection = this.connections[0];
            this.viewMode = 'synapse';
        }
    },

    startAnimation() {
        const animate = () => {
            this.networkCameraController?.update();
            this.synapseCameraController?.update();
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    },

    render() {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const config = (window as any).GreenhouseNeuroConfig;
        const post = (window as any).GreenhousePostProcessor;

        // 1. Prepare Frame (e.g. TAA Jitter)
        if (post && config) {
            post.prepareFrame(config.get('effects'));
        }

        // 2. Draw Background
        if (post && config) {
            post.drawBackground(config.get('ui.background'), config.get('ui'));
        } else {
            ctx.clearRect(0, 0, w, h);
        }

        // Item 16: Color Management / ACES is done in Lighting module.
        // We can apply global contrast/saturation here if needed.

        if (this.selectedConnection) {
            if ((window as any).GreenhouseNeuroSynapse) {
                (window as any).GreenhouseNeuroSynapse.drawSynapsePiP(ctx, 0, 0, w, h, this.selectedConnection, this.synapseMeshes, true, this.synapseCamera);
            }
        }

        const pipW = 300, pipH = 250, padding = 20;
        const pipX = w - pipW - padding, pipY = h - pipH - padding;
        this.drawNetworkView(ctx, pipX, pipY, pipW, pipH);

        // --- Apply Advanced Post-Processing ---
        if (post && config) {
            post.applyEffects(config.get('effects'), this.camera);
        }

        // --- Draw UI Overlay ---
        if ((window as any).GreenhouseNeuroApp && (window as any).GreenhouseNeuroApp.drawUI) {
            (window as any).GreenhouseNeuroApp.drawUI(ctx, w, h);
        }

        // Draw Region Labels
        if ((window as any).GreenhouseNeuroStats) {
            const projectedBrainNeurons = this.neurons
                .map(n => {
                    const p = (window as any).GreenhouseModels3DMath?.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                    return { ...n, ...p };
                })
                .filter(p => p.scale > 0);

            (window as any).GreenhouseNeuroStats.drawLabels(ctx, projectedBrainNeurons);
        }
    },

    drawNetworkView(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        const origW = this.projection.width, origH = this.projection.height;
        this.projection.width = w; this.projection.height = h;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#A0AEC0'; ctx.strokeRect(0, 0, w, h);
        ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();

        if (this.brainShell) {
            (window as any).GreenhouseNeuroBrain?.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w, h, null);
        }

        this.neurons.forEach(n => {
            const p = (window as any).GreenhouseModels3DMath?.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
            if (p && p.scale > 0) {
                ctx.fillStyle = n.baseColor;
                ctx.beginPath(); ctx.arc(p.x, p.y, n.radius * p.scale, 0, Math.PI * 2); ctx.fill();
            }
        });

        ctx.restore();
        this.projection.width = origW; this.projection.height = origH;
    },

    initializeBrainShell() {
        this.brainShell = { vertices: [], faces: [] };
        (window as any).GreenhouseNeuroGeometry?.initializeBrainShell(this.brainShell);
    },

    getRegionVertices(regionKey: string) {
        return (window as any).GreenhouseNeuroGeometry?.getRegionVertices(this.brainShell, regionKey) || [];
    },

    handleMouseClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        // Hit testing for connections in PiP
        const pipW = 300, pipH = 250, padding = 20;
        const pipX = this.canvas.width - pipW - padding, pipY = this.canvas.height - pipH - padding;

        if (mouseX > pipX && mouseX < pipX + pipW && mouseY > pipY && mouseY < pipY + pipH) {
            // Logic to switch selected connection
            const localX = mouseX - pipX, localY = mouseY - pipY;
            this.connections.forEach(conn => {
                const p = (window as any).GreenhouseModels3DMath?.project3DTo2D(conn.controlPoint.x, conn.controlPoint.y, conn.controlPoint.z, this.camera, { width: pipW, height: pipH, near: 10, far: 5000 });
                if (Math.hypot(p.x - localX, p.y - localY) < 20) this.selectedConnection = conn;
            });
        }
    },

    generateSynapseMeshes() {
        const createBulb = (isPre: boolean) => {
            const vertices: any[] = [], faces: number[][] = [], rings = 30, segments = 30, length = 80, radius = 50;
            for (let i = 0; i <= rings; i++) {
                const u = i / rings, xVal = u * length;
                let r = radius + 20 * Math.sin(u * Math.PI);
                if (u > 0.8) r *= Math.sqrt(1 - ((u - 0.8) / 0.2)**2);
                for (let j = 0; j <= segments; j++) {
                    const v = j / segments, theta = v * Math.PI * 2;
                    const my = r * Math.cos(theta), mz = r * Math.sin(theta);
                    vertices.push({ x: my, y: isPre ? -length + xVal : length - xVal, z: mz });
                }
            }
            for (let i = 0; i < rings; i++) {
                for (let j = 0; j < segments; j++) {
                    const r1 = i * (segments + 1), r2 = (i + 1) * (segments + 1);
                    faces.push([r1 + j, r1 + j + 1, r2 + j], [r1 + j + 1, r2 + j + 1, r2 + j]);
                }
            }
            return { vertices, faces };
        };
        return { pre: createBulb(true), post: createBulb(false) };
    }
};

(window as any).GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
