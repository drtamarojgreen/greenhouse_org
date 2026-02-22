// docs/js/neuro_app.js
// Main Application Entry Point for Neuro Simulation - Refactored for Robust Canvas UI

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseNeuroApp = {
        ga: null,
        ui3d: null,
        isRunning: false,
        rafId: null,
        lastTime: 0,
        accumulatedTime: 0,
        baseUrl: '',

        state: {
            viewMode: 0, // 0: Neural, 1: Synaptic, 2: Burst
            dosage: 1.0,
            activeScenarios: new Set(),
            activeEnhancements: new Set(),
            showInfo: false,
            activeTab: 'sim', // 'sim', 'adhd', 'synapse'
            searchQuery: '',
            adhdCategory: 'scenarios',
            scrollOffset: 0,
            dropdowns: {
                category: { isOpen: false, options: [] }
            }
        },

        ui: {
            panelW: 350,
            hoveredElement: null,
            buttons: [],
            checkboxes: [],
            sliders: [],
            actionButtons: [],
            cameraButtons: [],
            tabs: [],
            categoryDropdown: null,
            searchInput: { id: 'search_input', x: 40, y: 70, w: 280, h: 30 }
        },

        init(selector, baseUrl = '') {
            console.log('NeuroApp: Initializing High Quality Canvas UI...');
            this.container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!this.container) return;

            this.baseUrl = baseUrl || '';
            this.container.style.backgroundColor = '#000';
            this.container.style.position = 'relative';

            if (!window.NeuroGA || !window.GreenhouseNeuroUI3D) {
                console.error('NeuroApp: Missing GA or UI3D dependencies.');
                return;
            }

            this.ga = new window.NeuroGA();
            this.ga.init({ populationSize: 50 });

            this.ui3d = window.GreenhouseNeuroUI3D;
            if (this.ui3d) {
                this.ui3d.init(this.container);
                // Initial data push
                const initialBest = this.ga.step();
                this.ui3d.updateData(initialBest);
            }

            this.setupUIComponents();
            this.updateADHDCheckboxes();
            this.initSearch();
            this.bindEvents();
            this.startSimulation();
        },

        setupUIComponents() {
            const w = this.ui3d?.canvas?.width || 1000;
            const offsetX = 15;
            this.ui.panelW = Math.min(350, w - 40);
            const panelW = this.ui.panelW;

            const tabW = (panelW - 70) / 3;
            this.ui.tabs = [
                { id: 'tab_simulation', label: t('tab_simulation'), val: 'sim', x: 40 + offsetX, y: 35, w: tabW, h: 25 },
                { id: 'tab_adhd', label: t('tab_adhd'), val: 'adhd', x: 40 + offsetX + tabW + 5, y: 35, w: tabW, h: 25 },
                { id: 'tab_synapse', label: t('tab_synapse'), val: 'synapse', x: 40 + offsetX + (tabW + 5) * 2, y: 35, w: tabW, h: 25 }
            ];

            const btnW = (panelW - 70) / 3;
            this.ui.buttons = [
                { id: 'mode_neural', label: t('mode_neural'), val: 0, x: 40 + offsetX, y: 140, w: btnW, h: 25 },
                { id: 'mode_synaptic', label: t('mode_synaptic'), val: 1, x: 40 + offsetX + btnW + 5, y: 140, w: btnW, h: 25 },
                { id: 'mode_burst', label: t('mode_burst'), val: 2, x: 40 + offsetX + (btnW + 5) * 2, y: 140, w: btnW, h: 25 }
            ];

            this.ui.sliders = [{ id: 'dosage_slider', x: 40 + offsetX, y: 480, w: panelW - 70, h: 30, min: 0.1, max: 2.0 }];
            this.ui.searchInput.x = 40 + offsetX;
            this.ui.searchInput.w = panelW - 70;

            this.ui.actionButtons = [
                { id: 'btn_pause', label: t('btn_pause'), x: 40 + offsetX, y: 530, w: 80, h: 35, action: 'pause' },
                { id: 'btn_lang', label: t('btn_language'), x: 130 + offsetX, y: 530, w: 80, h: 35, action: 'lang' },
                { id: 'btn_info', label: 'INFO', x: 220 + offsetX, y: 530, w: 80, h: 35, action: 'info' }
            ];

            const camPanelX = Math.max(380, w - 260);
            this.ui.cameraButtons = [
                { id: 'reset_camera', label: t('reset_camera'), x: camPanelX + 15, y: 60, w: 110, h: 25, action: 'reset' },
                { id: 'auto_rotate', label: t('auto_rotate'), x: camPanelX + 130, y: 60, w: 110, h: 25, action: 'rotate' }
            ];

            this.ui.categoryDropdown = {
                id: 'cat_dropdown', x: 40 + offsetX, y: 110, w: panelW - 70, h: 30, val: this.state.adhdCategory,
                options: [
                    { label: t('cat_scenarios') || 'SCENARIOS', val: 'scenarios' },
                    { label: t('cat_symptoms') || 'SYMPTOMS', val: 'symptoms' },
                    { label: t('cat_treatments') || 'CLINICAL', val: 'treatments' },
                    { label: t('cat_pathology') || 'PATHOLOGY', val: 'pathology' },
                    { label: t('cat_etiology') || 'ETIOLOGY', val: 'etiology' },
                    { label: t('cat_conditions') || 'OTHER', val: 'conditions' },
                    { label: t('cat_research') || 'RESEARCH', val: 'research' }
                ]
            };
            this.state.dropdowns.category.options = this.ui.categoryDropdown.options;
        },

        roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
        },

        bindEvents() {
            const canvas = this.ui3d?.canvas;
            if (!canvas) return;
            canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
            window.addEventListener('mouseup', () => this.isDraggingSlider = false);
            window.addEventListener('resize', () => { this.setupUIComponents(); this.updateADHDCheckboxes(); });
        },

        getMousePos(e) {
            const rect = this.ui3d.canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (this.ui3d.canvas.width / rect.width),
                y: (e.clientY - rect.top) * (this.ui3d.canvas.height / rect.height)
            };
        },

        handleMouseDown(e) {
            const { x, y } = this.getMousePos(e);
            let hit = false;

            // Tabs
            for (const t of this.ui.tabs) {
                if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) {
                    this.state.activeTab = t.val; hit = true; break;
                }
            }
            if (hit) return;

            // Sim Tab
            if (this.state.activeTab === 'sim') {
                for (const b of this.ui.buttons) {
                    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                        this.state.viewMode = b.val; this.switchMode(b.val); hit = true; break;
                    }
                }
                if (!hit && x >= this.ui.sliders[0].x && x <= this.ui.sliders[0].x + this.ui.sliders[0].w && y >= this.ui.sliders[0].y && y <= this.ui.sliders[0].y + this.ui.sliders[0].h) {
                    this.isDraggingSlider = true; this.updateSlider(x, this.ui.sliders[0]); hit = true;
                }
            }

            // ADHD Tab (Checkboxes & Dropdown)
            if (this.state.activeTab === 'adhd') {
                const d = this.ui.categoryDropdown;
                if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) {
                    this.state.dropdowns.category.isOpen = !this.state.dropdowns.category.isOpen; hit = true;
                } else if (this.state.dropdowns.category.isOpen) {
                    for (let i=0; i<d.options.length; i++) {
                        const oy = d.y + d.h + 2 + i * 25;
                        if (x >= d.x && x <= d.x + d.w && y >= oy && y <= oy + 25) {
                            this.state.adhdCategory = d.options[i].val; this.state.dropdowns.category.isOpen = false;
                            this.updateADHDCheckboxes(); hit = true; break;
                        }
                    }
                    if (!hit) this.state.dropdowns.category.isOpen = false;
                }

                if (!hit) {
                    const filtered = this.getFilteredCheckboxes();
                    for (const c of filtered) {
                        if (c.y < 160 || c.y > 440) continue;
                        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
                            if (this.state.adhdCategory === 'scenarios') {
                                const act = !this.state.activeScenarios.has(c.scenarioId);
                                if (act) this.state.activeScenarios.add(c.scenarioId); else this.state.activeScenarios.delete(c.scenarioId);
                                this.toggleScenario(c.scenarioId, act);
                            } else {
                                const act = !this.state.activeEnhancements.has(c.enhancementId);
                                if (act) this.state.activeEnhancements.add(c.enhancementId); else this.state.activeEnhancements.delete(c.enhancementId);
                                this.ga?.setADHDEnhancement(c.enhancementId, act);
                            }
                            hit = true; break;
                        }
                    }
                }
            }

            // Action Buttons
            if (!hit) {
                for (const b of this.ui.actionButtons) {
                    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                        if (b.action === 'pause') { this.isRunning ? this.stopSimulation() : this.startSimulation(); this.refreshUIText(); }
                        else if (b.action === 'lang') { window.GreenhouseModelsUtil?.toggleLanguage(); this.refreshUIText(); }
                        else if (b.action === 'info') this.state.showInfo = !this.state.showInfo;
                        hit = true; break;
                    }
                }
            }

            // Camera Buttons
            if (!hit) {
                for (const b of this.ui.cameraButtons) {
                    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                        if (b.action === 'reset') this.ui3d?.resetCamera();
                        else if (b.action === 'rotate') this.ui3d?.toggleAutoRotate();
                        hit = true; break;
                    }
                }
            }
        },

        handleMouseMove(e) {
            const { x, y } = this.getMousePos(e);
            if (this.isDraggingSlider) return this.updateSlider(x, this.ui.sliders[0]);

            this.ui.hoveredElement = null;
            this.ui3d.canvas.style.cursor = 'default';

            const hit3d = this.ui3d?.hitTest(x, y);
            if (hit3d) {
                this.ui.hoveredElement = { ...hit3d, is3D: true, mx: x, my: y };
                this.ui3d.canvas.style.cursor = 'pointer';
            } else {
                const all = [...this.ui.tabs, ...this.ui.actionButtons, ...this.ui.cameraButtons];
                if (this.state.activeTab === 'sim') all.push(...this.ui.buttons, ...this.ui.sliders);
                if (this.state.activeTab === 'adhd') {
                    all.push(...this.getFilteredCheckboxes(), this.ui.categoryDropdown);
                    if (this.state.dropdowns.category.isOpen) {
                        const d = this.ui.categoryDropdown;
                        d.options.forEach((opt, i) => {
                            all.push({ id: `cat_dropdown_opt_${i}`, x: d.x, y: d.y + d.h + 2 + i * 25, w: d.w, h: 25, label: opt.label });
                        });
                    }
                }

                for (const el of all) {
                    if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + (el.h || 0)) {
                        this.ui.hoveredElement = { ...el, mx: x, my: y };
                        this.ui3d.canvas.style.cursor = 'pointer'; break;
                    }
                }
            }
        },

        handleWheel(e) {
            if (this.state.activeTab === 'adhd') {
                const { x, y } = this.getMousePos(e);
                if (x > 30 && x < 350 && y > 160 && y < 440) {
                    e.preventDefault();
                    this.state.scrollOffset = Math.max(0, this.state.scrollOffset + e.deltaY);
                }
            }
        },

        updateSlider(mx, s) {
            let pct = Math.max(0, Math.min(1, (mx - s.x) / s.w));
            this.state.dosage = s.min + pct * (s.max - s.min);
            if (this.ga) this.ga.adhdConfig.dosagePrecision = this.state.dosage;
        },

        startSimulation() { this.isRunning = true; this.lastTime = performance.now(); this.loop(performance.now()); },
        stopSimulation() { this.isRunning = false; },

        loop(now) {
            if (!this.isRunning) return;
            const dt = now - this.lastTime;
            this.lastTime = now;
            this.accumulatedTime += dt;
            let best = null;
            while (this.accumulatedTime >= 100) {
                if (this.ga) best = this.ga.step();
                this.accumulatedTime -= 100;
            }
            if (best && this.ui3d) this.ui3d.updateData(best);

            if (this.ui3d) {
                this.ui3d.cameraControls?.update();
                this.ui3d.render();
            }

            this.rafId = requestAnimationFrame((t) => this.loop(t));
        },

        drawUI(ctx, w, h) {
            const C = window.GreenhouseNeuroControls;
            if (!C || !w || !h) return;
            const panelW = this.ui.panelW || 350;
            const ox = 15;

            C.drawPanel(ctx, this, 20 + ox, 20, panelW, 580, '');
            this.ui.tabs.forEach(tab => C.drawButton(ctx, this, tab, this.state.activeTab === tab.val));

            if (this.state.activeTab === 'sim') this.drawSimTab(ctx, ox);
            else if (this.state.activeTab === 'adhd') this.drawADHDTab(ctx, ox);
            else if (this.state.activeTab === 'synapse') this.drawSynapseTab(ctx, ox);

            this.ui.actionButtons.forEach(b => C.drawButton(ctx, this, b, false));
            const camPanelX = Math.max(panelW + 30, w - 260);
            C.drawPanel(ctx, this, camPanelX, 20, 240, 80, t('3d_view_title'));
            this.ui.cameraButtons.forEach(b => C.drawButton(ctx, this, b, (b.action === 'rotate' && this.ui3d?.autoRotate)));

            const hov = this.ui.hoveredElement;
            if (hov && (hov.tooltip || hov.label)) {
                C.drawTooltip(ctx, this, hov.mx, hov.my, hov.tooltip || hov.label, hov.detail || '');
            }
        },

        drawSimTab(ctx, ox) {
            const C = window.GreenhouseNeuroControls;
            const panelW = this.ui.panelW;
            ctx.fillStyle = '#4ca1af'; ctx.font = '800 10px Quicksand';
            ctx.fillText(t('simulation_stats').toUpperCase(), 40 + ox, 80);
            ctx.fillStyle = '#fff'; ctx.font = '500 13px Quicksand';
            ctx.fillText(`${t('gen')}: ${this.ga?.generation || 0} | ${t('best_fitness')}: ${Math.round(this.ga?.bestGenome?.fitness || 0)}`, 40 + ox, 100);

            ctx.fillStyle = '#4ca1af'; ctx.fillText(t('simulation_mode').toUpperCase(), 40 + ox, 130);
            this.ui.buttons.forEach(b => C.drawButton(ctx, this, b, this.state.viewMode === b.val));

            const desc = t(['mode_neural_desc', 'mode_synaptic_desc', 'mode_burst_desc'][this.state.viewMode]);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'italic 11px Quicksand';
            window.GreenhouseModelsUtil?.wrapText(ctx, desc, 40 + ox, 175, panelW - 60, 14);

            ctx.fillStyle = '#4ca1af'; ctx.fillText(t('dosage_optimization').toUpperCase(), 40 + ox, 470);
            if (this.ui.sliders && this.ui.sliders[0]) {
                C.drawSlider(ctx, this, this.ui.sliders[0], this.state.dosage);
                ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(this.state.dosage.toFixed(2), ox + panelW - 20, 498); ctx.textAlign = 'left';
            }
        },

        drawADHDTab(ctx, ox) {
            const C = window.GreenhouseNeuroControls;
            const filtered = this.getFilteredCheckboxes();
            C.drawDropdown(ctx, this, this.ui.categoryDropdown, this.state.dropdowns.category.isOpen);
            ctx.save(); ctx.beginPath(); ctx.rect(30 + ox, 160, 310, 280); ctx.clip();
            filtered.forEach((c, i) => {
                c.y = 170 + i * 25 - this.state.scrollOffset;
                const act = (this.state.adhdCategory === 'scenarios') ? this.state.activeScenarios.has(c.scenarioId) : this.state.activeEnhancements.has(c.enhancementId);
                C.drawCheckbox(ctx, this, c, act);
            });
            ctx.restore();

            const hov = this.ui.hoveredElement;
            let info = "Hover items for details.";
            if (hov && (hov.scenarioId || hov.enhancementId)) {
                const data = window.GreenhouseADHDData;
                info = hov.scenarioId ? (data.scenarios[hov.scenarioId]?.name || hov.scenarioId) : (data.getEnhancementById(hov.enhancementId)?.description || hov.enhancementId);
            }
            ctx.fillStyle = '#fff'; ctx.font = 'italic 11px Quicksand';
            window.GreenhouseModelsUtil?.wrapText(ctx, info, 40 + ox, 455, 290, 16);
        },

        drawSynapseTab(ctx, ox) {
            const conn = this.ui3d?.selectedConnection;
            if (!conn) { ctx.fillStyle = '#fff'; ctx.fillText("Select a connection in 3D.", 40 + ox, 100); return; }
            window.GreenhouseNeuroSynapse?.drawSynapsePiP(ctx, 40+ox, 80, this.ui.panelW-40, 280, conn, this.ui3d.synapseMeshes, false);
            ctx.fillStyle = '#4ca1af'; ctx.fillText(t('synapse_characteristics').toUpperCase(), 40 + ox, 380);
            ctx.fillStyle = '#fff'; ctx.fillText(`${t('synapse_strength')}: ${conn.weight.toFixed(4)}`, 40 + ox, 400);
            ctx.fillText(`${t('synapse_origin')}: ${t(conn.from.region)}`, 40 + ox, 420);
            ctx.fillText(`${t('synapse_target')}: ${t(conn.to.region)}`, 40 + ox, 440);
        },

        refreshUIText() { this.setupUIComponents(); },
        switchMode(idx) { if (this.ga) { this.ga.populationSize = (idx === 1 ? 80 : 50); this.ga.adhdConfig.burstMode = (idx === 2); } },
        toggleScenario(id, act) { window.GreenhouseADHDData?.scenarios[id]?.enhancements.forEach(eid => this.ga?.setADHDEnhancement(eid, act)); },
        updateADHDCheckboxes() {
            const ox = 15; this.ui.checkboxes = [];
            const data = window.GreenhouseADHDData; if (!data) return;
            if (this.state.adhdCategory === 'scenarios') {
                Object.keys(data.scenarios).forEach(k => { if(k!=='none') this.ui.checkboxes.push({ id:`s_${k}`, scenarioId:k, labelKey:`adhd_scenario_${k}`, x:40+ox, w:this.ui.panelW-80, h:20 }); });
            } else {
                (data.categories ? data.categories[this.state.adhdCategory] : data[this.state.adhdCategory] || []).forEach(e => {
                    this.ui.checkboxes.push({ id:`e_${e.id}`, enhancementId:e.id, labelKey:`adhd_enh_${e.id}_name`, x:40+ox, w:this.ui.panelW-80, h:20 });
                });
            }
        },
        getFilteredCheckboxes() { return this.ui.checkboxes; },
        initSearch() {}
    };

    window.GreenhouseNeuroApp = GreenhouseNeuroApp;
})();
