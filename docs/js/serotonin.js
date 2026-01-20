/**
 * @file serotonin.js
 * @description Core engine for Serotonin Structural Model Simulation.
 */

(async function () {
    'use strict';

    let GreenhouseUtils;

    const loadDependencies = async () => {
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240;
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    GreenhouseUtils = window.GreenhouseUtils;
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
    };

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    Object.assign(G, {
        canvas: null,
        ctx: null,
        isRunning: false,
        width: 800,
        height: 600,

        state: {
            camera: { x: 0, y: 0, z: -500, rotationX: 0.5, rotationY: 0, rotationZ: 0, fov: 500, zoom: 1.0 },
            receptorModel: null,
            ligands: [],
            lipids: [],
            timer: 0
        },

        initialize(container) {
            if (!container) return;
            container.innerHTML = '';
            this.injectStyles();

            const wrapper = document.createElement('div');
            wrapper.className = 'serotonin-simulation-container';
            wrapper.style.width = '100%'; wrapper.style.height = '100%';
            wrapper.style.position = 'relative'; wrapper.style.backgroundColor = '#0a0510';
            container.appendChild(wrapper);

            if (this.createUI) this.createUI(wrapper);

            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 600;
            wrapper.appendChild(this.canvas);
            this.width = this.canvas.width; this.height = this.canvas.height;

            this.setupStructuralModel();
            this.setupInteraction();

            this.isRunning = true;
            this.animate();
        },

        injectStyles() {
            if (document.getElementById('serotonin-sim-styles')) return;
            const style = document.createElement('style');
            style.id = 'serotonin-sim-styles';
            style.innerHTML = `
                .serotonin-controls { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; z-index: 10; }
                .serotonin-btn { background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
                .serotonin-btn:hover { background: #4a5568; }
                .serotonin-info { position: absolute; bottom: 10px; left: 10px; color: #fff; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; pointer-events: none; }
            `;
            document.head.appendChild(style);
        },

        setupStructuralModel() {
            // Placeholder for 5-HT1A structural model
            this.state.receptorModel = { type: '5-HT1A', segments: 7 }; // 7-transmembrane helices
            this.state.lipids = Array.from({ length: 20 }, (_, i) => ({
                x: Math.cos(i * 0.3) * 100,
                y: -50 + Math.random() * 100,
                z: Math.sin(i * 0.3) * 100
            }));
        },

        setupInteraction() {
            let isDragging = false; let lastX = 0; let lastY = 0;
            this.canvas.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    this.state.camera.rotationY += dx * 0.01;
                    this.state.camera.rotationX += dy * 0.01;
                    lastX = e.clientX; lastY = e.clientY;
                }
            });
            window.addEventListener('mouseup', () => { isDragging = false; });
        },

        animate() {
            if (!this.isRunning) return;
            this.update();
            this.render();
            requestAnimationFrame(() => this.animate());
        },

        update() {
            this.state.timer++;
            if (!this.isDragging) {
                this.state.camera.rotationY += 0.003;
            }
        },

        render() {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const cam = this.state.camera;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0a0510';
            ctx.fillRect(0, 0, w, h);

            if (!window.GreenhouseModels3DMath) return;
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

            // Draw receptor helices (simplified)
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2;
                const rx = Math.cos(angle) * 40;
                const rz = Math.sin(angle) * 40;

                const top = project(rx, -80, rz, cam, { width: w, height: h, near: 10, far: 5000 });
                const bottom = project(rx, 80, rz, cam, { width: w, height: h, near: 10, far: 5000 });

                if (top.scale > 0 && bottom.scale > 0) {
                    ctx.strokeStyle = '#667eea';
                    ctx.lineWidth = 15 * top.scale;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(top.x, top.y);
                    ctx.lineTo(bottom.x, bottom.y);
                    ctx.stroke();
                }
            }

            // Draw Lipids
            this.state.lipids.forEach(l => {
                const p = project(l.x, l.y, l.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw Ligand (5-HT) in pocket
            const ligandPos = project(0, -20, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (ligandPos.scale > 0) {
                ctx.fillStyle = '#00ffcc';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffcc';
                ctx.beginPath();
                ctx.arc(ligandPos.x, ligandPos.y, 8 * ligandPos.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    });

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeSerotoninSimulation = function (selector) {
        const container = document.querySelector(selector);
        if (container) G.initialize(container);
    };

    function captureAttributes() {
        const attr = window._greenhouseScriptAttributes || {};
        const script = document.currentScript;
        const utils = window.GreenhouseUtils;

        const targetSelector = attr['target-selector-left'] || (script ? script.getAttribute('data-target-selector-left') : null) || (utils ? utils.appState.targetSelectorLeft : null);
        const baseUrl = attr['base-url'] || (script ? script.getAttribute('data-base-url') : null) || (utils ? utils.appState.baseUrl : null);

        return { targetSelector, baseUrl };
    }

    async function main() {
        console.log('Serotonin App: main() started.');
        try {
            await loadDependencies();

            // Capture attributes after dependencies are loaded to ensure GreenhouseUtils is available as a fallback
            const attributes = captureAttributes();
            const { targetSelector, baseUrl } = attributes;

            if (!baseUrl) {
                console.error('Serotonin App: Missing baseUrl, aborting initialization.');
                return;
            }

            // Load modular simulation components
            await GreenhouseUtils.loadScript('serotonin_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_legend.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_tooltips.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_receptors.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_kinetics.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_signaling.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_transport.js', baseUrl);
            await GreenhouseUtils.loadScript('serotonin_analytics.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            if (targetSelector) {
                console.log('Serotonin App: Waiting for container:', targetSelector);
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                console.log('Serotonin App: Initializing in 5 seconds...');
                setTimeout(() => {
                    console.log('Serotonin App: Auto-initializing...');
                    G.initialize(container);
                }, 5000);
            }
        } catch (error) {
            console.error('Serotonin Simulation App: Initialization failed', error);
        }
    }
    main();
})();
