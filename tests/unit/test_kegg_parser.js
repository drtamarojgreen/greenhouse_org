/**
 * @file test_kegg_parser.js
 * @description Unit tests for KeggParserKGML logic.
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
        return {
            getElementsByTagName: (tag) => {
                if (tag === 'entry') {
                    return [{
                        getAttribute: (attr) => {
                            if (attr === 'id') return '1';
                            if (attr === 'name') return 'test_node';
                            return 'gene';
                        },
                        getElementsByTagName: (inner) => {
                            if (inner === 'graphics') return [{
                                getAttribute: (ga) => '100'
                            }];
                            return [];
                        }
                    }];
                }
                if (tag === 'relation') {
                    return [{
                        getAttribute: (attr) => {
                            if (attr === 'entry1') return '1';
                            if (attr === 'entry2') return '2';
                            return 'activation';
                        }
                    }];
                }
                return [];
            }
        };
    }
};
global.console = { log: () => { }, error: () => { } };
global.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('<xml></xml>') });

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/kegg_parser.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('KeggParser (Unit)', () => {

    const Parser = global.window.KeggParser;

    TestFramework.it('should define Parser object', () => {
        assert.isDefined(Parser);
        assert.isFunction(Parser.parse);
    });

    TestFramework.it('should extract entries into nodes with coordinates', () => {
        const mockDoc = new global.DOMParser().parseFromString('', '');
        const nodes = Parser.extractEntries(mockDoc);

        assert.equal(nodes.length, 1);
        assert.equal(nodes[0].id, '1');
        assert.equal(nodes[0].x, 100);
    });

    TestFramework.it('should extract relations into edges', () => {
        const mockDoc = new global.DOMParser().parseFromString('', '');
        const edges = Parser.extractRelations(mockDoc);

        assert.equal(edges.length, 1);
        assert.equal(edges[0].source, '1');
        assert.equal(edges[0].target, '2');
    });

    TestFramework.it('should handle fetch and parse flow', async () => {
        const result = await Parser.parse('http://any.url');
        assert.isDefined(result.nodes);
        assert.greaterThan(result.nodes.length, 0);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
