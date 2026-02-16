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
         * @param {string} url - URL to csv
         * @param {number} limit - Number of top nodes to keep
         */
        init: function (url, limit = 50, baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
            const base = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/') : '';
            const path = url || 'endpoints/graph.csv';
            const dataUrl = (path.startsWith('http') || path.startsWith('/')) ? path : base + path;

            console.log(`GreenhouseGraphParser: Checking availability of graph data at ${dataUrl}...`);

            // Phase 1: Dynamic availability check before full load
            return fetch(dataUrl, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.log("GreenhouseGraphParser: Graph data unavailable (404/HEAD), feature disabled.");
                        this.isLoaded = false;
                        return null;
                    }

                    console.log(`GreenhouseGraphParser: Data found, fetching full content (Limit: ${limit})...`);
                    return fetch(dataUrl).then(res => res.text());
                })
                .then(csvText => {
                    if (!csvText) return null;
                    this.parseCSV(csvText, limit);
                    this.isLoaded = true;
                    console.log(`GreenhouseGraphParser: Successfully loaded top ${this.data.nodes.length} nodes.`);
                    this.notifySubscribers();
                    return this.data;
                })
                .catch(err => {
                    console.log("GreenhouseGraphParser: Graph data unavailable or error during check.");
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
                if (!line || index === 0) return; // Skip header

                // Regex matches: "Label",ID,"[Connections]",Weight,Group
                // Handles optional quotes, string IDs, and float weights.
                const match = line.match(/^(".*?"|[^,]+),(".*?"|[^,]+),("\[.*\]"),([\d.]+),(".*?"|[^,]+)$/);

                if (match) {
                    let label = match[1].replace(/^"|"$/g, '');
                    let id = match[2].replace(/^"|"$/g, '');
                    let weight = parseFloat(match[4]);
                    let groupStr = match[5].replace(/^"|"$/g, '');

                    // Group Mapping (Map string groups to integers for visualization)
                    const groupMap = { 'Disorder': 0, 'Drug': 1, 'ClinicalTrial': 2, 'Intervention': 3, 'Publication': 4 };
                    let group = groupMap[groupStr] !== undefined ? groupMap[groupStr] : 5;

                    let connections = [];
                    try {
                        // Handle CSV-escaped quotes in JSON string ("" -> ")
                        let jsonStr = match[3].replace(/^"|"$/g, '').replace(/""/g, '"');
                        connections = JSON.parse(jsonStr);
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
                const y = (nodes.length > 1) ? 1 - (i / (nodes.length - 1)) * 2 : 0; // y goes from 1 to -1
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
