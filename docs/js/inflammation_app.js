/**
 * @file inflammation_app.js
 * @description Main application logic for the Neuroinflammation Simulation.
 * Implements binary factor logic (Checkboxes) and restored physiological metrics.
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
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 600, near: 10, far: 5000 },
        interaction: {
            isDragging: false, lastX: 0, lastY: 0, mouseX: 0, mouseY: 0
        },
        ui: {
            hoveredElement: null,
            checkboxes: [], buttons: [], metrics: [],
            isIsolated: false,
            lockedRegion: null,
            showLeftHemisphere: true,
            showRightHemisphere: true,
            showDeepStructures: true
        },
        baseUrl: '',

        init(selector, baseUrl = '') {
            console.log("GreenhouseInflammationApp: Initializing Checkbox-Driven UI...");
            this.baseUrl = baseUrl || '';
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) return;

            container.innerHTML = '';
            container.style.backgroundColor = '#000';
            container.style.position = 'relative';

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 1000;
            this.canvas.height = 750;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            const config = window.GreenhouseInflammationConfig;

            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => {
                    acc[f.id] = f.defaultValue;
                    return acc;
                }, {}),
                initialMetrics: {
                    tnfAlpha: 0.1,
                    il10: 0.8,
                    neuroprotection: 0.9,
                    stressBurden: 0.2,
                    bbbIntegrity: 0.95,
                    microgliaActivation: 0.05,
                    // Advanced Signaling (4-40)
                    tryptase: 0.0,
                    chymase: 0.0,
                    atp: 0.1,
                    ros: 0.05,
                    calcium: 100,
                    nfkbActivation: 0.1,
                    nlrp3State: 0.0,
                    jakStat: 0.1,
                    mapk: 0.1,
                    pi3kAkt: 0.8,
                    campPka: 0.7
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            this.clock = new window.GreenhouseModelsUtil.DiurnalClock();

            if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.init(this);

            // Initialize Category State
            this.ui.categories = [
                { id: 'env', label: 'ENVIRONMENTAL', x: 20, y: 175, w: 200, h: 25, isOpen: true },
                { id: 'psych', label: 'PSYCHOLOGICAL', x: 240, y: 175, w: 200, h: 25, isOpen: false },
                { id: 'philo', label: 'PHILOSOPHICAL', x: 460, y: 175, w: 200, h: 25, isOpen: false },
                { id: 'research', label: 'RESEARCH / BIO', x: 680, y: 175, w: 200, h: 25, isOpen: false }
            ];

            this.setupUI();
            this.computeUILayout();

            this.canvas.onmousedown = (e) => this.handleMouseDown(e);
            this.canvas.onmousemove = (e) => this.handleMouseMove(e);
            this.canvas.onmouseup = () => this.handleMouseUp();
            this.canvas.onwheel = (e) => this.handleWheel(e);
            window.onkeydown = (e) => this.handleKeyDown(e);

            this.isRunning = true;
            this.startLoop();

            window.addEventListener('resize', () => {
                this.canvas.width = container.offsetWidth;
                this.projection.width = this.canvas.width;
                this.setupUI();
                this.computeUILayout();
            });
        },

        setupUI() {
            const config = window.GreenhouseInflammationConfig;
            this.ui.checkboxes = [];

            config.factors.forEach(f => {
                if (f.type !== 'checkbox') return;
                let category = f.category || 'other';
                this.ui.checkboxes.push({
                    id: f.id, label: f.label, category: category,
                    w: 180, h: 20
                });
            });

            this.ui.buttons = [
                { id: 'mode_macro', label: 'MACRO', x: 40, y: 70, w: 60, h: 22, val: 0 },
                { id: 'mode_micro', label: 'MICRO', x: 105, y: 70, w: 65, h: 22, val: 1 },
                { id: 'mode_molecular', label: 'MOLECULAR', x: 175, y: 70, w: 85, h: 22, val: 2 },
                { id: 'toggle_left', label: 'L-HEMI', x: 270, y: 70, w: 60, h: 22, type: 'toggle' },
                { id: 'toggle_right', label: 'R-HEMI', x: 335, y: 70, w: 60, h: 22, type: 'toggle' },
                { id: 'toggle_deep', label: 'DEEP', x: 400, y: 70, w: 50, h: 22, type: 'toggle' }
            ];
        },

        computeUILayout() {
            const w = this.canvas.width;
            const h = this.canvas.height;
            const isNarrow = w < 960;

            // 1. Title & Global HUD Coordinates
            this.layout = {
                title: { x: 40, y: 40 },
                subtitle: { x: 40, y: 60 },
                breadcrumbs: { x: isNarrow ? 40 : 300, y: isNarrow ? 15 : 35 },
                miniMap: { x: w - 140, y: 40, w: 100, h: 80 },
                legend: { x: 40, y: 100, w: 200, h: 180 },
                metrics: { x: 40, y: h - 80, spacing: 110 },
                analysisMatrix: { x: w - 180, y: h - 280 },
                analysisTimeline: { x: w - 180, y: h - 120 }
            };

            // 2. Buttons Reflow
            let btnX = 40;
            this.ui.buttons.forEach(b => {
                b.x = btnX;
                b.y = 70;
                btnX += b.w + 5;
            });

            // 3. Categories Reflow
            const catSpacing = 20;
            const catW = isNarrow ? Math.min(400, (w - 60) / 2) : 200;
            this.ui.categories.forEach((cat, i) => {
                cat.w = catW;
                if (isNarrow) {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    cat.x = 20 + col * (catW + catSpacing);
                    cat.y = 175 + row * 35;
                } else {
                    cat.x = 20 + i * (catW + catSpacing);
                    cat.y = 175;
                }
            });

            // 4. Legend Reflow (Avoid overlaps with category panels)
            if (isNarrow) {
                this.layout.legend = { x: w - 180, y: 140, w: 160, h: 140 };
            } else {
                this.layout.legend = { x: 40, y: h - 290, w: 200, h: 180 };
            }
        },

        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    this.ui.categories.forEach(c => {
                        if (c.id !== cat.id) c.isOpen = false;
                    });
                    cat.isOpen = !cat.isOpen;
                    return;
                }
            }

            const hit = this.hitTestCheckboxes(mx, my);
            if (hit) {
                this.engine.state.factors[hit.id] = this.engine.state.factors[hit.id] === 1 ? 0 : 1;
                return;
            }

            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    if (b.type === 'toggle') {
                        if (b.id === 'toggle_left') this.ui.showLeftHemisphere = !this.ui.showLeftHemisphere;
                        if (b.id === 'toggle_right') this.ui.showRightHemisphere = !this.ui.showRightHemisphere;
                        if (b.id === 'toggle_deep') this.ui.showDeepStructures = !this.ui.showDeepStructures;
                    } else {
                        this.engine.state.factors.viewMode = b.val;
                    }
                    return;
                }
            }

            this.interaction.isDragging = true;
            this.interaction.lastX = e.clientX;
            this.interaction.lastY = e.clientY;
        },

        hitTestCheckboxes(mx, my) {
            const isNarrow = this.canvas.width < 960;
            for (const cat of this.ui.categories) {
                if (!cat.isOpen) continue;

                const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                for (let i = 0; i < catBoxes.length; i++) {
                    const col = isNarrow ? 0 : (i % 2);
                    const row = isNarrow ? i : Math.floor(i / 2);
                    const bx = cat.x + 10 + (col * 190);
                    const by = cat.y + 30 + (row * 22);

                    if (mx >= bx && mx <= bx + 180 && my >= by && my <= by + 20) {
                        return catBoxes[i];
                    }
                }
            }
            return null;
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.interaction.mouseX = mx;
            this.interaction.mouseY = my;

            this.ui.hoveredElement = null;

            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    this.ui.hoveredElement = { ...cat, type: 'header' };
                    cat.isHovered = true;
                } else {
                    cat.isHovered = false;
                }
            }

            if (!this.ui.hoveredElement) {
                const hit = this.hitTestCheckboxes(mx, my);
                if (hit) this.ui.hoveredElement = { ...hit, type: 'checkbox' };
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
                if (this.ui.hoveredElement && this.ui.hoveredElement.id === 'brain_region') {
                    this.ui.currentRegion = this.ui.hoveredElement.label;
                }
            }

            if (this.interaction.isDragging) {
                this.camera.rotationY += (e.clientX - this.interaction.lastX) * 0.01;
                this.camera.rotationX += (e.clientY - this.interaction.lastY) * 0.01;
                this.interaction.lastX = e.clientX;
                this.interaction.lastY = e.clientY;
            }
        },

        handleMouseUp() { this.interaction.isDragging = false; },
        handleWheel(e) { e.preventDefault(); this.camera.z = Math.min(-100, Math.max(-2000, this.camera.z + e.deltaY * 0.5)); },

        handleKeyDown(e) {
            if (e.key === '1') this.engine.state.factors.viewMode = 0;
            if (e.key === '2') this.engine.state.factors.viewMode = 1;
            if (e.key === '3') this.engine.state.factors.viewMode = 2;
            if (e.key === 'h') this.ui.showLeftHemisphere = !this.ui.showLeftHemisphere;
            if (e.key === 'r') this.exportData();
        },

        applyPreset(id) {
            const config = window.GreenhouseInflammationConfig;
            const preset = config.diseasePresets[id];
            if (preset) {
                config.factors.forEach(f => {
                    if (f.type === 'checkbox') this.engine.state.factors[f.id] = 0;
                });
                preset.factors.forEach(fid => this.engine.state.factors[fid] = 1);
            }
        },

        exportData() {
            if (window.GreenhouseInflammationAnalysis) {
                window.GreenhouseInflammationAnalysis.exportToJSON(this.engine.state);
            }
        },

        updateModel(state, dt) {
            const f = state.factors;
            const m = state.metrics;
            const Util = window.GreenhouseModelsUtil;

            if (this.clock) {
                this.clock.update(dt);
                f.timeOfDay = this.clock.timeInHours;
            }

            let scoreEnv = 0, scorePsych = 0, scorePhilo = 0, scoreRes = 0;
            const config = window.GreenhouseInflammationConfig;
            config.factors.forEach(fact => {
                if (f[fact.id] === 1) {
                    if (fact.category === 'env') scoreEnv++;
                    else if (fact.category === 'psych') scorePsych++;
                    else if (fact.category === 'philo') scorePhilo++;
                    else if (fact.category === 'research') scoreRes++;
                }
            });

            const stressSync = window.GreenhouseBioStatus ? window.GreenhouseBioStatus.stress.load : 0.2;

            const ageImpact = f.agePreset ? 0.15 : 0;
            const sexImpact = f.sexSpecific ? 0.05 : 0;
            const diabetesImpact = f.comorbidityDiabetes ? 0.2 : 0;
            const totalClinicalBurden = ageImpact + sexImpact + diabetesImpact;

            const inflammatoryDrive = (scoreEnv * 0.1) + (stressSync * 0.3) + (f.leakyGut ? 0.15 : 0) + totalClinicalBurden;
            const antiInflammatoryReserve = (scorePsych * 0.08) + (scorePhilo * 0.05) + (f.exerciseRegular ? 0.15 : 0) + (f.medicationEffect ? 0.25 : 0);

            m.tnfAlpha = Util.SimulationEngine.smooth(m.tnfAlpha, Util.SimulationEngine.clamp(inflammatoryDrive - (antiInflammatoryReserve * 0.4), 0.02, 1.0), 0.05);
            m.il10 = Util.SimulationEngine.smooth(m.il10, Util.SimulationEngine.clamp(antiInflammatoryReserve + (m.tnfAlpha * 0.1), 0.05, 1.0), 0.02);

            m.bbbIntegrity = Util.SimulationEngine.smooth(m.bbbIntegrity, Util.SimulationEngine.clamp(1.0 - (m.tnfAlpha * 0.6) - (f.leakyGut ? 0.1 : 0), 0.1, 1.0), 0.02);
            m.microgliaActivation = Util.SimulationEngine.smooth(m.microgliaActivation, Util.SimulationEngine.clamp((m.tnfAlpha * 0.8) + (1.0 - m.bbbIntegrity) * 0.4, 0.01, 1.0), 0.03);

            const neuroTarget = Util.SimulationEngine.clamp(1.0 - (m.tnfAlpha * 0.7) + (m.il10 * 0.3), 0.1, 1.0);
            m.neuroprotection = Util.SimulationEngine.smooth(m.neuroprotection, neuroTarget, 0.03);
            m.stressBurden = Util.SimulationEngine.smooth(m.stressBurden, Util.SimulationEngine.clamp(stressSync + (m.tnfAlpha * 0.5) - (scorePhilo * 0.1), 0.01, 1.0), 0.05);

            // --- ADVANCED SIGNALING DYNAMICS (Enhancements 4-40) ---

            // Protease release from activated Mast Cells
            const mastActivity = Util.SimulationEngine.clamp(m.tnfAlpha * 1.5 + (f.pathogenActive ? 0.3 : 0), 0, 1);
            m.tryptase = Util.SimulationEngine.smooth(m.tryptase, mastActivity * 50, 0.1);
            m.chymase = Util.SimulationEngine.smooth(m.chymase, mastActivity * 30, 0.08);

            // Purinergic Signaling (ATP release from stress)
            m.atp = Util.SimulationEngine.smooth(m.atp, 0.1 + (m.stressBurden * 5.0), 0.05);

            // Inflammasome (NLRP3) - Driven by ATP and ROS
            m.ros = Util.SimulationEngine.smooth(m.ros, Util.SimulationEngine.clamp((m.tnfAlpha * 0.6) + (m.microgliaActivation * 0.4), 0.02, 1.0), 0.05);
            const nlrp3Target = Util.SimulationEngine.clamp((m.atp > 2.0 ? 0.4 : 0) + (m.ros > 0.5 ? 0.6 : 0), 0, 1);
            m.nlrp3State = Util.SimulationEngine.smooth(m.nlrp3State, nlrp3Target, 0.04);

            // Intracellular Cascades
            m.nfkbActivation = Util.SimulationEngine.smooth(m.nfkbActivation, Util.SimulationEngine.clamp(m.tnfAlpha * 1.2 + (m.nlrp3State * 0.5), 0, 1), 0.06);
            m.mapk = Util.SimulationEngine.smooth(m.mapk, Util.SimulationEngine.clamp(m.tnfAlpha * 0.8 + m.stressBurden * 0.4, 0, 1), 0.05);
            m.jakStat = Util.SimulationEngine.smooth(m.jakStat, Util.SimulationEngine.clamp(m.tnfAlpha * 0.5 + (f.toggleIL6Mode ? 0.4 : 0), 0, 1), 0.03);

            // Calcium dynamics (steady-state representation)
            m.calcium = Util.SimulationEngine.smooth(m.calcium, 100 + (m.nfkbActivation * 400), 0.1);

            // Counter-regulatory Signaling
            m.pi3kAkt = Util.SimulationEngine.smooth(m.pi3kAkt, Util.SimulationEngine.clamp(1.0 - (m.tnfAlpha * 0.5) + (m.il10 * 0.3), 0.1, 1.0), 0.02);
            m.campPka = Util.SimulationEngine.smooth(m.campPka, Util.SimulationEngine.clamp(m.il10 * 0.7 + (scorePhilo * 0.2), 0.05, 1.0), 0.04);

            if (window.GreenhouseBioStatus) {
                window.GreenhouseBioStatus.sync('inflammation', {
                    tone: m.tnfAlpha,
                    bbb: m.bbbIntegrity,
                    microglia: m.microgliaActivation,
                    tnfAlpha: m.tnfAlpha,
                    il10: m.il10,
                    neuroprotection: m.neuroprotection,
                    stressBurden: m.stressBurden
                });
            }
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
            const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, state = this.engine.state;
            ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, w, h);

            if (!this.interaction.isDragging) this.camera.rotationY += 0.001;
            if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.render(ctx, state, this.camera, this.projection);

            this.drawUI(ctx, w, h, state);
        },

        drawUI(ctx, w, h, state) {
            const isNarrow = w < 960;
            const l = this.layout;

            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Quicksand, sans-serif';
            ctx.fillText('NEUROINFLAMMATION ENGINE', l.title.x, l.title.y);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 12px Quicksand, sans-serif';
            const modes = ['btn_mode_macro', 'btn_mode_micro', 'btn_mode_molecular'];
            const modeName = t(modes[state.factors.viewMode || 0]);
            ctx.fillText(`${modeName} LEVEL: IMMUNE RESPONSE`, l.subtitle.x, l.subtitle.y);

            const m = state.metrics;
            const mLabels = [
                { l: 'TNF-α TONE', v: (m.tnfAlpha * 100).toFixed(1) + '%', c: '#ff5533' },
                { l: 'IL-10 RESERVE', v: (m.il10 * 100).toFixed(1) + '%', c: '#00ff99' },
                { l: 'NEUROPROTECTION', v: (m.neuroprotection * 100).toFixed(1) + '%', c: '#ffff66' },
                { l: 'STRESS BURDEN', v: (m.stressBurden * 100).toFixed(1) + '%', c: '#ff9900' }
            ];
            mLabels.forEach((ml, i) => {
                const bx = l.metrics.x + i * l.metrics.spacing;
                const by = l.metrics.y;
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.roundRect(ctx, bx, by, 100, 50, 8, true);
                ctx.fillStyle = ml.c; ctx.fillRect(bx, by, 2, 50);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Quicksand, sans-serif'; ctx.fillText(ml.l, bx + 10, by + 15);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Quicksand, sans-serif'; ctx.fillText(ml.v, bx + 10, by + 35);
            });

            if (this.ui.categories) {
                // Draw all headers first
                this.ui.categories.forEach(cat => {
                    if (window.GreenhouseInflammationControls) {
                        window.GreenhouseInflammationControls.drawCategoryHeader(ctx, cat);
                    }
                });

                // Draw the open panel last to ensure it's on top of other headers
                const openCat = this.ui.categories.find(c => c.isOpen);
                if (openCat) {
                    const catBoxes = this.ui.checkboxes.filter(c => c.category === openCat.id);
                    const rows = isNarrow ? catBoxes.length : Math.ceil(catBoxes.length / 2);
                    const panelW = isNarrow ? 210 : 400;
                    const panelH = rows * 22 + 40;

                    ctx.save();
                    ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
                    ctx.fillRect(openCat.x, openCat.y + 25, panelW, panelH);
                    ctx.strokeStyle = '#4ca1af';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(openCat.x, openCat.y + 25, panelW, panelH);
                    ctx.restore();

                    catBoxes.forEach((c, i) => {
                        const col = isNarrow ? 0 : (i % 2);
                        const row = isNarrow ? i : Math.floor(i / 2);
                        c.x = openCat.x + 10 + (col * 190);
                        c.y = openCat.y + 30 + (row * 22);
                        if (window.GreenhouseInflammationControls) {
                            window.GreenhouseInflammationControls.drawCheckbox(ctx, this, c, state);
                        }
                    });
                }
            }

            this.ui.buttons.forEach(b => {
                if (window.GreenhouseInflammationControls) {
                    const btnState = JSON.parse(JSON.stringify(state));
                    if (b.id === 'toggle_left' && this.ui.showLeftHemisphere) btnState.factors.viewMode = b.val;
                    if (b.id === 'toggle_right' && this.ui.showRightHemisphere) btnState.factors.viewMode = b.val;
                    if (b.id === 'toggle_deep' && this.ui.showDeepStructures) btnState.factors.viewMode = b.val;
                    window.GreenhouseInflammationControls.drawButton(ctx, this, b, btnState);
                }
            });

            if (window.GreenhouseInflammationControls) {
                const config = window.GreenhouseInflammationConfig;
                window.GreenhouseInflammationControls.drawAtlasLegend(ctx, this, config, l.legend);
                window.GreenhouseInflammationControls.drawMiniMap(ctx, this, w, h, l.miniMap);
                window.GreenhouseInflammationControls.drawBreadcrumbs(ctx, this, this.ui.currentRegion, l.breadcrumbs);
            }

            if (window.GreenhouseInflammationAnalysis) {
                window.GreenhouseInflammationAnalysis.render(ctx, this, state, l.analysisMatrix, l.analysisTimeline);
            }

            if (this.ui.hoveredElement && window.GreenhouseInflammationTooltips && this.ui.hoveredElement.type !== 'header') {
                window.GreenhouseInflammationTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
            }
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
