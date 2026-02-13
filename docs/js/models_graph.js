/**
 * @file models_graph.js
 * @description Utility to load and parse the graph.csv data for use in models.
 * Parses the topic graph structure: "Label",ID,[Connections],Weight,Group
 */

(function () {
    'use strict';

    window.GreenhouseModelsGraph = {
        data: { nodes: [], edges: [] },
        isLoaded: false,
        subscribers: [],

        /**
         * Initialize and load the graph data
         * @param {string} url - Optional URL to csv, defaults to 'endpoints/graph.csv'
         * @returns {Promise} Resolves with the graph data
         */
        init: function (url = '', baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
            const base = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/') : '';
            const path = url || 'endpoints/graph.csv';
            const dataUrl = (path.startsWith('http') || path.startsWith('/')) ? path : base + path;

            console.log(`GreenhouseModelsGraph: Checking availability of graph data at ${dataUrl}...`);

            // Dynamic availability check
            return fetch(dataUrl, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.warn("GreenhouseModelsGraph: Graph data unavailable (404/HEAD).");
                        this.isLoaded = false;
                        return null;
                    }
                    console.log(`GreenhouseModelsGraph: Data found, fetching full content...`);
                    return fetch(dataUrl).then(res => res.text());
                })
                .then(csvText => {
                    if (!csvText) return null;
                    this.parseCSV(csvText);
                    this.isLoaded = true;
                    console.log(`GreenhouseModelsGraph: Loaded ${this.data.nodes.length} nodes and ${this.data.edges.length} edges.`);
                    this.notifySubscribers();
                    return this.data;
                })
                .catch(err => {
                    console.error("GreenhouseModelsGraph: Error loading CSV", err);
                    this.isLoaded = false;
                    return null;
                });
        },

        /**
         * Subscribe to be notified when graph is loaded
         * @param {Function} callback 
         */
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

        /**
         * Parse the specific CSV format for the topic graph
         * Format: "Label",ID,[Connections],Weight,Group
         */
        parseCSV: function (text) {
            const lines = text.split('\n');
            const nodes = [];
            const edges = [];
            const edgeSet = new Set(); // To avoid duplicate edges if bidirectional

            lines.forEach((line, index) => {
                line = line.trim();
                if (!line) return;

                // Regex matches: "Label",ID,[1,2,3],Weight,Group
                // Captures: 1=Label, 2=ID, 3=ConnectionsArray, 4=Weight, 5=Group
                const match = line.match(/^"(.*)",(\d+),(\[.*?\]),(\d+),(\d+)$/);

                if (match) {
                    const label = match[1];
                    const id = parseInt(match[2], 10);
                    const weight = parseInt(match[4], 10);
                    const group = parseInt(match[5], 10);

                    let connections = [];
                    try {
                        connections = JSON.parse(match[3]);
                    } catch (e) {
                        console.warn(`GreenhouseModelsGraph: JSON parse error on line ${index}: ${match[3]}`);
                    }

                    nodes.push({ id, label, weight, group, connections });

                    // Create Edges
                    // Note: Format implies directed connections, but graph might be undirected.
                    // Storing all defined edges.
                    connections.forEach(targetId => {
                        // Create a unique key to valid uniqueness if needed, 
                        // but usually directed edges are fine to keep as is.
                        // If targetId exists in nodes later, we can verify validity.
                        edges.push({ source: id, target: targetId });
                    });
                } else {
                    // console.warn(`GreenhouseModelsGraph: Skipped malformed line ${index}:`, line.substring(0, 50) + "...");
                }
            });

            this.data = { nodes, edges };
        },

        getGraph: function () {
            return this.data;
        },

        /**
         * Get nodes belonging to a specific group
         */
        getNodesByGroup: function (groupId) {
            return this.data.nodes.filter(n => n.group === groupId);
        }
    };
})();
