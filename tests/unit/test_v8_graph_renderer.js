/**
 * @file test_v8_graph_renderer.js
 * @description Unit tests for V8GraphRenderer logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: (sel) => ({
        id: sel,
        innerHTML: '',
        style: {},
        appendChild: () => { },
        clientWidth: 800,
        clientHeight: 600,
        getBoundingClientRect: () => ({ left: 0, top: 0 })
    }),
    createElement: (tag) => ({
        tag,
        style: {},
        getContext: () => ({
            clearRect: () => { },
            fillRect: () => { },
            beginPath: () => { },
            arc: () => { },
            fill: () => { },
            stroke: () => { },
            moveTo: () => { },
            lineTo: () => { },
            measureText: () => ({ width: 10 }),
            fillText: () => { }
        }),
        addEventListener: () => { }
    }),
    addEventListener: () => { }
};
const originalConsole = console;
global.console = {
    log: (...args) => originalConsole.log(...args),
    error: (...args) => originalConsole.error(...args),
    warn: (...args) => originalConsole.warn(...args)
};
global.fetch = () => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('NodeLabel,NodeID,Connections,Weight,Group\n"Test Node","N1","[]",1,"Disorder"')
});
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// --- Load Script ---
const filePath = path.join(__dirname, '../../apps/frontend/v8_graph_renderer/V8GraphRenderer.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('V8GraphRenderer (Unit)', () => {

    const Renderer = global.window.V8GraphRenderer;

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

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
