/**
 * @file inflammation.js
 * @description Loader and application logic for the Neuroinflammation Simulation.
 */

(async function () {
    'use strict';
    console.log('Inflammation App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Inflammation App: Dependency manager timeout:', error);
            }
        } else {
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
        }
        GreenhouseUtils = window.GreenhouseUtils;
    };

    const captureScriptAttributes = () => {
        const scriptElement = document.currentScript || document.querySelector('script[src*="inflammation.js"]');
        if (!scriptElement) {
            console.error('Inflammation App: Script element not found.');
            return { baseUrl: '', targetSelector: '#inflammation-app-container' };
        }
        return {
            baseUrl: scriptElement.getAttribute('data-base-url') || '',
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || '#inflammation-app-container'
        };
    };

    async function main() {
        try {
            const { baseUrl, targetSelector } = captureScriptAttributes();
            await loadDependencies();

            if (!window.GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load shared models dependencies
            await window.GreenhouseUtils.loadScript('models_lang.js', baseUrl);
            await window.GreenhouseUtils.loadScript('models_util.js', baseUrl);

            if (window.GreenhouseInflammationApp) {
                window.GreenhouseInflammationApp.init(targetSelector);

                if (window.GreenhouseUtils.renderModelsTOC) {
                    window.GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                // Application logic will be defined here or loaded
                // For this combined file pattern, we define it here if not separate
                // But Phase 4 logic is next.
            }

        } catch (error) {
            console.error('Inflammation App: Initialization failed:', error);
        }
    }

    // --- Application Logic ---
    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    window.GreenhouseInflammationApp = {
        engine: null,
        canvas: null,
        ctx: null,
        isRunning: false,
        nodes: [],
        particles: [],

        init(selector) {
            console.log("GreenhouseInflammationApp: Initializing on", selector);
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) return;

            container.innerHTML = '';
            container.style.backgroundColor = '#050505';
            container.style.position = 'relative';
            container.style.minHeight = '600px';
            container.style.color = '#fff';
            container.style.fontFamily = 'Quicksand, sans-serif';

            // Create Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 400;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            // Initialize Engine
            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: {
                    immuneTrigger: 0.2,
                    sleepQuality: 0.8,
                    dietSupport: 0.5,
                    stressLoad: 0.3
                },
                initialMetrics: {
                    inflammatoryTone: 0.2,
                    signalingEfficiency: 1.0,
                    recoveryMomentum: 0.5
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            this.initNodes();
            this.createUI(container);

            this.isRunning = true;
            this.startLoop();

            window.addEventListener('resize', () => this.handleResize(container));
        },

        handleResize(container) {
            this.canvas.width = container.offsetWidth;
            this.initNodes();
        },

        initNodes() {
            this.nodes = [];
            const count = 40;
            for (let i = 0; i < count; i++) {
                this.nodes.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    activation: 0
                });
            }
        },

        updateModel(state, dt) {
            const factors = state.factors;
            const metrics = state.metrics;
            const Util = window.GreenhouseModelsUtil;

            // Mathematical Logic for Inflammation
            // Tone increases with trigger and stress, decreases with sleep and diet
            const targetTone = Util.SimulationEngine.clamp(
                (factors.immuneTrigger * 0.6 + factors.stressLoad * 0.4) * (1.2 - factors.sleepQuality * 0.5 - factors.dietSupport * 0.3),
                0, 1
            );

            metrics.inflammatoryTone = Util.SimulationEngine.smooth(metrics.inflammatoryTone, targetTone, 0.01);

            // Signaling efficiency drops as inflammation rises
            const targetEfficiency = 1.0 - metrics.inflammatoryTone * 0.7;
            metrics.signalingEfficiency = Util.SimulationEngine.smooth(metrics.signalingEfficiency, targetEfficiency, 0.05);

            // Recovery momentum depends on sleep and diet vs current tone
            const targetRecovery = Util.SimulationEngine.clamp(
                (factors.sleepQuality * 0.7 + factors.dietSupport * 0.3) * (1 - metrics.inflammatoryTone),
                0, 1
            );
            metrics.recoveryMomentum = Util.SimulationEngine.smooth(metrics.recoveryMomentum, targetRecovery, 0.02);
        },

        createUI(container) {
            const controls = document.createElement('div');
            controls.style.padding = '20px';
            controls.style.display = 'grid';
            controls.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
            controls.style.gap = '20px';
            controls.style.background = 'rgba(255,255,255,0.05)';

            const factors = [
                { id: 'immuneTrigger', label: t('label_immune_trigger') },
                { id: 'sleepQuality', label: t('label_sleep_quality') },
                { id: 'dietSupport', label: t('label_diet_support') },
                { id: 'stressLoad', label: t('label_stress_coload') }
            ];

            factors.forEach(f => {
                const group = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = f.label;
                label.style.display = 'block';
                label.style.fontSize = '12px';
                label.style.marginBottom = '5px';

                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = 0;
                slider.max = 1;
                slider.step = 0.01;
                slider.value = this.engine.state.factors[f.id];
                slider.style.width = '100%';
                slider.oninput = (e) => {
                    this.engine.state.factors[f.id] = parseFloat(e.target.value);
                };

                group.appendChild(label);
                group.appendChild(slider);
                controls.appendChild(group);
            });

            this.metricsDisplay = document.createElement('div');
            this.metricsDisplay.style.padding = '10px 20px';
            this.metricsDisplay.style.fontSize = '13px';
            this.metricsDisplay.style.borderTop = '1px solid rgba(255,255,255,0.1)';
            this.metricsDisplay.style.display = 'flex';
            this.metricsDisplay.style.gap = '30px';

            container.appendChild(controls);
            container.appendChild(this.metricsDisplay);
        },

        updateMetricsUI() {
            const m = this.engine.state.metrics;
            this.metricsDisplay.innerHTML = `
                <span><strong>${t('metric_inflam_tone')}:</strong> ${(m.inflammatoryTone * 100).toFixed(1)}%</span>
                <span><strong>${t('metric_signaling_eff')}:</strong> ${(m.signalingEfficiency * 100).toFixed(1)}%</span>
                <span><strong>${t('metric_recovery_mom')}:</strong> ${(m.recoveryMomentum * 100).toFixed(1)}%</span>
            `;
        },

        startLoop() {
            const loop = (t) => {
                if (!this.isRunning) return;
                this.engine.update(t);
                this.render();
                this.updateMetricsUI();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const tone = this.engine.state.metrics.inflammatoryTone;

            ctx.clearRect(0, 0, w, h);

            // Background glow
            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
            grad.addColorStop(0, `rgba(${100 * tone + 10}, 10, 20, 0.2)`);
            grad.addColorStop(1, '#050505');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Draw Nodes (Glial cells / Neurons)
            this.nodes.forEach(n => {
                n.x += n.vx * (1 + tone);
                n.y += n.vy * (1 + tone);

                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;

                ctx.beginPath();
                ctx.arc(n.x, n.y, 3 + tone * 5, 0, Math.PI * 2);
                ctx.fillStyle = tone > 0.5 ? `rgba(255, ${200 * (1 - tone)}, 50, 0.8)` : `rgba(100, 200, 255, 0.6)`;
                ctx.fill();

                // Connections
                this.nodes.forEach(n2 => {
                    const dx = n.x - n2.x;
                    const dy = n.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 * (1 - dist / 80) * (1 - tone)})`;
                        if (tone > 0.6) ctx.strokeStyle = `rgba(255, 100, 0, ${0.1 * (1 - dist / 80)})`;
                        ctx.stroke();
                    }
                });
            });

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(t('inflam_sim_title'), 20, 30);
        }
    };

    main();
})();
