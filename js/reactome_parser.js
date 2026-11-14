// docs/js/reactome_parser.js
// Dedicated parser for Reactome pathway data.

(function() {
    'use strict';

    const ReactomeParser = {
        async parse(source, isRaw = false) {
            try {
                let text;
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
                        console.error("Pathway App: Failed to parse Reactome JSON data", e);
                        return { nodes: [], edges: [] };
                    }
                }

                // Fallback for structured XML data (e.g. legacy BioPAX-like subsets)
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "application/xml");

                const nodes = this.extractEntries(xmlDoc);
                const edges = this.extractRelations(xmlDoc);

                return { nodes, edges };
            } catch (error) {
                console.error("Error parsing Reactome data:", error);
                return { nodes: [], edges: [] };
            }
        },

        parseJSON(data) {
            const nodes = [];
            const edges = [];

            // Reactome Diagram Layout mapping
            const rawNodes = data.nodes || data.physicalEntities || data.molecules || [];
            const rawEdges = data.edges || data.interactions || data.reactions || [];

            rawNodes.forEach(n => {
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

            rawEdges.forEach(e => {
                const source = String(e.from || e.sourceId || (e.input && e.input[0]) || e.substrate);
                const target = String(e.to || e.targetId || (e.output && e.output[0]) || e.product);
                
                if (source && target) {
                    edges.push({
                        source: source,
                        target: target,
                        type: e.renderableClass || e.type || 'reaction',
                        catalyst: e.catalyst,
                        metadata: e
                    });
                }
            });

            return { nodes, edges };
        },

        mapReactomeClass(rc) {
            if (!rc) return 'compound';
            const map = {
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

        extractEntries(xmlDoc) {
            const nodes = [];
            let entries = xmlDoc.getElementsByTagName("entry");
            if (!entries || entries.length === 0) {
                entries = xmlDoc.getElementsByTagName("node");
            }

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const graphics = entry.getElementsByTagName("graphics")[0];

                if (graphics) {
                    nodes.push({
                        id: entry.getAttribute("id") || entry.getAttribute("dbId") || entry.getAttribute("stId"),
                        name: entry.getAttribute("name") || entry.getAttribute("displayName") || entry.getAttribute("label"),
                        type: entry.getAttribute("type"),
                        x: parseInt(graphics.getAttribute("x"), 10),
                        y: parseInt(graphics.getAttribute("y"), 10),
                        width: parseInt(graphics.getAttribute("width"), 10),
                        height: parseInt(graphics.getAttribute("height"), 10)
                    });
                }
            }
            return nodes;
        },

        extractRelations(xmlDoc) {
            const edges = [];
            let relations = xmlDoc.getElementsByTagName("relation");
            if (!relations || relations.length === 0) {
                relations = xmlDoc.getElementsByTagName("edge");
            }

            for (let i = 0; i < relations.length; i++) {
                const relation = relations[i];
                edges.push({
                    source: relation.getAttribute("entry1") || relation.getAttribute("source") || relation.getAttribute("from"),
                    target: relation.getAttribute("entry2") || relation.getAttribute("target") || relation.getAttribute("to"),
                    type: relation.getAttribute("type")
                });
            }
            return edges;
        }
    };

    window.ReactomeParser = ReactomeParser;
    console.log('ReactomeParser loaded.');

})();
