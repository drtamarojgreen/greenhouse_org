(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('ReactomeParser (Unit)', () => {

        const Parser = window.ReactomeParser;

        TestFramework.it('should define Parser object', () => {
            assert.isDefined(Parser);
            assert.isFunction(Parser.parse);
        });

        TestFramework.it('should parse Reactome Diagram JSON into nodes and edges', () => {
            const mockData = {
                nodes: [
                    { dbId: 101, stId: "R-HSA-101", displayName: "Test Protein", renderableClass: "Protein", x: 150, y: 250 },
                    { dbId: 102, stId: "R-HSA-102", displayName: "Test Chemical", renderableClass: "Chemical", x: 350, y: 450 }
                ],
                edges: [
                    { dbId: 201, from: 101, to: 102, renderableClass: "Reaction" }
                ]
            };

            const result = Parser.parseJSON(mockData);

            assert.equal(result.nodes.length, 2);
            assert.equal(result.nodes[0].id, "101");
            assert.equal(result.nodes[0].name, "Test Protein");
            assert.equal(result.nodes[0].type, "gene"); // Mapped from Protein
            assert.equal(result.nodes[1].type, "compound"); // Mapped from Chemical
            assert.equal(result.nodes[0].stId, "R-HSA-101");
            
            assert.equal(result.edges.length, 1);
            assert.equal(result.edges[0].source, "101");
            assert.equal(result.edges[0].target, "102");
        });

        TestFramework.it('should extract entries from legacy XML with new identifiers', () => {
            const xml = `
                <pathway>
                    <entry id="1" name="test_node" type="gene">
                        <graphics x="100" y="200" width="46" height="17"/>
                    </entry>
                </pathway>
            `;
            const doc = new DOMParser().parseFromString(xml, "application/xml");
            const nodes = Parser.extractEntries(doc);

            assert.equal(nodes.length, 1);
            assert.equal(nodes[0].id, '1');
            assert.equal(nodes[0].x, 100);
        });

        TestFramework.it('should extract relations into edges from legacy XML', () => {
            const xml = `
                <pathway>
                    <relation entry1="1" entry2="2" type="activation"/>
                </pathway>
            `;
            const doc = new DOMParser().parseFromString(xml, "application/xml");
            const edges = Parser.extractRelations(doc);

            assert.equal(edges.length, 1);
            assert.equal(edges[0].source, '1');
            assert.equal(edges[0].target, '2');
        });

        TestFramework.it('should handle fetch and Reactome JSON flow', async () => {
            const originalFetch = window.fetch;
            const mockJson = JSON.stringify({
                nodes: [{ dbId: 1, displayName: "N", x: 10, y: 20 }]
            });
            
            window.fetch = () => Promise.resolve({
                ok: true,
                text: () => Promise.resolve(mockJson)
            });

            const result = await Parser.parse('http://any.url');
            assert.isDefined(result.nodes);
            assert.equal(result.nodes.length, 1);
            assert.equal(result.nodes[0].id, "1");

            window.fetch = originalFetch;
        });

    });
})();
