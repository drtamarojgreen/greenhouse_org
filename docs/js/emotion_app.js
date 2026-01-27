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
        activeTheory: null,
        config: null,
        diagrams: null,
        currentCategory: 'theories',
        uiContainer: null,
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
            container.style.minHeight = '600px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';

            // Create Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 500;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            // Generate Brain Mesh
            if (window.GreenhouseBrainMeshRealistic) {
                this.brainMesh = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
            } else {
                console.error('EmotionApp: GreenhouseBrainMeshRealistic not found.');
            }

            // UI Components
            this.uiContainer = document.createElement('div');
            this.uiContainer.style.cssText = 'background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1);';
            container.prepend(this.uiContainer);

            this.createCategorySelector(this.uiContainer);
            this.theorySelectorContainer = document.createElement('div');
            this.uiContainer.appendChild(this.theorySelectorContainer);

            this.updateTheorySelector();
            this.createInfoPanel(container);

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
                background: rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-family: sans-serif;
                min-height: 100px;
            `;
            this.infoPanel.innerHTML = '<h3>Emotion Simulation</h3><p>Select a psychological theory to see how it relates to brain structures.</p>';
            container.appendChild(this.infoPanel);
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
                    return `<span style="color: ${reg.color || '#ff4d4d'}">${reg.name}</span>`;
                }).join(', ');
            } else if (this.activeRegion) {
                const reg = this.config.regions[this.activeRegion] || {};
                regionInfo = `<span style="color: ${reg.color || '#ff4d4d'}">${reg.name || this.activeRegion}</span>: ${reg.description || ''}`;
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
                <h3 style="color: #ff4d4d; margin-top: 0;">${this.activeTheory.name}</h3>
                <p>${this.activeTheory.description}</p>
                ${wellnessInfo}
                ${conditionInfo}
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                    <strong>Involved Regions:</strong> ${regionInfo}
                </div>
            `;
        },

        setupInteraction() {
            let lastX = 0;
            let isDragging = false;

            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mousePos.x = e.clientX - rect.left;
                this.mousePos.y = e.clientY - rect.top;

                if (isDragging) {
                    const dx = e.clientX - lastX;
                    this.camera.rotationY += dx * 0.01;
                    lastX = e.clientX;
                } else {
                    this.updateHoveredRegion();
                }
            });

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
            });

            window.addEventListener('mouseup', () => {
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

            this.updateSimAnimation();

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

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
