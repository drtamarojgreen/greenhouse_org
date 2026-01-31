/**
 * @file dopamine.js
 * @description Core engine for Dopamine Signaling Simulation.
 */

(function () {
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.state = G.state || {
        camera: { x: 0, y: 0, z: -400, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500, zoom: 1.0 },
        cinematicCamera: true,
        receptors: [],
        particles: [],
        signalingActive: false,
        mode: 'D1R',
        scenarios: {
            cocaine: false,
            amphetamine: false,
            adhd: false,
            parkinsonian: false,
            schizophrenia: false,
            highStress: false,
            neuroinflammation: false,
            alphaSynuclein: false,
            heteromer: false,
            maoi: false
        },
        atpConsumed: 0,
        timer: 0
    };
})();

(async function () {
    'use strict';

    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.loadDependencies = async () => {
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240;
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
    };

    G.canvas = null;
    G.ctx = null;
    G.isRunning = false;
    G.width = 800;
    G.height = 600;
    G.isDragging = false;

    G.handleResize = function () {
        if (!G.canvas || !G.canvas.parentElement) return;
        const parent = G.canvas.parentElement;
        // Measure parent size first - since canvas is absolute/block and container is relative/hidden,
        // measuring the parent should be stable.
        const w = parent.clientWidth || 800;
        const h = parent.clientHeight || 500;

        // Only update if dimensions actually changed to avoid unnecessary churn
        if (G.canvas.width !== w || G.canvas.height !== h) {
            G.canvas.width = w;
            G.canvas.height = h;
            G.width = w;
            G.height = h;
        }
    };

    G.initialize = function (container, selector = null) {
        if (!container) return;
        // Stop if already running to prevent double loops on re-init
        if (G.isRunning) {
            G.isRunning = false;
        }

        container.innerHTML = '';
        G.injectStyles();

        const wrapper = document.createElement('div');
        wrapper.className = 'dopamine-simulation-container';
        // Ensure wrapper takes full space but doesn't grow indefinitely
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.backgroundColor = '#050510';
        wrapper.style.overflow = 'hidden';
        container.appendChild(wrapper);

        if (G.createUI) G.createUI(wrapper);
        if (G.initSidePanels) G.initSidePanels(wrapper);
        if (G.initLegend) G.initLegend(wrapper);
        if (G.initTooltips) G.initTooltips(wrapper);
        if (G.initUX) G.initUX();

        G.canvas = document.createElement('canvas');
        G.canvas.style.display = 'block';
        G.canvas.style.position = 'absolute';
        G.canvas.style.top = '0';
        G.canvas.style.left = '0';
        G.ctx = G.canvas.getContext('2d');
        wrapper.appendChild(G.canvas);

        G.handleResize();
        window.addEventListener('resize', () => G.handleResize());

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                // Use requestAnimationFrame to decouple resize from measurement
                // to avoid "ResizeObserver loop limit exceeded"
                requestAnimationFrame(() => G.handleResize());
            });
            ro.observe(wrapper);
        }

        // Single fallback for late layout settling
        setTimeout(() => G.handleResize(), 500);

        G.setupReceptors();
        G.setupInteraction();

        G.isRunning = true;
        G.animate();

        // Resilience using shared GreenhouseUtils
        if (window.GreenhouseUtils) {
            window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, G, 'initialize');
            window.GreenhouseUtils.startSentinel(container, selector, G, 'initialize');
        }
    };

    G.initSidePanels = function (container) {
        const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
        if (isMobile) return;

        G.leftPanel = document.createElement('div');
        G.leftPanel.className = 'dopamine-side-panel left';
        container.appendChild(G.leftPanel);

        G.rightPanel = document.createElement('div');
        G.rightPanel.className = 'dopamine-side-panel right';
        container.appendChild(G.rightPanel);

        // Define common update functions
        G.updateMetric = (panel, sectionId, label, value) => {
            let section = panel.querySelector(`#section-${sectionId.toLowerCase().replace(/\s+/g, '-')}`);
            if (!section) {
                section = document.createElement('div');
                section.id = `section-${sectionId.toLowerCase().replace(/\s+/g, '-')}`;
                section.className = 'dopamine-panel-section';
                section.innerHTML = `<div class="dopamine-panel-header">${sectionId}</div>`;
                panel.appendChild(section);
            }

            let item = section.querySelector(`[data-metric="${label}"]`);
            if (!item) {
                item = document.createElement('div');
                item.className = 'dopamine-metric-item';
                item.dataset.metric = label;
                item.innerHTML = `<span class="dopamine-metric-label">${label}</span><span class="dopamine-metric-value"></span>`;
                section.appendChild(item);
            }
            item.querySelector('.dopamine-metric-value').innerText = value;
        };
    };

    G.injectStyles = function () {
        if (document.getElementById('dopamine-sim-styles')) return;
        const style = document.createElement('style');
        style.id = 'dopamine-sim-styles';
        style.innerHTML = `
            .dopamine-simulation-container { min-height: 500px; height: 100%; width: 100%; overflow: hidden; position: relative; }
            .dopamine-simulation-container canvas { display: block; position: absolute; top: 0; left: 0; pointer-events: auto; }
            .dopamine-controls { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; z-index: 10; width: calc(100% - 20px); justify-content: center; pointer-events: none; }
            .dopamine-controls > * { pointer-events: auto; }
            .dopamine-btn { background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s; min-height: 44px; display: flex; align-items: center; justify-content: center; }
            .dopamine-btn:hover { background: #2d3748; border-color: #4fd1c5; box-shadow: 0 0 10px rgba(79, 209, 197, 0.4); }
            @media (max-width: 1024px) {
                .dopamine-btn { font-size: 16px; padding: 10px 20px; }
            }
            .dopamine-info { color: #4fd1c5; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border-left: 3px solid #4fd1c5; margin-bottom: 10px; font-size: 11px; }

            .dopamine-side-panel {
                position: absolute;
                top: 60px;
                bottom: 20px;
                width: 220px;
                background: rgba(5, 5, 20, 0.7);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(79, 209, 197, 0.2);
                color: #fff;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                z-index: 5;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #4fd1c5 #1a202c;
                transition: transform 0.3s ease;
            }
            .dopamine-side-panel.left { left: 10px; border-radius: 10px; }
            .dopamine-side-panel.right { right: 10px; border-radius: 10px; width: 260px; }

            .dopamine-panel-section {
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 10px;
            }
            .dopamine-panel-section:last-child { border-bottom: none; }
            .dopamine-panel-header {
                font-size: 10px;
                font-weight: bold;
                color: #4fd1c5;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .dopamine-metric-item {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 4px;
                font-family: 'Courier New', Courier, monospace;
            }
            .dopamine-metric-label { color: #a0aec0; }
            .dopamine-metric-value { color: #fff; font-weight: bold; text-shadow: 0 0 5px rgba(79, 209, 197, 0.5); }

            .dopamine-legend-compact { font-size: 10px; }
            .dopamine-legend-item { display: flex; align-items: center; margin-bottom: 4px; transition: color 0.2s; cursor: help; }
            .dopamine-legend-item:hover { color: #4fd1c5; }
            .dopamine-legend-swatch { width: 8px; height: 8px; margin-right: 8px; flex-shrink: 0; border-radius: 50%; }

            .dopamine-side-panel::-webkit-scrollbar { width: 4px; }
            .dopamine-side-panel::-webkit-scrollbar-track { background: #1a202c; }
            .dopamine-side-panel::-webkit-scrollbar-thumb { background: #4fd1c5; border-radius: 10px; }
        `;
        document.head.appendChild(style);
    };

    G.setupReceptors = function () {
        G.state.receptors = [
            { type: 'D1', x: -200, y: 0, z: 0, color: '#ff4d4d', il3Size: 20, tailLength: 60, helixRadius: 15 },
            { type: 'D2', x: -100, y: 0, z: 0, color: '#4d79ff', il3Size: 50, tailLength: 15, helixRadius: 18 },
            { type: 'D3', x: 0, y: 0, z: 0, color: '#4dff4d', il3Size: 45, tailLength: 15, helixRadius: 16 },
            { type: 'D4', x: 100, y: 0, z: 0, color: '#ffff4d', il3Size: 40, tailLength: 20, helixRadius: 14 },
            { type: 'D5', x: 200, y: 0, z: 0, color: '#ff4dff', il3Size: 22, tailLength: 55, helixRadius: 15 }
        ];
    };

    G.setupInteraction = function () {
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

    G.animate = function () {
        if (!G.isRunning) return;
        if (!G.uxState || !G.uxState.isPaused) {
            G.update();
        }
        G.render();
        requestAnimationFrame(() => G.animate());
    };

    G.update = function () {
        G.state.timer++;
        if (!G.isDragging) {
            G.state.camera.rotationY += 0.005;
            // 100. Cinematic Camera: subtle zoom/pan
            if (G.state.cinematicCamera) {
                G.state.camera.zoom = 1.0 + Math.sin(G.state.timer * 0.005) * 0.1;
                G.state.camera.rotationX = Math.sin(G.state.timer * 0.003) * 0.1;
            }
        }

        if (G.updateMolecular) G.updateMolecular();
        if (G.updateSynapse) G.updateSynapse();
        if (G.updateElectrophysiology) G.updateElectrophysiology();
        if (G.updateCircuit) G.updateCircuit();
        if (G.updatePlasticity) G.updatePlasticity();
        if (G.updateClinical) G.updateClinical();
        if (G.updatePharmacology) G.updatePharmacology();
        if (G.updateAnalytics) G.updateAnalytics();
        if (G.updateUX) G.updateUX();
        if (G.updateTooltips) G.updateTooltips();
    };

    G.render = function () {
        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;

        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        // Background with subtle radial gradient
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
        bgGrad.addColorStop(0, '#0a0a20');
        bgGrad.addColorStop(1, '#050510');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        G.state.receptors.forEach(r => {
            const baseP = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (baseP.scale > 0) {
                // 7-TM Helices with Gradients
                for (let i = 0; i < 7; i++) {
                    const angle = (i / 7) * Math.PI * 2 + G.state.timer * 0.01;
                    const hx = r.x + Math.cos(angle) * r.helixRadius;
                    const hz = r.z + Math.sin(angle) * r.helixRadius;
                    const top = project(hx, r.y - 45, hz, cam, { width: w, height: h, near: 10, far: 5000 });
                    const bottom = project(hx, r.y + 45, hz, cam, { width: w, height: h, near: 10, far: 5000 });

                    if (top.scale > 0 && bottom.scale > 0) {
                        const grad = ctx.createLinearGradient(top.x, top.y, bottom.x, bottom.y);
                        grad.addColorStop(0, r.color);
                        grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
                        grad.addColorStop(1, r.color);

                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 8 * top.scale;
                        ctx.lineCap = 'round';
                        ctx.globalAlpha = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(top.x, top.y);
                        ctx.lineTo(bottom.x, bottom.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }
                }

                // Enhanced IL3 Loop (Intracellular Loop 3)
                const il3Top = project(r.x, r.y + 35, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (il3Top.scale > 0) {
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 3 * il3Top.scale;
                    ctx.beginPath();
                    // Draw a more biological curved loop
                    ctx.moveTo(il3Top.x - 10 * il3Top.scale, il3Top.y);
                    ctx.bezierCurveTo(
                        il3Top.x - r.il3Size * il3Top.scale, il3Top.y + r.il3Size * il3Top.scale,
                        il3Top.x + r.il3Size * il3Top.scale, il3Top.y + r.il3Size * il3Top.scale,
                        il3Top.x + 10 * il3Top.scale, il3Top.y
                    );
                    ctx.stroke();
                }

                // Enhanced C-tail (Carboxyl Tail)
                const tailStart = project(r.x + r.helixRadius, r.y + 45, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (tailStart.scale > 0) {
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 2 * tailStart.scale;
                    ctx.beginPath();
                    ctx.moveTo(tailStart.x, tailStart.y);
                    // Pulsing movement for tail
                    const pulse = Math.sin(G.state.timer * 0.05) * 10;
                    ctx.bezierCurveTo(
                        tailStart.x + (15 + pulse) * tailStart.scale, tailStart.y + (r.tailLength / 2) * tailStart.scale,
                        tailStart.x - (15 + pulse) * tailStart.scale, tailStart.y + (r.tailLength) * tailStart.scale,
                        tailStart.x, tailStart.y + (r.tailLength + 10) * tailStart.scale
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = '#fff';
                ctx.font = `bold ${14 * baseP.scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.shadowBlur = 10 * baseP.scale;
                ctx.shadowColor = r.color;
                ctx.fillText(r.type, baseP.x, baseP.y + 110 * baseP.scale);
                ctx.shadowBlur = 0;
            }
        });

        if (G.renderMolecular) G.renderMolecular(ctx, project);
        if (G.renderSynapse) G.renderSynapse(ctx, project);
        if (G.renderElectrophysiology) G.renderElectrophysiology(ctx, project);
        if (G.renderCircuit) G.renderCircuit(ctx, project);
        if (G.renderPlasticity) G.renderPlasticity(ctx, project);
        if (G.renderClinical) G.renderClinical(ctx, project);
        if (G.renderPharmacology) G.renderPharmacology(ctx, project);
        if (G.renderAnalytics) G.renderAnalytics(ctx);
        if (G.renderUX) G.renderUX(ctx);
        if (G.renderLegend) G.renderLegend(ctx);

        // Render Hover Highlight
        if (G.hoverTarget) {
            const h = G.hoverTarget;
            const p = project(h.data.x, h.data.y, h.data.z || 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 30 * p.scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    };

    function captureAttributes() {
        if (window._greenhouseScriptAttributes) return { targetSelector: window._greenhouseScriptAttributes['target-selector-left'], baseUrl: window._greenhouseScriptAttributes['base-url'] };
        const script = document.querySelector('script[src*="dopamine.js"]');
        let baseUrl = script ? script.getAttribute('data-base-url') : null;
        if (baseUrl === null) {
            // Fallback for when data-base-url is missing
            baseUrl = '';
        }
        return {
            targetSelector: script ? script.getAttribute('data-target-selector-left') : '#dopamine-app-container',
            baseUrl: baseUrl
        };
    }

    async function main() {
        try {
            const attributes = captureAttributes();
            const { targetSelector, baseUrl } = attributes;

            console.log('Dopamine App Initializing with:', attributes);

            await G.loadDependencies();
            const GreenhouseUtils = window.GreenhouseUtils;

            // Load modular simulation components
            await GreenhouseUtils.loadScript('models_util.js', baseUrl);
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
            await GreenhouseUtils.loadScript('dopamine_scientific.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_analytics.js', baseUrl);
            await GreenhouseUtils.loadScript('dopamine_ux.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            window.Greenhouse = window.Greenhouse || {};
            window.Greenhouse.initializeDopamineSimulation = function (selector) {
                const container = document.querySelector(selector);
                if (container) G.initialize(container);
            };

            if (targetSelector) {
                const container = document.querySelector(targetSelector);
                if (container) {
                    G.initialize(container, targetSelector);

                    // Render bottom navigation TOC via common utilities
                    const GreenhouseUtils = window.GreenhouseUtils;
                    if (GreenhouseUtils && typeof GreenhouseUtils.renderModelsTOC === 'function') {
                        GreenhouseUtils.renderModelsTOC(targetSelector);
                    }
                } else {
                    console.error('Dopamine App: Container not found on initialization for selector:', targetSelector);
                }
            }
        } catch (error) {
            console.error('Dopamine Simulation App: Initialization failed', error);
        }
    }
    main();
})();
