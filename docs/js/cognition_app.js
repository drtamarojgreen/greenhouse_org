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

        init(selector, selArg = null) {
            // Standardize selector argument handling if re-invoked by GreenhouseUtils
            if (typeof selector !== 'string' && selArg) selector = selArg;

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
            }

            // Initialize Sub-modules
            if (window.GreenhouseCognitionAnalytics) window.GreenhouseCognitionAnalytics.init(this);
            if (window.GreenhouseCognitionTheories) window.GreenhouseCognitionTheories.init(this);
            if (window.GreenhouseCognitionDevelopment) window.GreenhouseCognitionDevelopment.init(this);
            if (window.GreenhouseCognitionInterventions) window.GreenhouseCognitionInterventions.init(this);
            if (window.GreenhouseCognitionMedications) window.GreenhouseCognitionMedications.init(this);
            if (window.GreenhouseCognitionResearch) window.GreenhouseCognitionResearch.init(this);
            if (window.GreenhouseCognitionEducational) window.GreenhouseCognitionEducational.init(this);

            this.createEnhancementUI(container);
            this.createInfoPanel(container);
            this.setupInteraction();

            this.isRunning = true;
            this.startLoop();

            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
            }
        },

        createEnhancementUI(container) {
            const uiContainer = document.createElement('div');
            uiContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 10px;
            `;

            const controlsRow = document.createElement('div');
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
            searchInput.placeholder = 'Search 200 enhancements...';
            searchInput.style.cssText = `
                background: #1a202c; color: #fff; border: 1px solid #4a5568; padding: 5px; border-radius: 4px; flex-grow: 1;
            `;

            controlsRow.appendChild(categorySelect);
            controlsRow.appendChild(searchInput);
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
            this.infoPanel = document.createElement('div');
            this.infoPanel.style.cssText = `
                padding: 20px;
                color: #eee;
                background: rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-family: sans-serif;
                min-height: 100px;
            `;
            this.infoPanel.innerHTML = '<h3>Cognition Simulation</h3><p>Select a cognitive theory to explore its neurological mapping.</p>';
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

            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            grad.addColorStop(0, '#0a200a');
            grad.addColorStop(1, '#051005');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (window.GreenhouseCognitionBrain && window.GreenhouseModels3DMath) {
                window.GreenhouseCognitionBrain.drawBrainShell(
                    ctx, this.brainMesh, this.camera, this.projection, w, h,
                    this.activeRegion ? { region: this.activeRegion } : null
                );
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('COGNITION MODEL: CEREBRAL CORTEX', 20, 30);

            if (this.activeEnhancement) {
                ctx.fillStyle = '#4fd1c5';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`ACTIVE ENHANCEMENT: ${this.activeEnhancement.name.toUpperCase()}`, 20, 50);
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
