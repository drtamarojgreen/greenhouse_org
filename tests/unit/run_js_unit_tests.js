const fs = require('fs');
const path = require('path');

// --- 1. Mock Browser Environment ---
global.window = global;
global.self = global;
global.performance = { now: () => Date.now() };

class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.attributes = {};
        this.children = [];
        this.innerHTML = '';
        this.style = {};
        this.value = '';
        this.textContent = '';
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false,
            toggle: () => {}
        };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] || null; }
    hasAttribute(name) { return this.attributes.hasOwnProperty(name); }
    appendChild(child) { this.children.push(child); }
    removeChild(child) { 
        const index = this.children.indexOf(child);
        if (index > -1) this.children.splice(index, 1);
    }
    addEventListener(event, callback) {}
    removeEventListener(event, callback) {}
    getElementsByTagName(name) {
        let results = [];
        for (let child of this.children) {
            if (child.tagName === name) results.push(child);
            results = results.concat(child.getElementsByTagName(name));
        }
        return results;
    }
    getContext() { 
        return {
            fillRect: () => {},
            clearRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            arc: () => {},
            fillText: () => {},
            measureText: () => ({ width: 10 }),
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            drawImage: () => {}
        };
    }
}

global.DOMParser = class {
    parseFromString(xmlText, type) {
        const doc = new MockElement('root');
        const entryBlockRegex = /<entry\s+([^>]+)>([\s\S]*?)<\/entry>|<entry\s+([^>]+)\/>/g;
        let match;
        while ((match = entryBlockRegex.exec(xmlText)) !== null) {
            const entry = new MockElement('entry');
            const attrs = match[1] || match[3];
            const content = match[2] || "";
            attrs.replace(/(\w+)="([^"]*)"/g, (m, name, val) => entry.setAttribute(name, val));
            if (content) {
                const graphicsMatch = /<graphics\s+([^>]+)\/>/.exec(content);
                if (graphicsMatch) {
                    const graphics = new MockElement('graphics');
                    graphicsMatch[1].replace(/(\w+)="([^"]*)"/g, (m, name, val) => graphics.setAttribute(name, val));
                    entry.appendChild(graphics);
                }
            }
            doc.appendChild(entry);
        }
        const relRegex = /<relation\s+([^>]+)\/>/g;
        while ((match = relRegex.exec(xmlText)) !== null) {
            const rel = new MockElement('relation');
            match[1].replace(/(\w+)="([^"]*)"/g, (m, name, val) => rel.setAttribute(name, val));
            doc.appendChild(rel);
        }
        return doc;
    }
};

global.fetch = (url) => Promise.resolve({
    ok: true,
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({}),
    headers: { get: () => 'application/json' }
});

global.document = {
    getElementById: (id) => new MockElement('div'),
    querySelector: () => new MockElement('div'),
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement(tag),
    body: new MockElement('body'),
    addEventListener: () => {}
};

global.navigator = { userAgent: 'node.js' };
global.location = { href: 'http://localhost/', search: '', hash: '' };
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// --- 2. Load Infrastructure (Relative to tests/unit/) ---
const ROOT = path.resolve(__dirname, '../../');
require(path.join(ROOT, 'docs/js/assertion_library.js'));
require(path.join(ROOT, 'docs/js/test_framework.js'));

// --- 3. Load Implementation to Test ---
require(path.join(ROOT, 'docs/js/reactome_parser.js'));

// Mocks for complex dependencies
global.PathwayLayout = {
    generate3DLayout: (data) => (data.nodes || []).map(n => ({ ...n, position3D: { x: 0, y: 0, z: 0 } }))
};
global.PathwayDataGenerator = {
    generate: () => ({ nodes: [], edges: [] })
};
global.GreenhouseModelsUtil = {
    PathwayService: {
        loadMetadata: () => Promise.resolve({ pathways: [] }),
        loadPathway: () => Promise.resolve({ nodes: [], edges: [] })
    },
    t: (k) => k
};

// Load core logic that tests might depend on
try {
    require(path.join(ROOT, 'docs/js/pathway/pathway_viewer.js'));
} catch (e) {
    console.warn("Could not load pathway_viewer.js, some tests might fail.");
}

// --- 4. Discover and Run Tests ---
function getAllTestFiles(dir, files_ = []) {
    const files = fs.readdirSync(dir);
    for (const i in files) {
        const name = path.join(dir, files[i]);
        if (fs.statSync(name).isDirectory()) {
            getAllTestFiles(name, files_);
        } else {
            if (path.basename(name).startsWith('test_') && name.endsWith('.js') && !name.includes('run_js_unit_tests.js')) {
                files_.push(name);
            }
        }
    }
    return files_;
}

async function runTests() {
    console.log("--- Starting Consolidated JavaScript Unit Tests (CLI) ---");
    
    const testFiles = getAllTestFiles(__dirname);
    console.log(`Found ${testFiles.length} test files.\n`);

    for (const file of testFiles) {
        const relativePath = path.relative(__dirname, file);
        console.log(`Running: ${relativePath}`);
        try {
            const code = fs.readFileSync(file, 'utf8');
            // Execute in current context
            eval(code);
        } catch (e) {
            console.error(`Error executing ${relativePath}:`, e.message);
        }
    }

    const results = await global.TestFramework.run();
    
    console.log("\n--- Test Results Summary ---");
    console.log(`Passed:  ${results.passed}`);
    console.log(`Failed:  ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Total:   ${results.total}`);

    if (results.failed > 0) {
        console.log("\n--- Failure Details ---");
        global.TestFramework.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.result === 'failed') {
                    console.error(`\n❌ [${suite.name}] ${test.name}`);
                    console.error(`   Error: ${test.error.message}`);
                }
            });
        });
        console.error("\n❌ CONSOLIDATED UNIT TESTS FAILED");
        process.exit(1);
    } else {
        console.log("\n✅ ALL CONSOLIDATED UNIT TESTS PASSED");
    }
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
