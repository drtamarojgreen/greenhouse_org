// docs/js/pathway_viewer.js
// Core viewer for the 3D pathway visualization, using the native 3D engine.

(function() {
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

    // High-fidelity mock config object
    const mockConfig = {
        camera: {
            controls: {
                autoRotate: false,
                autoRotateSpeed: 0.0,
            }
        },
        get(path) {
            const keys = path.split('.');
            let value = this;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }
            return value;
        },
        set(path, value) {
            const keys = path.split('.');
            let obj = this;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in obj) || typeof obj[key] !== 'object') {
                    obj[key] = {};
                }
                obj = obj[key];
            }
            obj[keys[keys.length - 1]] = value;
        }
    };

    const GreenhousePathwayViewer = {
        canvas: null, ctx: null, camera: null, projection: null, cameraControls: null,
        pathwayData: null, pathwayEdges: null, brainShell: null, highlightedNodeId: null,
        baseUrl: '',

        async init(containerSelector, baseUrl) {
            console.log("pathway_testing: init started");
            this.baseUrl = baseUrl || '';
            const container = document.querySelector(containerSelector);
            if (!container) return;

            this.setupUI(container);
            this.setupCanvas(container);

            this.camera = { x: 0, y: 0, z: 1000, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 45 };
            this.projection = { width: this.canvas.width, height: this.canvas.height, near: 1, far: 2000 };

            if (window.GreenhouseNeuroCameraControls) {
                this.cameraControls = Object.create(window.GreenhouseNeuroCameraControls);
                this.cameraControls.init(this.canvas, this.camera, mockConfig);
            }

            this.initializeBrainShell();
            await this.loadPathwayData();
            this.startAnimation();
        },

        setupUI(container) {
            const uiContainer = document.createElement('div');
            uiContainer.style.cssText = `position: absolute; top: 10px; left: 10px; z-index: 10; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white;`;
            container.style.position = 'relative';

            const label = document.createElement('label');
            label.textContent = 'Highlight Gene:';
            label.htmlFor = 'pathway-selector';
            uiContainer.appendChild(label);

            const select = document.createElement('select');
            select.id = 'pathway-selector';
            uiContainer.appendChild(select);

            const button = document.createElement('button');
            button.id = 'highlight-gene-btn';
            button.textContent = 'Highlight';
            button.addEventListener('click', () => {
                this.highlightedNodeId = select.value;
            });
            uiContainer.appendChild(button);

            container.appendChild(uiContainer);
        },

        setupCanvas(container) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth;
            this.canvas.height = Math.max(container.offsetHeight, 600);
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
            console.log("pathway_testing: loadPathwayData started");
            // Try to find embedded XML data first using provided selectors
            const pathwaySelector = 'section.wixui-section:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > p:nth-child(1) > span:nth-child(1)';

            let xmlText = null;
            const el = document.querySelector(pathwaySelector);
            if (el && el.textContent && el.textContent.trim().startsWith('<')) {
                xmlText = el.textContent.trim();
                console.log(`Pathway Viewer: Found XML data in ${pathwaySelector}`);
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
                    console.error("Pathway Viewer: Error parsing embedded XML", e);
                }
            }

            if (!this.pathwayData) {
                const url = this.baseUrl + 'endpoints/kegg_dopaminergic_raw.xml';
                const parsedData = await KeggParser.parse(url);
                this.pathwayData = PathwayLayout.generate3DLayout({ nodes: parsedData.nodes });
                this.pathwayEdges = parsedData.edges;
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
                this.cameraControls.update();
                this.render();
                requestAnimationFrame(animate);
            };
            animate();
        },

        render() {
            console.log("pathway_testing: render started");
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.brainShell && window.GreenhouseNeuroBrain) {
                window.GreenhouseNeuroBrain.drawBrainShell(this.ctx, this.brainShell, this.camera, this.projection, this.canvas.width, this.canvas.height, { color: 'rgba(204, 204, 204, 0.1)' });
            }

            this.drawPathwayGraph();
        },

        drawPathwayGraph() {
            console.log("pathway_testing: drawPathwayGraph started");
            if (!this.pathwayData || !window.GreenhouseModels3DMath) return;

            const projectedNodes = this.pathwayData.map(node => ({
                ...node,
                projected: GreenhouseModels3DMath.project3DTo2D(node.position3D.x, node.position3D.y, node.position3D.z, this.camera, this.projection)
            }));

            // Draw edges
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
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
                    let radius = 5 * node.projected.scale;
                    let color = 'white';
                    switch (node.type) {
                        case 'gene': color = '#00ff00'; break;
                        case 'compound': color = '#0000ff'; break;
                        case 'map': color = '#ffff00'; radius = 10 * node.projected.scale; break;
                    }
                    if (node.id === this.highlightedNodeId) {
                        color = '#ff0000';
                        radius *= 2;
                    }
                    this.ctx.beginPath();
                    this.ctx.arc(node.projected.x, node.projected.y, radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = color;
                    this.ctx.fill();
                }
            });
        }
    };

    window.GreenhousePathwayViewer = GreenhousePathwayViewer;
})();
