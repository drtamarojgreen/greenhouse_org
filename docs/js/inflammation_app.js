/**
 * @file inflammation_app.js
 * @description Main application logic for the Neuroinflammation Simulation.
 * Reconfigured for binary factor control (Checkboxes).
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationApp = {
        engine: null,
        canvas: null,
        ctx: null,
        isRunning: false,
        clock: null,
        camera: { x: 0, y: 0, z: -800, rotationX: 0.3, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 600, near: 10, far: 5000 },
        interaction: { isDragging: false, lastX: 0, lastY: 0, mouseX: 0, mouseY: 0 },
        ui: { hoveredElement: null, checkboxes: [], buttons: [] },

        init(selector) {
            console.log("GreenhouseInflammationApp: Initializing Checkbox-Driven UI...");
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) return;

            container.innerHTML = '';
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 1000;
            this.canvas.height = 700;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            const config = window.GreenhouseInflammationConfig;
            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => { acc[f.id] = f.defaultValue; return acc; }, {}),
                initialMetrics: { tnfAlpha: 10, il10: 5, microgliaActivation: 0.1, bbbIntegrity: 1.0, neuroprotection: 1.0, stressBurden: 0.15 },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            this.clock = new window.GreenhouseModelsUtil.DiurnalClock();
            this.clock.timeInHours = 8.0; // Consistently start at 8am

            if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.init(this);
            this.setupUI();

            this.canvas.onmousedown = (e) => this.handleMouseDown(e);
            this.canvas.onmousemove = (e) => this.handleMouseMove(e);
            this.canvas.onmouseup = () => this.handleMouseUp();
            this.canvas.onwheel = (e) => this.handleWheel(e);

            this.isRunning = true;
            this.startLoop();
        },

        setupUI() {
            const config = window.GreenhouseInflammationConfig;
            this.ui.checkboxes = [];
            let triggerCount = 0;
            let modCount = 0;

            config.factors.forEach(f => {
                if (f.type !== 'checkbox') return;
                const isProtective = f.impact < 0;
                this.ui.checkboxes.push({
                    id: f.id, label: f.label,
                    x: isProtective ? 250 : 40,
                    y: 120 + (isProtective ? modCount++ : triggerCount++) * 32,
                    w: 200, h: 24
                });
            });

            this.ui.buttons = [
                { id: 'mode_macro', label: 'MACRO', x: 40, y: 70, w: 60, h: 22, val: 0 },
                { id: 'mode_micro', label: 'MICRO', x: 105, y: 70, w: 60, h: 22, val: 1 },
                { id: 'mode_molecular', label: 'MOLECULAR', x: 170, y: 70, w: 80, h: 22, val: 2 }
            ];
        },

        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            for (const c of this.ui.checkboxes) {
                if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                    this.engine.state.factors[c.id] = this.engine.state.factors[c.id] === 1 ? 0 : 1;
                    return;
                }
            }
            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this.engine.state.factors.viewMode = b.val; return;
                }
            }
            this.interaction.isDragging = true;
            this.interaction.lastX = e.clientX;
            this.interaction.lastY = e.clientY;
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.interaction.mouseX = mx;
            this.interaction.mouseY = my;

            this.ui.hoveredElement = null;
            for (const c of this.ui.checkboxes) {
                if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                    this.ui.hoveredElement = { ...c, type: 'checkbox' }; break;
                }
            }
            if (!this.ui.hoveredElement) {
                for (const b of this.ui.buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.ui.hoveredElement = { ...b, type: 'button' }; break;
                    }
                }
            }
            if (!this.ui.hoveredElement && window.GreenhouseInflammationUI3D) {
                this.ui.hoveredElement = window.GreenhouseInflammationUI3D.checkHover(mx, my, this.camera, this.projection);
            }

            if (this.interaction.isDragging) {
                this.camera.rotationY += (e.clientX - this.interaction.lastX) * 0.01;
                this.camera.rotationX += (e.clientY - this.interaction.lastY) * 0.01;
                this.interaction.lastX = e.clientX;
                this.interaction.lastY = e.clientY;
            }
        },

        handleMouseUp() { this.interaction.isDragging = false; },
        handleWheel(e) { e.preventDefault(); this.camera.z = Math.min(-100, Math.max(-2000, this.camera.z + e.deltaY * 0.8)); },

        updateModel(state, dt) {
            const f = state.factors;
            const m = state.metrics;
            const Util = window.GreenhouseModelsUtil;

            // 1. Advance Clock
            if (this.clock) {
                this.clock.update(dt);
                f.timeOfDay = this.clock.timeInHours;
            }

            // 2. Inter-Model Stress Bridge
            // Pull real-time data from Stress simulation via global bridge
            let externalStress = 0;
            if (window.GreenhouseBioStatus && window.GreenhouseBioStatus.stress) {
                externalStress = window.GreenhouseBioStatus.stress.load;
                m.stressBurden = Util.SimulationEngine.smooth(m.stressBurden, externalStress, 0.01);
            }

            // 3. Pro-inflammatory Drive
            // Stress acts as a direct multiplier for inflammation (modeling HMGB1 / Alarmin pathways)
            const stressImpact = (f.chronicStress * 0.3) + (m.stressBurden * 0.5);
            const trigger = (f.pathogenActive * 0.5) + stressImpact + (f.poorSleep * 0.2) + (f.leakyGut * 0.2);
            const suppression = (f.nsaidsApp * 0.3) + (f.steroidsApp * 0.6) + (f.tnfInhibitors * 0.8) + (f.cleanDiet * 0.1);

            const targetTnf = Util.SimulationEngine.clamp(trigger * 400 * (1 - suppression), 5, 500);
            m.tnfAlpha = Util.SimulationEngine.smooth(m.tnfAlpha, targetTnf, 0.03);

            // 4. Anti-inflammatory
            // Circadian rhythm affects IL-10 synthesis peaks (usually night/early morning)
            const circadianPeak = this.clock ? (1.0 - this.clock.getCortisolFactor()) * 10 : 0;
            const targetIl10 = Util.SimulationEngine.clamp((m.tnfAlpha * 0.1) + (f.exerciseRegular * 15) + (f.cleanDiet * 10) + circadianPeak, 2, 60);
            m.il10 = Util.SimulationEngine.smooth(m.il10, targetIl10, 0.02);

            // 5. Glial State (M1 vs M2 shift)
            const activation = (m.tnfAlpha / 500) * (1 - (f.steroidsApp * 0.7));
            m.microgliaActivation = Util.SimulationEngine.smooth(m.microgliaActivation, Util.SimulationEngine.clamp(activation, 0, 1), 0.02);

            // 6. Structural Integrity (Stress-induced BBB Permeability)
            // Excessive cortisol (stressBurden) disrupts tight junctions
            const stressDamage = m.stressBurden * 0.0002;
            const damage = (m.tnfAlpha * 0.0001) + stressDamage;
            const repair = (f.cleanDiet * 0.00005) + (1 - f.poorSleep) * 0.0001;
            m.bbbIntegrity = Util.SimulationEngine.clamp(m.bbbIntegrity - damage + repair, 0.2, 1.0);

            m.neuroprotection = Util.SimulationEngine.clamp((m.bbbIntegrity * 0.7) + (m.il10 / 100) - (m.microgliaActivation * 0.3), 0, 1);

            // 7. Neurotransmitter Activity (Tryptophan Breakdown)
            // Inflammatory tone (TNF-alpha) activates IDO enzyme, re-routing Tryptophan to Kynurenine
            const idoActivation = Util.SimulationEngine.clamp(m.tnfAlpha / 300, 0, 1);
            m.tryptophanLevels = Util.SimulationEngine.smooth(m.tryptophanLevels || 100, 100 * (1 - idoActivation * 0.7), 0.02);
            m.kynurenineLevels = Util.SimulationEngine.smooth(m.kynurenineLevels || 10, 10 + (idoActivation * 80), 0.02);
            m.neurotoxicLoad = m.kynurenineLevels / (m.tryptophanLevels + 1);

            // Sync outcome back to bridge
            if (window.GreenhouseBioStatus) {
                window.GreenhouseBioStatus.sync('inflammation', {
                    tone: m.tnfAlpha / 500,
                    bbb: m.bbbIntegrity,
                    microglia: m.microgliaActivation,
                    tryptophan: m.tryptophanLevels,
                    kynurenine: m.kynurenineLevels,
                    neurotoxicLoad: m.neurotoxicLoad
                });
            }

            state.metrics.inflammatoryTone = m.tnfAlpha / 500;
        },

        startLoop() {
            const loop = (t) => { if (this.isRunning) { this.engine.update(t); this.render(); requestAnimationFrame(loop); } };
            requestAnimationFrame(loop);
        },

        render() {
            const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, state = this.engine.state;
            ctx.fillStyle = '#050710'; ctx.fillRect(0, 0, w, h);
            if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.render(ctx, state, this.camera, this.projection);
            this.drawUI(ctx, w, h, state);
        },

        drawUI(ctx, w, h, state) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Quicksand, sans-serif'; ctx.fillText('NEUROINFLAMMATION ENGINE', 40, 40);
            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 12px Quicksand, sans-serif';
            const modes = ['btn_mode_macro', 'btn_mode_micro', 'btn_mode_molecular', 'btn_mode_pathway'];
            const modeName = t(modes[state.factors.viewMode || 0]);
            ctx.fillText(`${modeName} LEVEL: IMMUNE STATE`, 40, 60);

            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = 'bold 9px Quicksand, sans-serif';
            ctx.fillText(t('IMMUNE TRIGGERS'), 40, 110);
            ctx.fillText(t('PROTECTIVE & INTERVENTIONAL'), 250, 110);

            // Metrics Bento
            const m = state.metrics;
            const mLabels = [
                { l: 'TNF-α', v: Math.round(m.tnfAlpha) + ' pg/mL', c: '#ff4444' },
                { l: 'IL-10', v: Math.round(m.il10) + ' pg/mL', c: '#44ffaa' },
                { l: 'BBB INTEGRITY', v: Math.round(m.bbbIntegrity * 100) + '%', c: '#44aaff' },
                { l: 'NEUROPROTECTION', v: Math.round(m.neuroprotection * 100) + '%', c: '#ffaa44' }
            ];
            mLabels.forEach((ml, i) => {
                const bx = 40 + i * 110;
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.roundRect(ctx, bx, h - 80, 100, 50, 8, true);
                ctx.fillStyle = ml.c; ctx.fillRect(bx, h - 80, 2, 50);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Quicksand, sans-serif'; ctx.fillText(ml.l, bx + 10, h - 65);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Quicksand, sans-serif'; ctx.fillText(ml.v, bx + 10, h - 45);
            });

            this.ui.checkboxes.forEach(c => window.GreenhouseInflammationControls && window.GreenhouseInflammationControls.drawCheckbox(ctx, this, c, state));
            this.ui.buttons.forEach(b => window.GreenhouseInflammationControls && window.GreenhouseInflammationControls.drawButton(ctx, this, b, state));
            if (this.ui.hoveredElement && window.GreenhouseInflammationTooltips) window.GreenhouseInflammationTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
        },

        roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
            if (fill) ctx.fill(); if (stroke) ctx.stroke();
        }
    };

    window.GreenhouseInflammationApp = GreenhouseInflammationApp;
})();
