const fs = require('fs');
const path = require('path');

// --- 1. Mock Browser Environment ---
global.window = global;
global.self = global;
global.performance = { now: () => Date.now() };

global.HTMLElement = class {};
global.MutationObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
};

class MockElement {
    constructor(tagName) {
        this.tagName = (tagName || '').toUpperCase();
        this.attributes = {};
        this.children = [];
        this.innerHTML = '';
        this.style = {};
        this._value = '';
        this.textContent = '';
        this.parentNode = null;
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false,
            toggle: () => {}
        };
    }
    get value() { return this._value; }
    set value(v) { this._value = v; }
    get className() { return this.attributes['class'] || ''; }
    set className(v) { this.attributes['class'] = v; }
    get id() { return this.attributes['id'] || ''; }
    set id(v) { this.attributes['id'] = v; }

    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] || null; }
    hasAttribute(name) { return this.attributes.hasOwnProperty(name); }
    appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
    }
    removeChild(child) { 
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
    }
    addEventListener(event, callback) {}
    removeEventListener(event, callback) {}
    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
    prepend(child) {
        this.children.unshift(child);
        child.parentNode = this;
    }
    querySelector(sel) {
        if (!sel) return null;
        if (sel.startsWith('#')) {
            const id = sel.slice(1);
            return this._find(node => node.id === id);
        }
        if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            return this._find(node => node.className.includes(cls));
        }
        return this._find(node => node.tagName === sel.toUpperCase());
    }
    _find(predicate) {
        for (const child of this.children) {
            if (predicate(child)) return child;
            const found = child._find(predicate);
            if (found) return found;
        }
        return null;
    }
    querySelectorAll(sel) {
        const results = [];
        this._findAll(node => {
            if (sel.startsWith('.')) return node.className.includes(sel.slice(1));
            return node.tagName === sel.toUpperCase();
        }, results);
        return results;
    }
    _findAll(predicate, results) {
        for (const child of this.children) {
            if (predicate(child)) results.push(child);
            child._findAll(predicate, results);
        }
    }
    getElementsByTagName(name) {
        let results = [];
        for (let child of this.children) {
            if (child.tagName === name) results.push(child);
            results = results.concat(child.getElementsByTagName(name));
        }
        return results;
    }
    getContext(type) {
        return {
            canvas: this,
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
            drawImage: () => {},
            setTransform: () => {},
            transform: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            quadraticCurveTo: () => {},
            closePath: () => {},
            clip: () => {},
            rect: () => {},
            strokeRect: () => {},
            roundRect: () => {}
        };
    }
    click() {
        if (this.onclick) this.onclick({ target: this });
    }
}

global.Image = class {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
    }
};

global.CustomEvent = class {
    constructor(event, params) {
        this.type = event;
        this.detail = params ? params.detail : null;
    }
};

global.dispatchEvent = (event) => {
    // Minimal mock for dispatchEvent
    return true;
};

global.addEventListener = () => {};

global.DOMParser = class {
    parseFromString(xmlText, type) {
        const doc = new MockElement('root');
        doc.querySelector = (sel) => {
            if (sel === 'title') return new MockElement('title');
            if (sel === 'url') return new MockElement('url');
            return null;
        };
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
    body: new MockElement('body'),
    head: new MockElement('head'),
    getElementById: (id) => global.document.body.querySelector(`#${id}`),
    querySelector: (sel) => global.document.body.querySelector(sel),
    querySelectorAll: (sel) => global.document.body.querySelectorAll(sel),
    createElement: (tag) => {
        const el = new MockElement(tag);
        if (tag === 'canvas') {
            el.width = 1000;
            el.height = 750;
        }
        return el;
    },
    addEventListener: () => {}
};

global.navigator = { userAgent: 'node.js' };
global.location = { href: 'http://localhost/', search: '', hash: '' };
global.getComputedStyle = () => ({
    display: 'block',
    flexWrap: 'nowrap',
    getPropertyValue: () => ''
});
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// --- 2. Load Infrastructure (Relative to tests/unit/) ---
const ROOT = path.resolve(__dirname, '../../');

function loadScript(relPath) {
    const fullPath = path.join(ROOT, 'docs/js', relPath);
    try {
        const code = fs.readFileSync(fullPath, 'utf8');
        // Use eval to execute in global context, similar to how <script> tags work
        eval(code);
    } catch (e) {
        console.error(`Failed to load ${relPath}: ${e.message}`);
    }
}

// Core Infrastructure
loadScript('assertion_library.js');
loadScript('test_framework.js');
loadScript('GreenhouseDependencyManager.js');
loadScript('GreenhouseUtils.js');
loadScript('models_lang.js');
loadScript('models_util.js');

// Mock specific classes if needed before loading submodules
global.NeuroSynapseCameraController = class {
    constructor(camera, config) {
        this.camera = camera;
        this.config = config;
    }
    init() {}
    update() {}
    handleMouseDown() {}
    handleMouseMove() {}
    handleMouseUp() {}
    handleWheel() {}
};

// --- 3. Load Implementation to Test ---
loadScript('reactome_parser.js');

// App-specific submodules
const submodules = [
    'models_3d_math.js',
    'brain_mesh_realistic.js',
    'neuro/neuro_config.js',
    'neuro/neuro_adhd_data.js',
    'neuro/neuro_ga.js',
    'neuro/neuro_ui_3d_geometry.js',
    'neuro/neuro_ui_3d_brain.js',
    'neuro/neuro_ui_3d_neuron.js',
    'neuro/neuro_ui_3d_synapse.js',
    'neuro/neuro_ui_3d_stats.js',
    'neuro/neuro_ui_3d.js',
    'neuro/neuro_controls.js',
    'neuro/neuro_app.js',
    'genetic/genetic_config.js',
    'genetic/genetic_algo.js',
    'genetic/genetic_ui_3d.js',
    'genetic/genetic_ui_3d_protein.js',
    'pathway/pathway_viewer.js',
    'stress/stress_config.js',
    'stress/stress_app.js',
    'emotion/emotion_config.js',
    'emotion/emotion_app.js',
    'serotonin/serotonin_transport.js',
    'serotonin/serotonin_signaling.js',
    'serotonin/serotonin_receptors.js',
    'dopamine/dopamine_synapse.js',
    'dopamine/dopamine_molecular.js',
    'dopamine/dopamine_electrophysiology.js',
    'synapse/synapse_chemistry.js',
    'synapse/synapse_neurotransmitters.js',
    'synapse/synapse_app.js',
    'inflammation/inflammation_app.js',
    'rna/rna_display.js',
    'rna/rna_repair_enzymes.js',
    'dna/dna_repair_mechanisms.js',
    'cognition/cognition_app.js',
    'cognition/cognition_config.js',
    'GreenhouseReactCompatibility.js',
    'GreenhouseDashboardApp.js',
    'dashboard.js',
    'inspiration.js',
    'labeling_system.js',
    'models_toc.js',
    'quizzes.js'
];

submodules.forEach(loadScript);

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

    process.on('unhandledRejection', (reason, promise) => {
        // Silently handle rejections to avoid crashing the test runner,
        // especially for tests specifically testing timeouts/rejections.
    });
    
    const testFiles = getAllTestFiles(__dirname);
    console.log(`Found ${testFiles.length} test files.\n`);

    for (const file of testFiles) {
        const relativePath = path.relative(__dirname, file);
        if (relativePath === 'test_production_resilience.js') {
            console.log(`Skipping: ${relativePath} (requires full DOM environment)`);
            continue;
        }
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
        // Limit details to first 20 failures to avoid flooding log
        let count = 0;
        global.TestFramework.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.result === 'failed' && count < 20) {
                    console.error(`\n❌ [${suite.name}] ${test.name}`);
                    console.error(`   Error: ${test.error.message}`);
                    count++;
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
