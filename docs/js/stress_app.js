/**
 * @file stress_app.js
 * @description Main application logic for the Stress Dynamics Simulation.
 * Implements binary factor logic (Checkboxes) and updated physiological equations.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressApp = {
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
            checkboxes: [], buttons: [], metrics: []
        },

        init(selector) {
            console.log("GreenhouseStressApp: Initializing Checkbox-Driven UI...");
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

            const config = window.GreenhouseStressConfig;

            this.engine = new window.GreenhouseModelsUtil.SimulationEngine({
                initialFactors: config.factors.reduce((acc, f) => {
                    acc[f.id] = f.defaultValue;
                    return acc;
                }, {}),
                initialMetrics: {
                    allostaticLoad: 0.15,
                    autonomicBalance: 0.4,
                    resilienceReserve: 0.9,
                    hpaSensitivity: 1.0,
                    hrv: 65,
                    vagalTone: 0.7
                },
                updateFn: (state, dt) => this.updateModel(state, dt)
            });

            this.clock = new window.GreenhouseModelsUtil.DiurnalClock();

            if (window.GreenhouseStressUI3D) window.GreenhouseStressUI3D.init(this);

            // Initialize Category State (Collapsed by default except maybe one)
            this.ui.categories = [
                { id: 'env', label: 'ENVIRONMENTAL', x: 20, y: 110, w: 200, h: 25, isOpen: true },
                { id: 'psych', label: 'PSYCHOLOGICAL', x: 240, y: 110, w: 200, h: 25, isOpen: false },
                { id: 'philo', label: 'PHILOSOPHICAL', x: 460, y: 110, w: 200, h: 25, isOpen: false },
                { id: 'research', label: 'RESEARCH / BIO', x: 680, y: 110, w: 200, h: 25, isOpen: false }
            ];

            this.setupUI();
            this.setupPathwayUI();

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
            const config = window.GreenhouseStressConfig;
            this.ui.checkboxes = [];

            // Group factors by category for easier rendering logic
            // We just prepare them here; drawUI determines position based on collapse state
            config.factors.forEach(f => {
                if (f.type !== 'checkbox') return;
                let category = f.category || 'other';
                this.ui.checkboxes.push({
                    id: f.id, label: f.label, category: category,
                    w: 180, h: 20,
                    // x, y calculated at draw time
                });
            });

            this.ui.buttons = [
                { id: 'mode_macro', label: 'MACRO', x: 40, y: 70, w: 60, h: 22, val: 0 },
                { id: 'mode_pathway', label: 'PATHWAY', x: 105, y: 70, w: 65, h: 22, val: 1 },
                { id: 'mode_systemic', label: 'SYSTEMIC', x: 175, y: 70, w: 70, h: 22, val: 2 }
            ];
        },

        setupPathwayUI() {
            this.ui.pathwayButtons = [];
            const ui3d = window.GreenhouseStressUI3D;
            if (ui3d && ui3d.availablePathways) {
                ui3d.availablePathways.forEach((p, i) => {
                    this.ui.pathwayButtons.push({
                        id: 'pathway_' + p.id,
                        label: p.name.toUpperCase(),
                        x: 40 + (i * 115),
                        y: 100,
                        w: 110,
                        h: 22,
                        pathwayId: p.id
                    });
                });
            } else {
                // Retry in 500ms if pathways not loaded yet
                setTimeout(() => this.setupPathwayUI(), 500);
            }
        },

        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // 1. Check Category Headers
            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    // Close others (accordion style) or just toggle? User asked for accessible dropdowns
                    // Let's toggle individually for now, or accordion if space is tight.
                    // Let's do Accordion behavior (one open at a time) for cleanliness
                    this.ui.categories.forEach(c => {
                        if (c.id !== cat.id) c.isOpen = false;
                    });
                    cat.isOpen = !cat.isOpen;
                    return;
                }
            }

            // 2. Check Visible Checkboxes
            // We need to know where they were drawn. Since we calculate positions in drawUI,
            // we should ideally store them there. But for now, let's re-simulate the layout check.
            const hit = this.hitTestCheckboxes(mx, my);
            if (hit) {
                this.engine.state.factors[hit.id] = this.engine.state.factors[hit.id] === 1 ? 0 : 1;
                return;
            }

            // 3. View Mode Buttons
            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this.engine.state.factors.viewMode = b.val; return;
                }
            }

            // 4. Pathway Selection Buttons (Only if in Pathway Mode)
            if (Math.round(this.engine.state.factors.viewMode) === 1 && this.ui.pathwayButtons) {
                for (const b of this.ui.pathwayButtons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.engine.state.factors.activePathway = b.pathwayId; return;
                    }
                }
            }

            // 5. Check 3D Interactions (Systemic View)
            if (window.GreenhouseStressUI3D) {
                const hit3D = window.GreenhouseStressUI3D.checkHover(mx, my, this.camera, this.projection);
                if (hit3D && hit3D.type === 'category_node') {
                    const catId = hit3D.id.replace('cat_', '');
                    this.ui.categories.forEach(c => c.isOpen = (c.id === catId));
                    return;
                }
            }

            // 6. Check Pathway Overlay Buttons (Graph Toggle)
            if (window.GreenhouseStressPathwayButtons) {
                const buttons = window.GreenhouseStressPathwayButtons;
                for (const b of buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        if (typeof b.action === 'function') b.action(this.engine.state);
                        return;
                    }
                }
            }

            this.interaction.isDragging = true;
            this.interaction.lastX = e.clientX;
            this.interaction.lastY = e.clientY;
        },

        hitTestCheckboxes(mx, my) {
            // Re-run simple layout logic to find hit
            for (const cat of this.ui.categories) {
                if (!cat.isOpen) continue; // Skip collapsed

                // Filter checkboxes for this category
                const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                for (let i = 0; i < catBoxes.length; i++) {
                    // 2 columns per category dropdown for density
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const bx = cat.x + 10 + (col * 190); // Shift X based on category X
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

            // Header Hover
            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    this.ui.hoveredElement = { ...cat, type: 'header' };
                    cat.isHovered = true;
                } else {
                    cat.isHovered = false;
                }
            }

            if (!this.ui.hoveredElement) {
                // Checkbox Hover
                const hit = this.hitTestCheckboxes(mx, my);
                if (hit) {
                    // We need to pass the temporary computed x/y to the drawer if needed,
                    // but the controls just need ID. 
                    // Let's pass a proxy object with ID
                    this.ui.hoveredElement = { ...hit, type: 'checkbox' };
                }
            }

            if (!this.ui.hoveredElement) {
                for (const b of this.ui.buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.ui.hoveredElement = { ...b, type: 'button' }; break;
                    }
                }
            }

            // Check Pathway Overlay Buttons (Graph Toggle)
            if (!this.ui.hoveredElement && window.GreenhouseStressPathwayButtons) {
                const buttons = window.GreenhouseStressPathwayButtons;
                for (const b of buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.ui.hoveredElement = { ...b, type: 'button_overlay' }; break;
                    }
                }
            }

            // Metrics Hover
            if (!this.ui.hoveredElement) {
                for (let i = 0; i < 4; i++) {
                    const bx = 40 + i * 110;
                    if (mx >= bx && mx <= bx + 100 && my >= this.canvas.height - 80 && my <= this.canvas.height - 30) {
                        const ids = ['metric_allostatic_load', 'metric_autonomic_balance', 'metric_resilience_reserve', 'hpaSensitivity'];
                        this.ui.hoveredElement = { id: ids[i], type: 'metric' }; break;
                    }
                }
            }

            if (!this.ui.hoveredElement && window.GreenhouseStressUI3D) {
                this.ui.hoveredElement = window.GreenhouseStressUI3D.checkHover(mx, my, this.camera, this.projection);
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

        updateModel(state, dt) {
            const f = state.factors;
            const m = state.metrics;
            const h = state.history;
            const Util = window.GreenhouseModelsUtil;

            // 1. Advance Clock
            if (this.clock) {
                this.clock.update(dt);
                f.timeOfDay = this.clock.timeInHours;
                f.diurnalPhase = this.clock.getPhase();
            }

            // 2. Calculate Aggregated Stress Load (Based on 100 factors)
            // Categorize sum of active inputs
            let scoreEnv = 0, scorePsych = 0, scorePhilo = 0, scoreRes = 0;

            const config = window.GreenhouseStressConfig;
            config.factors.forEach(fact => {
                if (f[fact.id] === 1) { // If active
                    if (fact.category === 'env') scoreEnv++;
                    else if (fact.category === 'psych') scorePsych++;
                    else if (fact.category === 'philo') scorePhilo++;
                    else if (fact.category === 'research') scoreRes++;
                }
            });

            // Normalized Loads (0.0 - 1.0 range approx)
            // Environment adds load. Psych/Philo/Research buffer it.
            const environmentalLoad = (scoreEnv * 0.05) + (f.sleepDeprivation ? 0.3 : 0);
            const copingBuffer = (scorePsych * 0.04) + (scorePhilo * 0.03) + (scoreRes * 0.02);

            // 3. Genetic & Epigenetic Modifiers
            // Epigenetic sensitivity: Cumulative load makes the system more "twitchy"
            const epigeneticDrive = h.cumulativeLoad * 0.05;
            const geneticDrive = (f.serotoninTransporter * 0.15) + (f.comtValMet * 0.1) + epigeneticDrive;

            // 4. Diurnal Core Baseline (Cortisol Awakening Response)
            const circadianDrive = this.clock ? this.clock.getCortisolFactor() * 0.2 : 0;

            // 5. Modulators (Brakes) & Gut Health
            // Gut health affects precursors for GABA/Serotonin
            const gutEfficiency = f.gutHealth ? 1.0 : 0.6;
            const damping = copingBuffer * gutEfficiency;

            // 6. Autonomic Dynamics (Vagus Nerve / HRV)
            const sympatheticTarget = Util.SimulationEngine.clamp((environmentalLoad + geneticDrive + circadianDrive) - damping, 0, 1.5);
            m.autonomicBalance = Util.SimulationEngine.smooth(m.autonomicBalance, sympatheticTarget, 0.05);

            // HRV Calculation (Inverse of autonomic balance + noise)
            const hrvBase = 100 - (m.autonomicBalance * 60);
            m.hrv = Util.SimulationEngine.smooth(m.hrv, hrvBase + (Math.random() - 0.5) * 5, 0.01);
            m.vagalTone = Util.SimulationEngine.smooth(m.vagalTone, 1.0 - m.autonomicBalance, 0.02);

            // 7. HPA Axis & Glucocorticoid Receptor (GR) Resistance
            // High cumulative load leads to GR downregulation (Resistance)
            const grResistance = Util.SimulationEngine.clamp(h.cumulativeLoad * 0.2, 0, 0.8);
            const fkbp5Impairment = f.fkbp5Variant * 0.4;
            m.hpaSensitivity = Util.SimulationEngine.smooth(m.hpaSensitivity, 1.0 - fkbp5Impairment - grResistance - (m.allostaticLoad * 0.3), 0.02);

            // 8. Allostatic Load & Resilience Reserve
            const drift = 0.0002;
            m.allostaticLoad = Util.SimulationEngine.clamp(
                m.allostaticLoad + (m.autonomicBalance * 0.0015) + drift - (damping * 0.001),
                0.05, 1.0
            );

            // Recovery is hindered by sleep deprivation but boosted by sleep phase
            const sleepMultiplier = this.clock ? this.clock.getResilienceRecoveryMultiplier() : 1.0;
            const recovery = (1.0 - f.sleepDeprivation * 0.6) * 0.001 * sleepMultiplier;

            m.resilienceReserve = Util.SimulationEngine.clamp(
                m.resilienceReserve - (m.allostaticLoad * 0.002) + recovery + (f.socialSupport * 0.0005),
                0, 1.0
            );

            // 9. Update History (Epigenetics)
            h.cumulativeLoad += (m.allostaticLoad > 0.7) ? 0.0001 : (m.allostaticLoad < 0.3 ? -0.00005 : 0);
            h.cumulativeLoad = Util.SimulationEngine.clamp(h.cumulativeLoad, 0, 10.0);
            h.peakStress = Math.max(h.peakStress, m.allostaticLoad);

            // 10. Neurotransmitter Activity (Comprehensive Coverage)
            // Precursor availability from gut health affects max rates
            const precursorFactor = f.gutHealth ? 1.0 : 0.5;

            // Serotonin: Impacted by stress load and genetic transporter status
            const baseSerotonin = 100 * precursorFactor;
            const serotoninLoss = (m.allostaticLoad * 40) + (f.serotoninTransporter * 20);
            m.serotoninLevels = Util.SimulationEngine.smooth(m.serotoninLevels || 100, (baseSerotonin - serotoninLoss), 0.01);

            // Dopamine: Chronic stress reduces D2 sensitivity and density
            const baseDopamine = 100 * precursorFactor;
            const dopamineLoss = (m.allostaticLoad * 50) + (f.comtValMet * 15);
            m.dopamineLevels = Util.SimulationEngine.smooth(m.dopamineLevels || 100, (baseDopamine - dopamineLoss), 0.01);

            // HPA Pulse Strength (CRH -> ACTH -> Cortisol)
            m.crhDrive = Util.SimulationEngine.smooth(m.crhDrive || 0, (m.autonomicBalance * 100), 0.05);
            m.acthDrive = Util.SimulationEngine.smooth(m.acthDrive || 0, (m.crhDrive * m.hpaSensitivity), 0.05);
            m.cortisolLevels = Util.SimulationEngine.smooth(m.cortisolLevels || 10, (m.acthDrive * 0.8), 0.02);

            // 11. Inter-Model Sync
            if (window.GreenhouseBioStatus) {
                window.GreenhouseBioStatus.sync('stress', {
                    load: m.allostaticLoad,
                    hpa: m.hpaSensitivity,
                    autonomic: m.autonomicBalance,
                    serotonin: m.serotoninLevels,
                    dopamine: m.dopamineLevels,
                    cortisol: m.cortisolLevels
                });
            }

            state.factors.stressorIntensity = Util.SimulationEngine.clamp(environmentalLoad * 0.8, 0, 1);
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
            if (window.GreenhouseStressUI3D) window.GreenhouseStressUI3D.render(ctx, state, this.camera, this.projection);

            this.drawUI(ctx, w, h, state);
        },

        drawUI(ctx, w, h, state) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Quicksand, sans-serif'; ctx.fillText('STRESS DYNAMICS ENGINE', 40, 40);
            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 12px Quicksand, sans-serif';
            const modes = ['btn_mode_macro', 'btn_mode_pathway', 'btn_mode_systemic'];
            const modeName = t(modes[state.factors.viewMode || 0]);
            ctx.fillText(`${modeName} LEVEL: BIOLOGICAL RESPONSE`, 40, 60);

            // Metrics Bento
            const m = state.metrics;
            const mLabels = [
                { l: 'ALLOSTATIC LOAD', v: (m.allostaticLoad * 100).toFixed(1) + '%', c: '#ff5533' },
                { l: 'AUTONOMIC', v: m.autonomicBalance > 0.8 ? 'SYMPATHETIC' : (m.autonomicBalance < 0.3 ? 'PARA' : 'BALANCED'), c: '#ffff66' },
                { l: 'RESILIENCE', v: (m.resilienceReserve * 100).toFixed(0) + '%', c: '#00ff99' },
                { l: 'HPA FEEDBACK', v: (m.hpaSensitivity * 100).toFixed(0) + '%', c: '#ff9900' }
            ];
            mLabels.forEach((ml, i) => {
                const bx = 40 + i * 110;
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                if (this.roundRect) this.roundRect(ctx, bx, h - 80, 100, 50, 8, true);
                ctx.fillStyle = ml.c; ctx.fillRect(bx, h - 80, 2, 50);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Quicksand, sans-serif'; ctx.fillText(ml.l, bx + 10, h - 65);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Quicksand, sans-serif'; ctx.fillText(ml.v, bx + 10, h - 45);
            });

            // Draw Category Headers & Expanded Content
            if (this.ui.categories) {
                this.ui.categories.forEach(cat => {
                    // Checkboxes if open (Panel first)
                    if (cat.isOpen) {
                        const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                        catBoxes.forEach((c, i) => {
                            // Layout Logic (Matches HitTest)
                            const col = i % 2;
                            const row = Math.floor(i / 2);
                            c.x = cat.x + 10 + (col * 190);
                            c.y = cat.y + 30 + (row * 22);

                            if (window.GreenhouseStressControls) {
                                window.GreenhouseStressControls.drawCheckbox(ctx, this, c, state);
                            }
                        });

                        // Draw Background Panel for Dropdown
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        const height = Math.ceil(catBoxes.length / 2) * 22 + 40;
                        ctx.fillRect(cat.x, cat.y + 25, 400, height);
                        ctx.restore();
                    }
                });
            }

            this.ui.buttons.forEach(b => window.GreenhouseStressControls && window.GreenhouseStressControls.drawButton(ctx, this, b, state));

            // Draw Pathway Buttons if in mode 1
            if (Math.round(state.factors.viewMode) === 1 && this.ui.pathwayButtons) {
                this.ui.pathwayButtons.forEach(b => window.GreenhouseStressControls && window.GreenhouseStressControls.drawButton(ctx, this, b, state));
            }

            if (this.ui.hoveredElement && window.GreenhouseStressTooltips && this.ui.hoveredElement.type !== 'header') {
                window.GreenhouseStressTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
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

    window.GreenhouseStressApp = GreenhouseStressApp;
})();
