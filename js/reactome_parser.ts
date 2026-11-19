// js/reactome_parser.ts
// Dedicated parser for Reactome pathway data.

export interface ReactomeNode {
    id: string | null;
    name: string | null;
    type: string | null;
    link?: string | null;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
    stId?: string;
}

export interface ReactomeEdge {
    source: string | null;
    target: string | null;
    type: string | null;
    catalyst?: any;
    metadata?: any;
}

export interface ReactomeParsedGraph {
    nodes: ReactomeNode[];
    edges: ReactomeEdge[];
}

const ReactomeParser = {
    async parse(source: string, isRaw: boolean = false): Promise<ReactomeParsedGraph> {
        try {
            let text: string;
            if (isRaw) {
                text = source;
            } else {
                const response = await fetch(source);
                if (!response.ok) {
                    return { nodes: [], edges: [] };
                }
                text = await response.text();
            }

            // Support Reactome Diagram Layout JSON
            if (text.trim().startsWith('{')) {
                try {
                    return this.parseJSON(JSON.parse(text));
                } catch (e) {
                    console.error('Pathway App: Failed to parse Reactome JSON data', e);
                    return { nodes: [], edges: [] };
                }
            }

            // Fallback for structured XML data (e.g. legacy BioPAX-like subsets)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'application/xml');

            const nodes = this.extractEntries(xmlDoc);
            const edges = this.extractRelations(xmlDoc);

            return { nodes, edges };
        } catch (error) {
            console.error('Error parsing Reactome data:', error);
            return { nodes: [], edges: [] };
        }
    },

    parseJSON(data: any): ReactomeParsedGraph {
        const nodes: ReactomeNode[] = [];
        const edges: ReactomeEdge[] = [];

        // Reactome Diagram Layout mapping
        const rawNodes = data.nodes || data.physicalEntities || data.molecules || [];
        const rawEdges = data.edges || data.interactions || data.reactions || [];

        rawNodes.forEach((n: any) => {
            nodes.push({
                id: String(n.dbId || n.id || n.stId),
                name: n.displayName || n.name || n.label || String(n.dbId),
                type: this.mapReactomeClass(n.renderableClass || n.type || n.class),
                link: n.stId ? `https://reactome.org/content/detail/${n.stId}` : (n.link || n.source),
                x: n.x || (n.minX !== undefined ? (n.minX + (n.maxX - n.minX) / 2) : 400),
                y: n.y || (n.minY !== undefined ? (n.minY + (n.maxY - n.minY) / 2) : 400),
                color: n.color,
                stId: n.stId
            });
        });

        rawEdges.forEach((e: any) => {
            const source = String(e.from || e.sourceId || (e.input && e.input[0]) || e.substrate);
            const target = String(e.to || e.targetId || (e.output && e.output[0]) || e.product);

            if (source && target) {
                edges.push({
                    source,
                    target,
                    type: e.renderableClass || e.type || 'reaction',
                    catalyst: e.catalyst,
                    metadata: e
                });
            }
        });

        return { nodes, edges };
    },

    mapReactomeClass(rc?: string): string {
        if (!rc) return 'compound';
        const map: Record<string, string> = {
            'Protein': 'gene',
            'Complex': 'map',
            'Chemical': 'compound',
            'Reaction': 'reaction',
            'Pathway': 'map',
            'RNA': 'gene',
            'Gene': 'gene'
        };
        return map[rc] || 'compound';
    },

    extractEntries(xmlDoc: Document): ReactomeNode[] {
        const nodes: ReactomeNode[] = [];
        let entries = xmlDoc.getElementsByTagName('entry');
        if (!entries || entries.length === 0) {
            entries = xmlDoc.getElementsByTagName('node');
        }

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const graphics = entry.getElementsByTagName('graphics')[0];

            if (graphics) {
                nodes.push({
                    id: entry.getAttribute('id') || entry.getAttribute('dbId') || entry.getAttribute('stId'),
                    name: entry.getAttribute('name') || entry.getAttribute('displayName') || entry.getAttribute('label'),
                    type: entry.getAttribute('type'),
                    x: parseInt(graphics.getAttribute('x') || '0', 10),
                    y: parseInt(graphics.getAttribute('y') || '0', 10),
                    width: parseInt(graphics.getAttribute('width') || '0', 10),
                    height: parseInt(graphics.getAttribute('height') || '0', 10)
                });
            }
        }
        return nodes;
    },

    extractRelations(xmlDoc: Document): ReactomeEdge[] {
        const edges: ReactomeEdge[] = [];
        let relations = xmlDoc.getElementsByTagName('relation');
        if (!relations || relations.length === 0) {
            relations = xmlDoc.getElementsByTagName('edge');
        }

        for (let i = 0; i < relations.length; i++) {
            const relation = relations[i];
            edges.push({
                source: relation.getAttribute('entry1') || relation.getAttribute('source') || relation.getAttribute('from'),
                target: relation.getAttribute('entry2') || relation.getAttribute('target') || relation.getAttribute('to'),
                type: relation.getAttribute('type')
            });
        }
        return edges;
    }
};

export { ReactomeParser };
