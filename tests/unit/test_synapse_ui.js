/**
 * Unit Tests for Synapse UI Rendering and Interaction
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.window.addEventListener = () => { };
global.window.removeEventListener = () => { };

// Mock MutationObserver
global.MutationObserver = class {
    constructor(callback) {}
    observe(node, options) {}
    disconnect() {}
};

const mockCtx = {
    save: () => { mockCtx.calls.push('save'); },
    restore: () => { mockCtx.calls.push('restore'); },
    fillRect: () => { mockCtx.calls.push('fillRect'); },
    beginPath: () => { mockCtx.calls.push('beginPath'); },
    moveTo: () => { mockCtx.calls.push('moveTo'); },
    lineTo: () => { mockCtx.calls.push('lineTo'); },
    bezierCurveTo: () => { mockCtx.calls.push('bezierCurveTo'); },
    fill: () => { mockCtx.calls.push('fill'); },
    stroke: () => { mockCtx.calls.push('stroke'); },
    arc: () => { mockCtx.calls.push('arc'); },
    rect: () => { mockCtx.calls.push('rect'); },
    setTransform: () => { mockCtx.calls.push('setTransform'); },
    createLinearGradient: () => ({ addColorStop: () => {} }),
    calls: []
};

global.document = {
    currentScript: { getAttribute: (name) => null },
    querySelector: (sel) => {
        if (sel === '#synapse-container') return mockContainer;
        return null;
    },
    querySelectorAll: (sel) => [],
    getElementById: (id) => {
        if (id === 'synapse-sidebar') return mockSidebar;
        if (id === 'synapse-tooltip') return mockTooltip;
        return null;
    },
    createElement: (tag) => {
        const el = {
            tagName: tag.toUpperCase(),
            style: {},
            appendChild: (child) => {
                if (!el.children) el.children = [];
                el.children.push(child);
            },
            addEventListener: (evt, cb) => {
                if (!el.listeners) el.listeners = {};
                el.listeners[evt] = cb;
            },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
            getContext: (type) => mockCtx,
            clientWidth: 800,
            clientHeight: 600
        };
        return el;
    },
    head: { appendChild: () => {} }
};

const mockContainer = {
    innerHTML: '',
    style: {},
    appendChild: (child) => {
        if (!mockContainer.children) mockContainer.children = [];
        mockContainer.children.push(child);
    },
    dataset: {}
};

const mockSidebar = { innerHTML: '', appendChild: () => { } };
const mockTooltip = { style: {}, innerHTML: '' };

global.requestAnimationFrame = (cb) => {
    // No-op
};

// --- Mocks for logic modules ---
const mockChemistry = {
    neurotransmitters: { serotonin: { color: '#00F2FF' } },
    receptors: {
        ionotropic_receptor: { binds: ['serotonin'], ionEffect: 'Na+' },
        gpcr: { binds: ['serotonin'] }
    }
};

global.window.GreenhouseUtils = {
    loadScript: () => Promise.resolve(),
    waitForElement: () => Promise.resolve(mockContainer)
};

// --- Helper to Load Script ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Synapse UI Rendering', () => {

    TestFramework.beforeEach(() => {
        mockCtx.calls = [];
        mockContainer.children = [];
        loadScript('synapse_app.js');

        // Setup engine modules
        const G = window.GreenhouseSynapseApp;
        G.Chemistry = mockChemistry;
        G.Particles = {
            create: () => { },
            updateAndDraw: () => { mockCtx.calls.push('particles'); },
            particles: []
        };
        G.Tooltips = {
            update: () => { },
            drawLabels: () => { mockCtx.calls.push('labels'); }
        };
        G.Sidebar = {
            render: () => { }
        };
    });

    TestFramework.it('should initialize and setup DOM', () => {
        const app = window.GreenhouseSynapseApp;
        app.container = mockContainer;
        app.setupDOM();
        assert.greaterThan(mockContainer.children.length, 0);
        assert.isDefined(app.canvas);
    });

    TestFramework.it('should execute rendering pipeline in order', () => {
        const app = window.GreenhouseSynapseApp;
        app.container = mockContainer;
        app.setupDOM();

        // Manual trigger of render
        app.render();

        const calls = mockCtx.calls;
        // Background (fillRect) - index depends on resize calls in setupDOM
        assert.includes(calls, 'fillRect');
        // Structure (Multiple calls: save, fill, arc, etc.)
        assert.includes(calls, 'save');
        assert.includes(calls, 'fill');
        // Particles
        assert.includes(calls, 'particles');
        // Labels
        assert.includes(calls, 'labels');
    });

    TestFramework.it('should calculate hoveredId based on mouse position', () => {
        const app = window.GreenhouseSynapseApp;
        app.container = mockContainer;
        app.setupDOM();

        // Mock mouse at top center (Pre-synaptic bulb)
        app.mouse.x = 400;
        app.mouse.y = 100;
        app.checkHover(800, 600);
        assert.equal(app.hoveredId, 'preSynapticTerminal');

        // Mock mouse at bottom center (Post-synaptic surface)
        app.mouse.x = 400;
        app.mouse.y = 500;
        app.checkHover(800, 600);
        assert.equal(app.hoveredId, 'postSynapticTerminal');
    });

    TestFramework.it('should trigger neurotransmitter release on click in active zone', () => {
        let releaseTriggered = false;
        window.GreenhouseSynapseApp.Particles.create = (w, h, count, config, isBurst) => {
            if (isBurst) releaseTriggered = true;
        };

        const app = window.GreenhouseSynapseApp;
        app.container = mockContainer;
        app.setupDOM();

        // Click in the pre-synaptic bulb area
        app.mouse.x = 400;
        app.mouse.y = 200;
        app.handleMouseDown();

        assert.isTrue(releaseTriggered, 'Click should trigger burst of neurotransmitters');
    });

});

TestFramework.run();
