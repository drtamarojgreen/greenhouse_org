/**
 * @file stress_app.js
 * @description Main application logic for the Stress Dynamics Simulation.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressApp = {
        engine: null,
        canvas: null,
        ctx: null,
        isRunning: false,
        history: [],
        maxHistory: 200,
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 400, near: 10, far: 5000 },

        init(selector) {
            console.log("GreenhouseStressApp: Initializing on", selector);
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) return;

            container.innerHTML = '';
            container.style.backgroundColor = '#050510'; // Deep blue
            container.style.position = 'relative';
            container.style.minHeight = '600px';
            container.style.color = '#fff';
            container.style.fontFamily = 'Quicksand, sans-serif';

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 400;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            const config = window.GreenhouseStressConfig;
            this.maxHistory = config.visual.maxHistory;

            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => {
                    acc[f.id] = f.defaultValue;
                    return acc;
                }, {}),
                initialMetrics: {
                    allostaticLoad: 0.2,
                    autonomicBalance: 0.5,
                    resilienceReserve: 0.8
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            this.createUI(container);
            this.isRunning = true;
            this.startLoop();

            window.addEventListener('resize', () => {
                this.canvas.width = container.offsetWidth;
                this.projection.width = this.canvas.width;
            });

            // Resilience logic
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
                window.GreenhouseUtils.startSentinel(container, selector, this, 'init');
            }
        },

        updateModel(state, dt) {
            const factors = state.factors;
            const metrics = state.metrics;
            const Util = window.GreenhouseModelsUtil;
            const frameScale = Util.SimulationEngine.clamp((dt || 16.67) / 16.67, 0.25, 4);

            // Higher values represent sympathetic dominance and lower values represent parasympathetic recovery.
            const sympatheticDrive = Util.SimulationEngine.clamp(
                factors.stressorIntensity * 1.1 - (factors.copingSkill * 0.45 + factors.socialSupport * 0.3 + factors.sleepRegularity * 0.25),
                0, 1
            );
            metrics.autonomicBalance = Util.SimulationEngine.smooth(metrics.autonomicBalance, sympatheticDrive, 0.05 * frameScale);

            const accumulation = metrics.autonomicBalance * 0.001 * frameScale;
            const recovery = (factors.sleepRegularity * 0.6 + factors.copingSkill * 0.4) * 0.0008 * frameScale;

            metrics.allostaticLoad = Util.SimulationEngine.clamp(
                metrics.allostaticLoad + accumulation - recovery,
                0.05, 1
            );

            const drain = metrics.allostaticLoad * 0.001 * frameScale;
            const recharge = (factors.socialSupport * 0.5 + factors.sleepRegularity * 0.5) * 0.0005 * frameScale;
            metrics.resilienceReserve = Util.SimulationEngine.clamp(
                metrics.resilienceReserve - drain + recharge,
                0, 1
            );

            if (state.time % 200 < dt) {
                this.history.push({
                    load: metrics.allostaticLoad,
                    balance: metrics.autonomicBalance,
                    reserve: metrics.resilienceReserve
                });
                if (this.history.length > this.maxHistory) this.history.shift();
            }
        },

        createUI(container) {
            const heading = document.createElement('h2');
            heading.textContent = t('stress_sim_title');
            heading.style.margin = '16px 20px 0';
            heading.style.fontSize = '1.1rem';

            const intro = document.createElement('p');
            intro.textContent = t('stress_model_intro');
            intro.style.margin = '8px 20px 12px';
            intro.style.fontSize = '0.9rem';
            intro.style.color = 'rgba(255,255,255,0.88)';

            const controls = document.createElement('div');
            controls.className = 'greenhouse-controls-panel';
            controls.style.display = 'grid';
            controls.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
            controls.style.gap = '20px';
            controls.style.background = 'rgba(0,0,0,0.3)';
            controls.style.border = 'none';
            controls.style.borderRadius = '0';

            const config = window.GreenhouseStressConfig;

            config.factors.forEach(f => {
                const group = document.createElement('div');
                const label = document.createElement('label');
                const inputId = `stress-${f.id}`;
                label.style.display = 'block';
                label.style.fontSize = '12px';
                label.style.marginBottom = '5px';
                label.setAttribute('for', inputId);

                const slider = document.createElement('input');
                slider.id = inputId;
                slider.type = 'range';
                slider.className = 'greenhouse-slider';

                if (f.id === 'viewMode') {
                    slider.min = 0;
                    slider.max = f.options.length - 1;
                    slider.step = 1;
                    slider.value = this.engine.state.factors[f.id];

                    const updateLabel = () => {
                        const opt = f.options[slider.value];
                        label.innerHTML = `<strong>${t(f.label)}</strong> <span style="color:#4ca1af">${t(opt.label)}</span>`;
                    };
                    slider.oninput = (e) => {
                        this.engine.state.factors[f.id] = parseInt(e.target.value);
                        updateLabel();
                    };
                    updateLabel();
                } else {
                    label.innerHTML = `<strong>${t(f.label)}</strong> <span id="val-${f.id}">${Math.round(this.engine.state.factors[f.id] * 100)}%</span>`;
                    slider.min = 0;
                    slider.max = 1;
                    slider.step = 0.01;
                    slider.value = this.engine.state.factors[f.id];
                    slider.oninput = (e) => {
                        const val = parseFloat(e.target.value);
                        this.engine.state.factors[f.id] = val;
                        const display = group.querySelector(`#val-${f.id}`);
                        if (display) display.textContent = `${Math.round(val * 100)}%`;
                        slider.setAttribute('aria-valuetext', `${Math.round(val * 100)}%`);
                    };
                    slider.setAttribute('aria-valuetext', `${Math.round(this.engine.state.factors[f.id] * 100)}%`);
                }

                group.appendChild(label);
                group.appendChild(slider);

                if (f.description) {
                    const desc = document.createElement('p');
                    desc.textContent = t(f.description);
                    desc.style.fontSize = '10px';
                    desc.style.margin = '5px 0 0 0';
                    desc.style.color = 'rgba(255,255,255,0.5)';
                    group.appendChild(desc);
                }

                controls.appendChild(group);
            });

            const resetButton = document.createElement('button');
            resetButton.type = 'button';
            resetButton.textContent = t('reset_to_default');
            resetButton.style.padding = '8px 12px';
            resetButton.style.margin = '0 20px 12px';
            resetButton.style.width = 'fit-content';
            resetButton.style.background = '#1f6f7a';
            resetButton.style.color = '#fff';
            resetButton.style.border = '1px solid rgba(255,255,255,0.35)';
            resetButton.style.borderRadius = '6px';
            resetButton.onclick = () => this.init(container);

            this.metricsDisplay = document.createElement('div');
            this.metricsDisplay.className = 'greenhouse-metrics-panel';
            this.metricsDisplay.style.background = 'rgba(0,0,0,0.5)';
            this.metricsDisplay.style.border = 'none';
            this.metricsDisplay.style.color = '#fff';
            this.metricsDisplay.style.display = 'flex';
            this.metricsDisplay.style.flexWrap = 'wrap';
            this.metricsDisplay.style.gap = '30px';
            this.metricsDisplay.style.marginTop = '0';
            this.metricsDisplay.setAttribute('role', 'status');
            this.metricsDisplay.setAttribute('aria-live', 'polite');

            container.appendChild(heading);
            container.appendChild(intro);
            container.appendChild(controls);
            container.appendChild(resetButton);
            container.appendChild(this.metricsDisplay);

            const disclaimer = document.createElement('p');
            disclaimer.style.fontSize = '10px';
            disclaimer.style.color = 'rgba(255,255,255,0.4)';
            disclaimer.style.margin = '20px';
            disclaimer.style.textAlign = 'center';
            disclaimer.textContent = t('edu_banner');
            container.appendChild(disclaimer);
        },

        updateMetricsUI() {
            const m = this.engine.state.metrics;
            this.metricsDisplay.innerHTML = `
                <span><strong>${t('metric_allostatic_load')}:</strong> ${(m.allostaticLoad * 100).toFixed(1)}%</span>
                <span><strong>${t('metric_autonomic_balance')}:</strong> ${m.autonomicBalance > 0.6 ? t('state_sympathetic_dominant') : m.autonomicBalance < 0.4 ? t('state_parasympathetic_dominant') : t('state_balanced')}</span>
                <span><strong>${t('metric_resilience_reserve')}:</strong> ${(m.resilienceReserve * 100).toFixed(1)}%</span>
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
            const config = window.GreenhouseStressConfig;

            ctx.clearRect(0, 0, w, h);

            // 3D Rendering
            if (window.GreenhouseStressUI3D) {
                window.GreenhouseStressUI3D.render(ctx, this.engine.state, this.camera, this.projection);
            }

            // Draw Graph (2D Overlay) - Only in systemic view
            if (this.engine.state.factors.viewMode === 2) {
                this.renderGraph(ctx, w, h, config);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(t('stress_sim_title'), 20, 30);
        },

        renderGraph(ctx, w, h, config) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.moveTo(50, 50);
            ctx.lineTo(50, h - 50);
            ctx.lineTo(w - 50, h - 50);
            ctx.stroke();

            if (this.history.length > 1) {
                const drawLine = (key, color) => {
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    this.history.forEach((point, i) => {
                        const x = 50 + (i / (this.maxHistory - 1)) * (w - 100);
                        const y = (h - 50) - point[key] * (h - 100);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                };

                drawLine('load', config.visual.colors.load);
                drawLine('reserve', config.visual.colors.reserve);
            }

            // Legend
            ctx.fillStyle = config.visual.colors.load;
            ctx.fillRect(w - 150, 60, 10, 10);
            ctx.fillStyle = '#fff';
            ctx.fillText(t('metric_allostatic_load'), w - 135, 70);

            ctx.fillStyle = config.visual.colors.reserve;
            ctx.fillRect(w - 150, 80, 10, 10);
            ctx.fillStyle = '#fff';
            ctx.fillText(t('metric_resilience_reserve'), w - 135, 90);
        }
    };

    window.GreenhouseStressApp = GreenhouseStressApp;
})();
