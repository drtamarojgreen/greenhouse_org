/**
 * @file dopamine.js
 * @description Core engine for Dopamine Signaling Simulation.
 */

(function () {
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.state = G.state || {
        camera: { x: 0, y: 0, z: -400, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500, zoom: 1.0 },
        receptors: [],
        particles: [],
        signalingActive: false,
        mode: 'D1R',
        atpConsumed: 0,
        timer: 0
    };
})();

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

    G.canvas = null;
    G.ctx = null;
    G.isRunning = false;
    G.width = 800;
    G.height = 600;
    G.isDragging = false;

    G.initialize = function(container) {
        if (!container || G.isRunning) return;
        container.innerHTML = '';
        G.injectStyles();

        const wrapper = document.createElement('div');
        wrapper.className = 'dopamine-simulation-container';
        wrapper.style.width = '100%'; wrapper.style.height = '100%';
        wrapper.style.position = 'relative'; wrapper.style.backgroundColor = '#050510';
        container.appendChild(wrapper);

        if (G.createUI) G.createUI(wrapper);
        if (G.initLegend) G.initLegend(wrapper);
        if (G.initTooltips) G.initTooltips(wrapper);
        if (G.initUX) G.initUX();

        G.canvas = document.createElement('canvas');
        G.ctx = G.canvas.getContext('2d');
        G.canvas.width = container.offsetWidth || 800;
        G.canvas.height = 600;
        wrapper.appendChild(G.canvas);
        G.width = G.canvas.width; G.height = G.canvas.height;

        G.setupReceptors();
        G.setupInteraction();

        G.isRunning = true;
        G.animate();
    };

    G.injectStyles = function() {
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
    };

    G.setupReceptors = function() {
        G.state.receptors = [
            { type: 'D1', x: -200, y: 0, z: 0, color: '#ff4d4d', il3Size: 20, tailLength: 60, helixRadius: 15 },
            { type: 'D2', x: -100, y: 0, z: 0, color: '#4d79ff', il3Size: 50, tailLength: 15, helixRadius: 18 },
            { type: 'D3', x: 0, y: 0, z: 0, color: '#4dff4d', il3Size: 45, tailLength: 15, helixRadius: 16 },
            { type: 'D4', x: 100, y: 0, z: 0, color: '#ffff4d', il3Size: 40, tailLength: 20, helixRadius: 14 },
            { type: 'D5', x: 200, y: 0, z: 0, color: '#ff4dff', il3Size: 22, tailLength: 55, helixRadius: 15 }
        ];
    };

    G.setupInteraction = function() {
        let lastX = 0; let lastY = 0;
        G.canvas.addEventListener('mousedown', (e) => { G.isDragging = true; lastX = e.clientX; lastY = e.clientY; });
        window.addEventListener('mousemove', (e) => {
            if (G.isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                G.state.camera.rotationY += dx * 0.01;
                G.state.camera.rotationX += dy * 0.01;
                lastX = e.clientX; lastY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => { G.isDragging = false; });
    };

    G.animate = function() {
        if (!G.isRunning) return;
        if (!G.uxState || !G.uxState.isPaused) {
            G.update();
        }
        G.render();
        requestAnimationFrame(() => G.animate());
    };

    G.update = function() {
        G.state.timer++;
        if (!G.isDragging) {
            G.state.camera.rotationY += 0.005;
        }

        if (G.updateMolecular) G.updateMolecular();
        if (G.updateSynapse) G.updateSynapse();
        if (G.updateElectrophysiology) G.updateElectrophysiology();
        if (G.updateCircuit) G.updateCircuit();
        if (G.updatePlasticity) G.updatePlasticity();
        if (G.updateClinical) G.updateClinical();
        if (G.updatePharmacology) G.updatePharmacology();
        if (G.updateUX) G.updateUX();
        if (G.updateTooltips) G.updateTooltips();
    };

    G.render = function() {
        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;

        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, w, h);

        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        G.state.receptors.forEach(r => {
            const baseP = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (baseP.scale > 0) {
                for (let i = 0; i < 7; i++) {
                    const angle = (i / 7) * Math.PI * 2 + G.state.timer * 0.01;
                    const hx = r.x + Math.cos(angle) * r.helixRadius;
                    const hz = r.z + Math.sin(angle) * r.helixRadius;
                    const top = project(hx, r.y - 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                    const bottom = project(hx, r.y + 40, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                    if (top.scale > 0 && bottom.scale > 0) {
                        ctx.strokeStyle = r.color;
                        ctx.lineWidth = 6 * top.scale;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(top.x, top.y);
                        ctx.lineTo(bottom.x, bottom.y);
                        ctx.stroke();
                    }
                }

                const il3Top = project(r.x, r.y + 30, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (il3Top.scale > 0) {
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 2 * il3Top.scale;
                    ctx.beginPath();
                    ctx.arc(il3Top.x, il3Top.y + (r.il3Size / 2) * il3Top.scale, (r.il3Size / 2) * il3Top.scale, -Math.PI, 0);
                    ctx.stroke();
                }

                const tailStart = project(r.x + r.helixRadius, r.y + 40, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (tailStart.scale > 0) {
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 2 * tailStart.scale;
                    ctx.beginPath();
                    ctx.moveTo(tailStart.x, tailStart.y);
                    ctx.bezierCurveTo(
                        tailStart.x + 10 * tailStart.scale, tailStart.y + r.tailLength * tailStart.scale,
                        tailStart.x - 10 * tailStart.scale, tailStart.y + (r.tailLength + 10) * tailStart.scale,
                        tailStart.x, tailStart.y + r.tailLength * tailStart.scale
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = '#fff';
                ctx.font = `${12 * baseP.scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(r.type, baseP.x, baseP.y + 100 * baseP.scale);
            }
        });

        if (G.renderMolecular) G.renderMolecular(ctx, project);
        if (G.renderSynapse) G.renderSynapse(ctx, project);
        if (G.renderElectrophysiology) G.renderElectrophysiology(ctx, project);
        if (G.renderCircuit) G.renderCircuit(ctx, project);
        if (G.renderPlasticity) G.renderPlasticity(ctx, project);
        if (G.renderClinical) G.renderClinical(ctx, project);
        if (G.renderPharmacology) G.renderPharmacology(ctx, project);
        if (G.renderUX) G.renderUX(ctx);
        if (G.renderLegend) G.renderLegend(ctx);
    };

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeDopamineSimulation = function (selector) {
        const container = document.querySelector(selector);
        if (container) G.initialize(container);
    };

    function captureAttributes() {
        if (window._greenhouseScriptAttributes) return { targetSelector: window._greenhouseScriptAttributes['target-selector-left'], baseUrl: window._greenhouseScriptAttributes['base-url'] };
        const script = document.currentScript;
        if (script) return { targetSelector: script.getAttribute('data-target-selector-left'), baseUrl: script.getAttribute('data-base-url') };
        return { targetSelector: null, baseUrl: null };
    }

    async function main() {
        try {
            const attributes = captureAttributes();
            const { targetSelector, baseUrl } = attributes;

            if (!baseUrl) {
                console.error('Dopamine App: Missing baseUrl, aborting initialization.');
                return;
            }

            await loadDependencies();

            // Load modular simulation components
            await GreenhouseUtils.loadScript('dopamine_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_legend.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_tooltips.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_molecular.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_synapse.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_electrophysiology.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_circuit.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_plasticity.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_clinical.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_pharmacology.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_ux.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            if (targetSelector) {
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                G.initialize(container);
            }
        } catch (error) {
            console.error('Dopamine Simulation App: Initialization failed', error);
        }
    }
    main();
})();
