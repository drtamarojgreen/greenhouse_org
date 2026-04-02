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

            this.addStartOverlay(this.container);
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
            if (!this.ctx) return;
            const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
            ctx.clearRect(0, 0, w, h);
            const activeGene = this.neurons3D[this.activeGeneIndex];

            // Main Brain View
            window.GreenhouseGeneticBrain?.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w, h, activeGene);

            // Item 64: Temporal Reprojection / Post-processing
            if (window.GreenhousePostProcessor) window.GreenhousePostProcessor.apply(ctx, w, h);

            // PiP Windows (Simplified for this update)
            const pipW = 200, pipH = 150, gap = 10;
            const rightPipX = w - pipW - gap;

            // Draw Target View PiP
            const targetState = window.GreenhouseGeneticPiPControls?.getState('target') || { camera: this.cameras[4] };
            window.GreenhouseGeneticBrain?.drawTargetView(ctx, rightPipX, h - pipH - gap, pipW, pipH, activeGene, this.activeGeneIndex, this.brainShell, null, targetState);
        }
    };

    window.GreenhouseGeneticUI3D = GreenhouseGeneticUI3D;
})();
