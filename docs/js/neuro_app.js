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
            adhdCategory: 'scenarios', // 'scenarios', 'symptoms', 'treatments', etc.
            scrollOffset: 0
        },

        ui: {
            hoveredElement: null,
            buttons: [],
            checkboxes: [],
            sliders: [],
            actionButtons: [],
            cameraButtons: [],
            tabs: [],
            categoryButtons: [],
            searchInput: { id: 'search_input', x: 40, y: 70, w: 280, h: 30 }
        },

        init(selector, baseUrl = '') {
            console.log('NeuroApp: Initializing High Quality Canvas UI...');
            // Reset State
            this.state = {
                viewMode: 0,
                dosage: 1.0,
                activeScenarios: new Set(),
                activeEnhancements: new Set(),
                showInfo: false,
                activeTab: 'sim',
                searchQuery: '',
                adhdCategory: 'scenarios',
                scrollOffset: 0
            };

            // Robust selector handling (Wix compatibility)
            this.container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!this.container) return;

            this.baseUrl = baseUrl || '';

            if (typeof selector === 'string') {
                this.container.innerHTML = '';
            }
            this.container.style.backgroundColor = '#000';
            this.container.style.position = 'relative';

            // Check dependencies
            if (!window.NeuroGA || !window.GreenhouseNeuroUI3D) {
                console.error('NeuroApp: Missing GA or UI3D dependencies.');
                return;
            }

            this.ga = new window.NeuroGA();
            this.ga.init({
                populationSize: 50,
                bounds: { x: 500, y: 500, z: 500 }
            });

            this.ui3d = window.GreenhouseNeuroUI3D;
            if (this.ui3d) {
                this.ui3d.init(this.container);
            }

            this.setupUIComponents();
            this.updateADHDCheckboxes();
            this.initSearch();
            this.bindEvents();

            this.startSimulation();

            if (window.GreenhouseUtils && window.GreenhouseUtils.renderModelsTOC) {
                const tocSelector = (typeof selector === 'string') ? selector : (selector.id ? `#${selector.id}` : null);
                if (tocSelector) window.GreenhouseUtils.renderModelsTOC(tocSelector);
            }
        },

        setupUIComponents() {
            const w = this.ui3d?.canvas?.width || 1000;
            const h = this.ui3d?.canvas?.height || 750;
            const offsetX = 15;

            // Responsiveness: Adjust panel width based on canvas
            this.ui.panelW = Math.min(350, w - 40);
            const panelW = this.ui.panelW;

            // Tabs
            const tabSpacing = 5;
            const tabW = (panelW - 60 - (tabSpacing * 2)) / 3;
            this.ui.tabs = [
                { id: 'tab_sim', label: t('tab_simulation') || 'SIM', val: 'sim', x: 40 + offsetX, y: 35, w: tabW, h: 25 },
                { id: 'tab_adhd', label: t('tab_adhd') || 'ADHD', val: 'adhd', x: 40 + offsetX + tabW + tabSpacing, y: 35, w: tabW, h: 25 },
                { id: 'tab_synapse', label: t('tab_synapse') || 'DETAIL', val: 'synapse', x: 40 + offsetX + (tabW + tabSpacing) * 2, y: 35, w: tabW, h: 25 }
            ];

            // Mode Buttons
            const btnW = (panelW - 60 - 10) / 3;
            this.ui.buttons = [
                { id: 'mode_neural', label: t('mode_neural'), val: 0, x: 40 + offsetX, y: 140, w: btnW, h: 25 },
                { id: 'mode_synaptic', label: t('mode_synaptic'), val: 1, x: 40 + offsetX + btnW + 5, y: 140, w: btnW, h: 25 },
                { id: 'mode_burst', label: t('mode_burst'), val: 2, x: 40 + offsetX + (btnW + 5) * 2, y: 140, w: btnW, h: 25 }
            ];

            // ADHD Scenarios
            this.ui.checkboxes = [];
            if (window.GreenhouseADHDData) {
                Object.keys(window.GreenhouseADHDData.scenarios).forEach((key) => {
                    if (key === 'none') return;
                    this.ui.checkboxes.push({
                        id: `scenario_${key}`,
                        scenarioId: key,
                        labelKey: `adhd_scenario_${key}`,
                        x: 40 + offsetX,
                        y: 0, // Positioned dynamically
                        w: panelW - 80,
                        h: 20
                    });
                });
            }

            // Dosage Slider
            this.ui.sliders = [
                { id: 'dosage_slider', x: 40 + offsetX, y: 480, w: panelW - 70, h: 30, min: 0.1, max: 2.0 }
            ];

            this.ui.searchInput.x = 40 + offsetX;
            this.ui.searchInput.w = panelW - 70;

            // System Buttons
            this.ui.actionButtons = [
                { id: 'btn_pause', label: t('btn_pause'), x: 40 + offsetX, y: 530, w: 80, h: 35, action: 'pause' },
                { id: 'btn_lang', label: t('btn_language'), x: 130 + offsetX, y: 530, w: 80, h: 35, action: 'lang' },
                { id: 'btn_info', label: 'INFO', x: 220 + offsetX, y: 530, w: 80, h: 35, action: 'info' }
            ];

            // Camera Controls
            this.ui.cameraButtons = [
                { id: 'reset_camera', label: t('reset_camera'), x: 400, y: 60, w: 110, h: 25, action: 'reset' },
                { id: 'auto_rotate', label: t('auto_rotate'), x: 515, y: 60, w: 110, h: 25, action: 'rotate' }
            ];

            // ADHD Category Buttons
            const catW = (panelW - 60 - 10) / 3;
            this.ui.categoryButtons = [
                { id: 'cat_scenarios', label: 'SCENARIOS', val: 'scenarios', x: 40 + offsetX, y: 110, w: catW, h: 20 },
                { id: 'cat_symptoms', label: 'SYMPTOMS', val: 'symptoms', x: 40 + offsetX + catW + 5, y: 110, w: catW, h: 20 },
                { id: 'cat_treatments', label: 'CLINICAL', val: 'treatments', x: 40 + offsetX + (catW + 5) * 2, y: 110, w: catW, h: 20 },
                { id: 'cat_pathology', label: 'PATHOLOGY', val: 'pathology', x: 40 + offsetX, y: 135, w: catW, h: 20 },
                { id: 'cat_etiology', label: 'ETIOLOGY', val: 'etiology', x: 40 + offsetX + catW + 5, y: 135, w: catW, h: 20 },
                { id: 'cat_conditions', label: 'OTHER', val: 'conditions', x: 40 + offsetX + (catW + 5) * 2, y: 135, w: catW, h: 20 }
            ];
        },

        bindEvents() {
            if (this.ui3d && this.ui3d.canvas) {
                this.ui3d.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e), true);
                this.ui3d.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e), true);
                this.ui3d.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

                window.addEventListener('mouseup', () => {
                    this.isDraggingSlider = false;
                });
            }
        },

        handleWheel(e) {
            if (this.state.activeTab !== 'adhd') return;

            const { x: mx, y: my } = this.getMousePos(e);
            const offsetX = 15;
            const scrollAreaX = 30 + offsetX;
            const scrollAreaY = 160;
            const scrollAreaW = 310;
            const scrollAreaH = 320;

            if (mx >= scrollAreaX && mx <= scrollAreaX + scrollAreaW && my >= scrollAreaY && my <= scrollAreaY + scrollAreaH) {
                e.preventDefault();
                const delta = e.deltaY;
                this.state.scrollOffset += delta;

                // Clamp scroll offset
                const filteredCount = this.getFilteredCheckboxes().length;
                const totalHeight = filteredCount * 25;
                const maxScroll = Math.max(0, totalHeight - scrollAreaH + 10);
                this.state.scrollOffset = Math.max(0, Math.min(this.state.scrollOffset, maxScroll));
            }
        },

        getMousePos(e) {
            if (!this.ui3d || !this.ui3d.canvas) return { x: 0, y: 0 };
            const rect = this.ui3d.canvas.getBoundingClientRect();
            // Critical: Map client coordinates to canvas internal resolution
            return {
                x: (e.clientX - rect.left) * (this.ui3d.canvas.width / rect.width),
                y: (e.clientY - rect.top) * (this.ui3d.canvas.height / rect.height)
            };
        },

        handleMouseDown(e) {
            const { x: mx, y: my } = this.getMousePos(e);
            let hit = false;

            // 0. Tabs
            for (const tab of this.ui.tabs) {
                if (mx >= tab.x && mx <= tab.x + tab.w && my >= tab.y && my <= tab.y + tab.h) {
                    this.state.activeTab = tab.val;
                    hit = true; break;
                }
            }

            // 1. Simulation Tab Elements
            if (!hit && this.state.activeTab === 'sim') {
                for (const b of this.ui.buttons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        this.state.viewMode = b.val;
                        this.switchMode(b.val);
                        hit = true; break;
                    }
                }
                const s = this.ui.sliders[0];
                if (!hit && mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
                    this.updateSlider(mx, s);
                    this.isDraggingSlider = true;
                    hit = true;
                }
            }

            // 2. ADHD Tab Elements
            if (!hit && this.state.activeTab === 'adhd') {
                const s = this.ui.searchInput;
                if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
                    if (this.searchElem) this.searchElem.focus();
                    hit = true;
                } else {
                    // Category Selection
                    for (const b of this.ui.categoryButtons) {
                        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                            this.state.adhdCategory = b.val;
                            this.state.scrollOffset = 0;
                            this.updateADHDCheckboxes();
                            hit = true; break;
                        }
                    }

                    if (!hit) {
                        const filtered = this.getFilteredCheckboxes();
                        const scrollAreaY = 160;
                        const scrollAreaH = 320;

                        for (const c of filtered) {
                            // Check if within visible area before hit detection
                            if (c.y < scrollAreaY || c.y + c.h > scrollAreaY + scrollAreaH) continue;

                            if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                                if (this.state.adhdCategory === 'scenarios') {
                                    const active = !this.state.activeScenarios.has(c.scenarioId);
                                    if (active) this.state.activeScenarios.add(c.scenarioId);
                                    else this.state.activeScenarios.delete(c.scenarioId);
                                    this.toggleScenario(c.scenarioId, active);
                                } else {
                                    const active = !this.state.activeEnhancements.has(c.enhancementId);
                                    if (active) this.state.activeEnhancements.add(c.enhancementId);
                                    else this.state.activeEnhancements.delete(c.enhancementId);
                                    this.ga?.setADHDEnhancement(c.enhancementId, active);
                                }
                                hit = true; break;
                            }
                        }
                    }
                }
            }

            // 3. Action Buttons
            if (!hit) {
                for (const b of this.ui.actionButtons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        if (b.action === 'pause') {
                            if (this.isRunning) this.stopSimulation();
                            else this.startSimulation();
                            this.refreshUIText();
                        } else if (b.action === 'lang') {
                            if (window.GreenhouseModelsUtil) window.GreenhouseModelsUtil.toggleLanguage();
                            this.refreshUIText();
                        } else if (b.action === 'info') {
                            this.state.showInfo = !this.state.showInfo;
                        }
                        hit = true; break;
                    }
                }
            }

            // 4. Camera Buttons
            if (!hit) {
                const w = this.ui3d?.canvas?.width || 1000;
                const camPanelX = Math.max(380, w - 260);
                for (const b of this.ui.cameraButtons) {
                    const bx = (b.action === 'reset') ? camPanelX + 15 : camPanelX + 130;
                    if (mx >= bx && mx <= bx + b.w && my >= 60 && my <= 60 + b.h) {
                        if (b.action === 'reset') this.ui3d?.resetCamera();
                        else if (b.action === 'rotate') this.ui3d?.toggleAutoRotate();
                        hit = true; break;
                    }
                }
            }

            // 5. Info Overlay Close
            if (!hit && this.state.showInfo) {
                this.state.showInfo = false;
                hit = true;
            }
        },

        handleMouseMove(e) {
            const { x: mx, y: my } = this.getMousePos(e);

            if (this.isDraggingSlider && this.ui.sliders[0]) {
                this.updateSlider(mx, this.ui.sliders[0]);
                return;
            }

            this.ui.hoveredElement = null;
            this.ui3d.canvas.style.cursor = 'default';

            const all = [...this.ui.tabs, ...this.ui.actionButtons, ...this.ui.cameraButtons];
            if (this.state.activeTab === 'sim') all.push(...this.ui.buttons, ...this.ui.sliders);
            if (this.state.activeTab === 'adhd') {
                const scrollAreaY = 160;
                const scrollAreaH = 320;
                const visibleCheckboxes = this.getFilteredCheckboxes().filter(c => c.y >= scrollAreaY && c.y + c.h <= scrollAreaY + scrollAreaH);
                all.push(...visibleCheckboxes, this.ui.searchInput, ...this.ui.categoryButtons);
            }

            for (const el of all) {
                let ex = el.x;
                if (el.action === 'reset' || el.action === 'rotate') {
                   const w = this.ui3d?.canvas?.width || 1000;
                   const camPanelX = Math.max(380, w - 260);
                   ex = (el.action === 'reset') ? camPanelX + 15 : camPanelX + 130;
                }
                if (mx >= ex && mx <= ex + el.w && my >= (el.y || 60) && my <= (el.y || 60) + el.h) {
                    this.ui.hoveredElement = el;
                    this.ui3d.canvas.style.cursor = 'pointer';
                    return;
                }
            }
        },

        updateSlider(mx, s) {
            let pct = (mx - s.x) / s.w;
            pct = Math.max(0, Math.min(1, pct));
            this.state.dosage = s.min + pct * (s.max - s.min);
            if (this.ga) this.ga.adhdConfig.dosagePrecision = this.state.dosage;
        },

        refreshUIText() {
            this.ui.buttons.forEach(b => b.label = t(b.id));
            this.ui.actionButtons.forEach(b => {
                if (b.action === 'pause') b.label = this.isRunning ? t('btn_pause') : t('btn_play');
                else if (b.action === 'lang') b.label = t('btn_language');
                else if (b.action === 'info') b.label = 'INFO';
            });
            this.ui.cameraButtons.forEach(b => b.label = t(b.id));
        },

        drawUI(ctx, w, h) {
            const Controls = window.GreenhouseNeuroControls;
            if (!Controls) return;

            // Reset state for robust rendering
            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            const offsetX = 15;
            const panelW = this.ui.panelW || 350;

            // 1. Main Panel
            Controls.drawPanel(ctx, this, 20 + offsetX, 20, panelW, 580, '');

            // 2. Tabs
            this.ui.tabs.forEach(tab => {
                Controls.drawButton(ctx, this, tab, this.state.activeTab === tab.val);
            });

            // 3. Tab Content
            if (this.state.activeTab === 'sim') this.drawSimTab(ctx, offsetX);
            else if (this.state.activeTab === 'adhd') this.drawADHDTab(ctx, offsetX);
            else if (this.state.activeTab === 'synapse') this.drawSynapseTab(ctx, offsetX);

            // 4. Action Buttons
            this.ui.actionButtons.forEach(b => Controls.drawButton(ctx, this, b, false));

            // 5. Camera Panel
            const camPanelX = Math.max(380, w - 260);
            Controls.drawPanel(ctx, this, camPanelX, 20, 240, 80, t('3d_view_title'));
            this.ui.cameraButtons.forEach(b => {
                const bx = (b.action === 'reset') ? camPanelX + 15 : camPanelX + 130;
                Controls.drawButton(ctx, this, { ...b, x: bx, y: 60 }, (b.action === 'rotate' && this.ui3d?.autoRotate));
            });

            // 6. Navigation Hint
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px Quicksand';
            ctx.textAlign = 'left';
            ctx.fillText('NAVIGATE: DRAG TO ROTATE • WHEEL TO ZOOM', 40 + offsetX, 585);

            // 7. Info Overlay
            if (this.state.showInfo) this.drawInfoOverlay(ctx, w, h);

            ctx.restore();
        },

        drawSimTab(ctx, offsetX) {
            const Controls = window.GreenhouseNeuroControls;
            const panelW = this.ui.panelW || 350;

            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText(t('simulation_stats').toUpperCase(), 40 + offsetX, 80);

            ctx.fillStyle = '#fff';
            ctx.font = '500 13px Quicksand';
            const statsText = this.ga ? `${t('gen')}: ${this.ga.generation} | ${t('best_fitness')}: ${Math.round(this.ga.bestGenome?.fitness || 0)}` : t('initializing');
            ctx.fillText(statsText, 40 + offsetX, 100);

            ctx.fillStyle = '#4ca1af';
            ctx.fillText(t('simulation_mode').toUpperCase(), 40 + offsetX, 130);
            this.ui.buttons.forEach(b => Controls.drawButton(ctx, this, b, this.state.viewMode === b.val));

            ctx.fillStyle = '#4ca1af';
            ctx.fillText(t('dosage_optimization').toUpperCase(), 40 + offsetX, 470);
            if (this.ui.sliders && this.ui.sliders.length > 0) {
                Controls.drawSlider(ctx, this, this.ui.sliders[0], this.state.dosage);
            }
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Quicksand';
            ctx.textAlign = 'right';
            ctx.fillText(this.state.dosage.toFixed(2), offsetX + panelW - 20, 498);
            ctx.textAlign = 'left';
        },

        drawADHDTab(ctx, offsetX) {
            const Controls = window.GreenhouseNeuroControls;
            Controls.drawSearchBox(ctx, this, this.ui.searchInput, this.state.searchQuery);

            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText('ENHANCEMENT CATEGORIES', 40 + offsetX, 105);

            this.ui.categoryButtons.forEach(b => {
                Controls.drawButton(ctx, this, b, this.state.adhdCategory === b.val);
            });

            const filtered = this.getFilteredCheckboxes();
            const scrollAreaY = 160;
            const scrollAreaH = 320;
            const itemHeight = 25;
            const totalHeight = filtered.length * itemHeight;
            const maxScroll = Math.max(0, totalHeight - scrollAreaH + 10);

            ctx.save();
            ctx.beginPath();
            ctx.rect(30 + offsetX, scrollAreaY, 310, scrollAreaH);
            ctx.clip();
            filtered.forEach((c, idx) => {
                c.y = scrollAreaY + 10 + idx * itemHeight - (this.state.scrollOffset || 0);
                const isActive = (this.state.adhdCategory === 'scenarios')
                    ? this.state.activeScenarios.has(c.scenarioId)
                    : this.state.activeEnhancements.has(c.enhancementId);
                Controls.drawCheckbox(ctx, this, c, isActive);
            });
            ctx.restore();

            // Draw Scrollbar track
            if (maxScroll > 0) {
                const sbX = 340 + offsetX;
                const sbY = scrollAreaY;
                const sbW = 4;
                const sbH = scrollAreaH;

                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.roundRect(ctx, sbX, sbY, sbW, sbH, 2, true);

                // Scrollbar Handle
                const handleH = Math.max(20, (sbH / (totalHeight + 10)) * sbH);
                const handlePos = (this.state.scrollOffset / maxScroll) * (sbH - handleH);
                ctx.fillStyle = 'rgba(76, 161, 175, 0.5)';
                this.roundRect(ctx, sbX, sbY + handlePos, sbW, handleH, 2, true);
            }
        },

        drawSynapseTab(ctx, offsetX) {
            const Synapse = window.GreenhouseNeuroSynapse;
            const panelW = this.ui.panelW || 350;
            if (!this.ui3d || !this.ui3d.selectedConnection) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '14px Quicksand';
                if (window.GreenhouseModelsUtil?.wrapText) {
                    window.GreenhouseModelsUtil.wrapText(ctx, "Select a connection in the 3D view to see its molecular synapse structure.", 40 + offsetX, 100, panelW - 60, 20);
                } else {
                    ctx.fillText("Select a connection to view synapse details.", 40 + offsetX, 100);
                }
                return;
            }
            if (Synapse && this.ui3d.synapseMeshes) {
                Synapse.drawSynapsePiP(ctx, 40 + offsetX, 80, panelW - 40, 380, this.ui3d.selectedConnection, this.ui3d.synapseMeshes, false);
            }
        },

        drawInfoOverlay(ctx, w, h) {
            const Controls = window.GreenhouseNeuroControls;
            const infoW = 400, infoH = 220;
            const infoX = (w - infoW) / 2, infoY = (h - infoH) / 2;
            Controls.drawPanel(ctx, this, infoX, infoY, infoW, infoH, t('neuro_explanation_title'));
            ctx.fillStyle = '#fff';
            ctx.font = '500 13px Quicksand';
            if (window.GreenhouseModelsUtil?.wrapText) {
                window.GreenhouseModelsUtil.wrapText(ctx, t('neuro_explanation_text'), infoX + 20, infoY + 50, infoW - 40, 20);
            }
            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK ANYWHERE TO CLOSE', infoX + infoW / 2, infoY + infoH - 20);
        },

        startSimulation() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame((t) => this.loop(t));
        },

        stopSimulation() {
            this.isRunning = false;
            if (this.rafId) cancelAnimationFrame(this.rafId);
        },

        loop(now) {
            if (!this.isRunning) return;
            const dt = now - this.lastTime;
            this.lastTime = now;
            const simStep = 100;
            this.accumulatedTime += dt;
            while (this.accumulatedTime >= simStep) {
                if (this.ga) {
                    const bestGenome = this.ga.step();
                    if (this.ui3d) this.ui3d.updateData(bestGenome);
                }
                this.accumulatedTime -= simStep;
            }
            this.rafId = requestAnimationFrame((t) => this.loop(t));
        },

        initSearch() {
            if (this.searchElem) return;
            this.searchElem = document.createElement('input');
            this.searchElem.type = 'text';
            this.searchElem.style.position = 'absolute';
            this.searchElem.style.left = '-1000px';
            this.searchElem.addEventListener('input', (e) => this.state.searchQuery = e.target.value.toLowerCase());
            this.container.appendChild(this.searchElem);
        },

        updateADHDCheckboxes() {
            const offsetX = 15;
            const panelW = this.ui.panelW || 350;
            this.ui.checkboxes = [];
            const data = window.GreenhouseADHDData;
            if (!data) return;

            if (this.state.adhdCategory === 'scenarios') {
                Object.keys(data.scenarios).forEach((key) => {
                    if (key === 'none') return;
                    this.ui.checkboxes.push({
                        id: `scenario_${key}`,
                        scenarioId: key,
                        labelKey: `adhd_scenario_${key}`,
                        x: 40 + offsetX,
                        y: 0,
                        w: panelW - 80,
                        h: 20
                    });
                });
            } else {
                const enhancements = data.categories[this.state.adhdCategory] || [];
                enhancements.forEach(e => {
                    this.ui.checkboxes.push({
                        id: `enh_${e.id}`,
                        enhancementId: e.id,
                        labelKey: `adhd_enh_${e.id}_name`,
                        x: 40 + offsetX,
                        y: 0,
                        w: panelW - 80,
                        h: 20
                    });
                });
            }
        },

        getFilteredCheckboxes() {
            let list = this.ui.checkboxes;
            if (this.state.searchQuery) {
                list = list.filter(c => t(c.labelKey).toLowerCase().includes(this.state.searchQuery));
            }
            return list;
        },

        switchMode(index) {
            if (!this.ga) return;
            if (index === 1) this.ga.populationSize = 80;
            else if (index === 2) this.ga.adhdConfig.burstMode = true;
            else { this.ga.populationSize = 50; this.ga.adhdConfig.burstMode = false; }
        },

        toggleScenario(scenarioId, isActive) {
            const data = window.GreenhouseADHDData;
            if (!data || !this.ga) return;
            const scenario = data.scenarios[scenarioId];
            if (scenario) scenario.enhancements.forEach(id => this.ga.setADHDEnhancement(id, isActive));
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

    window.GreenhouseNeuroApp = GreenhouseNeuroApp;
})();
