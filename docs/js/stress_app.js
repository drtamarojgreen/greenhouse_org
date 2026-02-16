/**
 * @file stress_app.js
 * @description Main application logic for the Stress Dynamics Simulation.
 * Implements binary factor logic (Checkboxes) and updated physiological equations.
 */

(function () {
    'use strict';

    const t = (k) => (window.GreenhouseModelsUtil && window.GreenhouseModelsUtil.t) ? window.GreenhouseModelsUtil.t(k) : k;

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
            lockedTooltip: null,
            checkboxes: [], buttons: [], metrics: []
        },
        baseUrl: '',

        init(selector, baseUrl = '') {
            console.log("GreenhouseStressApp: Initializing Checkbox-Driven UI...");
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

            // Initialize Category State (Expanded 12-node hierarchy)
            this.ui.categories = [
                { id: 'hpa', label: 'stress_cat_hpa', w: 180, h: 25, isOpen: false },
                { id: 'env', label: 'stress_cat_env', w: 180, h: 25, isOpen: true },
                { id: 'limbic', label: 'stress_cat_limbic', w: 180, h: 25, isOpen: false },
                { id: 'psych', label: 'stress_cat_psych', w: 180, h: 25, isOpen: false },
                { id: 'cortical', label: 'stress_cat_cortical', w: 180, h: 25, isOpen: false },
                { id: 'philo', label: 'stress_cat_philo', w: 180, h: 25, isOpen: false },
                { id: 'brainstem', label: 'stress_cat_autonomic', w: 180, h: 25, isOpen: false },
                { id: 'research', label: 'stress_cat_biological_defense', w: 180, h: 25, isOpen: false },
                { id: 'interv', label: 'stress_cat_interv', w: 180, h: 25, isOpen: false },
                { id: 'therapy', label: 'stress_cat_therapy', w: 180, h: 25, isOpen: false },
                { id: 'lifestyle', label: 'stress_cat_lifestyle', w: 180, h: 25, isOpen: false },
                { id: 'system', label: 'stress_cat_system', w: 180, h: 25, isOpen: false }
            ];

            this.setupUI();
            this.updateCategoryPositions();
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

        updateCategoryPositions() {
            const col1 = ['hpa', 'env', 'limbic', 'psych', 'cortical', 'philo'];
            const col2 = ['brainstem', 'research', 'interv', 'therapy', 'lifestyle', 'system'];

            const processCol = (ids, x, startY = 175) => {
                let currentY = startY;
                ids.forEach(id => {
                    const cat = this.ui.categories.find(c => c.id === id);
                    if (!cat) return;
                    cat.x = x;
                    cat.y = currentY;
                    currentY += cat.h + 10; // Increased header gap
                    if (cat.isOpen) {
                        const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                        const rowCount = Math.ceil(catBoxes.length / 2);
                        const height = rowCount * 25 + 45; // Updated height calculation
                        currentY += height + 10;
                    }
                });
            };

            processCol(col1, 20);
            // Responsive right alignment, ensuring no overlap with telemetry dashboard (starts at sw - 220)
            const col2X = Math.max(400, this.canvas.width - 630);
            processCol(col2, col2X, 280);
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
                // Organize pathways in a 2-row grid for better space utilization
                const buttonsPerRow = 4;
                const buttonWidth = 180;
                const buttonHeight = 24;
                const horizontalSpacing = 195;
                const verticalSpacing = 30;
                const startX = 40;
                const startY = 105;

                ui3d.availablePathways.forEach((p, i) => {
                    const row = Math.floor(i / buttonsPerRow);
                    const col = i % buttonsPerRow;

                    this.ui.pathwayButtons.push({
                        id: 'pathway_' + p.id,
                        label: p.name.toUpperCase(),
                        x: startX + (col * horizontalSpacing),
                        y: startY + (row * verticalSpacing),
                        w: buttonWidth,
                        h: buttonHeight,
                        pathwayId: p.id
                    });
                });
            } else {
                // Retry in 500ms if pathways not loaded yet
                setTimeout(() => this.setupPathwayUI(), 500);
            }
        },

        handleMouseDown(e) {
            this.updateCategoryPositions();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // 0. Check Systemic Scrubber Interaction
            if (Math.round(this.engine.state.factors.viewMode) === 2 && window.GreenhouseStressSystemic) {
                const sw = this.canvas.width;
                const sh = this.canvas.height;
                const scrubberW = 400;
                const scrubberX = (sw - scrubberW) / 2;
                const scrubberY = sh - 40;
                if (mx >= scrubberX && mx <= scrubberX + scrubberW && my >= scrubberY - 10 && my <= scrubberY + 20) {
                    window.GreenhouseStressSystemic.timelineT = (mx - scrubberX) / scrubberW;
                    this.interaction.isScrubbing = true;
                    return;
                }
            }

            // 1. Check Category Headers
            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    const wasOpen = cat.isOpen;
                    // Accordion behavior: close others in the same column?
                    // Actually, let's keep it simple: one open at a time globally for layout clarity.
                    this.ui.categories.forEach(c => c.isOpen = false);
                    cat.isOpen = !wasOpen;
                    this.updateCategoryPositions();
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

                    // Item 3: Click-to-lock category tooltip
                    if (this.ui.lockedTooltip && this.ui.lockedTooltip.id === hit3D.id) {
                        this.ui.lockedTooltip = null; // Toggle off if same
                    } else {
                        this.ui.lockedTooltip = { ...hit3D, x: mx, y: my };
                    }
                    return;
                }
            }

            this.ui.lockedTooltip = null; // Clear lock on clicking elsewhere

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
                    const by = cat.y + 40 + (row * 25); // Matched with updated drawUI spacing

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
            this.canvas.style.cursor = 'default';

            if (this.interaction.isScrubbing && window.GreenhouseStressSystemic) {
                const sw = this.canvas.width;
                const scrubberW = 400;
                const scrubberX = (sw - scrubberW) / 2;
                window.GreenhouseStressSystemic.timelineT = Math.min(1, Math.max(0, (mx - scrubberX) / scrubberW));
                return;
            }

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

            // Check Pathway Buttons (when in pathway mode)
            if (!this.ui.hoveredElement && this.ui.pathwayButtons) {
                for (const b of this.ui.pathwayButtons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.ui.hoveredElement = { ...b, type: 'pathway_button' }; break;
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

        handleMouseUp() {
            this.interaction.isDragging = false;
            this.interaction.isScrubbing = false;
        },
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

            // 2. Calculate Aggregated Stress Load (12-Node Hierarchy)
            let scores = {
                env: 0, psych: 0, philo: 0, research: 0, hpa: 0, limbic: 0, cortical: 0, brainstem: 0,
                interv: 0, therapy: 0, lifestyle: 0, system: 0
            };

            const config = window.GreenhouseStressConfig;
            config.factors.forEach(fact => {
                if (f[fact.id] === 1) { // If active
                    if (scores[fact.category] !== undefined) {
                        // Exclude meta-modulators from direct count to avoid double-counting in damping
                        const meta = ['stress_interv_adherence', 'stress_interv_persistence', 'stress_therapy_alliance', 'stress_therapy_homework', 'stress_system_access', 'stress_system_capacity', 'stress_system_wait_times'];
                        if (!meta.includes(fact.id)) scores[fact.category]++;
                    }
                }
            });

            // Clinical Interventions & Adherence (Items 73, 75, 78, 79)
            const adherence = (f.stress_interv_adherence ? 1.0 : 0.4) * (f.stress_interv_persistence ? 1.0 : 0.5);
            const therapyAlliance = (f.stress_therapy_alliance ? 1.2 : 0.8) * (f.stress_therapy_homework ? 1.1 : 0.9);

            // System Constraints (Items 83, 84)
            const systemEfficiency = (f.stress_system_access ? 1.0 : 0.5) * (f.stress_system_capacity ? 1.0 : 0.7) * (f.stress_system_wait_times ? 0.8 : 1.0);

            // Normalized Loads (0.0 - 1.0 range approx)
            // High environmental, hpa, limbic, brainstem scores increase load.
            // Psych, Philo, Cortical, Research buffer it.
            const environmentalLoad = (scores.env * 0.05) + (scores.hpa * 0.03) + (scores.limbic * 0.02) + (scores.brainstem * 0.02) + (f.sleepDeprivation ? 0.3 : 0);

            // Calculate Advanced Damping (Items 74, 80, 81, 82)
            let clinicalDamping = (scores.interv * 0.05 + scores.therapy * 0.06 * therapyAlliance) * adherence * systemEfficiency;
            const lifestyleBuffer = (scores.lifestyle * 0.04);
            const copingBuffer = (scores.psych * 0.04) + (scores.philo * 0.03) + (scores.cortical * 0.04) + (scores.research * 0.02);

            // Stepped-Care Escalation (Item 76)
            if (m.allostaticLoad > 0.7 && f.stress_system_stepped_care) clinicalDamping *= 1.25;

            // Multimodal Synergy (Item 79)
            let synergy = 1.0;
            if (scores.interv > 0 && scores.therapy > 0 && scores.lifestyle > 0) synergy = 1.35;
            else if ((scores.interv > 0 && scores.therapy > 0) || (scores.therapy > 0 && scores.lifestyle > 0)) synergy = 1.15;

            const gutEfficiency = f.gutHealth ? 1.0 : 0.6;
            const damping = (copingBuffer + clinicalDamping + lifestyleBuffer) * synergy * gutEfficiency;

            // 3. Genetic & Epigenetic Modifiers
            // Epigenetic sensitivity: Cumulative load makes the system more "twitchy"
            const epigeneticDrive = h.cumulativeLoad * 0.05;
            const geneticDrive = (f.serotoninTransporter * 0.15) + (f.comtValMet * 0.1) + epigeneticDrive;

            // 4. Diurnal Core Baseline (Cortisol Awakening Response)
            const circadianDrive = this.clock ? this.clock.getCortisolFactor() * 0.2 : 0;

            // 5. Modulators (Brakes) & Gut Health
            // Gut health already incorporated into damping above

            // 6. Autonomic Dynamics (Vagus Nerve / HRV)
            let sympatheticTarget = Util.SimulationEngine.clamp((environmentalLoad + geneticDrive + circadianDrive) - damping, 0, 1.5);

            // Crisis Pathway (Item 77): Acute deterioration without safety planning
            if (m.allostaticLoad > 0.85 && !f.stress_system_crisis_plan) {
                sympatheticTarget += 0.4; // Crisis spike
            }

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
                m.resilienceReserve - (m.allostaticLoad * 0.002) + recovery + ((f.psych_support || 0) * 0.0005),
                0, 1.0
            );

            // 9. Update History (Epigenetics)
            const relapsePrevention = f.stress_interv_relapse_prev ? 1.5 : 1.0;
            const historyRecovery = (m.allostaticLoad < 0.3 ? -0.00005 * relapsePrevention : 0);

            h.cumulativeLoad += (m.allostaticLoad > 0.7) ? 0.0001 : historyRecovery;
            h.cumulativeLoad = Util.SimulationEngine.clamp(h.cumulativeLoad, 0, 10.0);
            h.peakStress = Math.max(h.peakStress, m.allostaticLoad);

            // 10. Neurotransmitter Activity (Comprehensive Coverage)
            // Precursor availability from gut health affects max rates
            const precursorFactor = f.gutHealth ? 1.0 : 0.5;

            // Serotonin: Impacted by stress load, genetic status, and bio factors
            const baseSerotonin = 100 * precursorFactor;
            const serotoninLoss = (m.allostaticLoad * 40) + (f.serotoninTransporter * 20) - (f.bio_sero ? 30 : 0);
            m.serotoninLevels = Util.SimulationEngine.smooth(m.serotoninLevels || 100, (baseSerotonin - serotoninLoss), 0.01);

            // Dopamine: Chronic stress reduces D2 sensitivity; bio factors can override
            const baseDopamine = 100 * precursorFactor;
            const dopamineLoss = (m.allostaticLoad * 50) + (f.comtValMet * 15) - (f.bio_dopa ? 30 : 0);
            m.dopamineLevels = Util.SimulationEngine.smooth(m.dopamineLevels || 100, (baseDopamine - dopamineLoss), 0.01);

            // HPA Pulse Strength (CRH -> ACTH -> Cortisol)
            const crhTarget = (m.autonomicBalance * 100) + (f.bio_crh ? 50 : 0);
            m.crhDrive = Util.SimulationEngine.smooth(m.crhDrive || 0, crhTarget, 0.05);

            const acthTarget = (m.crhDrive * m.hpaSensitivity) + (f.bio_acth ? 50 : 0);
            m.acthDrive = Util.SimulationEngine.smooth(m.acthDrive || 0, acthTarget, 0.05);

            const cortisolTarget = (m.acthDrive * 0.8) + (f.bio_cortisol ? 20 : 0);
            m.cortisolLevels = Util.SimulationEngine.smooth(m.cortisolLevels || 10, cortisolTarget, 0.02);

            // Risk Monitoring (Item 85): Real-time threshold alerts simulation
            if (f.stress_system_risk_monitor && m.allostaticLoad > 0.9) {
                h.riskAlertActive = true;
            } else {
                h.riskAlertActive = false;
            }

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

            // 12. Biological Factor Refinements
            if (f.bio_hrv) m.hrv = Util.SimulationEngine.smooth(m.hrv, m.hrv + 15, 0.05);
            if (f.bio_il6 || f.bio_tnf || f.bio_crp) m.allostaticLoad += 0.0005;
            if (f.bio_bdnf) m.resilienceReserve += 0.0002;
            if (f.bio_oxy) m.autonomicBalance = Util.SimulationEngine.smooth(m.autonomicBalance, m.autonomicBalance * 0.8, 0.02);

            // Final safety clamp
            m.allostaticLoad = Util.SimulationEngine.clamp(m.allostaticLoad, 0.05, 1.0);
            m.resilienceReserve = Util.SimulationEngine.clamp(m.resilienceReserve, 0.0, 1.0);
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
            ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Quicksand, sans-serif'; ctx.fillText(t('stress_ui_engine_title'), 40, 40);
            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 12px Quicksand, sans-serif';
            const modes = ['btn_mode_macro', 'btn_mode_pathway', 'btn_mode_systemic'];
            const modeName = t(modes[state.factors.viewMode || 0]);
            ctx.fillText(`${modeName} LEVEL: ${t('stress_ui_biological_response')}`, 40, 60);

            // Metrics Bento
            const m = state.metrics;
            const mLabels = [
                { l: t('stress_ui_allostatic_load'), v: (m.allostaticLoad * 100).toFixed(1) + '%', c: '#ff5533' },
                { l: t('stress_ui_autonomic'), v: m.autonomicBalance > 0.8 ? t('stress_ui_sympathetic') : (m.autonomicBalance < 0.3 ? t('stress_ui_para') : t('stress_ui_balanced')), c: '#ffff66' },
                { l: t('stress_ui_resilience'), v: (m.resilienceReserve * 100).toFixed(0) + '%', c: '#00ff99' },
                { l: t('stress_ui_hpa_feedback'), v: (m.hpaSensitivity * 100).toFixed(0) + '%', c: '#ff9900' }
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
                    // Draw Header (the actual clickable accordion part)
                    if (window.GreenhouseStressControls) {
                        window.GreenhouseStressControls.drawCategoryHeader(ctx, this, cat);
                    }

                    // Checkboxes if open (Panel first)
                    if (cat.isOpen) {
                        const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                        const rowCount = Math.ceil(catBoxes.length / 2);
                        const height = rowCount * 25 + 45;

                        // Draw Background Panel for Dropdown
                        ctx.save();
                        ctx.fillStyle = 'rgba(5, 10, 20, 0.95)'; // Slightly darker and more opaque
                        ctx.strokeStyle = 'rgba(100, 210, 255, 0.4)';
                        ctx.lineWidth = 1;
                        if (this.roundRect) {
                            this.roundRect(ctx, cat.x - 5, cat.y + 25, 400, height, 8, true, true);
                        } else {
                            ctx.fillRect(cat.x - 5, cat.y + 25, 400, height);
                            ctx.strokeRect(cat.x - 5, cat.y + 25, 400, height);
                        }
                        ctx.restore();

                        catBoxes.forEach((c, i) => {
                            // Layout Logic (Matches HitTest)
                            const col = i % 2;
                            const row = Math.floor(i / 2);
                            c.x = cat.x + 10 + (col * 190);
                            c.y = cat.y + 40 + (row * 25); // Increased spacing

                            if (window.GreenhouseStressControls) {
                                window.GreenhouseStressControls.drawCheckbox(ctx, this, c, state);
                            }
                        });
                    }
                });
            }

            this.ui.buttons.forEach(b => window.GreenhouseStressControls && window.GreenhouseStressControls.drawButton(ctx, this, b, state));

            // Draw Pathway Buttons if in mode 1
            if (Math.round(state.factors.viewMode) === 1 && this.ui.pathwayButtons) {
                // Add section label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = 'bold 11px Quicksand, sans-serif';
                ctx.fillText(t('stress_ui_select_pathway_caps'), 40, 95);

                this.ui.pathwayButtons.forEach(b => window.GreenhouseStressControls && window.GreenhouseStressControls.drawButton(ctx, this, b, state));
            }

            // Tooltips (Item 3: Locked or Hovered)
            if (window.GreenhouseStressTooltips) {
                if (this.ui.lockedTooltip) {
                    window.GreenhouseStressTooltips.draw(ctx, this, this.ui.lockedTooltip.x, this.ui.lockedTooltip.y, true);
                } else if (this.ui.hoveredElement && this.ui.hoveredElement.type !== 'header') {
                    window.GreenhouseStressTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
                }
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
