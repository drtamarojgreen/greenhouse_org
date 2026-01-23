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

    // Define core properties and placeholders
    const coreProperties = {
        canvas: null,
        ctx: null,
        isRunning: false,
        width: 800,
        height: 600,
        highContrast: false,
        largeUI: false,
        reducedMotion: false,
        paused: false,
        playbackSpeed: 1,
        bloomEffect: false,
        volumetricLight: false,
        fps: 0,
        lastTime: 0,
        viewMode: '3D',
        selectedReceptor: null,

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
            if (document.getElementById('serotonin-sim-styles-modular')) return;
            const style = document.createElement('style');
            style.id = 'serotonin-sim-styles-modular';
            style.innerHTML = `
                .serotonin-controls-modular { position: absolute; top: 10px; left: 10px; display: flex; gap: 10px; z-index: 100; }
                .serotonin-dropdown { position: relative; }
                .serotonin-btn { background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
                .serotonin-btn:hover { background: #4a5568; }
                .serotonin-btn:focus { outline: 2px solid #00ffcc; outline-offset: 2px; }
                .serotonin-checkbox-modal {
                    position: absolute; top: 100%; left: 0; background: #2d3748; border: 1px solid #4a5568;
                    padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; min-width: 150px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 101;
                }
                .serotonin-checkbox-item { color: #fff; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
                .serotonin-info { position: absolute; bottom: 10px; left: 10px; color: #fff; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; pointer-events: none; font-size: 12px; }
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
            let startX = 0; let startY = 0;

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX; lastY = e.clientY;
                startX = e.clientX; startY = e.clientY;
            });

            window.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Distance HUD & Contextual Cursor (Category III, #51, #59)
                this.updateContextualCursor(mouseX, mouseY);

                if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    this.state.camera.rotationY += dx * 0.01;
                    this.state.camera.rotationX += dy * 0.01;
                    lastX = e.clientX; lastY = e.clientY;
                }
            });
            window.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
                    if (dist < 5) { // It's a click
                        this.handleCanvasClick(e);
                    }
                }
                isDragging = false;
            });
        },

        handleCanvasClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Check Legend Interaction first (#95)
            if (this.Legend && this.Legend.checkInteraction && this.Legend.checkInteraction(mx, my, this.width, this.height)) {
                return;
            }

            if (this.viewMode === '2D-Closeup') {
                this.viewMode = '3D';
                this.selectedReceptor = null;
                return;
            }

            if (!this.ctx || !window.GreenhouseModels3DMath) return;
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
            const cam = this.state.camera;
            const w = this.width;
            const h = this.height;

            if (this.state.receptors) {
                for (let r of this.state.receptors) {
                    const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 30 * p.scale) {
                        this.viewMode = '2D-Closeup';
                        this.selectedReceptor = r;
                        break;
                    }
                }
            }
        },

        updateContextualCursor(mx, my) {
            if (!this.ctx || !window.GreenhouseModels3DMath) return;
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
            const cam = this.state.camera;
            const w = this.width;
            const h = this.height;

            let foundTarget = false;
            this.hoverDistance = null;

            if (this.state.receptors) {
                this.state.receptors.forEach(r => {
                    const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 30 * p.scale) {
                        foundTarget = true;
                        this.hoverDistance = (dist / p.scale).toFixed(1);
                    }
                });
            }

            this.canvas.style.cursor = foundTarget ? 'pointer' : 'default';
        },

        animate() {
            if (!this.isRunning) return;
            this.update();

            if (this.vrMode) {
                // Stereoscopic Side-by-Side Mode (Category 10, #98)
                const fullW = this.width;
                // Left eye
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.rect(0, 0, fullW / 2, this.height);
                this.ctx.clip();
                this.render(0, 0, fullW / 2, this.height, -20);
                this.ctx.restore();

                // Right eye
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.rect(fullW / 2, 0, fullW / 2, this.height);
                this.ctx.clip();
                this.render(fullW / 2, 0, fullW / 2, this.height, 20);
                this.ctx.restore();
            } else {
                this.render(0, 0, this.width, this.height, 0);
            }

            requestAnimationFrame(() => this.animate());
        },

        update() {
            if (this.paused) return;

            // Performance Gauge (Feedback #50)
            const now = performance.now();
            if (this.lastTime) {
                const dt = now - this.lastTime;
                this.fps = Math.round(1000 / dt);
            }
            this.lastTime = now;

            const iterations = (this.timeLapse ? 5 : 1) * (this.playbackSpeed || 1);
            for (let i = 0; i < iterations; i++) {
                this.state.timer++;
                // Stop the revolution if 2D Closeup is active
                if (!this.isDragging && this.viewMode !== '2D-Closeup') {
                    this.state.camera.rotationY += 0.003;
                }
                // Call module updates if they exist
                if (this.Receptors && this.Receptors.updateReceptorStates) this.Receptors.updateReceptorStates();
                if (this.Kinetics && this.Kinetics.updateKinetics) this.Kinetics.updateKinetics();
                if (this.Signaling && this.Signaling.updateSignaling) this.Signaling.updateSignaling();
                if (this.Transport && this.Transport.updateTransport) this.Transport.updateTransport();
                if (this.Analytics && this.Analytics.updateAnalytics) this.Analytics.updateAnalytics();
            }
        },

        renderVolumetricLight() {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const time = this.state.timer * 0.02;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            // God rays emanating from top center
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI * 0.5 + (i - 2.5) * 0.3 + Math.sin(time + i) * 0.05;
                const length = Math.max(w, h) * 1.5;
                const grad = ctx.createLinearGradient(w / 2, 0, w / 2 + Math.cos(angle) * length, Math.sin(angle) * length);
                const alpha = (0.03 + Math.sin(time * 0.7 + i) * 0.02);
                grad.addColorStop(0, `rgba(150, 200, 255, ${alpha})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(w / 2, -20);
                ctx.lineTo(w / 2 + Math.cos(angle - 0.15) * length, Math.sin(angle - 0.15) * length);
                ctx.lineTo(w / 2 + Math.cos(angle + 0.15) * length, Math.sin(angle + 0.15) * length);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        },

        renderBloom() {
            const ctx = this.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.4;
            ctx.filter = 'blur(12px) brightness(1.2)';
            ctx.drawImage(this.canvas, 0, 0);
            ctx.restore();
        },

        render2DCloseup(ctx, w, h) {
            const r = this.selectedReceptor;
            if (!r) return;

            ctx.fillStyle = '#0a0510';
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.translate(w / 2, h / 2);

            // Draw Architecture-Specific Schematic
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;

            if (r.architecture === 'Pentameric') {
                // Pentameric schematic (cross-section)
                ctx.strokeRect(-150, -150, 300, 300);
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    ctx.fillStyle = 'rgba(100, 255, 100, 0.4)';
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * 80, Math.sin(angle) * 80, 40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.fillStyle = r.state === 'Active' ? '#00ffcc' : '#111';
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Ion Channel Pore", 0, 5);
            } else {
                // GPCR schematic
                ctx.strokeRect(-120, -180, 240, 360);
                // TM Helices
                for (let i = 0; i < 7; i++) {
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
                    ctx.fillRect(-100 + i * 28, -140, 20, 280);
                }
                // Binding Pocket
                ctx.beginPath();
                ctx.arc(0, -60, 50, 0, Math.PI * 2);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Orthosteric Pocket", 0, -60);

                // C-Terminal Tail visualization (Category 1, #1)
                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(80, 140);
                ctx.bezierCurveTo(90, 180, 70, 220, 80, 140 + (r.cTailLength || 20) * 2);
                ctx.stroke();
                ctx.font = '10px Arial';
                ctx.fillText("C-Terminal Tail", 90, 180);

                // IL3 Loop (Category 1, #1)
                ctx.beginPath();
                ctx.moveTo(-10, 140);
                ctx.quadraticCurveTo(0, 140 + (r.il3Length || 10) * 2, 10, 140);
                ctx.stroke();
                ctx.fillText("IL3 Loop", 0, 160);
            }

            // Ligand Docking Visualization (#70)
            if (this.Kinetics && this.Kinetics.renderDockingDetail) {
                this.Kinetics.renderDockingDetail(ctx, r);
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(r.type + " Molecular Architecture", 0, -210);

            ctx.font = '14px Arial';
            ctx.fillText("Architecture: " + (r.architecture || 'Unknown'), 0, -180);
            ctx.fillText("State: " + (r.state || 'Inactive'), 0, -160);

            // Sodium Allosteric Site (Category 2, #17)
            if (r.type === '5-HT1A') {
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText("Na+ Allosteric Site", 0, 25);
            }

            // Lipid Modulation indicator (Category 2, #16)
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            ctx.fillText("Membrane Stability: " + (r.stability ? r.stability.toFixed(2) : '1.00'), 0, 250);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#00ffcc';
            ctx.fillText("Click anywhere to return to 3D model", 0, 280);

            ctx.restore();
        },

        render(vx = 0, vy = 0, vw = this.width, vh = this.height, eyeOffset = 0) {
            const ctx = this.ctx;
            let w = this.width;
            let h = this.height;

            if (this.viewMode === '2D-Closeup') {
                this.render2DCloseup(ctx, w, h);
                return;
            }

            // Create temporary camera for eye offset if needed
            const cam = eyeOffset ? { ...this.state.camera, x: this.state.camera.x + eyeOffset } : this.state.camera;

            // Serotonin Syndrome Warning visual distortion (#60)
            let offsetX = 0, offsetY = 0;
            if (this.ssActive) {
                offsetX = (Math.random() - 0.5) * 10;
                offsetY = (Math.random() - 0.5) * 10;
            }

            ctx.clearRect(0, 0, w, h);

            // Cinematic FX: Vignette (#22)
            if (this.cinematicFX) {
                const grad = ctx.createRadialGradient(w / 2, h / 2, w / 4, w / 2, h / 2, w / 1.2);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            // Distance HUD for Hover (Category III, #59)
            if (this.hoverDistance) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(`Dist to pocket: ${this.hoverDistance} nm`, 20, 40);
            }
            ctx.fillStyle = this.highContrast ? '#000000' : '#0a0510';
            ctx.fillRect(0, 0, w, h);

            // Interaction Confirmation Ping (Category III, #46)
            if (this.lastInteraction && this.state.timer - this.lastInteraction.time < 30) {
                const alpha = 1.0 - (this.state.timer - this.lastInteraction.time) / 30;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
                ctx.fillRect(0, 0, w, h);
            }

            if (this.ssActive && this.state.timer % 10 < 5) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                ctx.fillRect(0, 0, w, h);
            }

            // Cinematic FX: Film Grain (#22)
            if (this.cinematicFX && Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                for (let k = 0; k < 100; k++) {
                    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
                }
            }

            // Volumetric Light (#25)
            if (this.volumetricLight) {
                this.renderVolumetricLight();
            }

            ctx.save();
            ctx.translate(offsetX, offsetY);

            if (!window.GreenhouseModels3DMath) return;
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

            // Draw receptor helices (Only draw original placeholder if modular receptors haven't initialized)
            if (!this.state.receptors || this.state.receptors.length === 0) {
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

            ctx.restore();

            // Bloom Effect (#22) - Apply at the very end of main scene render
            if (this.bloomEffect) {
                this.renderBloom();
            }
        }
    };
    Object.assign(G, coreProperties);

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
            // Internal API for Remote Control (#89)
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SET_SIM_PARAM') {
                    const { param, value } = event.data;
                    if (G.hasOwnProperty(param)) {
                        G[param] = value;
                        console.log(`Remote Control: Set ${param} to ${value}`);
                    }
                }
            });

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
                const container = document.querySelector(targetSelector);
                if (container) {
                    console.log('Serotonin App: Auto-initializing...');
                    G.initialize(container);
                } else {
                    console.error('Serotonin App: Container not found on initialization for selector:', targetSelector);
                }
            }
        } catch (error) {
            console.error('Serotonin Simulation App: Initialization failed', error);
        }
    }
    main();
})();
