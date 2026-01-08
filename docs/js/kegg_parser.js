// docs/js/kegg_parser.js
// Dedicated parser for KEGG Markup Language (KGML) data.

(function() {
    'use strict';

    const KeggParser = {
        async parse(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KGML data: ${response.statusText}`);
                }
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");

                const nodes = this.extractEntries(xmlDoc);
                const edges = this.extractRelations(xmlDoc);

                return { nodes, edges };
            } catch (error) {
                console.error("Error parsing KGML data:", error);
                return { nodes: [], edges: [] };
            }
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
