/**
 * @file model_graph_viewer.js
 * @description 3D Force-Directed Graph Renderer.
 * Renders the graph loaded by graph_parser.js onto an HTML5 Canvas using 3D projection.
 */

(function () {
    'use strict';

    const GreenhouseModelGraphViewer = {
        canvas: null,
        ctx: null,
        graphData: null,
        isRunning: false,

        // Layout State
        positions: {}, // map node.id -> {x, y, z}
        velocities: {}, // map node.id -> {vx, vy, vz}

        // Configuration
        config: {
            k_repel: 80000.0,    // Repulsive force strength
            k_attract: 0.05,     // Attractive force strength
            ideal_dist: 100.0,   // Ideal distance
            damping: 0.85,       // Damping
            iterations: 2,       // Sub-steps
            centerForce: 0.005   // Gravity to (0,0,0)
        },

        init: function (canvasElement) {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            this.initData();
        },

        initDataOnly: function () {
            this.initData();
        },

        initData: function () {
            // Subscribe to graph data via the new Parser
            if (window.GreenhouseGraphParser) {
                if (window.GreenhouseGraphParser.isLoaded && window.GreenhouseGraphParser.data) {
                    this.graphData = window.GreenhouseGraphParser.data;
                    this.resetLayout();
                }

                window.GreenhouseGraphParser.onLoad((data) => {
                    this.graphData = data;
                    this.resetLayout();
                    if (this.canvas) this.start();
                });
            } else {
                console.error("GreenhouseModelGraphViewer: graph_parser.js not loaded.");
            }
        },

        resetLayout: function () {
            if (!this.graphData) return;

            this.positions = {};
            this.velocities = {};

            this.graphData.nodes.forEach(node => {
                // Use positions from Parser if available (which initializes 3D layout)
                // Otherwise random 3D distribution
                this.positions[node.id] = {
                    x: node.x || (Math.random() - 0.5) * 500,
                    y: node.y || (Math.random() - 0.5) * 500,
                    z: node.z || (Math.random() - 0.5) * 500
                };
                this.velocities[node.id] = { x: 0, y: 0, z: 0 };
            });
        },

        start: function () {
            if (this.isRunning) return;
            this.isRunning = true;
            this.animate();
        },

        stop: function () {
            this.isRunning = false;
        },

        animate: function () {
            if (!this.isRunning) return;
            // Independent loop not used when integrated in Stress Pathway (which calls render/update directly)
            // But kept for standalone usage logic
            // this.updatePhysics(); 
            // this.render();
            // requestAnimationFrame(() => this.animate());
        },

        updatePhysics: function (overrideW, overrideH) {
            if (!this.graphData) return;

            // Physics operates in 3D centered at 0,0,0
            const { k_repel, k_attract, ideal_dist, damping, centerForce } = this.config;

            for (let iter = 0; iter < this.config.iterations; iter++) {
                const forces = {};

                // Initialize forces (Gravity to center)
                this.graphData.nodes.forEach(n => {
                    const p = this.positions[n.id];
                    if (!p) return;
                    forces[n.id] = {
                        x: -p.x * centerForce,
                        y: -p.y * centerForce,
                        z: -p.z * centerForce
                    };
                });

                // 1. Repulsive Forces (N^2)
                const nodes = this.graphData.nodes;
                const len = nodes.length;

                for (let i = 0; i < len; i++) {
                    const id1 = nodes[i].id;
                    const p1 = this.positions[id1];
                    if (!p1) continue;

                    for (let j = i + 1; j < len; j++) {
                        const id2 = nodes[j].id;
                        const p2 = this.positions[id2];
                        if (!p2) continue;

                        const dx = p1.x - p2.x;
                        const dy = p1.y - p2.y;
                        const dz = p1.z - p2.z;
                        let distSq = dx * dx + dy * dy + dz * dz;

                        if (distSq < 1.0) distSq = 1.0;

                        const f = k_repel / (distSq + 100); // 3D Repulsion
                        const dist = Math.sqrt(distSq);

                        // Vector components
                        const fx = (dx / dist) * f;
                        const fy = (dy / dist) * f;
                        const fz = (dz / dist) * f;

                        forces[id1].x += fx; forces[id1].y += fy; forces[id1].z += fz;
                        forces[id2].x -= fx; forces[id2].y -= fy; forces[id2].z -= fz;
                    }
                }

                // 2. Attractive Forces
                this.graphData.edges.forEach(edge => {
                    const u = edge.source;
                    const v = edge.target;
                    const p1 = this.positions[u];
                    const p2 = this.positions[v];

                    if (!p1 || !p2) return;

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dz = p2.z - p1.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;

                    const force = k_attract * Math.max(0, dist - ideal_dist);

                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    const fz = (dz / dist) * force;

                    forces[u].x += fx; forces[u].y += fy; forces[u].z += fz;
                    forces[v].x -= fx; forces[v].y -= fy; forces[v].z -= fz;
                });

                // 3. Integrate
                this.graphData.nodes.forEach(n => {
                    const id = n.id;
                    const f = forces[id];
                    const v = this.velocities[id];
                    const p = this.positions[id];

                    if (f && v && p) {
                        v.x = (v.x + f.x) * damping;
                        v.y = (v.y + f.y) * damping;
                        v.z = (v.z + f.z) * damping;

                        p.x += v.x;
                        p.y += v.y;
                        p.z += v.z;
                    }
                });
            }
        },

        render: function (externalCtx, width, height, camera, projection) {
            const ctx = externalCtx || this.ctx;
            if (!ctx || !this.graphData) return;

            const Math3D = window.GreenhouseModels3DMath;
            // If no camera passed, use default simple projection centered
            const defaultCam = { x: 0, y: 0, z: -800, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 };
            const defaultProj = { width: width || 800, height: height || 600, near: 10, far: 5000 };

            const cam = camera || defaultCam;
            const proj = projection || defaultProj;

            // 1. Project all nodes first
            const projectedNodes = {};
            this.graphData.nodes.forEach(node => {
                const p = this.positions[node.id];
                if (p) {
                    // 3D Projection
                    if (Math3D) {
                        projectedNodes[node.id] = Math3D.project3DTo2D(p.x, p.y, p.z, cam, proj);
                    } else {
                        // Fallback 2D
                        projectedNodes[node.id] = {
                            x: p.x + proj.width / 2,
                            y: p.y + proj.height / 2,
                            scale: 1.0, depth: p.z
                        };
                    }
                }
            });

            // 2. Sort by depth for Z-buffering (painter's algorithm)
            const sortedNodeIds = Object.keys(projectedNodes).sort((a, b) => {
                return (projectedNodes[b].depth || 0) - (projectedNodes[a].depth || 0);
            });

            // 3. Draw Edges (behind nodes usually, but simplified here)
            // Ideally sort edges by avg depth too, but for speed lines are fine below.
            ctx.lineWidth = 1;
            this.graphData.edges.forEach(edge => {
                const p1 = projectedNodes[edge.source];
                const p2 = projectedNodes[edge.target];

                if (p1 && p2 && p1.scale > 0 && p2.scale > 0) {
                    const depthAlpha = Math.min(1, (p1.scale + p2.scale) / 2);

                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(76, 161, 175, ${0.3 * depthAlpha})`;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // 4. Draw Nodes
            sortedNodeIds.forEach(id => {
                const projP = projectedNodes[id];
                if (projP.scale <= 0) return;

                const node = this.graphData.nodes.find(n => n.id === parseInt(id));
                if (!node) return;

                const baseSize = 4 + (node.weight || 0) * 0.5;
                const size = baseSize * projP.scale;

                // Color based on Group
                const groupColors = ['#ff4d4d', '#ffcc00', '#a18cd1', '#64d2ff', '#00ff99', '#ffffff'];
                const color = groupColors[(node.group || 0) % groupColors.length];

                ctx.fillStyle = color;

                // Fog/Alpha
                const alpha = Math.min(1, Math.max(0.1, projP.scale));
                ctx.globalAlpha = alpha;

                ctx.beginPath();
                ctx.arc(projP.x, projP.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Labels for top nodes or close nodes
                if (node.weight > 6 || size > 6) {
                    ctx.fillStyle = "#fff";
                    ctx.font = `${Math.floor(10 * projP.scale)}px Quicksand`;
                    ctx.textAlign = 'center';
                    ctx.fillText(node.label, projP.x, projP.y + size + 5 * projP.scale);
                }

                ctx.globalAlpha = 1.0;
            });
        }
    };

    window.GreenhouseModelGraphViewer = GreenhouseModelGraphViewer;
})();
