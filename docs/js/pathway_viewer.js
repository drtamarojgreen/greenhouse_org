// docs/js/pathway_viewer.js
// Core viewer for the 3D pathway visualization.

(function() {
    'use strict';

    const GreenhousePathwayViewer = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        brainModel: null,
        torsoModel: null,
        pathwayData: null,
        pathwayObjects: [],
        parsedData: null, // Store parsed data

        async init(containerSelector) {
            // Basic Three.js setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.querySelector(containerSelector).appendChild(this.renderer.domElement);

            // Controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(5, 5, 5);
            this.scene.add(directionalLight);

            // Camera Position
            this.camera.position.z = 150;

            // Load and render models
            this.renderAnatomicalContext();

            // Load and render pathway
            await this.loadAndRenderPathway();

            // Start rendering loop
            this.animate();
        },

        renderAnatomicalContext() {
            // Brain
            if (window.brain_mesh_realistic) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(window.brain_mesh_realistic.vertices, 3));
                geometry.setIndex(new THREE.Uint32BufferAttribute(window.brain_mesh_realistic.indices, 1));
                geometry.computeVertexNormals();
                const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3 });
                this.brainModel = new THREE.Mesh(geometry, material);
                this.brainModel.scale.set(10, 10, 10);
                this.scene.add(this.brainModel);
            }

            // Torso (placeholder)
            const torsoGeometry = new THREE.CylinderGeometry(20, 20, 80, 32);
            const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3 });
            this.torsoModel = new THREE.Mesh(torsoGeometry, torsoMaterial);
            this.torsoModel.position.y = -80;
            this.scene.add(this.torsoModel);
        },

        async loadAndRenderPathway() {
            this.parsedData = await window.KeggParser.parse('endpoints/kegg_dopaminergic_raw.xml');
            this.pathwayData = window.PathwayLayout.generate3DLayout(this.parsedData);
            this.renderPathwayGraph();
            this.populateUI();
        },

        renderPathwayGraph() {
            // Clear previous pathway objects
            this.pathwayObjects.forEach(obj => this.scene.remove(obj));
            this.pathwayObjects = [];

            const nodeGeometry = new THREE.SphereGeometry(2, 32, 32);
            const nodeMaterials = {
                gene: new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
                compound: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
                map: new THREE.MeshStandardMaterial({ color: 0xffff00 }),
                default: new THREE.MeshStandardMaterial({ color: 0xffffff })
            };

            // Render nodes
            this.pathwayData.forEach(node => {
                const material = nodeMaterials[node.type] || nodeMaterials.default;
                const sphere = new THREE.Mesh(nodeGeometry, material);
                sphere.position.set(node.position3D.x, node.position3D.y, node.position3D.z);
                sphere.userData = node; // Store data for highlighting
                this.scene.add(sphere);
                this.pathwayObjects.push(sphere);
            });

            // Render edges
            const edges = this.parsedData.edges;
            edges.forEach(edge => {
                const sourceNode = this.pathwayData.find(n => n.id === edge.source);
                const targetNode = this.pathwayData.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 });
                    const points = [
                        new THREE.Vector3(sourceNode.position3D.x, sourceNode.position3D.y, sourceNode.position3D.z),
                        new THREE.Vector3(targetNode.position3D.x, targetNode.position3D.y, targetNode.position3D.z)
                    ];
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    this.scene.add(line);
                    this.pathwayObjects.push(line);
                }
            });
        },

        populateUI() {
            const selector = document.getElementById('pathway-selector');
            if (!selector) return;

            this.pathwayData.filter(node => node.type === 'gene').forEach(geneNode => {
                const option = document.createElement('option');
                option.value = geneNode.id;
                option.textContent = geneNode.name;
                selector.appendChild(option);
            });

            document.getElementById('highlight-gene-btn').addEventListener('click', () => {
                const selectedId = selector.value;
                this.highlightNode(selectedId);
            });
        },

        highlightNode(nodeId) {
            this.pathwayObjects.forEach(obj => {
                if (obj.isMesh) { // Only highlight nodes (spheres)
                    if (obj.userData.id === nodeId) {
                        obj.material.emissive.setHex(0xff0000);
                    } else {
                        obj.material.emissive.setHex(0x000000);
                    }
                }
            });
        },

        animate() {
            requestAnimationFrame(this.animate.bind(this));
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }
    };

    window.GreenhousePathwayViewer = GreenhousePathwayViewer;
    console.log('GreenhousePathwayViewer loaded.');

})();
