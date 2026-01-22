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
global.MutationObserver = class {
    constructor() { }
    observe() { }
    disconnect() { }
};

global.document = {
    querySelector: (sel) => {
        if (sel === '#synapse-container') return mockContainer;
        return null;
    },
    getElementById: (id) => {
        if (id === 'synapse-sidebar') return mockSidebar;
        if (id === 'synapse-tooltip') return mockTooltip;
        if (id === 'dose-response-chart') return mockCanvas;
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
            insertAdjacentHTML: (pos, html) => {
                // simple mock
            },
            addEventListener: (evt, cb) => {
                if (!el.listeners) el.listeners = {};
                el.listeners[evt] = cb;
            },
            getContext: (type) => mockCtx,
            clientWidth: 800,
            clientHeight: 600,
            width: 800,
            height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
            toDataURL: () => 'data:image/png;base64,mock'
        };
        return el;
    }
};

const mockCanvas = {
    getContext: () => mockCtx,
    width: 260,
    height: 80
};

const mockContainer = {
    innerHTML: '',
    style: {},
    appendChild: (child) => {
        if (!mockContainer.children) mockContainer.children = [];
        mockContainer.children.push(child);
    }
};

const mockSidebar = {
    innerHTML: '',
    appendChild: () => { },
    insertAdjacentHTML: () => { },
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => []
};
const mockTooltip = { style: {}, innerHTML: '' };

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
    setTransform: () => { },
    clearRect: () => { },
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillText: () => { },
    closePath: () => { },
    setLineDash: () => { },
    strokeRect: () => { },
    ellipse: () => { },
    calls: []
};

global.requestAnimationFrame = (cb) => {
    global.window.lastRAF = cb;
};

// --- Helper to Load Script ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Setup G Namespace ---
global.window.GreenhouseSynapseApp = {
    Chemistry: {
        neurotransmitters: { serotonin: { color: '#00F2FF', id: 'serotonin', type: 'excitatory' } },
        receptors: {
            ionotropic_receptor: { binds: ['serotonin'], ionEffect: 'Na+' },
            gpcr: { binds: ['serotonin'] }
        },
        ions: {
            sodium: { charge: '+' }
        },
        retrograde: {
            endocannabinoid: { color: '#9C27B0' }
        },
        scenarios: {
            healthy: { description: 'test' }
        }
    },
    Particles: {
        create: () => { },
        updateAndDraw: () => { mockCtx.calls.push('particles'); },
        particles: [],
        ions: [],
        plasticityFactor: 1.0
    },
    Tooltips: {
        update: () => { },
        drawLabels: () => { mockCtx.calls.push('labels'); }
    },
    Sidebar: {
        render: () => { }
    },
    Controls: {
        render: () => { }
    },
    Analytics: {
        renderDashboard: () => { },
        update: () => { },
        state: { atp: 100 }
    },
    Visuals3D: {
        applyDepth: () => { },
        drawShadows: () => { },
        restoreDepth: () => { },
        drawDynamicLighting: () => { },
        drawIonHeatMap: () => { },
        drawElectrostaticPotential: () => { }
    },
    Molecular: {
        drawLipidBilayer: () => { },
        drawSNARE: () => { },
        drawECM: () => { },
        drawAstrocyte: () => { },
        drawScaffolding: () => { },
        drawCascades: () => { },
        drawRetrograde: () => { },
        drawMitochondria: () => { },
        drawGPCRTopology: () => { }
    }
};

// --- Test Suite ---

TestFramework.describe('Synapse UI Rendering', () => {

    TestFramework.beforeEach(() => {
        mockCtx.calls = [];
        mockContainer.children = [];
        loadScript('synapse_app.js');
    });

    TestFramework.it('should initialize and setup DOM', () => {
        window.GreenhouseSynapseApp.init('#synapse-container', '/');
        assert.greaterThan(mockContainer.children.length, 0);
        assert.isDefined(window.GreenhouseSynapseApp.canvas);
    });

    TestFramework.it('should execute rendering pipeline in order', () => {
        window.GreenhouseSynapseApp.init('#synapse-container', '/');

        // Manual trigger of render
        window.GreenhouseSynapseApp.render();

        const calls = mockCtx.calls;
        // 1. Background (fillRect)
        assert.equal(calls[0], 'fillRect');
        // 2. Structure (Multiple calls: save, fill, arc, etc.)
        assert.includes(calls, 'save');
        assert.includes(calls, 'fill');
        // 3. Particles
        assert.includes(calls, 'particles');
        // 4. Labels
        assert.includes(calls, 'labels');
    });

    TestFramework.it('should calculate hoveredId based on mouse position', () => {
        window.GreenhouseSynapseApp.init('#synapse-container', '/');
        const app = window.GreenhouseSynapseApp;

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

        window.GreenhouseSynapseApp.init('#synapse-container', '/');
        const app = window.GreenhouseSynapseApp;

        // Click in the pre-synaptic bulb area
        app.mouse.x = 400;
        app.mouse.y = 200;
        app.handleMouseDown();

        assert.isTrue(releaseTriggered, 'Click should trigger burst of neurotransmitters');
    });

});

TestFramework.run();
