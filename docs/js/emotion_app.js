/**
 * @file emotion_app.js
 * @description Main application logic for the Emotion Simulation Model.
 * Provides a 3D visualization of the Limbic System and interactive psychological theories.
 */

(function () {
    'use strict';

    const GreenhouseEmotionApp = {
        canvas: null,
        ctx: null,
        isRunning: false,
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 600, near: 10, far: 5000 },
        brainMesh: null,
        activeRegion: null,
        selectedRegion: null,
        activeTheory: null,
        config: null,
        diagrams: null,
        currentCategory: 'theories',
        uiContainer: null,
        mainContentContainer: null,
        theorySelectorContainer: null,
        hoveredRegion: null,
        mousePos: { x: 0, y: 0 },
        simState: {
            cortisol: 0.5,
            serotonin: 0.5,
            gaba: 0.5,
            heartRate: 70,
            targetCortisol: 0.5,
            targetSerotonin: 0.5,
            targetGaba: 0.5,
            jitter: 0
        },

        init(selector) {
            console.log('EmotionApp: Initializing with:', selector);
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) {
                console.error('EmotionApp: Target container not found:', selector);
                return;
            }

            this.config = window.GreenhouseEmotionConfig || {};
            this.diagrams = window.GreenhouseEmotionDiagrams || null;

            // Setup Container
            container.innerHTML = '';
            container.style.position = 'relative';
            container.style.backgroundColor = '#050510';
            container.style.minHeight = '700px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.overflow = 'hidden';

            // Create UI Container (Top)
            this.uiContainer = document.createElement('div');
            this.uiContainer.style.cssText = 'background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 10;';
            container.appendChild(this.uiContainer);

            // Create Main Content (Canvas + Deep Dive)
            this.mainContentContainer = document.createElement('div');
            this.mainContentContainer.style.cssText = 'display: flex; flex: 1; position: relative; overflow: hidden;';
            container.appendChild(this.mainContentContainer);

            // Create Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.display = 'block';
            this.canvas.style.flex = '1';
            this.canvas.style.minWidth = '0'; // Allow shrinking in flex
            this.mainContentContainer.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            // Generate Brain Mesh
            if (window.GreenhouseBrainMeshRealistic) {
                this.brainMesh = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
            } else {
                console.error('EmotionApp: GreenhouseBrainMeshRealistic not found.');
            }

            this.createCategorySelector(this.uiContainer);
            this.theorySelectorContainer = document.createElement('div');
            this.uiContainer.appendChild(this.theorySelectorContainer);

            this.updateTheorySelector();
            this.createInfoPanel(container);
            this.createDeepDivePanel(this.mainContentContainer);

            // Interaction
            this.setupInteraction();

            // Start Loop
            this.isRunning = true;
            this.startLoop();

            // Resilience
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
            }
        },

        createCategorySelector(container) {
            const catDiv = document.createElement('div');
            catDiv.style.cssText = `
                display: flex;
                gap: 10px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                justify-content: center;
                flex-wrap: wrap;
            `;

            const categories = [
                { id: 'theories', label: 'Core Theories' },
                { id: 'regulations', label: 'Emotional Regulation' },
                { id: 'therapeuticInterventions', label: 'Therapeutic Effects' },
                { id: 'medicationTreatments', label: 'Medication Treatments' },
                { id: 'advancedTheories', label: 'Regulation Theories' }
            ];

            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.textContent = cat.label;
                btn.style.cssText = `
                    background: #1a202c;
                    color: #fff;
                    border: 1px solid #4a5568;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                `;

                const updateStyle = () => {
                    btn.style.borderColor = (this.currentCategory === cat.id) ? '#ff4d4d' : '#4a5568';
                    btn.style.background = (this.currentCategory === cat.id) ? '#2d3748' : '#1a202c';
                };

                updateStyle();

                btn.onclick = () => {
                    this.currentCategory = cat.id;
                    Array.from(catDiv.children).forEach(b => {
                        b.style.borderColor = '#4a5568';
                        b.style.background = '#1a202c';
                    });
                    updateStyle();
                    this.updateTheorySelector();
                };
                catDiv.appendChild(btn);
            });

            container.appendChild(catDiv);
        },

        updateTheorySelector() {
            if (!this.theorySelectorContainer) return;
            this.theorySelectorContainer.innerHTML = '';
            this.createTheorySelector(this.theorySelectorContainer);
        },

        createTheorySelector(container) {
            const selectorDiv = document.createElement('div');
            selectorDiv.className = 'emotion-theory-selector';
            selectorDiv.style.cssText = `
                display: flex;
                gap: 8px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.2);
                justify-content: center;
                flex-wrap: wrap;
                max-height: 200px;
                overflow-y: auto;
            `;

            const items = this.config[this.currentCategory] || [];
            items.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = item.name;
                btn.title = item.name;
                btn.style.cssText = `
                    background: #1a202c;
                    color: #eee;
                    border: 1px solid #4a5568;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    white-space: nowrap;
                    transition: all 0.2s;
                `;
                btn.onmouseover = () => { btn.style.borderColor = '#ff4d4d'; };
                btn.onmouseout = () => { if (this.activeTheory !== item) btn.style.borderColor = '#4a5568'; };
                btn.onclick = () => {
                    this.activeTheory = item;
                    this.updateSimulationState(item);

                    // Support single or multiple regions
                    if (item.regions) {
                        this.activeRegion = item.regions;
                    } else {
                        // Legacy support for core theories
                        if (item.name === 'Schachter-Singer') {
                            this.activeRegion = 'prefrontalCortex';
                        } else if (item.name === 'James-Lange') {
                            this.activeRegion = 'hypothalamus';
                        } else {
                            this.activeRegion = 'amygdala';
                        }
                    }

                    this.updateInfoPanel();

                    // Reset all button styles in this container
                    Array.from(selectorDiv.children).forEach(b => b.style.borderColor = '#4a5568');
                    btn.style.borderColor = '#ff4d4d';
                };
                selectorDiv.appendChild(btn);
            });

            container.appendChild(selectorDiv);
        },

        createInfoPanel(container) {
            this.infoPanel = document.createElement('div');
            this.infoPanel.style.cssText = `
                padding: 20px;
                color: #eee;
                background: rgba(10, 10, 30, 0.8);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-family: sans-serif;
                min-height: 120px;
                z-index: 5;
            `;
            this.infoPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0; color: #ff4d4d;">Emotion Simulation</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">Select a psychological theory to explore neurological pathways and emotional regulation.</p>
                    </div>
                    <div style="font-size: 11px; text-align: right; opacity: 0.6;">
                        DRAG to rotate • SCROLL to zoom • CLICK regions for deep dive
                    </div>
                </div>
            `;
            container.appendChild(this.infoPanel);
        },

        createDeepDivePanel(container) {
            this.deepDivePanel = document.createElement('div');
            this.deepDivePanel.style.cssText = `
                width: 0;
                background: rgba(5, 5, 20, 0.95);
                border-left: 1px solid rgba(255, 255, 255, 0.1);
                transition: width 0.3s ease-out;
                overflow-y: auto;
                color: #eee;
                font-family: sans-serif;
                font-size: 14px;
                box-shadow: -5px 0 15px rgba(0,0,0,0.5);
                z-index: 20;
            `;
            container.appendChild(this.deepDivePanel);
        },

        updateSimulationState(item) {
            // Default targets
            let targetCortisol = 0.3 + Math.random() * 0.1;
            let targetSerotonin = 0.5;
            let targetGaba = 0.5;

            // Item-specific impacts
            const id = item.id;

            // Stress / High Arousal
            if (id === 1 || id === 9 || id === 25 || id === 31 || id === 71 || id === 89 || id === 94) {
                targetCortisol = 0.85;
            }

            // Calming / Regulation
            if (id === 2 || id === 10 || id === 28 || id === 33 || id === 43 || id === 65) {
                targetCortisol = 0.15;
            }

            // Serotonin Modulation
            if (id === 23 || (id >= 51 && id <= 55) || id === 61 || id === 63 || id === 74) {
                targetSerotonin = 0.9;
            }

            // GABA Modulation
            if (id === 8 || id === 53 || id === 60) {
                targetGaba = 0.85;
            }

            // Reward
            if (id === 22 || id === 35 || id === 36 || id === 48 || id === 88) {
                targetSerotonin = 0.7; // Boost mood
            }

            // Social support
            if (id === 10 || id === 34 || id === 83 || id === 97) {
                targetCortisol = 0.2;
            }

            this.simState.targetCortisol = targetCortisol;
            this.simState.targetSerotonin = targetSerotonin;
            this.simState.targetGaba = targetGaba;
        },

        updateHoveredRegion() {
            if (!this.brainMesh || !window.GreenhouseModels3DMath) return;

            let minDiv = 20;
            let closest = null;

            // Sample vertices for performance
            const step = 5;
            for (let i = 0; i < this.brainMesh.vertices.length; i += step) {
                const v = this.brainMesh.vertices[i];
                const proj = window.GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, this.camera, this.projection);
                if (proj.scale > 0 && proj.depth < 0.8) {
                    const dx = proj.x - this.mousePos.x;
                    const dy = proj.y - this.mousePos.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < minDiv) {
                        minDiv = dist;
                        closest = v.region;
                    }
                }
            }
            this.hoveredRegion = closest;
        },

        updateSimAnimation() {
            const lerp = (a, b, t) => a + (b - a) * t;
            const speed = 0.05;

            // Biological Jitter (Organic noise)
            const noise = (Math.random() - 0.5) * 0.01;
            this.simState.jitter = lerp(this.simState.jitter, noise, 0.1);

            this.simState.cortisol = lerp(this.simState.cortisol, this.simState.targetCortisol, speed) + this.simState.jitter;
            this.simState.serotonin = lerp(this.simState.serotonin, this.simState.targetSerotonin, speed) + this.simState.jitter * 0.5;
            this.simState.gaba = lerp(this.simState.gaba, this.simState.targetGaba, speed) + this.simState.jitter * 0.3;

            // Clamping
            this.simState.cortisol = Math.max(0, Math.min(1, this.simState.cortisol));
            this.simState.serotonin = Math.max(0, Math.min(1, this.simState.serotonin));
            this.simState.gaba = Math.max(0, Math.min(1, this.simState.gaba));
        },

        updateInfoPanel() {
            if (!this.activeTheory) return;

            let regionInfo = '';
            if (Array.isArray(this.activeRegion)) {
                regionInfo = this.activeRegion.map(r => {
                    const reg = this.config.regions[r] || { name: r };
                    const color = reg.color || '#ff4d4d';
                    return `<button onclick="window.GreenhouseEmotionApp.selectRegion('${r}')" style="background: none; border: none; color: ${color}; cursor: pointer; text-decoration: underline; font-size: 14px; padding: 0; margin-right: 5px;">${reg.name}</button>`;
                }).join(', ');
            } else if (this.activeRegion) {
                const reg = this.config.regions[this.activeRegion] || {};
                const color = reg.color || '#ff4d4d';
                regionInfo = `<button onclick="window.GreenhouseEmotionApp.selectRegion('${this.activeRegion}')" style="background: none; border: none; color: ${color}; cursor: pointer; text-decoration: underline; font-size: 14px; padding: 0;">${reg.name || this.activeRegion}</button>: ${reg.description || ''}`;
            }

            const wellnessInfo = this.activeTheory.wellnessFocus ? `
                <div style="margin-top: 10px; padding: 10px; background: rgba(0,255,100,0.1); border-radius: 4px; border-left: 3px solid #00ff64;">
                    <strong>Wellness Focus:</strong> ${this.activeTheory.wellnessFocus}
                </div>
            ` : '';

            const conditionInfo = this.activeTheory.conditionMapping ? `
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,100,0,0.1); border-radius: 4px; border-left: 3px solid #ff6400;">
                    <strong>Clinical Relevance:</strong> ${this.activeTheory.conditionMapping}
                </div>
            ` : '';

            this.infoPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <div style="flex: 1;">
                        <h3 style="color: #ff4d4d; margin: 0;">${this.activeTheory.name}</h3>
                        <p style="margin: 10px 0;">${this.activeTheory.description}</p>
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                            <strong>Involved Regions:</strong> ${regionInfo}
                        </div>
                    </div>
                    <div style="width: 300px; margin-left: 20px;">
                        ${wellnessInfo}
                        ${conditionInfo}
                    </div>
                </div>
            `;
        },

        selectRegion(regionId) {
            this.selectedRegion = regionId;
            this.activeRegion = regionId; // Highlight it too
            this.updateDeepDivePanel();
        },

        updateDeepDivePanel() {
            if (!this.deepDivePanel) return;

            if (!this.selectedRegion || this.selectedRegion === 'cortex') {
                this.deepDivePanel.style.width = '0';
                this.deepDivePanel.innerHTML = '';
                return;
            }

            const reg = this.config.regions[this.selectedRegion];
            if (!reg) {
                this.deepDivePanel.style.width = '0';
                return;
            }

            this.deepDivePanel.style.width = '350px';
            this.deepDivePanel.style.padding = '20px';

            const subRegionsHtml = reg.subRegions ? `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #aaa; margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase;">Sub-Regions</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${reg.subRegions.map(s => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 12px;">${s}</span>`).join('')}
                    </div>
                </div>
            ` : '';

            const ntHtml = reg.primaryNTs ? `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #aaa; margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase;">Primary Neurotransmitters</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${reg.primaryNTs.map(nt => `<span style="border: 1px solid rgba(255,77,77,0.3); color: #ff4d4d; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${nt}</span>`).join('')}
                    </div>
                </div>
            ` : '';

            const networkHtml = reg.networks ? `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #aaa; margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase;">Network Connectivity</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${reg.networks.map(n => `<span style="background: rgba(0,150,255,0.2); color: #0096ff; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${n}</span>`).join('')}
                    </div>
                </div>
            ` : '';

            const clinicalHtml = reg.clinicalSignificance ? `
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,150,0,0.05); border-left: 2px solid #ff9600;">
                    <h5 style="color: #ff9600; margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase;">Clinical Significance</h5>
                    <p style="margin: 0; font-size: 13px; line-height: 1.4;">${reg.clinicalSignificance}</p>
                </div>
            ` : '';

            this.deepDivePanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: ${reg.color || '#ff4d4d'}; margin: 0;">${reg.name}</h4>
                    <button onclick="window.GreenhouseEmotionApp.selectRegion(null)" style="background: none; border: none; color: #888; cursor: pointer; font-size: 20px;">&times;</button>
                </div>
                <p style="font-size: 14px; line-height: 1.5; color: #ccc; margin-bottom: 20px;">${reg.description || ''}</p>

                ${subRegionsHtml}
                ${ntHtml}
                ${networkHtml}
                ${clinicalHtml}

                <div style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <h5 style="color: #aaa; margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase;">Functional Connectivity Map</h5>
                    <div id="connectivity-visual" style="height: 100px; background: rgba(0,0,0,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #666;">
                        Interactive Neural Map Loading...
                    </div>
                </div>
            `;
        },

        setupInteraction() {
            let lastX = 0;
            let lastY = 0;
            let isDragging = false;
            let dragStartTime = 0;

            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mousePos.x = e.clientX - rect.left;
                this.mousePos.y = e.clientY - rect.top;

                if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    this.camera.rotationY += dx * 0.01;
                    this.camera.rotationX += dy * 0.01;
                    lastX = e.clientX;
                    lastY = e.clientY;
                } else {
                    this.updateHoveredRegion();
                }
            });

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                dragStartTime = Date.now();
            });

            window.addEventListener('mouseup', (e) => {
                const dragDuration = Date.now() - dragStartTime;
                if (isDragging && dragDuration < 200 && this.hoveredRegion) {
                    // It was a click, not a drag
                    this.selectRegion(this.hoveredRegion);
                }
                isDragging = false;
            });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.camera.z += e.deltaY * 0.5;
                this.camera.z = Math.min(-300, Math.max(-1500, this.camera.z));
            }, { passive: false });
        },

        startLoop() {
            const animate = () => {
                if (!this.isRunning) return;
                this.render();
                requestAnimationFrame(animate);
            };
            animate();
        },

        render() {
            if (!this.ctx || !this.brainMesh) return;

            // Sync resolution with display size
            if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
                this.canvas.width = this.canvas.offsetWidth;
                this.canvas.height = this.canvas.offsetHeight;
                this.projection.width = this.canvas.width;
                this.projection.height = this.canvas.height;
            }

            this.updateSimAnimation();

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            if (w === 0 || h === 0) return;

            ctx.clearRect(0, 0, w, h);

            // Atmospheric Background based on state
            const moodFactor = this.simState.serotonin - this.simState.cortisol * 0.5;
            let bgColor1 = '#0a0a20'; // Default dark blue
            let bgColor2 = '#050510';

            if (moodFactor > 0.6) { // High Serotonin, Low Cortisol (Joy/Calm)
                bgColor1 = '#002b1a'; // Deep forest green
            } else if (moodFactor < 0.2) { // High Cortisol, Low Serotonin (Stress/Distress)
                bgColor1 = '#2b0a0a'; // Deep blood red
            } else if (this.simState.serotonin < 0.3) { // Low everything (Depression)
                bgColor1 = '#0a0a0a'; // Black/Grey
            }

            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            grad.addColorStop(0, bgColor1);
            grad.addColorStop(1, bgColor2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (window.GreenhouseEmotionBrain && window.GreenhouseModels3DMath) {
                // Pulse effect for highlighted regions
                const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
                window.GreenhouseEmotionBrain.drawBrainShell(
                    ctx,
                    this.brainMesh,
                    this.camera,
                    this.projection,
                    w, h,
                    this.activeRegion ? { region: this.activeRegion, intensity: pulse } : null
                );
            }

            // Draw Diagrams/Overlays
            if (this.diagrams) {
                this.diagrams.draw(ctx, this);
            }

            // Title Overlay
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('EMOTION MODEL: LIMBIC SYSTEM', 20, 30);

            if (this.activeTheory) {
                ctx.fillStyle = '#ff4d4d';
                ctx.fillText(`ACTIVE THEORY: ${this.activeTheory.name.toUpperCase()}`, 20, 55);
            }

            // Hover Info
            if (this.hoveredRegion && this.hoveredRegion !== 'cortex') {
                const regName = this.config.regions && this.config.regions[this.hoveredRegion] ?
                                this.config.regions[this.hoveredRegion].name : this.hoveredRegion;

                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.font = '12px Arial';
                const tw = ctx.measureText(regName).width;

                ctx.beginPath();
                ctx.roundRect(this.mousePos.x + 15, this.mousePos.y - 30, tw + 20, 25, 5);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.fillText(regName, this.mousePos.x + 25, this.mousePos.y - 13);
                ctx.restore();
            }
        }
    };

    window.GreenhouseEmotionApp = GreenhouseEmotionApp;
})();
