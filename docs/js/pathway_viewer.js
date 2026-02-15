// docs/js/pathway_viewer.js
// Core viewer for the 3D pathway visualization, using the native 3D engine.

(function () {
    'use strict';

    // Internal helper for parsing KGML data
    const KeggParser = {
        async parse(source, isRaw = false) {
            try {
                let xmlText;
                if (isRaw) {
                    xmlText = source;
                } else {
                    const response = await fetch(source);
                    if (!response.ok) {
                        return { nodes: [], edges: [] };
                    }
                    xmlText = await response.text();
                }
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");

                const nodes = this.extractEntries(xmlDoc);
                const edges = this.extractRelations(xmlDoc);

                return { nodes, edges };
            } catch (error) {
                return { nodes: [], edges: [] };
            }
        },

        extractEntries(xmlDoc) {
            const nodes = [];
            const entries = xmlDoc.getElementsByTagName("entry");

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const graphics = entry.getElementsByTagName("graphics")[0];

                if (graphics) {
                    nodes.push({
                        id: entry.getAttribute("id"),
                        name: graphics.getAttribute("name") || entry.getAttribute("name"),
                        type: entry.getAttribute("type"),
                        x: parseInt(graphics.getAttribute("x"), 10),
                        y: parseInt(graphics.getAttribute("y"), 10),
                    });
                }
            }
            return nodes;
        },

        extractRelations(xmlDoc) {
            const edges = [];
            const relations = xmlDoc.getElementsByTagName("relation");

            for (let i = 0; i < relations.length; i++) {
                const relation = relations[i];
                edges.push({
                    source: relation.getAttribute("entry1"),
                    target: relation.getAttribute("entry2"),
                });
            }
            return edges;
        }
    };

    // Internal helper for generating organic mock data
    const PathwayDataGenerator = {
        generate(id, regions) {
            const nodes = [];
            const edges = [];

            // Map region names to common anatomical labels/neurotransmitters
            const regionLabels = {
                'gut': ['Tryptophan', 'Gut Microbiota', 'Enteric Nerves'],
                'blood_stream': ['Kynurenine', 'Albumin-bound Trp', 'Cytokines'],
                'brain_stem': ['Raphe Nuclei', 'Locus Coeruleus', 'VTA'],
                'pfc': ['Glutamate', 'GABA', 'Neuromodulation'],
                'hypothalamus': ['CRH', 'Oxytocin', 'Homeostasis'],
                'pituitary': ['ACTH', 'GH', 'Master Gland'],
                'adrenals': ['Cortisol', 'Adrenaline', 'Stress Response'],
                'scn': ['Melatonin', 'BMAL1', 'CLOCK'],
                'pineal': ['Serotonin-to-Melatonin', 'Circadian Output'],
                'liver': ['Metabolic Clock', 'IGF-1'],
                'heart': ['Adrenergic Input', 'HRV'],
                'vta': ['Dopamine Pulse', 'Reward Prediction'],
                'sn': ['Motor Control', 'Basal Ganglia'],
                'striatum': ['D1 Receptors', 'D2 Receptors'],
                'raphe': ['5-HT', 'Mood Regulation'],
                'amygdala': ['Fear Response', 'Emotional Salience'],
                'hippocampus': ['Memory Consolidation', 'Neurogenesis'],
                'locus_coeruleus': ['Norepinephrine', 'Vigilance'],
                'thalamus': ['Sensory Gating', 'Relay Station'],
                'spinal_cord': ['Autonomic Outflow', 'Reflexes'],
                'synapse': ['Synaptic Vesicles', 'Ion Channels', 'Receptors'],
                'cytosol': ['Kinase Cascade', 'ATP'],
                'nucleus': ['Gene Expression', 'Epigenetics']
            };

            let globalNodeId = 1;

            regions.forEach((region, rIdx) => {
                const labels = regionLabels[region] || [region.toUpperCase()];
                labels.forEach((label, lIdx) => {
                    const nodeId = `n_${id}_${rIdx}_${lIdx}`;
                    nodes.push({
                        id: nodeId,
                        name: label,
                        type: this.determineType(label),
                        region: region,
                        // Pseudo-random but deterministic coordinates for KGML compatibility
                        x: 100 + rIdx * 150 + lIdx * 30,
                        y: 100 + lIdx * 80
                    });

                    // Auto-connect to previous node in chain
                    if (nodes.length > 1) {
                        edges.push({
                            source: nodes[nodes.length - 2].id,
                            target: nodeId
                        });
                    }
                });
            });

            return { nodes, edges };
        },

        determineType(label) {
            const keywords = ['Gene', 'Kinase', 'Receptor', 'D1', 'D2'];
            if (keywords.some(k => label.includes(k))) return 'gene';
            if (label.includes('Metabolic') || label.includes('Clock')) return 'map';
            return 'compound';
        }
    };

    // Internal helper for 2D to 3D layout
    const PathwayLayout = {
        generate3DLayout(data) {
            if (!data || !data.nodes || data.nodes.length === 0) return [];

            // Anatomical Map (Coordinates in World Space)
            const anatomicalMap = {
                // Brain
                'pfc': { x: 0, y: 80, z: 140 },
                'striatum': { x: 80, y: 20, z: 40 },
                'vta': { x: 0, y: -40, z: -20 },
                'sn': { x: 30, y: -40, z: -10 },
                'hypothalamus': { x: 0, y: -20, z: 20 },
                'pituitary': { x: 0, y: -80, z: 60 },
                'scn': { x: 0, y: -10, z: 50 },
                'pineal': { x: 0, y: 40, z: -60 },
                'raphe': { x: 0, y: -120, z: -20 },
                'locus_coeruleus': { x: 20, y: -110, z: -40 },
                'amygdala': { x: 70, y: -30, z: 20 },
                'hippocampus': { x: 60, y: -50, z: -40 },
                'thalamus': { x: 15, y: 40, z: 10 },
                'brain_stem': { x: 0, y: -160, z: -40 },
                // Torso
                'spinal_cord': { x: 0, y: -250, z: -50 },
                'heart': { x: -50, y: -450, z: 30 },
                'liver': { x: 60, y: -550, z: 40 },
                'adrenals': { x: 50, y: -650, z: -20 },
                'gut': { x: 0, y: -800, z: 20 },
                'blood_stream': { x: -100, y: -500, z: 0 },
                // Cellular/Generic
                'synapse': { x: 20, y: 150, z: 150 },
                'cytosol': { x: 0, y: 160, z: 150 },
                'nucleus': { x: -20, y: 170, z: 150 }
            };

            return data.nodes.map((node, i) => {
                const targetBase = anatomicalMap[node.region] || { x: 0, y: 0, z: 0 };

                // Add jitter to prevent exact overlap if multiple nodes in same region
                const jitter = 25;
                const pos = {
                    x: targetBase.x + (Math.sin(i * 1.5) * jitter),
                    y: targetBase.y + (Math.cos(i * 2.1) * jitter),
                    z: targetBase.z + (Math.sin(i * 0.7) * jitter)
                };

                // Fallback for KEGG nodes without region assignment (legacy support)
                if (!node.region) {
                    const scaleFactor = 30;
                    pos.x = (node.x - 400) / scaleFactor;
                    pos.y = -(node.y - 400) / scaleFactor;
                    pos.z = (node.type === 'gene') ? 0 : 100;
                }

                return { ...node, position3D: pos };
            });
        }
    };


    const GreenhousePathwayViewer = {
        canvas: null, ctx: null, camera: null, projection: null, cameraControls: null,
        pathwayData: null, pathwayEdges: null, brainShell: null, torsoShell: null, highlightedNodeId: null,
        hoveredNodeId: null,
        animationTime: 0,

        // --- Simulation Updates & AI Metrics ---
        showHeatmap: false, // UX Heatmap Predictor
        jitterScore: 0,     // Animation Jitter Detector
        lastFrameTimestamps: [],

        availablePathways: [], currentPathwayId: null, baseUrl: '', initialized: false,
        rawXmlData: null, // Bridge storage

        async init(containerSelector, baseUrl) {
            if (this.isRunning) return;

            let container;
            let actualSelector = containerSelector;

            if (containerSelector && typeof containerSelector !== 'string') {
                container = containerSelector;
                actualSelector = baseUrl;
                baseUrl = this.baseUrl;
            } else {
                container = document.querySelector(containerSelector);
            }

            if (!container) {
                console.error("Pathway App: Target container not found.");
                return;
            }

            const checkCompletion = () => {
                const text = container.textContent.trim();
                return text.includes('<pathway') && text.includes('</pathway>');
            };

            if (checkCompletion()) {
                this.executeInitialization(container, actualSelector, baseUrl);
            } else {
                const pollInterval = setInterval(() => {
                    if (checkCompletion()) {
                        clearInterval(pollInterval);
                        this.executeInitialization(container, actualSelector, baseUrl);
                    }
                }, 100);

                setTimeout(() => {
                    if (!this.isRunning) {
                        clearInterval(pollInterval);
                        this.executeInitialization(container, actualSelector, baseUrl);
                    }
                }, 15000);
            }
        },

        async executeInitialization(container, containerSelector, baseUrl) {
            if (this.isRunning && this._lastContainer === container) return;
            this.isRunning = true;
            this._lastContainer = container;
            this.baseUrl = baseUrl || '';

            const bridgeData = container.textContent.trim();
            container.innerHTML = '';

            if (bridgeData.includes('<pathway')) {
                const start = bridgeData.indexOf('<pathway');
                const end = bridgeData.lastIndexOf('</pathway>') + 10;
                this.rawXmlData = bridgeData.substring(start, end);
            }

            this.setupDataBridgeObserver(container);
            this.setupUI(container);
            this.setupCanvas(container);

            this.camera = { x: 0, y: 0, z: -1000, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 };
            this.projection = { width: this.canvas.width, height: this.canvas.height, near: 1, far: 5000, fov: 600 };

            const fullConfig = {
                camera: {
                    initial: { ...this.camera },
                    controls: {
                        enablePan: true, enableZoom: true, enableRotate: true, autoRotate: true,
                        autoRotateSpeed: 0.0005, panSpeed: 0.002, zoomSpeed: 0.1, rotateSpeed: 0.005,
                        inertia: true, inertiaDamping: 0.95, minZoom: -50, maxZoom: -8000
                    }
                },
                get(path) {
                    const keys = path.split('.');
                    let val = this;
                    for (const key of keys) {
                        if (val && typeof val === 'object' && key in val) val = val[key];
                        else return undefined;
                    }
                    return val;
                },
                set(path, value) {
                    const keys = path.split('.');
                    let obj = this;
                    for (let i = 0; i < keys.length - 1; i++) {
                        const key = keys[i];
                        if (!(key in obj)) obj[key] = {};
                        obj = obj[key];
                    }
                    obj[keys[keys.length - 1]] = value;
                }
            };

            if (window.GreenhousePathwayCameraControls) {
                this.cameraControls = Object.create(window.GreenhousePathwayCameraControls);
                this.cameraControls.init(this.canvas, this.camera, fullConfig);
            }

            this.initializeGeometry();

            window.addEventListener('greenhouseLanguageChanged', () => {
                this.refreshUIText();
            });

            await this.loadPathwayMetadata();
            this.initialized = true;

            const status = document.getElementById('app-status');
            if (status) status.textContent = "Simulation Ready";

            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, containerSelector, this, 'init');
                window.GreenhouseUtils.startSentinel(container, containerSelector, this, 'init');
            }

            this.startAnimation();
        },

        setupDataBridgeObserver(container) {
            this._bridgeObserver = new MutationObserver(() => {
                const newData = container.textContent.trim();
                if (newData.startsWith('<') && newData !== this.rawXmlData) {
                    this.rawXmlData = newData;
                    if (this.initialized) {
                        this.switchPathway(this.currentPathwayId || (this.availablePathways[0] && this.availablePathways[0].id));
                    }
                }
            });
            this._bridgeObserver.observe(container, { childList: true, characterData: true, subtree: true });
        },

        async loadPathwayMetadata() {
            try {
                const response = await fetch(this.baseUrl + 'endpoints/models_pathways.json');
                const data = await response.json();
                this.availablePathways = data.pathways;
                this.populatePathwaySelector();

                if (this.availablePathways.length > 0) {
                    let startId = this.availablePathways[0].id;
                    if (this.rawXmlData) {
                        const match = this.availablePathways.find(p => this.rawXmlData.toLowerCase().includes(p.name.toLowerCase()));
                        if (match) startId = match.id;
                    }
                    await this.switchPathway(startId);
                }
            } catch (err) {
                console.error("Pathway App: Failed to load metadata.", err);
            }
        },

        populatePathwaySelector() {
            const selector = document.getElementById('master-pathway-selector');
            if (!selector) return;
            selector.innerHTML = '';
            this.availablePathways.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                selector.appendChild(option);
            });
            selector.onchange = (e) => this.switchPathway(e.target.value);
        },

        async switchPathway(pathwayId) {
            this.currentPathwayId = pathwayId;
            const pathway = this.availablePathways.find(p => p.id === pathwayId);
            if (!pathway) return;

            const geneSelector = document.getElementById('pathway-selector');
            if (geneSelector) geneSelector.innerHTML = '<option>Loading...</option>';

            let success = false;

            if (this.rawXmlData) {
                const cleanData = this.rawXmlData.replace(/<pathway.*?>/g, '').replace(/<\/pathway>/g, '').trim();

                try {
                    const jsonData = JSON.parse(cleanData);
                    if (jsonData && (jsonData.molecules || jsonData.nodes)) {
                        success = this.processJsonData(jsonData);
                    }
                } catch (e) {
                    const parsed = await KeggParser.parse(this.rawXmlData, true);
                    if (parsed && parsed.nodes && parsed.nodes.length > 0) {
                        this.pathwayData = PathwayLayout.generate3DLayout(parsed);
                        this.pathwayEdges = parsed.edges;
                        success = true;
                    }
                }
            }

            if (!success && pathway.source) {
                success = await this.loadExternalPathway(pathway.source);
            }

            if (!success) {
                const generated = PathwayDataGenerator.generate(pathwayId, pathway.regions);
                this.pathwayData = PathwayLayout.generate3DLayout(generated);
                this.pathwayEdges = generated.edges;
            }

            this.updateGeneSelector();
            this.updateLegend();
        },

        setupUI(container) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
            const uiContainer = document.createElement('div');
            uiContainer.style.cssText = `
                position: absolute; top: ${isMobile ? 'auto' : '20px'}; bottom: ${isMobile ? '20px' : 'auto'};
                left: 20px; right: ${isMobile ? '20px' : 'auto'}; z-index: 100; background: rgba(18, 18, 18, 0.85);
                padding: 15px; border-radius: 12px; color: #e0e0e0; font-family: 'Segoe UI', sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); min-width: 220px;
            `;
            container.style.position = 'relative';

            const header = document.createElement('div');
            header.style.cssText = `font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #4ca1af; text-transform: uppercase;`;
            header.textContent = t('pathway_control');
            uiContainer.appendChild(header);

            const pSelect = document.createElement('select');
            pSelect.id = 'master-pathway-selector';
            pSelect.style.cssText = `width: 100%; background: #2a2a2a; color: #4ca1af; border: 1px solid #444; padding: 8px; border-radius: 6px; margin-bottom: 10px;`;
            uiContainer.appendChild(pSelect);

            const select = document.createElement('select');
            select.id = 'pathway-selector';
            select.style.cssText = `width: 100%; background: #2a2a2a; color: white; border: 1px solid #444; padding: 8px; border-radius: 6px; margin-bottom: 10px;`;
            uiContainer.appendChild(select);

            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex'; btnGroup.style.gap = '10px';

            const button = document.createElement('button');
            button.id = 'highlight-gene-btn';
            button.textContent = t('highlight_pathway');
            button.style.cssText = `flex: 1; background: linear-gradient(135deg, #4ca1af, #2c3e50); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;`;
            button.onclick = () => { this.highlightedNodeId = select.value; };
            btnGroup.appendChild(button);

            // AI ANALYTICS Toggle
            const sciBtn = document.createElement('button');
            sciBtn.textContent = "AI ANALYTICS";
            sciBtn.style.cssText = `flex: 1; background: #2d3748; color: #4fd1c5; border: 1px solid #4fd1c5; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;`;
            sciBtn.onclick = () => { this.showHeatmap = !this.showHeatmap; sciBtn.style.background = this.showHeatmap ? "#4fd1c5" : "#2d3748"; sciBtn.style.color = this.showHeatmap ? "#000" : "#4fd1c5"; };

            uiContainer.appendChild(btnGroup);
            uiContainer.appendChild(sciBtn);

            const legend = document.createElement('div');
            legend.id = 'pathway-legend';
            legend.style.cssText = `margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 8px;`;
            uiContainer.appendChild(legend);

            container.appendChild(uiContainer);
        },

        setupCanvas(container) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth;
            this.canvas.height = Math.max(container.offsetHeight, 600);
            this.canvas.style.display = 'block';
            this.ctx = this.canvas.getContext('2d');
            container.appendChild(this.canvas);

            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                this.checkHover(mx, my);
            });

            this.canvas.addEventListener('click', () => {
                if (this.hoveredNodeId) {
                    this.highlightedNodeId = this.hoveredNodeId;
                    const selector = document.getElementById('pathway-selector');
                    if (selector) selector.value = this.highlightedNodeId;
                }
            });
        },

        checkHover(mx, my) {
            if (!this.pathwayData || !window.GreenhouseModels3DMath) return;
            let foundId = null;
            for (const node of this.pathwayData) {
                const proj = GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection);
                if (proj.scale > 0) {
                    const dx = proj.x - mx, dy = proj.y - my;
                    if (Math.sqrt(dx * dx + dy * dy) < 10 * proj.scale) { foundId = node.id; break; }
                }
            }
            this.hoveredNodeId = foundId;
            this.canvas.style.cursor = foundId ? 'pointer' : 'default';
        },

        initializeGeometry() {
            this.brainShell = { vertices: [], faces: [] };
            this.torsoShell = { vertices: [], faces: [] };
            if (window.GreenhousePathwayGeometry) {
                window.GreenhousePathwayGeometry.initializeBrainShell(this.brainShell);
                window.GreenhousePathwayGeometry.initializeTorsoShell(this.torsoShell);
            }
        },

        async loadExternalPathway(url, isLive = false) {
            try {
                const fetchUrl = isLive ? url : (this.baseUrl + url);
                if (fetchUrl.endsWith('.json')) {
                    const response = await fetch(fetchUrl);
                    return this.processJsonData(await response.json());
                }
                const parsedData = await KeggParser.parse(fetchUrl);
                if (parsedData.nodes.length > 0) {
                    parsedData.nodes.forEach(node => { node.region = this.mapKeggNodeToRegion(node, this.currentPathwayId); });
                    this.pathwayData = PathwayLayout.generate3DLayout({ nodes: parsedData.nodes });
                    this.pathwayEdges = parsedData.edges;
                    return true;
                }
            } catch (err) { console.error('Pathway App: External load error.', err); }
            return false;
        },

        processJsonData(data) {
            if (data.molecules && data.reactions) {
                const nodes = data.molecules.map(m => ({
                    id: m.id, name: m.label, region: this.mapMoleculeToRegion(m, data),
                    type: (m.class === 'metabolite' || m.class === 'neurotransmitter') ? 'compound' : (m.class === 'cytokine' ? 'map' : 'gene')
                }));
                const edges = data.reactions.map(r => ({ source: r.substrate, target: r.product }));
                this.pathwayData = PathwayLayout.generate3DLayout({ nodes });
                this.pathwayEdges = edges;
                return true;
            }
            return false;
        },

        mapMoleculeToRegion(molecule, data) {
            const reaction = data.reactions.find(r => r.substrate === molecule.id || r.product === molecule.id);
            if (reaction) {
                const compId = (reaction.substrate === molecule.id) ? reaction.fromCompartment : reaction.toCompartment;
                const compartment = data.compartments.find(c => c.id === compId);
                if (compartment) return compartment.anchorRegion;
            }
            return 'pfc';
        },

        mapKeggNodeToRegion(node, pathwayId) {
            const name = (node.name || '').toLowerCase();
            if (pathwayId === 'tryptophan') {
                if (name.includes('tryptophan')) return 'gut';
                if (name.includes('kynurenine')) return 'blood_stream';
                if (name.includes('ido') || name.includes('tdo')) return 'liver';
            }
            if (pathwayId === 'dopaminergic' || pathwayId === 'dopamine') {
                if (name.includes('vta') || name.includes('th')) return 'vta';
                if (name.includes('drd1') || name.includes('drd2')) return 'striatum';
            }
            if (pathwayId === 'serotonergic' || pathwayId === 'serotonin') {
                if (name.includes('raphe')) return 'raphe';
                if (name.includes('pfc')) return 'pfc';
            }
            const pathway = this.availablePathways.find(p => p.id === pathwayId);
            if (pathway && pathway.regions.length > 0) {
                return pathway.regions[name.charCodeAt(0) % pathway.regions.length];
            }
            return 'pfc';
        },

        refreshUIText() {
            this.updateGeneSelector();
            this.populatePathwaySelector();
            this.updateLegend();
        },

        updateGeneSelector() {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const selector = document.getElementById('pathway-selector');
            if (selector && this.pathwayData) {
                selector.innerHTML = `<option value="">${t('select_focus')}</option>`;
                this.pathwayData.forEach(node => {
                    const option = document.createElement('option');
                    option.value = node.id; option.textContent = node.name;
                    selector.appendChild(option);
                });
            }
        },

        updateLegend() {
            const legend = document.getElementById('pathway-legend');
            if (!legend || !this.pathwayData) return;
            const types = new Set(this.pathwayData.map(n => n.type));
            legend.innerHTML = '';
            const typeMeta = { 'gene': '#00ffcc', 'compound': '#3498db', 'map': '#f1c40f' };
            types.forEach(type => {
                const item = document.createElement('div');
                item.style.cssText = `display: flex; align-items: center; gap: 5px; font-size: 11px; color: #ccc;`;
                const dot = document.createElement('span');
                dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${typeMeta[type] || '#888'};`;
                const label = document.createElement('span'); label.textContent = type.toUpperCase();
                item.appendChild(dot); item.appendChild(label);
                legend.appendChild(item);
            });
        },

        startAnimation() {
            let lastTime = performance.now();
            const animate = (time) => {
                const dt = time - lastTime; lastTime = time;
                this.animationTime += dt * 0.001;
                this.calculateJitter(dt);
                if (this.cameraControls) this.cameraControls.update();
                this.render();
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        },

        calculateJitter(dt) {
            this.lastFrameTimestamps.push(dt);
            if (this.lastFrameTimestamps.length > 60) this.lastFrameTimestamps.shift();
            if (this.lastFrameTimestamps.length > 10) {
                const avg = this.lastFrameTimestamps.reduce((a, b) => a + b, 0) / this.lastFrameTimestamps.length;
                this.jitterScore = this.lastFrameTimestamps.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / this.lastFrameTimestamps.length;
            }
        },

        render() {
            const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
            ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
            if (!this.initialized) return;
            this.drawAnatomicalBackdrop(ctx, w, h);
            const highlightedNode = this.pathwayData ? this.pathwayData.find(n => n.id === this.highlightedNodeId) : null;
            const activeRegion = highlightedNode ? highlightedNode.region : null;
            this.drawCentralNervousSystemPillar(ctx, w, h);
            if (this.brainShell && window.GreenhousePathwayBrain) { window.GreenhousePathwayBrain.drawBrain(ctx, this.brainShell, this.camera, this.projection, w, h, { activeRegion }); }
            if (this.torsoShell && window.GreenhousePathwayBrain) { window.GreenhousePathwayBrain.drawTorso(ctx, this.torsoShell, this.camera, this.projection, w, h, { activeRegion }); }
            if (this.pathwayData) {
                if (this.showHeatmap) this.drawUXHeatmap(ctx, w, h);
                this.drawPathwayGraph(ctx);
                this.drawTooltip(ctx, w, h);
                if (this.showHeatmap) this.drawJitterMonitor(ctx, w, h);
            }
        },

        drawAnatomicalBackdrop(ctx, w, h) {
            const scale = Math.min(w, h) / 1000;
            ctx.save(); ctx.translate(w / 2, h / 2 - 100); ctx.scale(scale, scale);
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.05)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, -250); ctx.bezierCurveTo(250, -250, 450, -50, 450, 200);
            ctx.bezierCurveTo(450, 350, 300, 450, 100, 450); ctx.bezierCurveTo(-100, 450, -250, 350, -350, 200);
            ctx.bezierCurveTo(-350, -50, -150, -250, 0, -250); ctx.stroke(); ctx.restore();
        },

        drawCentralNervousSystemPillar(ctx, w, h) {
            const p1 = GreenhouseModels3DMath.project3DTo2D(0, -180, 0, this.camera, this.projection);
            const p2 = GreenhouseModels3DMath.project3DTo2D(0, -380, 0, this.camera, this.projection);
            if (p1.scale > 0 && p2.scale > 0) {
                const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                grad.addColorStop(0, 'rgba(0, 242, 255, 0.2)'); grad.addColorStop(1, 'rgba(0, 242, 255, 0.05)');
                ctx.strokeStyle = grad; ctx.lineWidth = 15 * p1.scale;
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        },

        drawUXHeatmap(ctx, w, h) {
            ctx.save(); ctx.globalCompositeOperation = 'screen';
            this.pathwayData.forEach(node => {
                const proj = GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection);
                if (proj.scale > 0) {
                    const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 80 * proj.scale);
                    grad.addColorStop(0, 'rgba(255, 0, 0, 0.2)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(proj.x, proj.y, 80 * proj.scale, 0, Math.PI * 2); ctx.fill();
                }
            });
            ctx.restore();
        },

        drawJitterMonitor(ctx, w, h) {
            ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(w - 220, 20, 200, 40);
            ctx.fillStyle = this.jitterScore < 5 ? '#48bb78' : '#f56565'; ctx.font = 'bold 10px monospace';
            ctx.fillText(`STABILITY: ${this.jitterScore.toFixed(2)}`, w - 210, 45); ctx.restore();
        },

        drawTooltip(ctx, w, h) {
            if (!this.hoveredNodeId) return;
            const node = this.pathwayData.find(n => n.id === this.hoveredNodeId);
            const proj = GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection);
            if (proj.scale <= 0) return;
            ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.strokeStyle = '#4ca1af';
            ctx.fillRect(proj.x + 10, proj.y - 40, 150, 40); ctx.strokeRect(proj.x + 10, proj.y - 40, 150, 40);
            ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.fillText(node.name, proj.x + 15, proj.y - 25);
            ctx.fillStyle = '#aaa'; ctx.font = '10px Arial'; ctx.fillText(node.type.toUpperCase(), proj.x + 15, proj.y - 10);
        },

        drawPathwayGraph(ctx) {
            if (!this.pathwayData || !window.GreenhouseModels3DMath) return;
            const projectedNodes = this.pathwayData.map(node => ({ ...node, projected: GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection) }));
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.3)'; ctx.lineWidth = 1.5;
            this.pathwayEdges.forEach(edge => {
                const s = projectedNodes.find(n => n.id === edge.source), t = projectedNodes.find(n => n.id === edge.target);
                if (s && t && s.projected.scale > 0 && t.projected.scale > 0) {
                    ctx.beginPath(); ctx.moveTo(s.projected.x, s.projected.y); ctx.lineTo(t.projected.x, t.projected.y); ctx.stroke();
                    this.drawFlowArrow(s.projected, t.projected);
                }
            });
            projectedNodes.forEach(node => {
                if (node.projected.scale > 0) {
                    let r = 4 * node.projected.scale, c = '#4ca1af';
                    if (node.type === 'gene') c = '#00ffcc'; else if (node.type === 'compound') c = '#3498db'; else if (node.type === 'map') { c = '#f1c40f'; r = 8 * node.projected.scale * (Math.sin(this.animationTime * 3) * 0.2 + 1); }
                    if (node.id === this.highlightedNodeId || node.id === this.hoveredNodeId) { c = '#39ff14'; r *= 2; }
                    ctx.beginPath(); ctx.arc(node.projected.x, node.projected.y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
                }
            });
        },

        drawFlowArrow(p1, p2) {
            const t = (this.animationTime * 0.5) % 1;
            const ax = p1.x + (p2.x - p1.x) * t, ay = p1.y + (p2.y - p1.y) * t;
            this.ctx.fillStyle = 'rgba(0, 255, 204, 0.8)'; this.ctx.beginPath();
            this.ctx.arc(ax, ay, 2 * p1.scale, 0, Math.PI * 2); this.ctx.fill();
        }
    };

    window.GreenhousePathwayViewer = GreenhousePathwayViewer;
})();
