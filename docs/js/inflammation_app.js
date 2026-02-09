/**
 * @file inflammation_app.js
 * @description Main application logic for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationApp = {
        engine: null,
        canvas: null,
        ctx: null,
        isRunning: false,
        nodes: [],
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 400, near: 10, far: 5000 },

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

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            const config = window.GreenhouseInflammationConfig;

            // Initialize Engine
            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => {
                    acc[f.id] = f.defaultValue;
                    return acc;
                }, {}),
                initialMetrics: {
                    inflammatoryTone: 0.2,
                    signalingEfficiency: 1.0,
                    recoveryMomentum: 0.5
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            // Initialize 3D UI components
            if (window.GreenhouseInflammationUI3D) {
                window.GreenhouseInflammationUI3D.init(this);
            }

            this.createUI(container);

            this.isRunning = true;
            this.startLoop();

            window.addEventListener('resize', () => this.handleResize(container));

            // Resilience logic: observe the container for removal and restart if needed
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
                window.GreenhouseUtils.startSentinel(container, selector, this, 'init');
            }
        },

        handleResize(container) {
            this.canvas.width = container.offsetWidth;
            this.projection.width = this.canvas.width;
        },

        updateModel(state, dt) {
            const factors = state.factors;
            const metrics = state.metrics;
            const Util = window.GreenhouseModelsUtil;

            const targetTone = Util.SimulationEngine.clamp(
                (factors.immuneTrigger * 0.6 + factors.stressLoad * 0.4) * (1.2 - factors.sleepQuality * 0.5 - factors.dietSupport * 0.3),
                0, 1
            );

            metrics.inflammatoryTone = Util.SimulationEngine.smooth(metrics.inflammatoryTone, targetTone, 0.01);

            const targetEfficiency = 1.0 - metrics.inflammatoryTone * 0.7;
            metrics.signalingEfficiency = Util.SimulationEngine.smooth(metrics.signalingEfficiency, targetEfficiency, 0.05);

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

            const config = window.GreenhouseInflammationConfig;

            config.factors.forEach(f => {
                const group = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = t(f.label);
                label.style.display = 'block';
                label.style.fontSize = '12px';
                label.style.marginBottom = '5px';

                const valueDisplay = document.createElement('span');
                valueDisplay.style.fontSize = '10px';
                valueDisplay.style.marginLeft = '10px';
                valueDisplay.style.color = 'rgba(255,255,255,0.6)';

                const updateDisplay = (val) => {
                    if (f.id === 'viewMode') {
                        const modes = ['option_macro', 'option_micro', 'option_molecular'];
                        valueDisplay.textContent = t(modes[Math.round(val)]);
                    } else {
                        valueDisplay.textContent = (val * 100).toFixed(0) + '%';
                    }
                };
                updateDisplay(this.engine.state.factors[f.id]);
                label.appendChild(valueDisplay);

                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = f.min !== undefined ? f.min : 0;
                slider.max = f.max !== undefined ? f.max : 1;
                slider.step = f.step !== undefined ? f.step : 0.01;
                slider.value = this.engine.state.factors[f.id];
                slider.style.width = '100%';
                slider.oninput = (e) => {
                    const val = parseFloat(e.target.value);
                    this.engine.state.factors[f.id] = val;
                    updateDisplay(val);
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
            const state = this.engine.state;
            const tone = state.metrics.inflammatoryTone;

            ctx.clearRect(0, 0, w, h);

            // Rotate camera slightly
            this.camera.rotationY += 0.002;

            // Background glow
            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
            grad.addColorStop(0, `rgba(${100 * tone + 10}, 10, 20, 0.2)`);
            grad.addColorStop(1, '#050505');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (window.GreenhouseInflammationUI3D) {
                window.GreenhouseInflammationUI3D.render(ctx, state, this.camera, this.projection);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(t('inflam_sim_title'), 20, 30);
        }
    };

    window.GreenhouseInflammationApp = GreenhouseInflammationApp;
})();
