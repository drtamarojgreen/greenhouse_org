// docs/js/kegg_parser.js
// Dedicated parser for KEGG Markup Language (KGML) data.

(function() {
    'use strict';

    const KeggParser = {
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

                // Support JSON format
                if (text.trim().startsWith('{')) {
                    try {
                        return this.parseJSON(JSON.parse(text));
                    } catch (e) {
                        console.error("Pathway App: Failed to parse JSON data", e);
                        return { nodes: [], edges: [] };
                    }
                }

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "application/xml");

                const nodes = this.extractEntries(xmlDoc);
                const edges = this.extractRelations(xmlDoc);

                return { nodes, edges };
            } catch (error) {
                console.error("Error parsing KGML data:", error);
                return { nodes: [], edges: [] };
            }
        },

        parseJSON(data) {
            const nodes = [];
            const edges = [];

            if (data.molecules) {
                data.molecules.forEach(m => {
                    nodes.push({
                        id: m.id,
                        name: m.label || m.id,
                        type: m.class || 'compound',
                        link: m.link || m.source,
                        x: m.x || 400,
                        y: m.y || 400,
                        color: m.color,
                        radius: m.defaultRadius
                    });
                });
            }

            if (data.reactions) {
                data.reactions.forEach(r => {
                    if (r.substrate && r.product) {
                        edges.push({
                            source: r.substrate,
                            target: r.product,
                            type: r.type,
                            catalyst: r.catalyst,
                            metadata: r
                        });
                    }
                });
            }

            return { nodes, edges };
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
                        width: parseInt(graphics.getAttribute("width"), 10),
                        height: parseInt(graphics.getAttribute("height"), 10)
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
                    type: relation.getAttribute("type")
                });
            }
            return edges;
        }
    };

    window.KeggParser = KeggParser;
    console.log('KeggParser loaded.');

})();
