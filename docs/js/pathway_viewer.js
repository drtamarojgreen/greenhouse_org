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
                        name: entry.getAttribute("name"),
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
        availablePathways: [], currentPathwayId: null, baseUrl: '', initialized: false,
        rawXmlData: null, // Bridge storage

        async init(containerSelector, baseUrl) {
            console.log(`Pathway App: Initializing Viewer in ${containerSelector}`);
            this.baseUrl = baseUrl || '';
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.error("Pathway App: Target container not found.");
                return;
            }

            // The targetSelector element is the data bridge. 
            // Wix Velo writes the XML data here before the app starts.
            const embeddedData = container.textContent.trim();
            if (embeddedData.startsWith('<')) {
                this.rawXmlData = embeddedData;
                console.log("Pathway App: Successfully captured XML data from target container.");
            }

            this.setupUI(container);
            this.setupCanvas(container);

            // Correct Camera settings for the 3D Engine
            this.camera = {
                x: 0,
                y: 0,
                z: -1000, // Pulled back to see torso
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                fov: 600
            };

            this.projection = {
                width: this.canvas.width,
                height: this.canvas.height,
                near: 1,
                far: 5000,
                fov: 600
            };

            const fullConfig = {
                camera: {
                    initial: { ...this.camera },
                    controls: {
                        enablePan: true,
                        enableZoom: true,
                        enableRotate: true,
                        autoRotate: true,
                        autoRotateSpeed: 0.0005,
                        panSpeed: 0.002,
                        zoomSpeed: 0.1,
                        rotateSpeed: 0.005,
                        inertia: true,
                        inertiaDamping: 0.95,
                        minZoom: -50,
                        maxZoom: -8000
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
            await this.loadPathwayMetadata();
            this.initialized = true;
            this.startAnimation();
        },

        async loadPathwayMetadata() {
            try {
                const response = await fetch(this.baseUrl + 'endpoints/models_pathways.json');
                const data = await response.json();
                this.availablePathways = data.pathways;
                this.populatePathwaySelector();

                // Load default (first) pathway
                if (this.availablePathways.length > 0) {
                    await this.switchPathway(this.availablePathways[0].id);
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
            console.log(`Pathway App: Switching to ${pathwayId}`);
            this.currentPathwayId = pathwayId;
            const pathway = this.availablePathways.find(p => p.id === pathwayId);
            if (!pathway) return;

            // Show loading status
            const geneSelector = document.getElementById('pathway-selector');
            if (geneSelector) geneSelector.innerHTML = '<option>Connecting to KEGG...</option>';

            let success = false;

            // Priority 1: Use bridged data from Velo if available
            if (this.rawXmlData) {
                const parsed = await KeggParser.parse(this.rawXmlData, true);
                if (parsed.nodes.length > 0) {
                    this.pathwayData = PathwayLayout.generate3DLayout(parsed);
                    this.pathwayEdges = parsed.edges;
                    success = true;
                }
            }

            // Priority 2: Remote fetch
            if (!success && pathway.source) {
                success = await this.loadExternalPathway(pathway.source);
            }

            // Priority 2: KEGG Live API
            if (!success && pathway.kegg_id) {
                const liveUrl = `https://rest.kegg.jp/get/${pathway.kegg_id}/kgml`;
                success = await this.loadExternalPathway(liveUrl, true);
            }

            // Priority 3: Internal Generator
            if (!success) {
                const generated = PathwayDataGenerator.generate(pathwayId, pathway.regions);
                this.pathwayData = PathwayLayout.generate3DLayout(generated);
                this.pathwayEdges = generated.edges;
            }

            this.updateGeneSelector();
        },

        setupUI(container) {
            const uiContainer = document.createElement('div');
            uiContainer.style.cssText = `
                position: absolute; 
                top: 20px; 
                left: 20px; 
                z-index: 100; 
                background: rgba(18, 18, 18, 0.85); 
                padding: 15px; 
                border-radius: 12px; 
                color: #e0e0e0; 
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                min-width: 200px;
            `;
            container.style.position = 'relative';

            const header = document.createElement('div');
            header.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #4ca1af; text-transform: uppercase; letter-spacing: 1px;';
            header.textContent = 'Pathway Control';
            uiContainer.appendChild(header);

            const pathwayGroup = document.createElement('div');
            pathwayGroup.style.marginBottom = '15px';
            const pLabel = document.createElement('label');
            pLabel.textContent = 'Systemic Pathway:';
            pLabel.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #aaa;';
            pathwayGroup.appendChild(pLabel);
            const pSelect = document.createElement('select');
            pSelect.id = 'master-pathway-selector';
            pSelect.style.cssText = `
                width: 100%; background: #2a2a2a; color: #4ca1af; border: 1px solid #444; 
                padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer;
            `;
            pathwayGroup.appendChild(pSelect);
            uiContainer.appendChild(pathwayGroup);

            const selectGroup = document.createElement('div');
            selectGroup.style.marginBottom = '10px';

            const label = document.createElement('label');
            label.textContent = 'Component / Gene:';
            label.style.cssText = 'display: block; font-size: 12px; margin-bottom: 5px; color: #aaa;';
            selectGroup.appendChild(label);

            const select = document.createElement('select');
            select.id = 'pathway-selector';
            select.style.cssText = `
                width: 100%; 
                background: #2a2a2a; 
                color: white; 
                border: 1px solid #444; 
                padding: 8px; 
                border-radius: 6px;
                outline: none;
                font-size: 13px;
                cursor: pointer;
            `;
            selectGroup.appendChild(select);
            uiContainer.appendChild(selectGroup);

            const button = document.createElement('button');
            button.id = 'highlight-gene-btn';
            button.textContent = 'Highlight Pathway';
            button.style.cssText = `
                width: 100%; 
                background: linear-gradient(135deg, #4ca1af, #2c3e50); 
                color: white; 
                border: none; 
                padding: 10px; 
                border-radius: 6px; 
                font-weight: bold; 
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            `;
            button.onmouseover = () => button.style.filter = 'brightness(1.2)';
            button.onmouseout = () => button.style.filter = 'brightness(1.0)';
            button.onclick = () => {
                this.highlightedNodeId = select.value;
            };
            uiContainer.appendChild(button);

            container.appendChild(uiContainer);
        },

        setupCanvas(container) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth;
            this.canvas.height = Math.max(container.offsetHeight, 600);
            this.canvas.style.display = 'block';
            this.ctx = this.canvas.getContext('2d');
            container.appendChild(this.canvas);
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
                const parsedData = await KeggParser.parse(fetchUrl);

                if (parsedData.nodes.length > 0) {
                    parsedData.nodes.forEach(node => {
                        node.region = this.mapKeggNodeToRegion(node, this.currentPathwayId);
                    });
                    this.pathwayData = PathwayLayout.generate3DLayout({ nodes: parsedData.nodes });
                    this.pathwayEdges = parsedData.edges;
                    return true;
                }
            } catch (err) {
                console.error('Pathway App: External load error.', err);
            }
            return false;
        },

        mapKeggNodeToRegion(node, pathwayId) {
            const name = (node.name || '').toLowerCase();

            if (pathwayId === 'tryptophan') {
                if (name.includes('tryptophan')) return 'gut';
                if (name.includes('kynurenine')) return 'blood_stream';
                if (name.includes('ido') || name.includes('tdo')) return 'liver';
            }

            if (pathwayId === 'circadian') {
                if (name.includes('period') || name.includes('clock')) return 'scn';
                if (name.includes('bmal') || name.includes('arntl')) return 'liver';
            }

            if (pathwayId === 'hpa') {
                if (name.includes('crh')) return 'hypothalamus';
                if (name.includes('acth')) return 'pituitary';
                if (name.includes('cortisol')) return 'adrenals';
            }

            const pathway = this.availablePathways.find(p => p.id === pathwayId);
            if (pathway && pathway.regions.length > 0) {
                const charCode = name.charCodeAt(0) || 0;
                return pathway.regions[charCode % pathway.regions.length];
            }
            return 'pfc';
        },

        updateGeneSelector() {
            const selector = document.getElementById('pathway-selector');
            if (selector && this.pathwayData) {
                selector.innerHTML = '<option value="">-- Select focus --</option>';
                this.pathwayData.forEach(node => {
                    const option = document.createElement('option');
                    option.value = node.id;
                    option.textContent = node.name;
                    selector.appendChild(option);
                });
            }
        },

        startAnimation() {
            const animate = () => {
                if (this.cameraControls) this.cameraControls.update();
                this.render();
                requestAnimationFrame(animate);
            };
            animate();
        },

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, w, h);

            if (!this.initialized) return;

            // Draw Subtle Grid for spatial orientation
            this.drawReferenceGrid(ctx, w, h);

            const highlightedNode = this.pathwayData ? this.pathwayData.find(n => n.id === this.highlightedNodeId) : null;
            const activeRegion = highlightedNode ? highlightedNode.region : null;

            // Draw Connection Pillar (Spinal Cord base)
            this.drawCentralNervousSystemPillar(ctx, w, h);

            if (this.brainShell && window.GreenhousePathwayBrain) {
                window.GreenhousePathwayBrain.drawBrain(ctx, this.brainShell, this.camera, this.projection, w, h, { activeRegion });
            }

            if (this.torsoShell && window.GreenhousePathwayBrain) {
                window.GreenhousePathwayBrain.drawTorso(ctx, this.torsoShell, this.camera, this.projection, w, h, { activeRegion });
            }

            if (this.pathwayData) {
                this.drawPathwayGraph();
            } else {
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.font = '14px Arial';
                ctx.fillText("Connecting to KEGG / Loading data...", w / 2, h / 2);
            }

            // Draw Interaction PiP if a node is selected
            if (highlightedNode && window.GreenhousePathwayBrain) {
                const pipW = 300;
                const pipH = 250;
                const pipX = w - pipW - 20;
                const pipY = h - pipH - 20;

                ctx.save();
                ctx.translate(pipX, pipY);
                ctx.beginPath();
                ctx.rect(0, 0, pipW, pipH);
                ctx.clip(); // Ensure PiP content stays inside bounds

                window.GreenhousePathwayBrain.drawInteractionPiP(ctx, pipW, pipH, highlightedNode.name);

                ctx.restore();
            }
        },

        drawCentralNervousSystemPillar(ctx, w, h) {
            // Draws a glowing vertical pillar to suggest anatomical connection
            const steps = 10;
            const p1 = GreenhouseModels3DMath.project3DTo2D(0, -180, 0, this.camera, this.projection);
            const p2 = GreenhouseModels3DMath.project3DTo2D(0, -380, 0, this.camera, this.projection);

            if (p1.scale > 0 && p2.scale > 0) {
                const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                grad.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
                grad.addColorStop(1, 'rgba(0, 242, 255, 0.05)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 15 * p1.scale;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        },

        drawReferenceGrid(ctx, w, h) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const step = 50;
            ctx.beginPath();
            for (let x = 0; x <= w; x += step) {
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
            }
            for (let y = 0; y <= h; y += step) {
                ctx.moveTo(0, y); ctx.lineTo(w, y);
            }
            ctx.stroke();
        },

        drawPathwayGraph() {
            if (!this.pathwayData || !window.GreenhouseModels3DMath) return;

            const projectedNodes = this.pathwayData.map(node => ({
                ...node,
                projected: GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection)
            }));

            // Draw edges
            this.ctx.strokeStyle = 'rgba(76, 161, 175, 0.3)';
            this.ctx.lineWidth = 1.5;
            this.pathwayEdges.forEach(edge => {
                const source = projectedNodes.find(n => n.id === edge.source);
                const target = projectedNodes.find(n => n.id === edge.target);
                if (source && target && source.projected.scale > 0 && target.projected.scale > 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(source.projected.x, source.projected.y);
                    this.ctx.lineTo(target.projected.x, target.projected.y);
                    this.ctx.stroke();
                }
            });

            // Draw nodes
            projectedNodes.forEach(node => {
                if (node.projected.scale > 0) {
                    let radius = 4 * node.projected.scale;
                    let color = '#4ca1af';
                    let glow = 'rgba(76, 161, 175, 0.4)';

                    switch (node.type) {
                        case 'gene':
                            color = '#00ffcc';
                            glow = 'rgba(0, 255, 204, 0.4)';
                            break;
                        case 'compound':
                            color = '#3498db';
                            glow = 'rgba(52, 152, 219, 0.4)';
                            break;
                        case 'map':
                            color = '#f1c40f';
                            radius = 8 * node.projected.scale;
                            glow = 'rgba(241, 196, 15, 0.4)';
                            break;
                    }

                    if (node.id === this.highlightedNodeId) {
                        color = '#39ff14'; // Neon Green
                        glow = 'rgba(57, 255, 20, 0.8)';
                        radius *= 2.5;

                        // Draw background box for label
                        const label = node.name.toUpperCase();
                        this.ctx.font = 'bold 11px "Courier New", Courier, monospace';
                        const textWidth = this.ctx.measureText(label).width;
                        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                        this.ctx.fillRect(node.projected.x - textWidth / 2 - 5, node.projected.y - radius - 25, textWidth + 10, 20);
                        this.ctx.strokeStyle = '#39ff14';
                        this.ctx.strokeRect(node.projected.x - textWidth / 2 - 5, node.projected.y - radius - 25, textWidth + 10, 20);

                        this.ctx.fillStyle = '#39ff14';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(label, node.projected.x, node.projected.y - radius - 11);
                    }

                    // Shadow / Glow
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = glow;

                    this.ctx.beginPath();
                    this.ctx.arc(node.projected.x, node.projected.y, radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = color;
                    this.ctx.fill();

                    this.ctx.shadowBlur = 0; // Reset
                }
            });
        }
    };

    window.GreenhousePathwayViewer = GreenhousePathwayViewer;
})();
