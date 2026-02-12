/**
 * @file graph_parser.js
 * @description Parses large topic graphs (CSV) and filters for top N nodes for visualization.
 * Defines 3D positions for the filtered nodes.
 */

(function () {
    'use strict';

    window.GreenhouseGraphParser = {
        data: { nodes: [], edges: [] },
        isLoaded: false,
        subscribers: [],

        /**
         * Initialize and load the graph data, keeping only top N nodes by weight.
         * @param {string} url - URL to csv or relative path
         * @param {number} limit - Number of top nodes to keep
         * @param {string} baseUrl - Base URL for relative paths
         */
        init: function (url, limit = 50, baseUrl = '') {
            let dataUrl = url || 'endpoints/graph.csv';

            // If it's a relative path (doesn't start with http/https or /), prepend baseUrl
            if (baseUrl && !dataUrl.startsWith('http') && !dataUrl.startsWith('/')) {
                const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
                dataUrl = base + dataUrl;
            }

            console.log(`GreenhouseGraphParser: Fetching graph data from ${dataUrl} (Limit: ${limit})...`);

            return fetch(dataUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.text();
                })
                .then(csvText => {
                    this.parseCSV(csvText, limit);
                    this.isLoaded = true;
                    console.log(`GreenhouseGraphParser: Loaded top ${this.data.nodes.length} nodes.`);
                    this.notifySubscribers();
                    return this.data;
                })
                .catch(err => {
                    console.log("GreenhouseGraphParser: Graph data unavailable, feature disabled.");
                    // Don't re-throw - allow the app to continue without graph feature
                    this.isLoaded = false;
                    return null;
                });
        },

        onLoad: function (callback) {
            if (this.isLoaded) {
                callback(this.data);
            } else {
                this.subscribers.push(callback);
            }
        },

        notifySubscribers: function () {
            this.subscribers.forEach(cb => cb(this.data));
            this.subscribers = [];
        },

        parseCSV: function (text, limit) {
            const lines = text.split('\n');
            let nodes = [];
            const edges = [];

            // 1. First Pass: Parse all Valid Lines
            lines.forEach((line, index) => {
                line = line.trim();
                // Regex matches: "Label",ID,[1,2,3],Weight,Group
                // Note: Weight is index 4, Group is index 5 in match array (0 is full string)
                const match = line.match(/^"(.*)",(\d+),(\[.*?\]),(\d+),(\d+)$/);

                if (match) {
                    const label = match[1];
                    const id = parseInt(match[2], 10);
                    const weight = parseInt(match[4], 10);
                    const group = parseInt(match[5], 10);
                    let connections = [];
                    try {
                        connections = JSON.parse(match[3]);
                    } catch (e) { }

                    nodes.push({ id, label, weight, group, connections });
                }
            });

            // 2. Sort by Weight Descending
            nodes.sort((a, b) => b.weight - a.weight);

            // 3. Slice the Top N
            nodes = nodes.slice(0, limit);

            // 4. Assign 3D Positions (Volumetric, Spherical Distribution)
            // Use Fibonacci Sphere algorithm for even distribution
            const phi = Math.PI * (3 - Math.sqrt(5)); // Golden Angle

            nodes.forEach((node, i) => {
                const y = 1 - (i / (nodes.length - 1)) * 2; // y goes from 1 to -1
                const radiusAtY = Math.sqrt(1 - y * y); // Radius at y

                const theta = phi * i; // Golden angle increment

                const r = 250; // Radius of the sphere cloud

                node.x = Math.cos(theta) * radiusAtY * r;
                node.y = y * r;
                node.z = Math.sin(theta) * radiusAtY * r;

                // Random drift for organic feel
                node.x += (Math.random() - 0.5) * 50;
                node.y += (Math.random() - 0.5) * 50;
                node.z += (Math.random() - 0.5) * 50;

                // Initialize Velocity for Physics
                node.vx = 0; node.vy = 0; node.vz = 0;
            });

            // 5. Create Edges (Only if both source and target are in top N)
            const nodeIds = new Set(nodes.map(n => n.id));

            nodes.forEach(node => {
                node.connections.forEach(targetId => {
                    if (nodeIds.has(targetId)) {
                        // Check uniqueness (undirected) to avoid double drawing? 
                        // For simplicity, directed is fine, stroke will just overwrite or add intensity.
                        // Or we can enforce id < targetId if we want unique undirected edges.
                        edges.push({ source: node.id, target: targetId });
                    }
                });
            });

            this.data = { nodes, edges };
        }
    };
})();
