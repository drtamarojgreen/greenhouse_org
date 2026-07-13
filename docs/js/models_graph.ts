/// <reference path="types/globals.d.ts" />

interface GraphNode {
    id: number;
    label: string;
    weight: number;
    group: number;
    connections: number[];
}

interface GraphEdge {
    source: number;
    target: number;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const GreenhouseModelsGraph = {
    data: { nodes: [], edges: [] } as GraphData,
    isLoaded: false,
    subscribers: [] as ((data: GraphData) => void)[],

    /**
     * Initialize and load the graph data
     * @param url - Optional URL to csv, defaults to 'endpoints/graph.csv'
     * @returns Resolves with the graph data
     */
    init(url: string = '', baseUrl: string = 'https://drtamarojgreen.github.io/greenhouse_org/'): Promise<GraphData | null> {
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
     * @param callback 
     */
    onLoad(callback: (data: GraphData) => void): void {
        if (this.isLoaded) {
            callback(this.data);
        } else {
            this.subscribers.push(callback);
        }
    },

    notifySubscribers(): void {
        this.subscribers.forEach(cb => cb(this.data));
        this.subscribers = [];
    },

    /**
     * Parse the specific CSV format for the topic graph
     * Format: "Label",ID,[Connections],Weight,Group
     */
    parseCSV(text: string): void {
        const lines = text.split('\n');
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];

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

                let connections: number[] = [];
                try {
                    connections = JSON.parse(match[3]);
                } catch (e) {
                    console.warn(`GreenhouseModelsGraph: JSON parse error on line ${index}: ${match[3]}`);
                }

                nodes.push({ id, label, weight, group, connections });

                // Create Edges
                connections.forEach(targetId => {
                    edges.push({ source: id, target: targetId });
                });
            }
        });

        this.data = { nodes, edges };
    },

    getGraph(): GraphData {
        return this.data;
    },

    /**
     * Get nodes belonging to a specific group
     */
    getNodesByGroup(groupId: number): GraphNode[] {
        return this.data.nodes.filter(n => n.group === groupId);
    }
};

(window as any).GreenhouseModelsGraph = GreenhouseModelsGraph;
