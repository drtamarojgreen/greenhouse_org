/**
 * @file greenhouse_mocks.js
 * @description Provides mocks for Greenhouse-specific global objects and functions.
 */

const dummy = () => {};
const dummyAsync = () => Promise.resolve();

function setupGreenhouseMocks() {
    const win = global.window || global;

    // Helper to protect a global object
    const protectGlobal = (name, mock) => {
        if (!global[name]) {
            global[name] = mock;
        } else {
            // Augment existing
            for (const key in mock) {
                try {
                    global[name][key] = mock[key];
                } catch (e) {
                    // Might be read-only
                }
            }
        }

        // Try to make it sticky on window
        try {
            Object.defineProperty(win, name, {
                value: global[name],
                writable: true,
                configurable: true
            });
        } catch (e) {}
    };

    const utilsMock = {
        appState: {
            targetSelectorLeft: '#container',
            baseUrl: '/',
            loadedScripts: new Set(),
            isInitialized: true
        },
        loadScript: dummyAsync,
        t: (k) => k,
        displayError: dummy,
        displaySuccess: dummy,
        displayInfo: dummy,
        observeAndReinitializeApplication: dummy,
        startSentinel: dummy,
        renderModelsTOC: dummyAsync,
        isMobileUser: () => false,
        fetchModelDescriptions: () => Promise.resolve([]),
        initializeApp: dummy,
        reinitialize: dummy,
        setState: dummy,
        getState: () => ({}),
        populateServices: dummy,
        populateAppointments: dummy,
        showConflictModal: dummy,
        showNotification: dummy,
        createElementSafely: (tag) => global.document.createElement(tag),
        removeElementSafely: dummy,
        getStatus: () => ({ available: [], statistics: {} }),
        validateConfiguration: () => true,
        waitForElement: () => Promise.resolve(global.document.createElement('div')),
        SimulationEngine: class {
            constructor() {
                this.state = { time: 0, factors: {}, metrics: {}, flags: {}, history: {} };
                this.start = dummy; this.stop = dummy; this.update = dummy;
            }
            static clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
            static smooth(c, t, f) { return c + (t - c) * f; }
        },
        DiurnalClock: class { constructor() { this.timeInHours = 8; this.tick = dummy; this.update = dummy; } }
    };

    protectGlobal('GreenhouseUtils', utilsMock);
    global.GreenhouseModelsUtil = global.GreenhouseUtils;
    win.GreenhouseModelsUtil = global.GreenhouseUtils;

    const dmMock = {
        register: (name, value, meta) => {
            global.GreenhouseDependencyManager._deps = global.GreenhouseDependencyManager._deps || {};
            global.GreenhouseDependencyManager._deps[name] = value;
            if (global.GreenhouseDependencyManager._waiters && global.GreenhouseDependencyManager._waiters[name]) {
                global.GreenhouseDependencyManager._waiters[name].forEach(w => w.resolve(value));
                delete global.GreenhouseDependencyManager._waiters[name];
            }
        },
        get: (name) => (global.GreenhouseDependencyManager._deps || {})[name],
        isAvailable: (name) => !!(global.GreenhouseDependencyManager._deps || {})[name],
        waitFor: (name, timeout = 15000) => {
            if (global.GreenhouseDependencyManager.isAvailable(name)) return Promise.resolve(global.GreenhouseDependencyManager.get(name));
            return Promise.resolve({}); // Immediate resolve for tests to avoid timeouts
        },
        waitForMultiple: () => Promise.resolve({}),
        clear: dummy,
        getStatus: () => ({ available: [], statistics: { totalRegistered: 0 } }),
        config: { get: () => 15000, set: dummy },
        _deps: {},
        _waiters: {}
    };
    protectGlobal('GreenhouseDependencyManager', dmMock);

    protectGlobal('GreenhouseModels3DGeometry', {
        generateSphere: () => ({ vertices: [], faces: [] }),
        generateCylinder: () => ({ vertices: [], faces: [] }),
        generateTorus: () => ({ vertices: [], faces: [] })
    });

    const dopamineMock = {
        state: {
            camera: { x:0, y:0, z:-400, rotationX:0, rotationY:0, rotationZ:0, fov:500, zoom:1.0 },
            cameraControls: { autoRotateSpeed: 0.001 },
            scenarios: {}, receptors: [], particles: []
        },
        electroState: { channels: {} }, uxState: { isPaused: false }, initialize: dummy, setupReceptors: dummy, setupInteraction: dummy, animate: dummy,
        applyPalette: dummy, initSidePanels: dummy, initLegend: dummy, initTooltips: dummy, initUX: dummy,
        updateMolecular: dummy, updateSynapse: dummy, updateElectrophysiology: dummy, updateCircuit: dummy, updatePlasticity: dummy,
        updateClinical: dummy, updatePharmacology: dummy, updateAnalytics: dummy, updateUX: dummy, updateLanguage: dummy,
        renderMolecular: dummy, renderSynapse: dummy, renderElectrophysiology: dummy, renderCircuit: dummy, renderPlasticity: dummy,
        renderClinical: dummy, renderPharmacology: dummy, renderAnalytics: dummy, renderUX: dummy, renderLegend: dummy,
        toggleColorBlind: dummy, setupStructuralModel: dummy, setupUIMetrics: dummy
    };
    protectGlobal('GreenhouseDopamine', dopamineMock);

    const serotoninMock = {
        state: { camera: { x:0, y:0, z:-500, rotationX:0, rotationY:0, rotationZ:0, fov:500, zoom:1.0 }, receptors: [], ligands: [], lipids: [] },
        Transport: { update: dummy }, initialize: dummy, setupStructuralModel: dummy, setupInteraction: dummy, animate: dummy,
        createUI: dummy, toggleColorBlind: dummy, updateTransport: dummy, cycleEnvironment: dummy
    };
    protectGlobal('GreenhouseSerotonin', serotoninMock);

    const synapseMock = {
        Chemistry: {
            neurotransmitters: { glutamate: { type: 'excitatory' }, gaba: { type: 'inhibitory' } },
            receptors: { ionotropic_receptor: { binds: ['glutamate'] }, ampar: {}, nmdar: {}, tlr4: {} },
            scenarios: { schizophrenia: { modifiers: { receptorDensity: 1.5 } } },
            init: dummy, update: dummy
        },
        Neurotransmitters: { init: dummy, update: dummy },
        state: { mouse: { x: 0, y: 0 } },
        update: dummy, render: dummy, init: dummy, applyScenario: dummy
    };
    protectGlobal('GreenhouseSynapse', synapseMock);
    global.GreenhouseSynapseApp = global.GreenhouseSynapse;
    win.GreenhouseSynapseApp = global.GreenhouseSynapse;

    const geneticMock = {
        CameraController: class { constructor() { this.init = dummy; this.getState = () => ({}); } },
        PiPControls: class { constructor() { this.init = dummy; } },
        Algo: class { constructor() { this.init = dummy; } },
        DNA: class { constructor() { this.drawMacroView = dummy; } },
        Protein: class { constructor() { this.drawProteinView = dummy; this.proteinCache = {}; } },
        Brain: class { constructor() { this.drawTargetView = dummy; this.initializeBrainShell = dummy; } },
        Lighting: class { constructor() { this.calculateLighting = dummy; this.parseColor = dummy; } },
        Stats: class { constructor() { this.drawOverlayInfo = dummy; this.logEvent = dummy; } },
        Chromosome: class { constructor() { this.drawChromatinStructure = dummy; } }
    };
    protectGlobal('GreenhouseGenetic', geneticMock);

    const neuroMock = {
        ga: { init: dummy, step: dummy, evaluateFitness: dummy, setADHDEnhancement: dummy, generation: { id: 0 }, population: [] },
        viewMode: '3D', activeTab: 'all', tabs: [], init: dummy, stopSimulation: dummy, startSimulation: dummy,
        updateADHDCheckboxes: dummy, switchMode: dummy, setupUIComponents: dummy,
        ui: { tabs: [{id:'t1', val:'sim'}, {id:'t2', val:'adhd'}, {id:'t3', val:'synapse'}], cameraButtons: [] },
        state: { activeTab: 'sim' },
        updateADHDData: dummy,
        roundRect: dummy
    };
    protectGlobal('GreenhouseNeuroApp', neuroMock);

    if (!global.NeuroGA) {
        global.NeuroGA = class { constructor() { this.init = dummy; this.step = dummy; this.evaluateFitness = dummy; this.createRandomGenome = () => ({}); } };
    }

    protectGlobal('GreenhouseNeuroConfig', { get: () => 0.5, set: dummy });
    protectGlobal('GreenhouseNeuroCameraControls', { init: dummy, rotate: dummy, zoom: dummy, pan: dummy, reset: dummy, resetCamera: dummy });
    protectGlobal('GreenhouseNeuroUI3D', { init: dummy, updateData: dummy, render: dummy });
    protectGlobal('GreenhouseNeuroControls', { drawPanel: dummy, drawButton: dummy, drawSlider: dummy, drawCheckbox: dummy, drawSearchBox: dummy });

    protectGlobal('GreenhouseStressApp', { factors: {}, state: { allostaticLoad: 0.1, resilienceReserve: 1.0 }, categories: [], init: dummy, initVisuals: dummy, roundRect: dummy });
    protectGlobal('GreenhouseInflammationApp', { state: { tnfAlpha: 0.1, il10: 0.5 }, categories: [], checkboxes: [], buttons: [], init: dummy, metrics: {}, roundRect: dummy });

    global.GreenhouseADHDData = global.GreenhouseADHDData || {};
    protectGlobal('GreenhouseBioStatus', { sync: dummy, stress: { load: 0 }, inflammation: { tone: 0 } });
}

module.exports = {
    setupGreenhouseMocks
};
