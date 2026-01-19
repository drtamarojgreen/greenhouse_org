/**
 * @file dopamine.js
 * @description Core engine for Dopamine Signaling Simulation.
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

    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    Object.assign(G, {
        canvas: null,
        ctx: null,
        isRunning: false,
        width: 800,
        height: 600,

        state: {
            camera: { x: 0, y: 0, z: -400, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500, zoom: 1.0 },
            receptors: [],
            particles: [],
            signalingActive: false,
            mode: 'D1R',
            atpConsumed: 0,
            timer: 0
        },

        initialize(container) {
            if (!container) return;
            container.innerHTML = '';
            this.injectStyles();

            const wrapper = document.createElement('div');
            wrapper.className = 'dopamine-simulation-container';
            wrapper.style.width = '100%'; wrapper.style.height = '100%';
            wrapper.style.position = 'relative'; wrapper.style.backgroundColor = '#050510';
            container.appendChild(wrapper);

            if (this.createUI) this.createUI(wrapper);

            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 600;
            wrapper.appendChild(this.canvas);
            this.width = this.canvas.width; this.height = this.canvas.height;

            this.setupReceptors();
            this.setupInteraction();

            this.isRunning = true;
            this.animate();
        },

        injectStyles() {
            if (document.getElementById('dopamine-sim-styles')) return;
            const style = document.createElement('style');
            style.id = 'dopamine-sim-styles';
            style.innerHTML = `
                .dopamine-controls { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; z-index: 10; }
                .dopamine-btn { background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
                .dopamine-btn:hover { background: #4a5568; }
                .dopamine-info { position: absolute; bottom: 10px; left: 10px; color: #fff; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; pointer-events: none; }
            `;
            document.head.appendChild(style);
        },

        setupReceptors() {
            this.state.receptors = [
                { type: 'D1', x: -150, y: 0, z: 0, color: '#ff4d4d' },
                { type: 'D2', x: -75, y: 0, z: 0, color: '#4d79ff' },
                { type: 'D3', x: 0, y: 0, z: 0, color: '#4dff4d' },
                { type: 'D4', x: 75, y: 0, z: 0, color: '#ffff4d' },
                { type: 'D5', x: 150, y: 0, z: 0, color: '#ff4dff' }
            ];
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
            // Basic rotation for effect
            if (!this.isDragging) {
                this.state.camera.rotationY += 0.005;
            }
        },

        render() {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const cam = this.state.camera;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, w, h);

            if (!window.GreenhouseModels3DMath) return;
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

            // Draw Receptors
            this.state.receptors.forEach(r => {
                const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.fillStyle = r.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 20 * p.scale, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#fff';
                    ctx.font = `${12 * p.scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(r.type, p.x, p.y + 30 * p.scale);
                }
            });
        }
    });

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeDopamineSimulation = function (selector) {
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
        console.log('Dopamine App: main() started.');
        try {
            await loadDependencies();

            // Capture attributes after dependencies are loaded to ensure GreenhouseUtils is available as a fallback
            const attributes = captureAttributes();
            const { targetSelector, baseUrl } = attributes;

            if (!baseUrl) {
                console.error('Dopamine App: Missing baseUrl, aborting initialization.');
                return;
            }

            // Load modular simulation components
            await GreenhouseUtils.loadScript('dopamine_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_legend.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_tooltips.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            if (targetSelector) {
                console.log('Dopamine App: Waiting for container:', targetSelector);
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                console.log('Dopamine App: Initializing in 5 seconds...');
                setTimeout(() => {
                    console.log('Dopamine App: Auto-initializing...');
                    G.initialize(container);
                }, 5000);
            }
        } catch (error) {
            console.error('Dopamine Simulation App: Initialization failed', error);
        }
    }
    main();
})();
