// docs/js/neuro_app.js
// Main Application Entry Point for Neuro Simulation - Refactored for High Quality Canvas UI

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseNeuroApp = {
        ga: null,
        ui3d: null,
        isRunning: false,
        intervalId: null,
        baseUrl: '',

        state: {
            viewMode: 0, // 0: Neural, 1: Synaptic, 2: Burst
            dosage: 1.0,
            activeScenarios: new Set(),
            showInfo: false
        },

        ui: {
            hoveredElement: null,
            buttons: [],
            checkboxes: [],
            sliders: [],
            actionButtons: [],
            cameraButtons: []
        },

        init(selector, baseUrl = '') {
            console.log('NeuroApp: Initializing High Quality Canvas UI...');
            // Handle cases where selector is already a DOM element (from GreenhouseUtils re-init)
            this.container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!this.container) return;

            this.baseUrl = baseUrl || '';

            // Do not clear the container if we are already inside it (to avoid flicker)
            // But we need to ensure it's empty if we're starting fresh
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

            this.setupUIComponents();

            this.ui3d = window.GreenhouseNeuroUI3D;
            if (this.ui3d) {
                this.ui3d.init(this.container); // Pass direct element
            }

            this.bindEvents();

            // Start simulation
            this.startSimulation();

            if (window.GreenhouseUtils && window.GreenhouseUtils.renderModelsTOC) {
                // Ensure we pass a string selector to avoid DOMException if targetSelector is an object
                const tocSelector = (typeof selector === 'string') ? selector : (selector.id ? `#${selector.id}` : null);
                window.GreenhouseUtils.renderModelsTOC(tocSelector);
            }
        },

        setupUIComponents() {
            const w = this.ui3d?.canvas?.width || 1000;
            const h = this.ui3d?.canvas?.height || 750;
            const offsetX = 15; // Shift all UI elements right to avoid clipping

            // Mode Buttons
            this.ui.buttons = [
                { id: 'mode_neural', label: t('mode_neural'), val: 0, x: 40 + offsetX, y: 110, w: 100, h: 25 },
                { id: 'mode_synaptic', label: t('mode_synaptic'), val: 1, x: 145 + offsetX, y: 110, w: 110, h: 25 },
                { id: 'mode_burst', label: t('mode_burst'), val: 2, x: 260 + offsetX, y: 110, w: 100, h: 25 }
            ];

            // ADHD Scenarios (from Data)
            this.ui.checkboxes = [];
            if (window.GreenhouseADHDData) {
                let startY = 180;
                let visibleIndex = 0;
                Object.keys(window.GreenhouseADHDData.scenarios).forEach((key) => {
                    if (key === 'none') return;
                    this.ui.checkboxes.push({
                        id: `scenario_${key}`,
                        scenarioId: key,
                        labelKey: `adhd_scenario_${key}`,
                        x: 40 + offsetX,
                        y: startY + visibleIndex * 25,
                        w: 200,
                        h: 20
                    });
                    visibleIndex++;
                });
            }

            // Dosage Slider
            this.ui.sliders = [
                { id: 'dosage_slider', x: 40 + offsetX, y: 480, w: 280, h: 30, min: 0.1, max: 2.0 }
            ];

            // System Buttons
            this.ui.actionButtons = [
                { id: 'btn_pause', label: t('btn_pause'), x: 40 + offsetX, y: 530, w: 80, h: 35, action: 'pause' },
                { id: 'btn_lang', label: t('btn_language'), x: 130 + offsetX, y: 530, w: 80, h: 35, action: 'lang' },
                { id: 'btn_info', label: 'INFO', x: 220 + offsetX, y: 530, w: 80, h: 35, action: 'info' }
            ];

            // Camera Controls (Standardized)
            this.ui.cameraButtons = [
                { id: 'reset_camera', label: t('reset_camera'), x: 400, y: 60, w: 110, h: 25, action: 'reset' },
                { id: 'auto_rotate', label: t('auto_rotate'), x: 515, y: 60, w: 110, h: 25, action: 'rotate' }
            ];
        },

        bindEvents() {
            if (this.ui3d && this.ui3d.canvas) {
                // Use capturing phase (true) to ensure UI handles clicks before the 3D scene
                this.ui3d.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e), true);
                this.ui3d.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e), true);
            }
        },

        handleMouseDown(e) {
            if (!this.ui3d || !this.ui3d.canvas) return;
            const rect = this.ui3d.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.ui3d.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.ui3d.canvas.height / rect.height);

            let hit = false;

            // 1. Buttons (Modes)
            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    this.state.viewMode = b.val;
                    this.switchMode(b.val);
                    hit = true; break;
                }
            }

            // 2. Checkboxes (Scenarios)
            if (!hit) {
                for (const c of this.ui.checkboxes) {
                    if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                        if (this.state.activeScenarios.has(c.scenarioId)) {
                            this.state.activeScenarios.delete(c.scenarioId);
                            this.toggleScenario(c.scenarioId, false);
                        } else {
                            this.state.activeScenarios.add(c.scenarioId);
                            this.toggleScenario(c.scenarioId, true);
                        }
                        hit = true; break;
                    }
                }
            }

            // 3. Slider (Dosage)
            if (!hit) {
                const s = this.ui.sliders[0];
                if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
                    this.updateSlider(mx, s);
                    this.isDraggingSlider = true;
                    hit = true;
                }
            }

            // 4. Action Buttons
            if (!hit) {
                for (const b of this.ui.actionButtons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        if (b.action === 'pause') {
                            if (this.isRunning) this.stopSimulation();
                            else this.startSimulation();
                            b.label = this.isRunning ? t('btn_pause') : t('btn_play');
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

            // 5. Camera Buttons
            if (!hit) {
                for (const b of this.ui.cameraButtons) {
                    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                        if (b.action === 'reset') {
                            if (this.ui3d) this.ui3d.resetCamera();
                        } else if (b.action === 'rotate') {
                            if (this.ui3d) this.ui3d.toggleAutoRotate();
                        }
                        hit = true; break;
                    }
                }
            }

            if (hit) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }

            window.addEventListener('mouseup', () => this.isDraggingSlider = false, { once: true });
        },

        handleMouseMove(e) {
            if (!this.ui3d || !this.ui3d.canvas) return;
            const rect = this.ui3d.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.ui3d.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.ui3d.canvas.height / rect.height);

            if (this.isDraggingSlider) {
                this.updateSlider(mx, this.ui.sliders[0]);
                return;
            }

            this.ui.hoveredElement = null;

            // Simple hit test for all components
            const all = [
                ...this.ui.buttons,
                ...this.ui.checkboxes,
                ...this.ui.sliders,
                ...this.ui.actionButtons,
                ...this.ui.cameraButtons
            ];

            for (const el of all) {
                if (mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h) {
                    this.ui.hoveredElement = el;
                    this.ui3d.canvas.style.cursor = 'pointer';
                    return;
                }
            }
            // If mouse didn't hit UI, let UI3D handle it or reset cursor
            // (UI3D handles region hovers in its own mousemove)
        },

        updateSlider(mx, s) {
            let pct = (mx - s.x) / s.w;
            pct = Math.max(0, Math.min(1, pct));
            this.state.dosage = s.min + pct * (s.max - s.min);
            if (this.ga) this.ga.adhdConfig.dosagePrecision = this.state.dosage;
        },

        refreshUIText() {
            // Update labels based on current language
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

            const offsetX = 15;

            // 1. Draw Main Control Panel Background
            Controls.drawPanel(ctx, this, 20 + offsetX, 20, 350, 580, t('Simulation Controls'));

            // 2. Stats Section
            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText(t('simulation_stats').toUpperCase(), 40 + offsetX, 60);

            ctx.fillStyle = '#fff';
            ctx.font = '500 13px Quicksand';
            const statsText = this.ga ? `${t('gen')}: ${this.ga.generation} | ${t('best_fitness')}: ${Math.round(this.ga.bestGenome?.fitness || 0)}` : t('initializing');
            ctx.fillText(statsText, 40 + offsetX, 80);

            // 3. Mode Section
            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText(t('simulation_mode').toUpperCase(), 40 + offsetX, 100);
            this.ui.buttons.forEach(b => Controls.drawButton(ctx, this, b, this.state.viewMode === b.val));

            // 4. Scenarios Section
            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText(t('adhd_scenarios').toUpperCase(), 40 + offsetX, 155);

            // Draw Scenarios list with scroll simulation (or just clipping)
            ctx.save();
            ctx.beginPath();
            ctx.rect(30 + offsetX, 165, 300, 280);
            ctx.clip();
            this.ui.checkboxes.forEach(c => Controls.drawCheckbox(ctx, this, c, this.state.activeScenarios.has(c.scenarioId)));
            ctx.restore();

            // 5. Dosage Section
            ctx.fillStyle = '#4ca1af';
            ctx.font = '800 10px Quicksand';
            ctx.fillText(t('dosage_optimization').toUpperCase(), 40 + offsetX, 470);
            Controls.drawSlider(ctx, this, this.ui.sliders[0], this.state.dosage);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Quicksand';
            ctx.fillText(this.state.dosage.toFixed(2), 330 + offsetX, 498);

            // 6. Action Buttons
            this.ui.actionButtons.forEach(b => Controls.drawButton(ctx, this, b, false));

            // 7. Camera Controls Panel (Right Side, Responsive)
            const camPanelX = Math.max(380, w - 260);
            Controls.drawPanel(ctx, this, camPanelX, 20, 240, 80, t('3d_view_title'));

            this.ui.cameraButtons.forEach(b => {
                // Reposition based on panel
                if (b.action === 'reset') b.x = camPanelX + 15;
                else b.x = camPanelX + 130;
                b.y = 60;
                const isActive = (b.action === 'rotate' && this.ui3d?.autoRotate);
                Controls.drawButton(ctx, this, b, isActive);
            });

            // 8. Credits / Help hint at bottom
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px Quicksand';
            ctx.fillText('NAVIGATE: DRAG TO ROTATE • WHEEL TO ZOOM', 40 + offsetX, 585);

            // 9. Info Panel (Overlay)
            if (this.state.showInfo) {
                const infoW = 400;
                const infoH = 200;
                const infoX = (w - infoW) / 2;
                const infoY = (h - infoH) / 2;
                Controls.drawPanel(ctx, this, infoX, infoY, infoW, infoH, t('neuro_explanation_title'));

                ctx.fillStyle = '#fff';
                ctx.font = '500 13px Quicksand';
                if (window.GreenhouseModelsUtil && window.GreenhouseModelsUtil.wrapText) {
                    window.GreenhouseModelsUtil.wrapText(ctx, t('neuro_explanation_text'), infoX + 20, infoY + 60, infoW - 40, 20);
                } else {
                    ctx.fillText(t('neuro_explanation_text'), infoX + 20, infoY + 60);
                }

                ctx.fillStyle = '#4ca1af';
                ctx.font = '800 10px Quicksand';
                ctx.textAlign = 'center';
                ctx.fillText('CLICK ANYWHERE TO CLOSE', infoX + infoW / 2, infoY + infoH - 20);
                ctx.textAlign = 'left';
            }
        },

        startSimulation() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.intervalId = setInterval(() => {
                if (this.ga) {
                    const bestGenome = this.ga.step();
                    if (this.ui3d) this.ui3d.updateData(bestGenome);
                }
            }, 100);
        },

        stopSimulation() {
            this.isRunning = false;
            clearInterval(this.intervalId);
        },

        switchMode(index) {
            if (!this.ga) return;
            if (index === 1) {
                this.ga.populationSize = 80;
            } else if (index === 2) {
                this.ga.adhdConfig.burstMode = true; // Use config instead of direct ga property for consistency
            } else {
                this.ga.populationSize = 50;
                this.ga.adhdConfig.burstMode = false;
            }
        },

        toggleScenario(scenarioId, isActive) {
            const data = window.GreenhouseADHDData;
            if (!data || !this.ga) return;

            const scenario = data.scenarios[scenarioId];
            if (!scenario) return;

            scenario.enhancements.forEach(id => {
                this.ga.setADHDEnhancement(id, isActive);
            });
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
