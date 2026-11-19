/**
 * @file graph_parser.ts
 * @description Parses large topic graphs (CSV) and filters for top N nodes for visualization.
 * Defines 3D positions for the filtered nodes.
 */

export interface GraphNode {
    id: string;
    label: string;
    weight: number;
    group: number;
    connections: string[];
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
}

export interface ParsedGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export type GraphLoadCallback = (data: ParsedGraphData) => void;

const GreenhouseGraphParser = {
    data: { nodes: [], edges: [] } as ParsedGraphData,
    isLoaded: false,
    _setupStarted: false,
    subscribers: [] as GraphLoadCallback[],

    /**
     * Initialize and load the graph data, keeping only top N nodes by weight.
     * @param url - URL to csv
     * @param limit - Number of top nodes to keep
     * @param baseUrl - Base URL for relative requests
     */
    init: function (url?: string, limit: number = 50, baseUrl: string = '/'): Promise<ParsedGraphData | null> {
        const base = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/') : '';
        const path = url || 'endpoints/graph.csv';
        const dataUrl = (path.startsWith('http') || path.startsWith('/')) ? path : base + path;

        console.log(`GreenhouseGraphParser: Checking availability of graph data at ${dataUrl}...`);

        // Phase 1: Dynamic availability check before full load
        return fetch(dataUrl, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    console.log('GreenhouseGraphParser: Graph data unavailable (404/HEAD), feature disabled.');
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
            .catch(() => {
                console.log('GreenhouseGraphParser: Graph data unavailable or error during check.');
                this.isLoaded = false;
                return null;
            });
    },

    onLoad: function (callback: GraphLoadCallback): void {
        if (this.isLoaded) {
            callback(this.data);
        } else {
            this.subscribers.push(callback);
        }
    },

    notifySubscribers: function (): void {
        this.subscribers.forEach(cb => cb(this.data));
        this.subscribers = [];
    },

    parseCSV: function (text: string, limit: number): void {
        const lines = text.split('\n');
        let nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];

        // 1. First Pass: Parse all Valid Lines
        lines.forEach((line, index) => {
            line = line.trim();
            if (!line || index === 0) return; // Skip header

            // Regex matches: "Label",ID,"[Connections]",Weight,Group
            // Handles optional quotes, string IDs, and float weights.
            const match = line.match(/^(".*?"|[^,]+),(".*?"|[^,]+),("\[.*\]"),([\d.]+),(".*?"|[^,]+)$/);

            if (match) {
                const label = match[1].replace(/^"|"$/g, '');
                const id = match[2].replace(/^"|"$/g, '');
                const weight = parseFloat(match[4]);
                const groupStr = match[5].replace(/^"|"$/g, '');

                // Group Mapping (Map string groups to integers for visualization)
                const groupMap: Record<string, number> = {
                    'Disorder': 0,
                    'Drug': 1,
                    'ClinicalTrial': 2,
                    'Intervention': 3,
                    'Publication': 4
                };
                const group = groupMap[groupStr] !== undefined ? groupMap[groupStr] : 5;

                let connections: string[] = [];
                try {
                    // Handle CSV-escaped quotes in JSON string ("" -> ")
                    const jsonStr = match[3].replace(/^"|"$/g, '').replace(/""/g, '"');
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
                    edges.push({ source: node.id, target: targetId });
                }
            });
        });

        this.data = { nodes, edges };
    }
};

export { GreenhouseGraphParser };
