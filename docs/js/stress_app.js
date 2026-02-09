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
            const f = state.factors;
            const m = state.metrics;
            const Util = window.GreenhouseModelsUtil;
            const frameScale = Util.SimulationEngine.clamp((dt || 16.67) / 16.67, 0.25, 4);

            // Scientific Enhancement 1 & 2: Stomatal Conductance & VPD
            // Simplified Penman-Monteith / Jarvis-style logic
            const temp = f.ambientPressure || 25;
            const rh = f.humidity || 0.6;

            // Saturation vapor pressure (kPa)
            const esat = 0.6112 * Math.exp((17.67 * temp) / (temp + 243.5));
            const eact = esat * rh;
            const vpd = esat - eact; // Enhancement 2: VPD modeled separately

            // Stomatal response to temp (Enhancement 1) - parabolic curve optimized at 25C
            const fTemp = Math.max(0, 1 - 0.005 * Math.pow(temp - 25, 2));
            // Stomatal response to VPD
            const fVPD = Math.max(0.1, 1 - 0.5 * vpd);

            // Stomatal Conductance (Metaphor: Regulatory Openness)
            const stomatalConductance = fTemp * fVPD * (f.copingSkill * 0.8 + 0.2);

            // Scientific Enhancement 4: Salinity (EC) stress
            const ec = f.toxicityLevel || 1.5;
            const salinityStress = Util.SimulationEngine.clamp((ec - 1.2) * 0.1, 0, 0.5);

            // Higher values represent sympathetic dominance and lower values represent parasympathetic recovery.
            const sympatheticDrive = Util.SimulationEngine.clamp(
                f.stressorIntensity * 1.1 + vpd * 0.2 + salinityStress - (stomatalConductance * 0.6 + f.socialSupport * 0.3 + f.sleepRegularity * 0.25),
                0, 1
            );
            m.autonomicBalance = Util.SimulationEngine.smooth(m.autonomicBalance, sympatheticDrive, 0.05 * frameScale);

            const accumulation = m.autonomicBalance * 0.001 * frameScale;
            const recovery = (f.sleepRegularity * 0.5 + stomatalConductance * 0.5) * 0.0008 * frameScale;

            m.allostaticLoad = Util.SimulationEngine.clamp(
                m.allostaticLoad + accumulation - recovery,
                0.05, 1
            );
            if (isNaN(m.allostaticLoad)) console.error("Stress App: allostaticLoad is NaN", {accumulation, recovery, m, f});

            const drain = (m.allostaticLoad * 0.8 + salinityStress * 2.0) * 0.001 * frameScale;
            const recharge = (f.socialSupport * 0.5 + f.sleepRegularity * 0.5) * 0.0005 * frameScale;
            m.resilienceReserve = Util.SimulationEngine.clamp(
                m.resilienceReserve - drain + recharge,
                0, 1
            );

            if (state.time % 200 < dt) {
                if (this.history.length < 5) console.log("Stress App: Pushing to history", m);
                this.history.push({
                    load: m.allostaticLoad,
                    balance: m.autonomicBalance,
                    reserve: m.resilienceReserve
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
                    let min = 0, max = 1, step = 0.01, isPercent = true;
                    if (f.id === 'ambientPressure') { min = 0; max = 45; step = 0.5; isPercent = false; }
                    if (f.id === 'toxicityLevel') { min = 0; max = 10; step = 0.1; isPercent = false; }

                    const updateValDisplay = (val) => {
                        const display = group.querySelector(`#val-${f.id}`);
                        if (display) display.textContent = isPercent ? `${Math.round(val * 100)}%` : val.toFixed(1);
                    };

                    label.innerHTML = `<strong>${t(f.label)}</strong> <span id="val-${f.id}"></span>`;
                    slider.min = min;
                    slider.max = max;
                    slider.step = step;
                    slider.value = this.engine.state.factors[f.id];
                    slider.oninput = (e) => {
                        const val = parseFloat(e.target.value);
                        this.engine.state.factors[f.id] = val;
                        updateValDisplay(val);
                        slider.setAttribute('aria-valuetext', isPercent ? `${Math.round(val * 100)}%` : val.toFixed(1));
                    };
                    updateValDisplay(this.engine.state.factors[f.id]);
                    slider.setAttribute('aria-valuetext', isPercent ? `${Math.round(this.engine.state.factors[f.id] * 100)}%` : this.engine.state.factors[f.id].toFixed(1));
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

            const scenarioContainer = document.createElement('div');
            scenarioContainer.className = 'greenhouse-scenario-container';
            scenarioContainer.style.padding = '10px 20px';
            scenarioContainer.style.display = 'flex';
            scenarioContainer.style.flexWrap = 'wrap';
            scenarioContainer.style.gap = '10px';

            const scenarios = [
                { label: 'Heat Wave', values: { ambientPressure: 38, stressorIntensity: 0.8 } },
                { label: 'Drought', values: { humidity: 0.2, stressorIntensity: 0.7 } },
                { label: 'Toxicity', values: { toxicityLevel: 5.0, stressorIntensity: 0.6 } }
            ];

            scenarios.forEach(s => {
                const btn = document.createElement('button');
                btn.textContent = s.label;
                btn.className = 'greenhouse-btn greenhouse-btn-primary';
                btn.style.padding = '5px 10px';
                btn.style.fontSize = '12px';
                btn.style.borderRadius = '15px';
                btn.onclick = () => {
                    Object.keys(s.values).forEach(k => {
                        this.engine.state.factors[k] = s.values[k];
                        const slider = container.querySelector(`#stress-${k}`);
                        if (slider) {
                            slider.value = s.values[k];
                            slider.dispatchEvent(new Event('input'));
                        }
                    });
                };
                scenarioContainer.appendChild(btn);
            });

            const resetContainer = document.createElement('div');
            resetContainer.className = 'greenhouse-reset-container';
            resetContainer.style.padding = '10px 20px 20px';
            resetContainer.style.width = '100%';
            resetContainer.style.boxSizing = 'border-box';
            resetContainer.style.display = 'flex';
            resetContainer.style.justifyContent = 'flex-start';
            resetContainer.style.gap = '20px';

            const resetButton = document.createElement('button');
            resetButton.type = 'button';
            resetButton.className = 'greenhouse-btn greenhouse-btn-secondary';
            resetButton.textContent = t('reset_to_default');
            resetButton.style.padding = '10px 20px';
            resetButton.style.width = 'auto';
            resetButton.style.minWidth = '160px';
            resetButton.style.background = '#1f6f7a';
            resetButton.style.color = '#fff';
            resetButton.style.border = '1px solid rgba(255,255,255,0.35)';
            resetButton.style.borderRadius = '25px';
            resetButton.style.cursor = 'pointer';
            resetButton.style.fontSize = '14px';
            resetButton.style.fontWeight = '600';
            resetButton.style.transition = 'all 0.3s ease';
            resetButton.style.whiteSpace = 'nowrap';
            resetButton.style.display = 'inline-block';

            resetButton.onmouseover = () => {
                resetButton.style.background = '#2a8a96';
                resetButton.style.transform = 'translateY(-1px)';
            };
            resetButton.onmouseout = () => {
                resetButton.style.background = '#1f6f7a';
                resetButton.style.transform = 'translateY(0)';
            };

            resetButton.onclick = () => this.init(container);
            resetContainer.appendChild(resetButton);

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
            container.appendChild(scenarioContainer);
            container.appendChild(controls);
            container.appendChild(resetContainer);
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

            if (this.engine.state.time % 1000 < 20) console.log("Stress App: Rendering frame", {w, h, viewMode: this.engine.state.factors.viewMode});

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
            console.log("Stress App: renderGraph called", {w, h});
            const margin = { top: 50, right: 150, bottom: 50, left: 60 };
            const graphWidth = w - margin.left - margin.right;
            const graphHeight = h - margin.top - margin.bottom;

            // Enhancement 91: Threshold Bands (Safe/Caution/Critical)
            const drawBand = (yMin, yMax, color, label) => {
                const y1 = (h - margin.bottom) - yMax * graphHeight;
                const y2 = (h - margin.bottom) - yMin * graphHeight;
                ctx.fillStyle = color;
                ctx.fillRect(margin.left, y1, graphWidth, y2 - y1);

                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '10px Arial';
                ctx.fillText(label, margin.left + 5, y1 + 12);
            };

            drawBand(0, 0.3, 'rgba(76, 175, 80, 0.15)', t('band_safe'));
            drawBand(0.3, 0.7, 'rgba(255, 193, 7, 0.15)', t('band_caution'));
            drawBand(0.7, 1.0, 'rgba(244, 67, 54, 0.15)', t('band_critical'));

            // Grid lines
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.moveTo(margin.left, margin.top);
            ctx.lineTo(margin.left, h - margin.bottom);
            ctx.lineTo(w - margin.right, h - margin.bottom);
            ctx.stroke();

            if (this.history.length > 1) {
                // Enhancement 81: Layered ribbons and uncertainty ribbons (simulated with opacity)
                const drawRibbon = (key, color) => {
                    ctx.beginPath();
                    // Basic hex to rgba conversion for the ribbon
                    const rgba = color.startsWith('#') ?
                        `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, 0.2)` :
                        color;
                    ctx.fillStyle = rgba;
                    this.history.forEach((point, i) => {
                        const x = margin.left + (i / (this.maxHistory - 1)) * graphWidth;
                        const y = (h - margin.bottom) - point[key] * graphHeight;
                        if (i === 0) ctx.moveTo(x, h - margin.bottom);
                        ctx.lineTo(x, y);
                    });
                    ctx.lineTo(margin.left + (this.history.length - 1) / (this.maxHistory - 1) * graphWidth, h - margin.bottom);
                    ctx.closePath();
                    ctx.fill();
                };

                const drawLine = (key, color) => {
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                    this.history.forEach((point, i) => {
                        const x = margin.left + (i / (this.maxHistory - 1)) * graphWidth;
                        const y = (h - margin.bottom) - point[key] * graphHeight;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                };

                drawRibbon('load', config.visual.colors.load);
                drawRibbon('reserve', config.visual.colors.reserve);
                drawLine('load', config.visual.colors.load);
                drawLine('reserve', config.visual.colors.reserve);
            }

            // Legend
            const legendX = w - margin.right + 20;
            ctx.fillStyle = config.visual.colors.load;
            ctx.fillRect(legendX, 60, 12, 12);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Quicksand, sans-serif';
            ctx.fillText(t('metric_allostatic_load'), legendX + 20, 70);

            ctx.fillStyle = config.visual.colors.reserve;
            ctx.fillRect(legendX, 85, 12, 12);
            ctx.fillStyle = '#fff';
            ctx.fillText(t('metric_resilience_reserve'), legendX + 20, 95);
        }
    };

    window.GreenhouseStressApp = GreenhouseStressApp;
})();
