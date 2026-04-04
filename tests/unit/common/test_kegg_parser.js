(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('KeggParser (Unit)', () => {

        const Parser = window.KeggParser;

        TestFramework.it('should define Parser object', () => {
            assert.isDefined(Parser);
            assert.isFunction(Parser.parse);
        });

        TestFramework.it('should extract entries into nodes with coordinates', () => {
            // Use real DOMParser in browser
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

        TestFramework.it('should extract relations into edges', () => {
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

        TestFramework.it('should handle fetch and parse flow', async () => {
            // Mock fetch for this test
            const originalFetch = window.fetch;
            window.fetch = () => Promise.resolve({
                ok: true,
                text: () => Promise.resolve('<pathway><entry id="1" name="n"><graphics x="10"/></entry></pathway>')
            });

            const result = await Parser.parse('http://any.url');
            assert.isDefined(result.nodes);
            assert.greaterThan(result.nodes.length, 0);

            window.fetch = originalFetch;
        });

    });
})();
