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
        currentCategory: 'theories',
        uiContainer: null,
        theorySelectorContainer: null,

        init(selector) {
            console.log('EmotionApp: Initializing with selector:', selector);
            const container = document.querySelector(selector);
            if (!container) {
                console.error('EmotionApp: Target container not found:', selector);
                return;
            }

            this.config = window.GreenhouseEmotionConfig || {};

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
                { id: 'regulations', label: 'Regulation' },
                { id: 'therapeuticInterventions', label: 'Therapeutic' },
                { id: 'medicationTreatments', label: 'Medication' },
                { id: 'advancedTheories', label: 'Advanced Theories' }
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
                    this.updateInfoPanel();

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

            this.infoPanel.innerHTML = `
                <h3 style="color: #ff4d4d; margin-top: 0;">${this.activeTheory.name}</h3>
                <p>${this.activeTheory.description}</p>
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                    <strong>Involved Regions:</strong> ${regionInfo}
                </div>
            `;
        },

        setupInteraction() {
            let lastX = 0;
            let isDragging = false;

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
            });

            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - lastX;
                    this.camera.rotationY += dx * 0.01;
                    lastX = e.clientX;
                }
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
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Background
            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            grad.addColorStop(0, '#0a0a20');
            grad.addColorStop(1, '#050510');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (window.GreenhouseNeuroBrain && window.GreenhouseModels3DMath) {
                // We use GreenhouseNeuroBrain but with our active region highlight
                window.GreenhouseNeuroBrain.drawBrainShell(
                    ctx,
                    this.brainMesh,
                    this.camera,
                    this.projection,
                    w, h,
                    this.activeRegion ? { region: this.activeRegion } : null
                );
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
        }
    };

    window.GreenhouseEmotionApp = GreenhouseEmotionApp;
})();
