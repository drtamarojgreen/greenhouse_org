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
            isDragging: false, lastX: 0, lastY: 0, mouseX: 0, mouseY: 0,
            velocityThreshold: 0.0001,
            friction: 0.95,
            velX: 0, velY: 0,
            isYLocked: false
        },
        ui: {
            hoveredElement: null,
            focusedElement: null,
            exportStatus: null,
            metricVelocity: {},
            footerPage: 0,
            metricsPerPage: 4,
            searchQuery: '',
            historyStates: [],
            maxHistoryStates: 20,
            baselineMetrics: null,
            isCompareBaseline: false,
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
            let savedCategories = [];
            try {
                if (typeof localStorage !== 'undefined') {
                    savedCategories = JSON.parse(localStorage.getItem('greenhouse_inflammation_categories') || '[]');
                }
            } catch (e) { console.warn("GreenhouseInflammationApp: localStorage unavailable"); }

            this.ui.categories = [
                { id: 'env', label: 'ENVIRONMENTAL', x: 20, y: 175, w: 200, h: 25, isOpen: true },
                { id: 'psych', label: 'PSYCHOLOGICAL', x: 240, y: 175, w: 200, h: 25, isOpen: false },
                { id: 'philo', label: 'PHILOSOPHICAL', x: 460, y: 175, w: 200, h: 25, isOpen: false },
                { id: 'research', label: 'RESEARCH / BIO', x: 680, y: 175, w: 200, h: 25, isOpen: false }
            ];
            this.ui.categories.forEach(cat => {
                const saved = savedCategories.find(s => s.id === cat.id);
                if (saved) cat.isOpen = saved.isOpen;
            });

            this.setupUI();
            this.computeUILayout();
            this.ui.baselineMetrics = { ...this.engine.state.metrics };

            this.canvas.onmousedown = (e) => this.handleMouseDown(e);
            this.canvas.onmousemove = (e) => this.handleMouseMove(e);
            this.canvas.onmouseup = () => this.handleMouseUp();
            this.canvas.onwheel = (e) => this.handleWheel(e);
            window.onkeydown = (e) => this.handleKeyDown(e);
            this.canvas.tabIndex = 1; // Make canvas focusable

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
                    w: 180, h: 20, impact: f.impact || 0
                });
            });

            this.ui.buttons = [
                { id: 'mode_macro', label: 'MACRO', x: 40, y: 70, w: 60, h: 22, val: 0 },
                { id: 'mode_micro', label: 'MICRO', x: 105, y: 70, w: 65, h: 22, val: 1 },
                { id: 'mode_molecular', label: 'MOLECULAR', x: 175, y: 70, w: 85, h: 22, val: 2 },
                { id: 'mode_pathway', label: 'PATHWAY', x: 265, y: 70, w: 80, h: 22, val: 3 },
                { id: 'toggle_left', label: 'L-HEMI', x: 350, y: 70, w: 60, h: 22, type: 'toggle' },
                { id: 'toggle_right', label: 'R-HEMI', x: 415, y: 70, w: 60, h: 22, type: 'toggle' },
                { id: 'toggle_deep', label: 'DEEP', x: 480, y: 70, w: 50, h: 22, type: 'toggle' },
                { id: 'camera_lock_y', label: 'LOCK Y', x: 535, y: 70, w: 50, h: 22, type: 'toggle' },
                { id: 'camera_reset', label: 'RESET', x: 590, y: 70, w: 50, h: 22, type: 'action' },
                { id: 'export_json', label: 'JSON', x: 645, y: 70, w: 45, h: 22, type: 'action' },
                { id: 'export_csv', label: 'CSV', x: 695, y: 70, w: 45, h: 22, type: 'action' },
                { id: 'toggle_baseline', label: 'BASELINE', x: 745, y: 70, w: 75, h: 22, type: 'toggle' },
                { id: 'undo_factor', label: 'UNDO', x: 825, y: 70, w: 45, h: 22, type: 'action' },
                { id: 'sim_pause', label: 'PAUSE', x: 875, y: 70, w: 50, h: 22, type: 'toggle' },
                { id: 'export_screenshot', label: 'SHOT', x: 930, y: 70, w: 45, h: 22, type: 'action' },
                { id: 'regen_micro', label: 'REGEN', x: 40, y: 100, w: 50, h: 20, type: 'action' },
                { id: 'timeline_window', label: 'WINDOW', x: 100, y: 100, w: 60, h: 20, type: 'action' },
                { id: 'show_notes', label: 'NOTES', x: 170, y: 100, w: 50, h: 20, type: 'toggle' }
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

            // Footer Pagination Click
            const l = this.layout;
            const totalMetrics = 8; // Should match visible metrics in drawUI
            const pages = Math.ceil(totalMetrics / this.ui.metricsPerPage);
            for (let i = 0; i < pages; i++) {
                if (mx >= l.metrics.x + i * 15 - 5 && mx <= l.metrics.x + i * 15 + 5 &&
                    my >= l.metrics.y - 15 - 5 && my <= l.metrics.y - 15 + 5) {
                    this.ui.footerPage = i;
                    return;
                }
            }

            // Breadcrumb Click (Item 83)
            const lb = this.layout.breadcrumbs;
            if (mx >= lb.x && mx <= lb.x + 150 && my >= lb.y - 10 && my <= lb.y + 5) {
                this.resetCamera();
                this.ui.currentRegion = null;
                return;
            }

            // Minimap Click (Item 86)
            const lm = this.layout.miniMap;
            if (mx >= lm.x && mx <= lm.x + lm.w && my >= lm.y && my <= lm.y + lm.h) {
                this.camera.rotationY += Math.PI / 2;
                return;
            }

            for (const cat of this.ui.categories) {
                if (mx >= cat.x && mx <= cat.x + cat.w && my >= cat.y && my <= cat.y + cat.h) {
                    // Check for Clear Category button (right side of header)
                    if (mx >= cat.x + cat.w - 30) {
                        this.clearCategory(cat.id);
                    } else {
                        this.ui.categories.forEach(c => {
                            if (c.id !== cat.id) c.isOpen = false;
                        });
                        cat.isOpen = !cat.isOpen;
                        this.saveCategoryState();
                    }
                    return;
                }
            }

            // Search Bar Hit Test (Inside open category panel)
            const openCat = this.ui.categories.find(c => c.isOpen);
            if (openCat) {
                const isNarrow = this.canvas.width < 960;
                const panelW = isNarrow ? 210 : 400;
                const sx = openCat.x + 10, sy = openCat.y + 30;
                if (mx >= sx && mx <= sx + panelW - 20 && my >= sy && my <= sy + 20) {
                    const query = prompt("Search Factors:", this.ui.searchQuery);
                    if (query !== null) this.ui.searchQuery = query.toLowerCase();
                    return;
                }
            }

            const hit = this.hitTestCheckboxes(mx, my);
            if (hit) {
                this.pushHistoryState();
                this.engine.state.factors[hit.id] = this.engine.state.factors[hit.id] === 1 ? 0 : 1;
                this.highlightedFactor = hit.id;
                setTimeout(() => this.highlightedFactor = null, 1000);
                return;
            }

            // Metric Card Click (Select for timeline)
            const Analysis = window.GreenhouseInflammationAnalysis;
            if (Analysis) {
                const totalMetrics = 8;
                for (let i = 0; i < Math.min(totalMetrics, this.ui.metricsPerPage); i++) {
                    const bx = l.metrics.x + i * l.metrics.spacing;
                    const by = l.metrics.y;
                    if (mx >= bx && mx <= bx + 100 && my >= by && my <= by + 60) {
                        const start = this.ui.footerPage * this.ui.metricsPerPage;
                        const allMetricIds = ['tnfAlpha', 'il10', 'neuroprotection', 'stressBurden', 'bbbIntegrity', 'microgliaActivation', 'nfkbActivation', 'nlrp3State'];
                        const mid = allMetricIds[start + i];
                        if (Analysis.selectedMetrics.includes(mid)) {
                            Analysis.selectedMetrics = Analysis.selectedMetrics.filter(m => m !== mid);
                        } else {
                            if (Analysis.selectedMetrics.length >= 3) Analysis.selectedMetrics.shift();
                            Analysis.selectedMetrics.push(mid);
                        }
                        return;
                    }
                }
            }

            for (const b of this.ui.buttons) {
                if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                    if (b.type === 'toggle') {
                        if (b.id === 'toggle_left') this.ui.showLeftHemisphere = !this.ui.showLeftHemisphere;
                        else if (b.id === 'toggle_right') this.ui.showRightHemisphere = !this.ui.showRightHemisphere;
                        else if (b.id === 'toggle_deep') this.ui.showDeepStructures = !this.ui.showDeepStructures;
                        else if (b.id === 'camera_lock_y') this.interaction.isYLocked = !this.interaction.isYLocked;
                        else if (b.id === 'toggle_baseline') this.ui.isCompareBaseline = !this.ui.isCompareBaseline;
                        else if (b.id === 'sim_pause') this.ui.simPaused = !this.ui.simPaused;
                        else if (b.id === 'show_notes') this.ui.showImplementationNotes = !this.ui.showImplementationNotes;
                    } else if (b.type === 'action') {
                        if (b.id === 'camera_reset') this.resetCamera();
                        else if (b.id === 'export_json') this.exportData('json');
                        else if (b.id === 'export_csv') this.exportData('csv');
                        else if (b.id === 'undo_factor') this.popHistoryState();
                        else if (b.id === 'export_screenshot') this.exportScreenshot();
                        else if (b.id === 'regen_micro') { if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.initMicroData(); }
                        else if (b.id === 'timeline_window') {
                            const Analysis = window.GreenhouseInflammationAnalysis;
                            if (Analysis) {
                                Analysis.timelineWindow = Analysis.timelineWindow === 200 ? 400 : (Analysis.timelineWindow === 400 ? 600 : 200);
                            }
                        }
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

                let catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                if (this.ui.searchQuery) {
                    catBoxes = catBoxes.filter(c => c.label.toLowerCase().includes(this.ui.searchQuery));
                }

                for (let i = 0; i < catBoxes.length; i++) {
                    const col = isNarrow ? 0 : (i % 2);
                    const row = isNarrow ? i : Math.floor(i / 2);
                    const bx = cat.x + 10 + (col * 190);
                    const by = cat.y + 55 + (row * 22); // Shifted for search bar

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
                const dx = (e.clientX - this.interaction.lastX) * 0.01;
                const dy = (e.clientY - this.interaction.lastY) * 0.01;

                this.camera.rotationY += dx;
                if (!this.interaction.isYLocked) {
                    this.camera.rotationX += dy;
                }

                this.interaction.velX = dx;
                this.interaction.velY = dy;

                this.interaction.lastX = e.clientX;
                this.interaction.lastY = e.clientY;
            }
        },

        handleMouseUp() {
            this.interaction.isDragging = false;
        },
        handleWheel(e) {
            e.preventDefault();
            this.camera.z = Math.min(-100, Math.max(-2000, this.camera.z + e.deltaY * 0.5));
            this.showZoomFeedback = true;
            if (this._zoomTimeout) clearTimeout(this._zoomTimeout);
            this._zoomTimeout = setTimeout(() => this.showZoomFeedback = false, 2000);
        },

        resetCamera() {
            this.camera = { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 };
            this.interaction.velX = 0;
            this.interaction.velY = 0;
        },

        handleKeyDown(e) {
            if (e.key === '1') this.engine.state.factors.viewMode = 0;
            if (e.key === '2') this.engine.state.factors.viewMode = 1;
            if (e.key === '3') this.engine.state.factors.viewMode = 2;
            if (e.key === '4') this.engine.state.factors.viewMode = 3;
            if (e.key === 'h') this.ui.showLeftHemisphere = !this.ui.showLeftHemisphere;
            if (e.key === 'r') this.exportData();
            if (e.key === ' ') { e.preventDefault(); this.ui.simPaused = !this.ui.simPaused; }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.popHistoryState();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.cycleFocus(e.shiftKey ? -1 : 1);
            }
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.ui.focusedElement) this.activateFocusedElement();
            }
        },

        cycleFocus(dir) {
            const focusables = [...this.ui.buttons];
            this.ui.categories.forEach(cat => {
                focusables.push({ ...cat, type: 'header' });
                if (cat.isOpen) {
                    const catBoxes = this.ui.checkboxes.filter(c => c.category === cat.id);
                    catBoxes.forEach(cb => focusables.push({ ...cb, type: 'checkbox' }));
                }
            });

            if (!this.ui.focusedElement) {
                this.ui.focusedElement = focusables[0];
            } else {
                const idx = focusables.findIndex(f => f.id === this.ui.focusedElement.id);
                let nextIdx = (idx + dir + focusables.length) % focusables.length;
                this.ui.focusedElement = focusables[nextIdx];
            }
        },

        activateFocusedElement() {
            const el = this.ui.focusedElement;
            if (!el) return;
            if (el.type === 'button') {
                if (el.type === 'toggle') {
                    if (el.id === 'toggle_left') this.ui.showLeftHemisphere = !this.ui.showLeftHemisphere;
                    if (el.id === 'toggle_right') this.ui.showRightHemisphere = !this.ui.showRightHemisphere;
                    if (el.id === 'toggle_deep') this.ui.showDeepStructures = !this.ui.showDeepStructures;
                    if (el.id === 'camera_lock_y') this.interaction.isYLocked = !this.interaction.isYLocked;
                } else if (el.type === 'action') {
                    if (el.id === 'camera_reset') this.resetCamera();
                } else {
                    this.engine.state.factors.viewMode = el.val;
                }
            } else if (el.type === 'header') {
                this.ui.categories.forEach(c => { if (c.id !== el.id) c.isOpen = false; });
                const cat = this.ui.categories.find(c => c.id === el.id);
                if (cat) {
                    cat.isOpen = !cat.isOpen;
                    this.saveCategoryState();
                }
            } else if (el.type === 'checkbox') {
                this.engine.state.factors[el.id] = this.engine.state.factors[el.id] === 1 ? 0 : 1;
            }
        },

        saveCategoryState() {
            try {
                if (typeof localStorage !== 'undefined') {
                    const state = this.ui.categories.map(c => ({ id: c.id, isOpen: c.isOpen }));
                    localStorage.setItem('greenhouse_inflammation_categories', JSON.stringify(state));
                }
            } catch (e) {}
        },

        applyPreset(id) {
            const config = window.GreenhouseInflammationConfig;
            const preset = config.diseasePresets[id];
            if (preset) {
                this.pushHistoryState();
                config.factors.forEach(f => {
                    if (f.type === 'checkbox') this.engine.state.factors[f.id] = 0;
                });
                preset.factors.forEach(fid => {
                    this.engine.state.factors[fid] = 1;
                });
                this.presetFactors = preset.factors;
                setTimeout(() => this.presetFactors = null, 2000);
            }
        },

        clearCategory(catId) {
            this.pushHistoryState();
            const config = window.GreenhouseInflammationConfig;
            config.factors.forEach(f => {
                if (f.category === catId && f.type === 'checkbox') {
                    this.engine.state.factors[f.id] = 0;
                }
            });
        },

        pushHistoryState() {
            const stateClone = JSON.parse(JSON.stringify(this.engine.state.factors));
            this.ui.historyStates.push(stateClone);
            if (this.ui.historyStates.length > this.ui.maxHistoryStates) {
                this.ui.historyStates.shift();
            }
        },

        popHistoryState() {
            if (this.ui.historyStates.length > 0) {
                const prevState = this.ui.historyStates.pop();
                for (const key in prevState) {
                    this.engine.state.factors[key] = prevState[key];
                }
            }
        },

        exportScreenshot() {
            const dataUrl = this.canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `inflammation_capture_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        exportData(format = 'json') {
            if (window.GreenhouseInflammationAnalysis) {
                let result;
                if (format === 'csv') {
                    result = window.GreenhouseInflammationAnalysis.exportToCSV(this.engine.state);
                } else {
                    result = window.GreenhouseInflammationAnalysis.exportToJSON(this.engine.state);
                }

                if (result) {
                    this.ui.exportStatus = {
                        msg: `EXPORTED ${format.toUpperCase()}`,
                        timestamp: result.timestamp,
                        size: (result.size / 1024).toFixed(1) + ' KB'
                    };
                    if (this._exportTimeout) clearTimeout(this._exportTimeout);
                    this._exportTimeout = setTimeout(() => this.ui.exportStatus = null, 5000);
                }
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

            state.driveComponents = { env: scoreEnv * 0.1, stress: stressSync * 0.3, gut: f.leakyGut ? 0.15 : 0, clinical: totalClinicalBurden };
            state.reserveComponents = { psych: scorePsych * 0.08, philo: scorePhilo * 0.05, exercise: f.exerciseRegular ? 0.15 : 0, medication: f.medicationEffect ? 0.25 : 0 };

            const prevTnf = m.tnfAlpha;
            m.tnfAlpha = Util.SimulationEngine.smooth(m.tnfAlpha, Util.SimulationEngine.clamp(inflammatoryDrive - (antiInflammatoryReserve * 0.4), 0.02, 1.0), 0.05);
            this.ui.metricVelocity.tnfAlpha = m.tnfAlpha - prevTnf;
            const prevIl10 = m.il10;
            m.il10 = Util.SimulationEngine.smooth(m.il10, Util.SimulationEngine.clamp(antiInflammatoryReserve + (m.tnfAlpha * 0.1), 0.05, 1.0), 0.02);
            this.ui.metricVelocity.il10 = m.il10 - prevIl10;

            const prevBbb = m.bbbIntegrity;
            m.bbbIntegrity = Util.SimulationEngine.smooth(m.bbbIntegrity, Util.SimulationEngine.clamp(1.0 - (m.tnfAlpha * 0.6) - (f.leakyGut ? 0.1 : 0), 0.1, 1.0), 0.02);
            this.ui.metricVelocity.bbbIntegrity = m.bbbIntegrity - prevBbb;

            const prevMic = m.microgliaActivation;
            m.microgliaActivation = Util.SimulationEngine.smooth(m.microgliaActivation, Util.SimulationEngine.clamp((m.tnfAlpha * 0.8) + (1.0 - m.bbbIntegrity) * 0.4, 0.01, 1.0), 0.03);
            this.ui.metricVelocity.microgliaActivation = m.microgliaActivation - prevMic;

            const neuroTarget = Util.SimulationEngine.clamp(1.0 - (m.tnfAlpha * 0.7) + (m.il10 * 0.3), 0.1, 1.0);
            const prevNeuro = m.neuroprotection;
            m.neuroprotection = Util.SimulationEngine.smooth(m.neuroprotection, neuroTarget, 0.03);
            this.ui.metricVelocity.neuroprotection = m.neuroprotection - prevNeuro;

            const prevStress = m.stressBurden;
            m.stressBurden = Util.SimulationEngine.smooth(m.stressBurden, Util.SimulationEngine.clamp(stressSync + (m.tnfAlpha * 0.5) - (scorePhilo * 0.1), 0.01, 1.0), 0.05);
            this.ui.metricVelocity.stressBurden = m.stressBurden - prevStress;

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

            if (window.GreenhouseInflammationAnalysis) {
                window.GreenhouseInflammationAnalysis.updateHistory(state);
            }
        },

        startLoop() {
            const loop = (t) => {
                if (!this.isRunning) return;
                if (!this.ui.simPaused) {
                    this.engine.update(t);
                }
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        render() {
            const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, state = this.engine.state;
            ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, w, h);

            this.updateCameraInertia();

            if (window.GreenhouseInflammationUI3D) window.GreenhouseInflammationUI3D.render(ctx, state, this.camera, this.projection);

            this.drawUI(ctx, w, h, state);
        },

        updateCameraInertia() {
            if (!this.interaction.isDragging) {
                // Apply velocity with friction
                this.camera.rotationY += this.interaction.velX;
                if (!this.interaction.isYLocked) {
                    this.camera.rotationX += this.interaction.velY;
                }

                this.interaction.velX *= this.interaction.friction;
                this.interaction.velY *= this.interaction.friction;

                // Stop if below threshold
                if (Math.abs(this.interaction.velX) < this.interaction.velocityThreshold) this.interaction.velX = 0;
                if (Math.abs(this.interaction.velY) < this.interaction.velocityThreshold) this.interaction.velY = 0;

                // If no user velocity, apply subtle auto-rotation
                if (this.interaction.velX === 0) {
                    this.camera.rotationY += 0.001;
                }
            }
        },

        drawUI(ctx, w, h, state) {
            const isNarrow = w < 960;
            const l = this.layout;

            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Quicksand, sans-serif'; // Increased size (Enhancement #97)
            ctx.fillText('NEUROINFLAMMATION ENGINE', l.title.x, l.title.y);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 14px Quicksand, sans-serif'; // Increased size
            const modes = ['btn_mode_macro', 'btn_mode_micro', 'btn_mode_molecular', 'PATHWAY'];
            const modeName = state.factors.viewMode === 3 ? 'PATHWAY' : t(modes[state.factors.viewMode || 0]);
            ctx.fillText(`${modeName} LEVEL: IMMUNE RESPONSE`, l.subtitle.x, l.subtitle.y);

            this.drawViewModeLegend(ctx, l.title.x, 85);

            const m = state.metrics;
            const allMetrics = [
                { id: 'tnfAlpha', l: 'TNF-α TONE', v: (m.tnfAlpha * 100).toFixed(1) + '%', rv: m.tnfAlpha.toFixed(3), c: '#ff5533' },
                { id: 'il10', l: 'IL-10 RESERVE', v: (m.il10 * 100).toFixed(1) + '%', rv: m.il10.toFixed(3), c: '#00ff99' },
                { id: 'neuroprotection', l: 'NEUROPROTECTION', v: (m.neuroprotection * 100).toFixed(1) + '%', rv: m.neuroprotection.toFixed(3), c: '#ffff66' },
                { id: 'stressBurden', l: 'STRESS BURDEN', v: (m.stressBurden * 100).toFixed(1) + '%', rv: m.stressBurden.toFixed(3), c: '#ff9900' },
                { id: 'bbbIntegrity', l: 'BBB INTEGRITY', v: (m.bbbIntegrity * 100).toFixed(1) + '%', rv: m.bbbIntegrity.toFixed(3), c: '#64d2ff' },
                { id: 'microgliaActivation', l: 'GLIA ACTIVATION', v: (m.microgliaActivation * 100).toFixed(1) + '%', rv: m.microgliaActivation.toFixed(3), c: '#ff4444' },
                { id: 'nfkbActivation', l: 'NF-κB STATE', v: (m.nfkbActivation * 100).toFixed(1) + '%', rv: m.nfkbActivation.toFixed(3), c: '#ffcc00' },
                { id: 'nlrp3State', l: 'NLRP3 INFLAM.', v: (m.nlrp3State * 100).toFixed(1) + '%', rv: m.nlrp3State.toFixed(3), c: '#ff3300' }
            ];

            const start = this.ui.footerPage * this.ui.metricsPerPage;
            const visibleMetrics = allMetrics.slice(start, start + this.ui.metricsPerPage);

            visibleMetrics.forEach((ml, i) => {
                const bx = l.metrics.x + i * l.metrics.spacing;
                const by = l.metrics.y;

                // Provenance Check (Item 96)
                if (this.interaction.mouseX >= bx && this.interaction.mouseX <= bx + 100 &&
                    this.interaction.mouseY >= by && this.interaction.mouseY <= by + 60) {
                    this.ui.hoveredElement = { id: ml.id, label: ml.l, type: 'metric' };
                }
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.roundRect(ctx, bx, by, 100, 60, 8, true); // Increased height for sparkline
                ctx.fillStyle = ml.c; ctx.fillRect(bx, by, 2, 60);

                // Trend Arrow (Item 22)
                const vel = this.ui.metricVelocity[ml.id] || 0;
                if (Math.abs(vel) > 0.0001) {
                    ctx.fillStyle = vel > 0 ? '#ff5533' : '#00ff99';
                    ctx.beginPath();
                    if (vel > 0) { ctx.moveTo(bx + 90, by + 10); ctx.lineTo(bx + 95, by + 15); ctx.lineTo(bx + 85, by + 15); }
                    else { ctx.moveTo(bx + 90, by + 15); ctx.lineTo(bx + 95, by + 10); ctx.lineTo(bx + 85, by + 10); }
                    ctx.fill();
                }

                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Quicksand, sans-serif'; ctx.fillText(ml.l, bx + 10, by + 15);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Quicksand, sans-serif'; ctx.fillText(ml.v, bx + 10, by + 30);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '8px monospace'; ctx.fillText(ml.rv, bx + 10, by + 40); // Raw Value (Item 21)

                // Sparkline (Item 27)
                if (window.GreenhouseInflammationAnalysis && window.GreenhouseInflammationAnalysis.history[ml.id]) {
                    this.drawMiniSparkline(ctx, bx + 10, by + 55, 80, 15, window.GreenhouseInflammationAnalysis.history[ml.id], ml.c);
                }
            });

            this.drawFooterPagination(ctx, l.metrics.x, l.metrics.y - 15, allMetrics.length);
            this.drawClinicalStrip(ctx, w, h, state);
            this.drawContributorDecomposition(ctx, w, h, state);

            if (this.ui.categories) {
                // Draw all headers first
                this.ui.categories.forEach(cat => {
                    if (window.GreenhouseInflammationControls) {
                        window.GreenhouseInflammationControls.drawCategoryHeader(ctx, this, cat);
                    }
                });

                // Draw the open panel last to ensure it's on top of other headers
                const openCat = this.ui.categories.find(c => c.isOpen);
                if (openCat) {
                    // Search Bar (Item 15)
                    const panelW = isNarrow ? 210 : 400;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(openCat.x + 10, openCat.y + 30, panelW - 20, 20);
                    ctx.fillStyle = '#fff';
                    ctx.font = '9px monospace';
                    ctx.fillText(this.ui.searchQuery ? `SEARCH: ${this.ui.searchQuery}` : 'CLICK TO SEARCH...', openCat.x + 15, openCat.y + 43);

                    let catBoxes = this.ui.checkboxes.filter(c => c.category === openCat.id);
                    if (this.ui.searchQuery) {
                        catBoxes = catBoxes.filter(cb => cb.label.toLowerCase().includes(this.ui.searchQuery));
                    }

                    const rows = isNarrow ? catBoxes.length : Math.ceil(catBoxes.length / 2);
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
                        c.y = openCat.y + 55 + (row * 22); // Shifted down for search bar
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
                window.GreenhouseInflammationControls.drawDebugBadge(ctx, this);
                this.drawExportStatus(ctx);
                if (this.ui.showImplementationNotes) this.drawImplementationNotes(ctx);
            }

            if (window.GreenhouseInflammationAnalysis) {
                window.GreenhouseInflammationAnalysis.render(ctx, this, state, l.analysisMatrix, l.analysisTimeline);
            }

            if (this.ui.hoveredElement && window.GreenhouseInflammationTooltips && this.ui.hoveredElement.type !== 'header') {
                window.GreenhouseInflammationTooltips.draw(ctx, this, this.interaction.mouseX, this.interaction.mouseY);
                if (this.ui.hoveredElement.type === 'checkbox') this.drawImpactPreview(ctx);
            }
        },

        drawExportStatus(ctx) {
            if (!this.ui.exportStatus) return;
            const { msg, timestamp, size } = this.ui.exportStatus;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 255, 150, 0.9)';
            ctx.font = 'bold 10px Quicksand';
            ctx.textAlign = 'right';
            ctx.fillText(`${msg} | ${size} | ${timestamp.split('T')[1].split('.')[0]}`, this.canvas.width - 40, this.canvas.height - 20);
            ctx.restore();
        },

        drawImpactPreview(ctx) {
            const cb = this.ui.hoveredElement;
            if (!cb || cb.impact === undefined) return;

            ctx.save();
            ctx.fillStyle = cb.impact > 0 ? 'rgba(255, 50, 50, 0.2)' : 'rgba(50, 255, 150, 0.2)';
            ctx.fillRect(this.canvas.width / 2 - 100, this.canvas.height - 150, 200, 30);
            ctx.strokeStyle = cb.impact > 0 ? '#ff3300' : '#00ff99';
            ctx.strokeRect(this.canvas.width / 2 - 100, this.canvas.height - 150, 200, 30);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Quicksand';
            ctx.textAlign = 'center';
            const type = cb.impact > 0 ? 'PRO-INFLAMMATORY' : 'ANTI-INFLAMMATORY';
            ctx.fillText(`IMPACT PREVIEW: ${type} (${cb.impact > 0 ? '+' : ''}${cb.impact.toFixed(2)})`, this.canvas.width / 2, this.canvas.height - 132);
            ctx.restore();
        },

        drawMiniSparkline(ctx, x, y, w, h, data, color) {
            if (!data || data.length < 2) return;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            const step = w / data.length;
            data.forEach((v, i) => {
                const px = x + i * step;
                const py = y - (v * h);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.restore();
        },

        drawFooterPagination(ctx, x, y, total) {
            const pages = Math.ceil(total / this.ui.metricsPerPage);
            for (let i = 0; i < pages; i++) {
                ctx.fillStyle = this.ui.footerPage === i ? '#4ca1af' : 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.arc(x + i * 15, y, 4, 0, Math.PI * 2);
                ctx.fill();

                // Clickable area check (simplified, usually done in handleMouseDown)
                if (this.interaction.mouseX >= x + i * 15 - 5 && this.interaction.mouseX <= x + i * 15 + 5 &&
                    this.interaction.mouseY >= y - 5 && this.interaction.mouseY <= y + 5) {
                    this.ui.hoveredElement = { id: `footer_page_${i}`, type: 'ui' };
                }
            }
        },

        drawClinicalStrip(ctx, w, h, state) {
            const f = state.factors;
            const stressSync = window.GreenhouseBioStatus ? window.GreenhouseBioStatus.stress.load : null;

            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(w - 250, 100, 230, 80);
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.3)';
            ctx.strokeRect(w - 250, 100, 230, 80);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 10px Quicksand';
            ctx.fillText('CLINICAL STATUS STRIP', w - 240, 115);

            // Item 33: Stress Load
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            if (stressSync !== null) {
                ctx.fillText(`STRESS LOAD (SYNC): ${stressSync.toFixed(2)}`, w - 240, 132);
            } else {
                ctx.fillStyle = '#ff9900';
                ctx.fillText('STRESS BRIDGE: UNAVAILABLE (DEF: 0.20)', w - 240, 132); // Item 34
            }

            // Item 35: Clinical Flags
            ctx.fillStyle = f.agePreset ? '#ff4444' : '#666';
            ctx.fillText(`AGE BURDEN: ${f.agePreset ? 'HIGH-RISK' : 'NORMAL'}`, w - 240, 145);
            ctx.fillStyle = f.comorbidityDiabetes ? '#ff4444' : '#666';
            ctx.fillText(`DIABETES CO-MORB: ${f.comorbidityDiabetes ? 'ACTIVE' : 'NONE'}`, w - 240, 158);
            ctx.fillStyle = f.sexSpecific ? '#fff' : '#666';
            ctx.fillText(`SEX-SPECIFIC BIAS: ${f.sexSpecific ? 'ENABLED' : 'OFF'}`, w - 240, 171);

            ctx.restore();
        },

        drawContributorDecomposition(ctx, w, h, state) {
            if (!state.driveComponents) return;
            const x = w - 250, y = 200, bw = 230;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(x, y, bw, 100);

            ctx.fillStyle = '#ff5533'; ctx.font = 'bold 9px Quicksand';
            ctx.fillText('INFLAMMATORY DRIVE DECOMPOSITION', x + 5, y + 15);

            const driveKeys = Object.keys(state.driveComponents);
            driveKeys.forEach((k, i) => {
                const val = state.driveComponents[k];
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(x + 5, y + 25 + i * 15, bw - 10, 8);
                ctx.fillStyle = '#ff5533';
                ctx.fillRect(x + 5, y + 25 + i * 15, (bw - 10) * val, 8);
                ctx.fillStyle = '#fff'; ctx.font = '7px monospace';
                ctx.fillText(`${k.toUpperCase()}: ${val.toFixed(2)}`, x + 5, y + 32 + i * 15);
            });

            // Item 29: Warning Badge
            if (state.metrics.tnfAlpha > 0.6 && state.metrics.bbbIntegrity < 0.6) {
                ctx.fillStyle = '#ff0000';
                this.roundRect(ctx, x, y - 30, bw, 25, 5, true);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Quicksand';
                ctx.textAlign = 'center';
                ctx.fillText('WARNING: HIGH NEUROVASCULAR RISK', x + bw/2, y - 13);
            }
            ctx.restore();
        },

        drawImplementationNotes(ctx) {
            const notes = [
                "MODEL FORMULAS & CONSTANTS:",
                "- TNF-α target = clamp(Drive - Reserve*0.4, 0.02, 1.0)",
                "- BBB integrity target = clamp(1.0 - TNF*0.6, 0.1, 1.0)",
                "- Microglia activation target = clamp(TNF*0.8 + (1-BBB)*0.4, 0.01, 1.0)",
                "- Smoothing factors: TNF: 0.05, IL-10: 0.02, BBB: 0.02, Glia: 0.03",
                "- Stress Burden: influenced by stressSync, TNF, and philo factors."
            ];

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 10, 0.95)';
            ctx.fillRect(100, 100, 400, 150);
            ctx.strokeStyle = '#4ca1af';
            ctx.strokeRect(100, 100, 400, 150);

            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
            notes.forEach((n, i) => ctx.fillText(n, 110, 120 + i * 15));
            ctx.restore();
        },

        drawViewModeLegend(ctx, x, y) {
            ctx.save();
            const isHovered = this.interaction.mouseX >= x && this.interaction.mouseX <= x + 400 &&
                              this.interaction.mouseY >= y - 10 && this.interaction.mouseY <= y + 5;

            if (isHovered) {
                this.ui.hoveredElement = { id: 'keyboard_shortcuts', label: t('label_shortcuts'), type: 'ui' };
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
            }

            ctx.font = '9px monospace';
            ctx.fillText(t('view_mode_legend_text'), x, y);
            ctx.restore();
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
