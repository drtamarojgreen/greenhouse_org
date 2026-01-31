/**
 * @file cognition_app.js
 * @description Main application logic for the Cognition Simulation Model.
 */

(function () {
    'use strict';

    const GreenhouseCognitionApp = {
        canvas: null,
        ctx: null,
        isRunning: false,
        camera: { x: 0, y: 0, z: -600, rotationX: 0.2, rotationY: 0, rotationZ: 0, fov: 600 },
        projection: { width: 800, height: 600, near: 10, far: 5000 },
        brainMesh: null,
        activeRegion: null,
        activeTheory: null,
        activeEnhancement: null,
        config: null,
        centroids: {},
        pulses: [],
        backgroundParticles: [],
        options: { glassBrain: false },
        targetCamera: null,
        isAnimatingCamera: false,

        init(selector, selArg = null) {
            // Standardize selector argument handling if re-invoked by GreenhouseUtils
            if (typeof selector !== 'string' && selArg) selector = selArg;

            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

            console.log('CognitionApp: Initializing with selector:', selector);
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) {
                console.error('CognitionApp: Target container not found:', selector);
                return;
            }

            this.config = window.GreenhouseCognitionConfig || {};

            container.innerHTML = '';
            container.style.position = 'relative';
            container.style.backgroundColor = '#051005'; // Slightly green tint for cognition
            container.style.minHeight = '600px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 500;
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            if (window.GreenhouseBrainMeshRealistic) {
                this.brainMesh = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();

                // Assign regions to vertices for highlighting
                if (this.brainMesh.regions) {
                    for (const [regionId, regionData] of Object.entries(this.brainMesh.regions)) {
                        if (regionData.vertices) {
                            regionData.vertices.forEach(vIdx => {
                                if (this.brainMesh.vertices[vIdx]) {
                                    this.brainMesh.vertices[vIdx].region = regionId;
                                }
                            });
                        }
                    }
                }

                if (window.GreenhouseCognitionBrain) {
                    this.centroids = window.GreenhouseCognitionBrain.calculateCentroids(this.brainMesh);
                }
            }

            // Initialize Sub-modules
            if (window.GreenhouseCognitionAnalytics) window.GreenhouseCognitionAnalytics.init(this);
            if (window.GreenhouseCognitionTheories) window.GreenhouseCognitionTheories.init(this);
            if (window.GreenhouseCognitionDevelopment) window.GreenhouseCognitionDevelopment.init(this);
            if (window.GreenhouseCognitionInterventions) window.GreenhouseCognitionInterventions.init(this);
            if (window.GreenhouseCognitionMedications) window.GreenhouseCognitionMedications.init(this);
            if (window.GreenhouseCognitionResearch) window.GreenhouseCognitionResearch.init(this);
            if (window.GreenhouseCognitionEducational) window.GreenhouseCognitionEducational.init(this);

            this.initBackground();
            this.createEnhancementUI(container);
            if (!isMobile) {
                this.createInfoPanel(container);
            }
            this.setupInteraction();

            // Handle Language Change
            window.addEventListener('greenhouseLanguageChanged', () => {
                this.refreshUIText();
            });

            // Local Language Toggle for Cognition
            const langBtn = document.createElement('button');
            langBtn.id = 'cognition-lang-toggle';
            langBtn.textContent = window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t('btn_language') : 'Language';
            langBtn.style.cssText = `
                position: absolute; top: 10px; right: 10px; z-index: 100;
                background: #4fd1c5; color: white; border: none; padding: 5px 12px;
                border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: bold;
            `;
            langBtn.onclick = () => {
                if (window.GreenhouseModelsUtil) window.GreenhouseModelsUtil.toggleLanguage();
            };
            container.appendChild(langBtn);

            this.isRunning = true;
            this.startLoop();

            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
            }
        },

        refreshUIText() {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const lBtn = document.getElementById('cognition-lang-toggle');
            if (lBtn) lBtn.textContent = t('btn_language');

            this.updateInfoPanel();

            // Refresh search placeholder
            const searchInput = document.getElementById('enhancement-search');
            if (searchInput) searchInput.placeholder = t('cog_search_placeholder');

            // Refresh UI Row
            const row = document.querySelector('#cognition-ui-row');
            if (row) {
                const glassBtn = row.querySelector('.cog-glass-btn');
                if (glassBtn) glassBtn.textContent = `${t('cog_glass_brain')}: ${this.options.glassBrain ? 'On' : 'Off'}`;
                const resetBtn = row.querySelector('.cog-reset-btn');
                if (resetBtn) resetBtn.textContent = t('cog_reset_view');
            }
        },

        createEnhancementUI(container) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const uiContainer = document.createElement('div');
            uiContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 10px;
            `;

            const controlsRow = document.createElement('div');
            controlsRow.id = 'cognition-ui-row';
            controlsRow.style.cssText = `
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                align-items: center;
                flex-wrap: wrap;
            `;

            const categories = ['All', 'Analytical', 'Theory', 'Development', 'Intervention', 'Medication', 'Visualization', 'Accuracy', 'Research', 'Educational'];
            const categorySelect = document.createElement('select');
            categorySelect.style.cssText = `
                background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px; border-radius: 4px;
            `;
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                categorySelect.appendChild(opt);
            });

            const searchInput = document.createElement('input');
            searchInput.id = 'enhancement-search';
            searchInput.placeholder = t('cog_search_placeholder');
            searchInput.style.cssText = `
                background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px; border-radius: 4px; flex-grow: 1;
            `;

            const glassToggle = document.createElement('button');
            glassToggle.className = 'cog-glass-btn';
            glassToggle.textContent = `${t('cog_glass_brain')}: Off`;
            glassToggle.style.cssText = `
                background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;
            `;
            glassToggle.onclick = () => {
                this.options.glassBrain = !this.options.glassBrain;
                glassToggle.textContent = `${t('cog_glass_brain')}: ${this.options.glassBrain ? 'On' : 'Off'}`;
                glassToggle.style.borderColor = this.options.glassBrain ? '#4fd1c5' : '#4a5568';
            };

            const resetCamera = document.createElement('button');
            resetCamera.className = 'cog-reset-btn';
            resetCamera.textContent = t('cog_reset_view');
            resetCamera.style.cssText = `
                background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;
            `;
            resetCamera.onclick = () => {
                this.targetCamera = { rotationX: 0.2, rotationY: 0, z: -600 };
                this.isAnimatingCamera = true;
            };

            controlsRow.appendChild(categorySelect);
            controlsRow.appendChild(searchInput);
            controlsRow.appendChild(glassToggle);
            controlsRow.appendChild(resetCamera);
            uiContainer.appendChild(controlsRow);

            const listContainer = document.createElement('div');
            listContainer.id = 'enhancement-list';
            listContainer.style.cssText = `
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 8px;
                scrollbar-width: thin;
                scrollbar-color: #4fd1c5 #1a202c;
            `;

            const renderList = () => {
                listContainer.innerHTML = '';
                const filter = categorySelect.value;
                const search = searchInput.value.toLowerCase();
                const enhancements = (this.config.enhancements || []).filter(e => {
                    const matchCat = filter === 'All' || e.category === filter;
                    const matchSearch = e.name.toLowerCase().includes(search);
                    return matchCat && matchSearch;
                });

                enhancements.forEach(enh => {
                    const btn = document.createElement('button');
                    btn.className = 'enhancement-item';
                    btn.textContent = enh.name;
                    btn.title = enh.description;
                    btn.style.cssText = `
                        background: #1a202c; color: #fff; border: 1px solid #4a5568;
                        padding: 6px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap;
                        font-size: 12px; transition: all 0.2s;
                    `;
                    if (this.activeEnhancement === enh) btn.style.borderColor = '#4fd1c5';
                    btn.onmouseover = () => { btn.style.background = '#2d3748'; };
                    btn.onmouseout = () => { btn.style.background = '#1a202c'; };
                    btn.onclick = () => {
                        this.activeEnhancement = enh;
                        this.activeRegion = enh.region;
                        this.updateInfoPanel();
                        this.zoomToRegion(enh.region);
                        Array.from(listContainer.children).forEach(b => b.style.borderColor = '#4a5568');
                        btn.style.borderColor = '#4fd1c5';
                    };
                    listContainer.appendChild(btn);
                });
            };

            categorySelect.onchange = renderList;
            searchInput.oninput = renderList;
            renderList();

            uiContainer.appendChild(listContainer);
            container.prepend(uiContainer);
        },

        createInfoPanel(container) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            this.infoPanel = document.createElement('div');
            this.infoPanel.style.cssText = `
                padding: 20px;
                color: #eee;
                background: rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-family: sans-serif;
                min-height: 100px;
            `;
            this.infoPanel.innerHTML = `<h3>${t('cog_simulation')}</h3><p>${t('cog_select_desc')}</p>`;
            container.appendChild(this.infoPanel);
        },

        updateInfoPanel() {
            const enh = this.activeEnhancement;
            if (!enh) return;
            const region = this.config.regions[this.activeRegion] || {};
            this.infoPanel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="color: #4fd1c5; margin-top: 0;">${enh.name}</h3>
                    <span style="font-size: 10px; background: #2d3748; padding: 2px 6px; border-radius: 10px; color: #ccc;">${enh.category}</span>
                </div>
                <p style="margin: 5px 0 15px 0; color: #ddd;">${enh.description}</p>
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${region.color || '#4fd1c5'}">
                    <strong style="color: ${region.color || '#fff'}">${region.name || 'Region'}:</strong> ${region.description || ''}
                </div>
            `;
        },

        setupInteraction() {
            let lastX = 0, lastY = 0;
            let isDragging = false;
            let hasDragged = false;

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                hasDragged = false;
                this.isAnimatingCamera = false; // Stop auto-animation on manual interaction
                lastX = e.clientX;
                lastY = e.clientY;
            });

            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged = true;

                    this.camera.rotationY += dx * 0.01;
                    this.camera.rotationX += dy * 0.01;

                    // Limit X rotation to avoid flipping
                    this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));

                    lastX = e.clientX;
                    lastY = e.clientY;
                }
            });

            window.addEventListener('mouseup', (e) => {
                if (isDragging && !hasDragged) {
                    // It was a click, not a drag
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.onBrainClick(x, y);
                }
                isDragging = false;
            });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                // Improved zoom speed and feel
                const delta = e.deltaY;
                const zoomSpeed = Math.abs(this.camera.z) * 0.001;
                this.camera.z += delta * zoomSpeed * 5;
                this.camera.z = Math.min(-200, Math.max(-2000, this.camera.z));
            }, { passive: false });
        },

        onBrainClick(x, y) {
            if (window.GreenhouseCognitionBrain) {
                const pickedRegion = window.GreenhouseCognitionBrain.pickRegion(
                    x, y, this.brainMesh, this.camera, this.projection
                );

                if (pickedRegion) {
                    this.activeRegion = pickedRegion;
                    // Find an enhancement that uses this region to update the UI
                    const relatedEnhancement = this.config.enhancements.find(e => e.region === pickedRegion);
                    if (relatedEnhancement) {
                        this.activeEnhancement = relatedEnhancement;
                        this.updateInfoPanel();
                        this.syncSidebarSelection();
                    } else {
                        // Just highlight region if no specific enhancement is mapped
                        this.updateInfoPanelWithRegionOnly(pickedRegion);
                    }
                }
            }
        },

        syncSidebarSelection() {
            const listContainer = document.getElementById('enhancement-list');
            if (!listContainer) return;

            Array.from(listContainer.children).forEach(btn => {
                if (btn.textContent === this.activeEnhancement?.name) {
                    btn.style.borderColor = '#4fd1c5';
                    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    btn.style.borderColor = '#4a5568';
                }
            });
        },

        updateInfoPanelWithRegionOnly(regionId) {
            const region = this.config.regions[regionId];
            if (!region) return;
            this.infoPanel.innerHTML = `
                <h3 style="color: ${region.color || '#4fd1c5'}; margin-top: 0;">${region.name}</h3>
                <p>${region.description}</p>
                <p style="font-size: 11px; color: #888;">No specific enhancement currently active for this region.</p>
            `;
        },

        startLoop() {
            const animate = () => {
                if (!this.isRunning) return;
                this.update();
                this.render();
                requestAnimationFrame(animate);
            };
            animate();
        },

        zoomToRegion(regionId) {
            const centroid = this.centroids[regionId];
            if (!centroid) return;

            // Calculate target rotation to face the centroid roughly
            // Brain is centered at 0,0,0. Centroid is at (x,y,z)
            const targetRotY = -Math.atan2(centroid.x, -centroid.z);
            const targetRotX = Math.atan2(centroid.y, Math.sqrt(centroid.x * centroid.x + centroid.z * centroid.z)) * 0.5;

            this.targetCamera = {
                rotationX: targetRotX,
                rotationY: targetRotY,
                z: -450 // Zoom in
            };
            this.isAnimatingCamera = true;
        },

        initBackground() {
            this.backgroundParticles = [];
            for (let i = 0; i < 150; i++) {
                this.backgroundParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: 0.5 + Math.random() * 1.5,
                    alpha: 0.1 + Math.random() * 0.3
                });
            }
        },

        update() {
            // Background update
            this.backgroundParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;
            });

            // Camera Interpolation
            if (this.isAnimatingCamera && this.targetCamera) {
                const lerp = 0.05;
                this.camera.rotationX += (this.targetCamera.rotationX - this.camera.rotationX) * lerp;

                // Handle rotation wrapping for Y
                let diffY = this.targetCamera.rotationY - this.camera.rotationY;
                while (diffY > Math.PI) diffY -= Math.PI * 2;
                while (diffY < -Math.PI) diffY += Math.PI * 2;
                this.camera.rotationY += diffY * lerp;

                this.camera.z += (this.targetCamera.z - this.camera.z) * lerp;

                if (Math.abs(diffY) < 0.01 && Math.abs(this.camera.z - this.targetCamera.z) < 1) {
                    this.isAnimatingCamera = false;
                }
            }

            // Update Pulses
            for (let i = this.pulses.length - 1; i >= 0; i--) {
                const p = this.pulses[i];
                p.progress += p.speed;
                if (p.progress >= 1) {
                    this.pulses.splice(i, 1);
                    continue;
                }
                // Linear interpolation for now, can be curved later
                p.x = p.from.x + (p.to.x - p.from.x) * p.progress;
                p.y = p.from.y + (p.to.y - p.from.y) * p.progress;
                p.z = p.from.z + (p.to.z - p.from.z) * p.progress;
            }

            // Random pulse generation based on active state
            if (Math.random() < 0.05) {
                this.generateContextualPulses();
            }
        },

        generateContextualPulses() {
            const enh = this.activeEnhancement;
            if (!enh) return;

            // Mapping enhancements to pulse paths
            const paths = {
                2: [['prefrontalCortex', 'parietalLobe'], ['parietalLobe', 'occipitalLobe']], // Signal Propagation
                8: [['prefrontalCortex', 'parietalLobe']], // Working Memory
                16: [['thalamus', 'amygdala']], // Threat Detection
                106: [['temporalLobe', 'prefrontalCortex']], // Language Processing
                12: [['prefrontalCortex', 'parietalLobe'], ['parietalLobe', 'temporalLobe']] // DMN
            };

            const pathSet = paths[enh.id];
            if (pathSet) {
                pathSet.forEach(pair => {
                    const from = this.centroids[pair[0]];
                    const to = this.centroids[pair[1]];
                    if (from && to) {
                        this.pulses.push({
                            x: from.x, y: from.y, z: from.z,
                            from, to,
                            progress: 0,
                            speed: 0.01 + Math.random() * 0.02,
                            size: 2 + Math.random() * 2,
                            color: enh.id === 16 ? '255, 100, 100' : '57, 255, 20'
                        });
                    }
                });
            }
        },

        render() {
            if (!this.ctx || !this.brainMesh) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            ctx.clearRect(0, 0, w, h);

            // Draw Background
            ctx.save();
            this.backgroundParticles.forEach(p => {
                const brightness = (this.activeEnhancement && this.activeEnhancement.category === 'Theory') ? 1.5 : 1.0;
                ctx.fillStyle = `rgba(57, 255, 20, ${p.alpha * brightness})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();

            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            grad.addColorStop(0, '#0a200a');
            grad.addColorStop(1, '#051005');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (window.GreenhouseCognitionBrain && window.GreenhouseModels3DMath) {
                window.GreenhouseCognitionBrain.drawBrainShell(
                    ctx, this.brainMesh, this.camera, this.projection, w, h,
                    this.activeRegion ? { region: this.activeRegion } : null,
                    this.options
                );

                if (this.pulses.length > 0) {
                    window.GreenhouseCognitionBrain.drawPulses(ctx, this.pulses, this.camera, this.projection);
                }

                // Connection Maps
                const enh = this.activeEnhancement;
                if (enh) {
                    if (enh.id === 12) { // DMN
                        window.GreenhouseCognitionBrain.drawConnections(ctx, this.centroids, ['prefrontalCortex', 'parietalLobe', 'temporalLobe'], this.camera, this.projection, '80, 100, 255');
                    } else if (enh.id === 11) { // Salience Network
                        window.GreenhouseCognitionBrain.drawConnections(ctx, this.centroids, ['amygdala', 'temporalLobe', 'prefrontalCortex'], this.camera, this.projection, '255, 100, 50');
                    }
                }

                // Floating Labels
                window.GreenhouseCognitionBrain.drawLabels(ctx, this.centroids, this.config, this.camera, this.projection);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${t('cog_model_title').toUpperCase()}: ${t('cerebral_cortex').toUpperCase()}`, 20, 30);

            if (this.activeEnhancement) {
                ctx.fillStyle = '#4fd1c5';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`${t('active_enhancement').toUpperCase()}: ${this.activeEnhancement.name.toUpperCase()}`, 20, 50);
            }

            // Call sub-module renders
            if (window.GreenhouseCognitionAnalytics) window.GreenhouseCognitionAnalytics.render(ctx);
            if (window.GreenhouseCognitionTheories) window.GreenhouseCognitionTheories.render(ctx);
            if (window.GreenhouseCognitionDevelopment) window.GreenhouseCognitionDevelopment.render(ctx);
            if (window.GreenhouseCognitionInterventions) window.GreenhouseCognitionInterventions.render(ctx);
            if (window.GreenhouseCognitionMedications) window.GreenhouseCognitionMedications.render(ctx);
            if (window.GreenhouseCognitionResearch) window.GreenhouseCognitionResearch.render(ctx);
            if (window.GreenhouseCognitionEducational) window.GreenhouseCognitionEducational.render(ctx);
        }
    };

    window.GreenhouseCognitionApp = GreenhouseCognitionApp;
})();
