/**
 * @file test_mobile_model_behaviors.js
 * @description Rigorous tests for model-specific behaviors and mode switching in mobile viewer.
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Setup Global Environment ---
const createMockWindow = () => ({
    innerWidth: 500,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
    dispatchEvent: () => { },
    addEventListener: () => { },
    ontouchstart: () => { },
    _greenhouseScriptAttributes: {},
    Greenhouse: {},
    GreenhouseDNARepair: {
        initializeDNARepairSimulation: function(container) { this._initialized = true; },
        startSimulation: function(mode) { this._dnaMode = mode; }
    },
    GreenhouseDopamine: {
        initialize: function(container, selector) { this._initialized = true; },
        state: { mode: 'D1R' }
    },
    GreenhouseSerotonin: {
        initialize: function(container, selector) { this._initialized = true; },
        viewMode: '3D'
    },
    GreenhouseEmotionApp: {
        init: function(selector) { this._emotionInitialized = true; },
        config: {
            theories: [
                { name: 'James-Lange', regions: 'Amygdala' },
                { name: 'Cannon-Bard', regions: 'Thalamus' },
                { name: 'Schachter-Singer', regions: 'Cortex' }
            ]
        },
        activeTheory: null,
        activeRegion: null,
        updateInfoPanel: () => { }
    },
    GreenhouseCognitionApp: {
        init: function(selector) { this._cognitionInitialized = true; },
        currentCategory: 'Analytical',
        updateTheorySelector: () => { }
    },
    GreenhouseGeneticAlgo: {
        init: function() { this._geneticAlgoInitialized = true; }
    },
    GreenhouseGeneticUI3D: {
        init: function(container, algo) { this._geneticUI3DInitialized = true; },
        isEvolving: false
    },
    GreenhouseGenetic: {
        startSimulation: function() { this._geneticSimStarted = true; }
    },
    GreenhouseNeuroApp: {
        init: function(selector) { this._neuroInitialized = true; }
    },
    GreenhousePathwayViewer: {
        init: function(selector, baseUrl) { this._pathwayInitialized = true; }
    },
    GreenhouseSynapseApp: {
        init: function(selector, baseUrl) { this._synapseInitialized = true; }
    },
    RNARepairSimulation: class {
        constructor(canvas) {
            this.canvas = canvas;
            // Capture the instance for inspection if needed
            if (global.window && global.window.Greenhouse) {
                global.window.Greenhouse._lastRnaSim = this;
            }
        }
    },
    fetch: () => Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
    }),
    URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
    Blob: class {},
    Map: Map,
    Set: Set,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Promise: Promise,
    CustomEvent: class { constructor(name, data) { this.name = name; this.detail = data ? data.detail : null; } },
    console: { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} }
});

const createMockElement = (tag) => ({
    tag, id: '', className: '', textContent: '', innerHTML: '',
    style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
    appendChild: function (c) { this.children.push(c); c.parentNode = this; return c; },
    prepend: function (c) { this.children.unshift(c); c.parentNode = this; return c; },
    remove: function () { this._removed = true; },
    addEventListener: function () { },
    querySelector: function (sel) {
        if (sel === '#genetic-start-overlay') return { style: { display: 'block' } };
        return this.children.find(c => c.id === sel.replace('#', '')) || null;
    },
    querySelectorAll: function (sel) {
        return this.children.filter(c => c.className?.includes(sel.replace('.', '')));
    },
    setAttribute: function (k, v) { this[k] = v; },
    classList: { add: () => {}, remove: () => {}, toggle: () => {} }
});

const runInNewContext = (overrides = {}) => {
    const mockWindow = {
        innerWidth: 500, innerHeight: 800,
        location: { pathname: '/models', search: '', hostname: 'localhost' },
        navigator: { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' },
        dispatchEvent: () => { }, addEventListener: () => { },
        fetch: () => Promise.resolve({
            ok: true, text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
        }),
        URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => {} },
        setTimeout: setTimeout, clearTimeout: clearTimeout,
        Greenhouse: {},
        GreenhouseDNARepair: {
            initializeDNARepairSimulation: function(c) { this._initialized = true; },
            startSimulation: function(m) { this._dnaMode = m; }
        },
        GreenhouseDopamine: { initialize: function(c, s) { this._initialized = true; }, state: { mode: 'D1R' } },
        GreenhouseSerotonin: { initialize: function(c, s) { this._initialized = true; }, viewMode: '3D' },
        GreenhouseEmotionApp: {
            init: function(s) { this._emotionInitialized = true; },
            config: { theories: [ { name: 'James-Lange', regions: 'Amygdala' }, { name: 'Cannon-Bard', regions: 'Thalamus' } ] },
            activeTheory: null, activeRegion: null, updateInfoPanel: () => { }
        },
        RNARepairSimulation: class { constructor(c) { this.canvas = c; } }
    };

    const createEl = (tag) => ({
        tagName: tag.toUpperCase(), id: '', className: '', textContent: '', innerHTML: '',
        style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
        appendChild: function(c) { this.children.push(c); c.parentNode = this; return c; },
        querySelector: () => null, querySelectorAll: () => [],
        setAttribute: function(k, v) { this[k] = v; },
        classList: { add: () => {}, remove: () => {}, toggle: () => {} }
    });

    const mockDocument = createEl('document');
    mockDocument.body = createEl('body'); mockDocument.head = createEl('head');
    mockDocument.getElementById = () => null;
    mockDocument.createElement = createEl;
    mockDocument.querySelector = () => null;
    mockDocument.addEventListener = () => {};

    const context = vm.createContext({ ...mockWindow, document: mockDocument, window: mockWindow });
    context.global = context;

    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseUtils.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../docs/js/GreenhouseMobile.js'), 'utf8'), context);

    return context;
};

TestFramework.describe('Mobile Model-Specific Behaviors', () => {

    TestFramework.describe('DNA Model Behaviors', () => {
        TestFramework.it('should map mode indices to repair mechanisms', () => {
            const context = runInNewContext();
            const dnaConfig = context.GreenhouseMobile.modelRegistry.dna;
            dnaConfig.onSelectMode(0);
            assert.equal(context.GreenhouseDNARepair._dnaMode, 'ber', 'Should select ber');
        });
    });

    TestFramework.describe('RNA Model Behaviors', () => {
        TestFramework.it('should create rnaSimulation instance', () => {
            const context = runInNewContext();
            const container = context.document.createElement('div');
            context.GreenhouseMobile.modelRegistry.rna.init(container, './');
            assert.isDefined(context.Greenhouse.rnaSimulation, 'Should create RNA simulation instance');
        });
    });

    TestFramework.describe('Dopamine Model Behaviors', () => {
        TestFramework.it('should map mode indices to dopamine states', () => {
            const context = runInNewContext();
            const dopamineConfig = context.GreenhouseMobile.modelRegistry.dopamine;
            dopamineConfig.onSelectMode(1);
            assert.equal(context.GreenhouseDopamine.state.mode, 'D2R', 'Should set mode to D2R');
        });
    });

    TestFramework.describe('Emotion Model Behaviors', () => {
        TestFramework.it('should switch emotion theories on mode selection', () => {
            const context = runInNewContext();
            context.GreenhouseMobile.modelRegistry.emotion.onSelectMode(1);
            assert.equal(context.GreenhouseEmotionApp.activeTheory.name, 'Cannon-Bard', 'Should select Cannon-Bard');
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
