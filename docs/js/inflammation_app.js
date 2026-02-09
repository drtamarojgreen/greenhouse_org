/**
 * @file inflammation_app.js
 * @description Main application logic for the Neuroinflammation Simulation.
 * 100% Canvas-based UI and Educational Experience.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationApp = {
        engine: null,
        canvas: null,
        ctx: null,
        isRunning: false,
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 600, near: 10, far: 5000 },
        interaction: {
            isDragging: false,
            isPanning: false,
            lastX: 0,
            lastY: 0,
            mouseX: 0,
            mouseY: 0
        },
        ui: {
            hoveredId: null,
            activeInfoIndex: 0,
            scrollOffset: 0,
            sliders: [],
            buttons: []
        },

        init(selector) {
            console.log("GreenhouseInflammationApp: Initializing Canvas-First UI...");
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) return;

            container.innerHTML = '';
            container.style.backgroundColor = '#000';
            container.style.position = 'relative';
            container.style.minHeight = '600px';
            container.style.overflow = 'hidden';

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 1000;
            this.canvas.height = Math.max(container.offsetHeight, 700);
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            this.canvas.oncontextmenu = (e) => e.preventDefault();

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
                    tnfAlpha: 10,
                    il10: 2,
                    microgliaActivation: 0.1,
                    bbbIntegrity: 0.95,
                    neuroprotection: 0.8,
                    inflammatoryTone: 0.02
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            if (window.GreenhouseInflammationUI3D) {
                window.GreenhouseInflammationUI3D.init(this);
            }

            this.setupUI();

            // Event Listeners
            this.canvas.onmousedown = (e) => this.handleMouseDown(e);
            this.canvas.onmousemove = (e) => this.handleMouseMove(e);
            this.canvas.onmouseup = () => this.handleMouseUp();
            this.canvas.onwheel = (e) => this.handleWheel(e);

            this.isRunning = true;
            this.startLoop();

            window.addEventListener('resize', () => {
                this.canvas.width = container.offsetWidth;
                this.projection.width = this.canvas.width;
                this.setupUI();
            });
        },

        setupUI() {
            const w = this.canvas.width;
            const h = this.canvas.height;
            const factors = window.GreenhouseInflammationConfig.factors;

            this.ui.sliders = factors.filter(f => f.id !== 'viewMode').map((f, i) => ({
                id: f.id,
                label: f.label,
                x: 30,
                y: 110 + i * 42, // Reduced spacing to fit more
                w: 160,
                h: 6,
                min: 0,
                max: 1
            }));

            this.ui.buttons = [
                { id: 'mode_macro', label: 'MACRO', x: 40, y: 80, w: 60, h: 25, val: 0 },
                { id: 'mode_micro', label: 'MICRO', x: 110, y: 80, w: 60, h: 25, val: 1 },
                { id: 'mode_mol', label: 'MOL', x: 180, y: 80, w: 40, h: 25, val: 2 }
            ];
        },

        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Check UI
            for (const s of this.ui.sliders) {
                if (mx >= s.x && mx <= s.x + s.w && my >= s.y - 10 && my <= s.y + 20) {
                    this.ui.activeSlider = s;
                    return;
                }
            }

            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this.engine.state.factors.viewMode = b.val;
                    return;
                }
            }

            this.interaction.isDragging = e.button === 0;
            this.interaction.isPanning = (e.button === 2 || (e.button === 0 && e.shiftKey));
            this.interaction.lastX = e.clientX;
            this.interaction.lastY = e.clientY;
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.interaction.mouseX = mx;
            this.interaction.mouseY = my;

            if (this.ui.activeSlider) {
                const s = this.ui.activeSlider;
                const pct = Math.min(1, Math.max(0, (mx - s.x) / s.w));
                this.engine.state.factors[s.id] = pct;
                return;
            }

            // Hover detection for UI elements
            this.ui.hoveredElement = null;
            for (const s of this.ui.sliders) {
                if (mx >= s.x && mx <= s.x + s.w && my >= s.y - 12 && my <= s.y + 12) {
                    this.ui.hoveredElement = { ...s, type: 'slider' };
                    break;
                }
            }
            if (!this.ui.hoveredElement) {
                for (const b of this.ui.buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.ui.hoveredElement = { ...b, type: 'button' };
                        break;
                    }
                }
            }

            // Check Bento Metrics
            if (!this.ui.hoveredElement) {
                for (let i = 0; i < 3; i++) {
                    const bx = 40 + i * 110;
                    if (mx >= bx && mx <= bx + 100 && my >= this.canvas.height - 80 && my <= this.canvas.height - 30) {
                        const ids = ['metric_tnf', 'metric_il10', 'metric_bbb'];
                        this.ui.hoveredElement = { id: ids[i], type: 'metric' };
                        break;
                    }
                }
            }

            // Check Educational Cards
            if (!this.ui.hoveredElement) {
                const panelW = 320;
                const px = this.canvas.width - panelW - 40;
                let y = 110;
                for (let i = 0; i < 6; i++) {
                    if (mx >= px + 15 && mx <= px + panelW - 15 && my >= y && my <= y + 60) {
                        this.ui.hoveredElement = { id: `card_${i}`, type: 'card' };
                        break;
                    }
                    y += 75;
                }
            }

            // Check 3D objects if no UI is hovered
            if (!this.ui.hoveredElement && window.GreenhouseInflammationUI3D) {
                this.ui.hoveredElement = window.GreenhouseInflammationUI3D.checkHover(mx, my, this.camera, this.projection);
            }

            if (this.interaction.isDragging) {
                const dx = e.clientX - this.interaction.lastX;
                const dy = e.clientY - this.interaction.lastY;
                this.camera.rotationY += dx * 0.01;
                this.camera.rotationX += dy * 0.01;
                this.interaction.lastX = e.clientX;
                this.interaction.lastY = e.clientY;
            }
        },

        handleMouseUp() {
            this.interaction.isDragging = false;
            this.interaction.isPanning = false;
            this.ui.activeSlider = null;
        },

        handleWheel(e) {
            e.preventDefault();
            this.camera.z = Math.min(-100, Math.max(-2000, this.camera.z + e.deltaY * 0.5));
        },

        updateModel(state, dt) {
            const f = state.factors;
            const m = state.metrics;
            const Util = window.GreenhouseModelsUtil;

            // 1. Pro-inflammatory Surge (TNF-Alpha)
            // NSAIDs reduce drive; Steroids provide broad suppression; Biologics target TNF specifically.
            const suppression = (f.nsaids * 0.3 + f.corticosteroids * 0.6 + f.biologics * 0.8);

            const proDrive = (f.pathogenLoad * 1.5 + f.stressCortisol * 0.8) /
                (0.5 + f.sleepRestoration * 0.5 + f.nutrientDensity * 0.3 + suppression);

            const baseTnf = Util.SimulationEngine.clamp(proDrive * 100, 5, 500);
            // Direct TNF inhibition from biologics
            const finalTnf = baseTnf * (1 - f.biologics * 0.9);
            m.tnfAlpha = Util.SimulationEngine.smooth(m.tnfAlpha, finalTnf, 0.02);

            // 2. Anti-inflammatory Response (IL-10)
            const antiDrive = (m.tnfAlpha * 0.05 + f.physicalActivity * 0.5 + f.nutrientDensity * 0.4);
            const targetIl10 = Util.SimulationEngine.clamp(antiDrive * 10, 1, 50);
            m.il10 = Util.SimulationEngine.smooth(m.il10, targetIl10, 0.015);

            // 3. Glial Activation
            // Steroids strongly suppress glial reactivity
            const glialSuppress = f.corticosteroids * 0.7;
            const targetMicroglia = Util.SimulationEngine.clamp(((m.tnfAlpha - m.il10 * 2) / 100) * (1 - glialSuppress), 0, 1);
            m.microgliaActivation = Util.SimulationEngine.smooth(m.microgliaActivation, targetMicroglia, 0.01);

            // 4. BBB Integrity
            const repair = (f.sleepRestoration * 0.0001 + f.nutrientDensity * 0.00005);
            const damage = (m.tnfAlpha * 0.00001 + f.stressCortisol * 0.00005);
            m.bbbIntegrity = Util.SimulationEngine.clamp(m.bbbIntegrity + repair - damage, 0.1, 1);

            // 5. Neuroprotection
            m.neuroprotection = (m.bbbIntegrity * 0.6 + m.il10 / 50 * 0.4) * (1 - m.microgliaActivation * 0.8);
            state.metrics.inflammatoryTone = m.tnfAlpha / 500;
        },

        startLoop() {
            const loop = (t) => {
                if (!this.isRunning) return;
                this.engine.update(t);
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const state = this.engine.state;

            ctx.fillStyle = '#050505'; // Deep black for better contrast
            ctx.fillRect(0, 0, w, h);

            if (!this.interaction.isDragging) this.camera.rotationY += 0.001;

            if (window.GreenhouseInflammationUI3D) {
                window.GreenhouseInflammationUI3D.render(ctx, state, this.camera, this.projection);
            }

            this.drawUIElements(ctx, w, h, state);
            this.drawEducationalPanel(ctx, w, h, state);
        },

        drawUIElements(ctx, w, h, state) {
            const m = state.metrics;
            ctx.save();

            // Header
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('NEUROINFLAMMATION ENGINE', 40, 40);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 12px sans-serif';
            const viewModeName = state.factors.viewMode < 0.5 ? 'MACRO' : (state.factors.viewMode < 1.5 ? 'MICRO' : 'MOLECULAR');
            ctx.fillText(`${viewModeName} LEVEL: BIOLOGICAL DYNAMICS`, 40, 60);

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px sans-serif';
            ctx.fillText('EXPERIMENTAL BIOLOGICAL MODEL v5.1', 40, 75);

            // Bento Metrics
            const mLabels = [
                { l: 'TNF-α', v: m.tnfAlpha.toFixed(1), u: 'pg/mL', c: '#ff5500' },
                { l: 'IL-10', v: m.il10.toFixed(1), u: 'pg/mL', c: '#00ff99' },
                { l: 'BBB', v: (m.bbbIntegrity * 100).toFixed(0) + '%', u: 'INT', c: '#ffffff' }
            ];
            mLabels.forEach((ml, i) => {
                const bx = 40 + i * 110;
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.roundRect(ctx, bx, h - 80, 100, 50, 8, true);
                ctx.fillStyle = ml.c; ctx.fillRect(bx, h - 80, 2, 50);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px sans-serif'; ctx.fillText(ml.l, bx + 10, h - 65);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(ml.v, bx + 10, h - 45);
            });

            // Sliders
            this.ui.sliders.forEach(s => {
                if (window.GreenhouseInflammationControls) {
                    window.GreenhouseInflammationControls.drawSlider(ctx, this, s, state);
                }
            });

            // Buttons
            this.ui.buttons.forEach(b => {
                if (window.GreenhouseInflammationControls) {
                    window.GreenhouseInflammationControls.drawButton(ctx, this, b, state);
                }
            });

            // Draw Tooltip
            if (this.ui.hoveredElement && window.GreenhouseInflammationTooltips) {
                window.GreenhouseInflammationTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
            }

            ctx.restore();
        },


        drawEducationalPanel(ctx, w, h, state) {
            const panelW = 320;
            const px = w - panelW - 40;
            ctx.save();

            ctx.fillStyle = 'rgba(0,0,0,0.85)'; // Higher opacity for legibility against particle storm
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.4)';
            this.roundRect(ctx, px, 40, panelW, h - 140, 20, true, true);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('SCIENTIFIC DISCOURSE', px + 25, 75);

            const cards = [
                { h: 'CARDINAL SIGNS', t: 'Rubor (Redness), Calor (Heat), Tumor (Swelling), Dolor (Pain), Functio Laesa (Loss of Function).' },
                { h: 'ACUTE VS CHRONIC', t: 'Acute is rapid onset with neutrophils; Chronic involves macrophages and lymphocytes.' },
                { h: 'CYTOKINE NETWORK', t: 'TNF-α drives inflammation while IL-10 orchestrates resolution and repair.' },
                { h: 'BBB LEAKAGE', t: 'Compromised endothelial junctions allow leukocyte infiltration into CNS parenchyma.' },
                { h: 'METABOLIC LINK', t: 'Stress and nutrition modulate the Arachidonic Acid pathway (COX/LOX branches).' },
                { h: 'RESOLUTION', t: 'Specialized Pro-resolving Mediators (SPMs) active in self-limiting the response.' }
            ];

            let y = 110;
            cards.forEach(c => {
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                this.roundRect(ctx, px + 15, y, panelW - 30, 60, 10, true);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(c.h, px + 25, y + 22);
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '10px sans-serif';
                this.wrapText(ctx, c.t, px + 25, y + 40, panelW - 50, 14);
                y += 75;
            });

            ctx.fillStyle = 'rgba(255,100,100,0.4)'; ctx.font = 'italic 9px sans-serif';
            this.wrapText(ctx, 'DISCLAIMER: EDUCATIONAL ONLY. NOT FOR DIAGNOSIS.', px + 25, h - 130, panelW - 50, 12);
            ctx.restore();
        },

        roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
        },

        wrapText(ctx, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                    ctx.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, y);
        }
    };

    window.GreenhouseInflammationApp = GreenhouseInflammationApp;
})();
