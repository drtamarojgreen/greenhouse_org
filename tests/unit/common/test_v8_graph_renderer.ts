(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('V8GraphRenderer (Unit)', () => {

        const Renderer = window.V8GraphRenderer;

        TestFramework.describe('Initialization', () => {
            TestFramework.it('should define Renderer object', () => {
                assert.isDefined(Renderer);
                assert.isFunction(Renderer.init);
            });
        });

        TestFramework.describe('CSV Parsing', () => {
            TestFramework.it('should parse CSV text into nodes and links', () => {
                const csvText = 'NodeLabel,NodeID,Connections,Weight,Group\n"Node A","A","[""B""]",1,"G1"\n"Node B","B","[]",1,"G2"';
                const data = Renderer.parseCSV(csvText);
                assert.equal(data.nodes.length, 2);
                assert.equal(data.links.length, 1);
                assert.equal(data.nodes[0].id, "A");
                assert.equal(data.nodes[1].id, "B");
            });
        });

    });
})();
