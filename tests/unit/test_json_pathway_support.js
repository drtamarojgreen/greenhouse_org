/**
 * @file test_json_pathway_support.js
 * @description Unit tests for JSON pathway support in KeggParser.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.DOMParser = class {
    parseFromString(xml, type) {
        return { getElementsByTagName: () => [] };
    }
};
global.console = { log: console.log, error: console.error, warn: console.warn };
global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('{}') });

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/kegg_parser.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('KeggParser JSON Support', () => {

    const Parser = global.window.KeggParser;

    TestFramework.it('should parse JSON molecule data into nodes', () => {
        const mockJson = {
            molecules: [
                { id: 'M1', label: 'Molecule 1', class: 'gene', x: 100, y: 200 },
                { id: 'M2', label: 'Molecule 2', class: 'compound' }
            ]
        };

        const result = Parser.parseJSON(mockJson);

        assert.equal(result.nodes.length, 2);
        assert.equal(result.nodes[0].id, 'M1');
        assert.equal(result.nodes[0].name, 'Molecule 1');
        assert.equal(result.nodes[0].type, 'gene');
        assert.equal(result.nodes[0].x, 100);
        assert.equal(result.nodes[1].id, 'M2');
        assert.equal(result.nodes[1].type, 'compound');
        assert.equal(result.nodes[1].x, 400); // Default
    });

    TestFramework.it('should parse JSON reaction data into edges', () => {
        const mockJson = {
            reactions: [
                { id: 'R1', substrate: 'M1', product: 'M2', type: 'activation', catalyst: 'Enzyme X' }
            ]
        };

        const result = Parser.parseJSON(mockJson);

        assert.equal(result.edges.length, 1);
        assert.equal(result.edges[0].source, 'M1');
        assert.equal(result.edges[0].target, 'M2');
        assert.equal(result.edges[0].type, 'activation');
        assert.equal(result.edges[0].catalyst, 'Enzyme X');
    });

    TestFramework.it('should detect JSON and parse accordingly', async () => {
        const jsonString = JSON.stringify({
            molecules: [{ id: 'J1', label: 'Json Node' }],
            reactions: [{ substrate: 'J1', product: 'J2' }]
        });

        // Mock fetch to return JSON string
        global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve(jsonString) });

        const result = await Parser.parse('http://fake.url');

        assert.equal(result.nodes.length, 1);
        assert.equal(result.nodes[0].id, 'J1');
        assert.equal(result.edges.length, 1);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
