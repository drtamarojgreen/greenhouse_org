// docs/js/pathway_viewer.js
// Core viewer for the 3D pathway visualization, using the native 3D engine.

(function () {
    'use strict';

    // Internal helper for parsing KGML data
    const KeggParser = {
        async parse(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KGML data: ${response.statusText}`);
                }
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");

                const nodes = this.extractEntries(xmlDoc);
                const edges = this.extractRelations(xmlDoc);

                return { nodes, edges };
            } catch (error) {
                console.error("Error parsing KGML data:", error);
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

    // Internal helper for 2D to 3D layout
    const PathwayLayout = {
        generate3DLayout(data, scaleFactor = 20, zLayerSeparation = 150) {
            if (!data || !data.nodes || data.nodes.length === 0) return [];
            const xCoords = data.nodes.map(n => n.x);
            const yCoords = data.nodes.map(n => n.y);
            const xCenter = (Math.min(...xCoords) + Math.max(...xCoords)) / 2;
            const yCenter = (Math.min(...yCoords) + Math.max(...yCoords)) / 2;

            return data.nodes.map(node => {
                const x_3d = (node.x - xCenter) / scaleFactor;
                const y_3d = (node.y - yCenter) / scaleFactor;
                let z_3d = 0;
                switch (node.type) {
                    case 'compound': z_3d = zLayerSeparation; break;
                    case 'gene': z_3d = 0; break;
                    case 'map': z_3d = -zLayerSeparation; break;
                }
                return { ...node, position3D: { x: x_3d, y: -y_3d, z: z_3d } };
            });
        }
    };


    const GreenhousePathwayViewer = {
        canvas: null, ctx: null, camera: null, projection: null, cameraControls: null,
        pathwayData: null, pathwayEdges: null, brainShell: null, highlightedNodeId: null,
        baseUrl: '', initialized: false,

        async init(containerSelector, baseUrl) {
            console.log("Pathway App: Initializing Viewer.");
            this.baseUrl = baseUrl || '';
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.error("Pathway App: Container not found.");
                return;
            }

            this.setupUI(container);
            this.setupCanvas(container);

            // Correct Camera settings for the 3D Engine
            this.camera = {
                x: 0,
                y: 0,
                z: -800, // Negative Z to look at origin
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
                        maxZoom: -5000
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

            if (window.GreenhouseNeuroCameraControls) {
                this.cameraControls = Object.create(window.GreenhouseNeuroCameraControls);
                this.cameraControls.init(this.canvas, this.camera, fullConfig);
            }

            this.initializeBrainShell();
            await this.loadPathwayData();
            this.initialized = true;
            this.startAnimation();
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

            const selectGroup = document.createElement('div');
            selectGroup.style.marginBottom = '10px';

            const label = document.createElement('label');
            label.textContent = 'Target Gene:';
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

        initializeBrainShell() {
            this.brainShell = { vertices: [], faces: [] };
            if (window.GreenhouseNeuroGeometry) {
                window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);
            }
        },

        async loadPathwayData() {
            const pathwaySelector = 'section.wixui-section:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > p:nth-child(1) > span:nth-child(1)';

            let xmlText = null;
            const el = document.querySelector(pathwaySelector);
            if (el && el.textContent && el.textContent.trim().startsWith('<')) {
                xmlText = el.textContent.trim();
                console.log('Pathway App: Found embedded XML data.');
            }

            if (xmlText) {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                    const nodes = KeggParser.extractEntries(xmlDoc);
                    const edges = KeggParser.extractRelations(xmlDoc);

                    this.pathwayData = PathwayLayout.generate3DLayout({ nodes });
                    this.pathwayEdges = edges;
                } catch (e) {
                    console.error("Pathway App: Error parsing embedded XML", e);
                }
            }

            if (!this.pathwayData) {
                const url = this.baseUrl + 'endpoints/kegg_dopaminergic_raw.xml';
                console.log(`Pathway App: Attempting to load pathway from ${url}`);
                try {
                    const parsedData = await KeggParser.parse(url);
                    if (parsedData.nodes.length > 0) {
                        this.pathwayData = PathwayLayout.generate3DLayout({ nodes: parsedData.nodes });
                        this.pathwayEdges = parsedData.edges;
                        console.log('Pathway App: External data loaded successfully.');
                    }
                } catch (err) {
                    console.error('Pathway App: Failed to load external pathway data.', err);
                }
            }

            const selector = document.getElementById('pathway-selector');
            if (selector && this.pathwayData) {
                this.pathwayData.filter(node => node.type === 'gene').forEach(geneNode => {
                    const option = document.createElement('option');
                    option.value = geneNode.id;
                    option.textContent = geneNode.name;
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

            if (this.brainShell && window.GreenhouseNeuroBrain) {
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w, h, { color: 'rgba(204, 204, 204, 0.05)' });
            }

            if (this.pathwayData) {
                this.drawPathwayGraph();
            } else {
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.font = '14px Arial';
                ctx.fillText("Loading pathway data...", w / 2, h / 2);
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
                        color = '#e74c3c';
                        glow = 'rgba(231, 76, 60, 0.6)';
                        radius *= 2.5;

                        // Draw label for highlighted node
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = 'bold 12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(node.name, node.projected.x, node.projected.y - radius - 10);
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
