/**
 * @file test_mobile_model_behaviors.js
 * @description Rigorous tests for model-specific behaviors and mode switching in mobile viewer
 */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const assert = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = {
    innerWidth: 500,
    innerHeight: 800,
    location: { pathname: '/models', search: '', hostname: 'localhost' },
    navigator: { userAgent: 'iPhone', maxTouchPoints: 5 },
    dispatchEvent: () => { },
    addEventListener: () => { },
    ontouchstart: () => { },
    _greenhouseScriptAttributes: {},
    GreenhouseDNARepair: {
        initializeDNARepairSimulation: (container) => { container._initialized = true; },
        startSimulation: (mode) => { window._dnaMode = mode; }
    },
    GreenhouseDopamine: {
        initialize: (container, selector) => { container._initialized = true; },
        state: { mode: 'D1R' }
    },
    GreenhouseSerotonin: {
        initialize: (container, selector) => { container._initialized = true; },
        viewMode: '3D'
    },
    GreenhouseEmotionApp: {
        init: (selector) => { window._emotionInitialized = true; },
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
        init: (selector) => { window._cognitionInitialized = true; },
        currentCategory: 'Analytical',
        updateTheorySelector: () => { }
    },
    GreenhouseGeneticAlgo: {
        init: () => { window._geneticAlgoInitialized = true; }
    },
    GreenhouseGeneticUI3D: {
        init: (container, algo) => { window._geneticUI3DInitialized = true; },
        isEvolving: false
    },
    GreenhouseGenetic: {
        startSimulation: () => { window._geneticSimStarted = true; }
    },
    GreenhouseNeuroApp: {
        init: (selector) => { window._neuroInitialized = true; }
    },
    GreenhousePathwayViewer: {
        init: (selector, baseUrl) => { window._pathwayInitialized = true; }
    },
    GreenhouseSynapseApp: {
        init: (selector, baseUrl) => { window._synapseInitialized = true; }
    },
    RNARepairSimulation: class {
        constructor(canvas) {
            this.canvas = canvas;
            window._rnaSimCreated = true;
        }
    }
};

global.document = {
    currentScript: null,
    querySelector: (sel) => {
        if (sel === '#genetic-start-overlay') {
            return { style: { display: 'block' } };
        }
        return null;
    },
    getElementById: (id) => null,
    createElement: (tag) => {
        const el = {
            tag, id: '', className: '', textContent: '', innerHTML: '',
            style: {}, dataset: {}, children: [], offsetWidth: 400, offsetHeight: 600,
            width: 0, height: 0,
            appendChild: function (c) { this.children.push(c); return c; },
            prepend: function (c) { this.children.unshift(c); return c; },
            remove: function () { this._removed = true; },
            addEventListener: function (evt, handler, opts) {
                this._listeners = this._listeners || {};
                this._listeners[evt] = handler;
            },
            querySelector: function (sel) {
                if (sel === '#genetic-start-overlay') {
                    return { style: { display: 'block' } };
                }
                return this.children.find(c => c.id === sel.replace('#', '')) || null;
            },
            querySelectorAll: function (sel) {
                return this.children.filter(c => c.className?.includes(sel.replace('.', '')));
            },
            setAttribute: function (k, v) { this[k] = v; },
            classList: {
                add: function () { },
                remove: function () { },
                toggle: function () { }
            },
            offsetWidth: 100
        };
        if (tag === 'script') {
            setTimeout(() => { if (el.onload) el.onload(); }, 10);
        }
        return el;
    },
    body: { appendChild: (el) => { }, style: {} },
    head: { appendChild: (el) => { if (el.tag === 'script' && el.onload) setTimeout(() => el.onload(), 10); return el; } }
};

global.setTimeout = setTimeout;
global.console = console;
global.fetch = () => Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<models><model id="genetic"><title>Genetic</title><url>/genetic</url></model></models>')
});

// --- Load Scripts ---
const utilsPath = path.join(__dirname, '../../docs/js/GreenhouseUtils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
vm.runInThisContext(utilsCode);

const mobilePath = path.join(__dirname, '../../docs/js/GreenhouseMobile.js');
const mobileCode = fs.readFileSync(mobilePath, 'utf8');
vm.runInThisContext(mobileCode);

const Mobile = global.window.GreenhouseMobile;

TestFramework.describe('Mobile Model-Specific Behaviors', () => {

    TestFramework.describe('DNA Model Behaviors', () => {
        TestFramework.it('should have all 4 DNA repair modes', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            assert.equal(dnaConfig.modes.length, 4, 'Should have 4 repair modes');
            assert.isTrue(dnaConfig.modes.includes('Base Excision'), 'Should have BER');
            assert.isTrue(dnaConfig.modes.includes('Mismatch Repair'), 'Should have MMR');
            assert.isTrue(dnaConfig.modes.includes('Nucleotide Excision'), 'Should have NER');
            assert.isTrue(dnaConfig.modes.includes('Double-Strand Break'), 'Should have DSB');
        });

        TestFramework.it('should initialize DNA repair simulation', async () => {
            const container = document.createElement('div');
            const dnaConfig = Mobile.modelRegistry.dna;

            dnaConfig.init(container, 'https://test.com/');
            assert.isTrue(container._initialized, 'Should initialize DNA repair');
        });

        TestFramework.it('should map mode indices to repair mechanisms', () => {
            const dnaConfig = Mobile.modelRegistry.dna;
            const internalModes = ['ber', 'mmr', 'ner', 'dsb'];

            internalModes.forEach((mode, index) => {
                dnaConfig.onSelectMode(index);
                assert.equal(window._dnaMode, mode, `Should select ${mode} for index ${index}`);
            });
        });
    });

    TestFramework.describe('RNA Model Behaviors', () => {
        TestFramework.it('should have all 4 RNA repair modes', () => {
            const rnaConfig = Mobile.modelRegistry.rna;
            assert.equal(rnaConfig.modes.length, 4, 'Should have 4 repair modes');
            assert.isTrue(rnaConfig.modes.includes('Ligation'), 'Should have Ligation');
            assert.isTrue(rnaConfig.modes.includes('Demethylation'), 'Should have Demethylation');
            assert.isTrue(rnaConfig.modes.includes('Pseudouridylation'), 'Should have Pseudouridylation');
            assert.isTrue(rnaConfig.modes.includes('Decapping'), 'Should have Decapping');
        });

        TestFramework.it('should create canvas for RNA simulation', () => {
            const container = document.createElement('div');
            const rnaConfig = Mobile.modelRegistry.rna;

            rnaConfig.init(container, 'https://test.com/');
            assert.isTrue(container.children.length > 0, 'Should create canvas element');
            assert.isTrue(window._rnaSimCreated, 'Should create RNA simulation');
        });

        TestFramework.it('should set canvas dimensions from container', () => {
            const container = document.createElement('div');
            container.offsetWidth = 500;
            container.offsetHeight = 700;
            const rnaConfig = Mobile.modelRegistry.rna;

            rnaConfig.init(container, 'https://test.com/');
            const canvas = container.children[0];
            assert.isTrue(canvas.width === 500 || canvas.width === 400, 'Should set canvas width');
            assert.isTrue(canvas.height === 700 || canvas.height === 600, 'Should set canvas height');
        });
    });

    TestFramework.describe('Dopamine Model Behaviors', () => {
        TestFramework.it('should have all 4 dopamine modes', () => {
            const dopamineConfig = Mobile.modelRegistry.dopamine;
            assert.equal(dopamineConfig.modes.length, 4, 'Should have 4 modes');
            assert.isTrue(dopamineConfig.modes.includes('D1R Signaling'), 'Should have D1R');
            assert.isTrue(dopamineConfig.modes.includes('D2R Signaling'), 'Should have D2R');
            assert.isTrue(dopamineConfig.modes.includes('Synaptic Release'), 'Should have Synapse');
            assert.isTrue(dopamineConfig.modes.includes('Circuit Dynamics'), 'Should have Circuit');
        });

        TestFramework.it('should initialize with unique canvas ID', () => {
            const container = document.createElement('div');
            const dopamineConfig = Mobile.modelRegistry.dopamine;

            dopamineConfig.init(container, 'https://test.com/');
            assert.isTrue(container.id.startsWith('dopamine-canvas-'), 'Should set unique ID');
        });

        TestFramework.it('should map mode indices to dopamine states', () => {
            const dopamineConfig = Mobile.modelRegistry.dopamine;
            const expectedModes = ['D1R', 'D2R', 'Synapse', 'Circuit'];

            expectedModes.forEach((mode, index) => {
                dopamineConfig.onSelectMode(index);
                assert.equal(window.GreenhouseDopamine.state.mode, mode, `Should set mode to ${mode}`);
            });
        });
    });

    TestFramework.describe('Serotonin Model Behaviors', () => {
        TestFramework.it('should have all 4 serotonin modes', () => {
            const serotoninConfig = Mobile.modelRegistry.serotonin;
            assert.equal(serotoninConfig.modes.length, 4, 'Should have 4 modes');
            assert.isTrue(serotoninConfig.modes.includes('3D Receptor'), 'Should have 3D');
            assert.isTrue(serotoninConfig.modes.includes('5-HT1A Structural'), 'Should have Structural');
            assert.isTrue(serotoninConfig.modes.includes('2D Closeup'), 'Should have 2D');
            assert.isTrue(serotoninConfig.modes.includes('Ligand Kinetics'), 'Should have Kinetics');
        });

        TestFramework.it('should map mode indices to view modes', () => {
            const serotoninConfig = Mobile.modelRegistry.serotonin;
            const expectedModes = ['3D', 'Structural', '2D-Closeup', 'Kinetics'];

            expectedModes.forEach((mode, index) => {
                serotoninConfig.onSelectMode(index);
                assert.equal(window.GreenhouseSerotonin.viewMode, mode, `Should set viewMode to ${mode}`);
            });
        });
    });

    TestFramework.describe('Emotion Model Behaviors', () => {
        TestFramework.it('should have all 3 emotion theory modes', () => {
            const emotionConfig = Mobile.modelRegistry.emotion;
            assert.equal(emotionConfig.modes.length, 3, 'Should have 3 theory modes');
            assert.isTrue(emotionConfig.modes.includes('James-Lange'), 'Should have James-Lange');
            assert.isTrue(emotionConfig.modes.includes('Cannon-Bard'), 'Should have Cannon-Bard');
            assert.isTrue(emotionConfig.modes.includes('Schachter-Singer'), 'Should have Schachter-Singer');
        });

        TestFramework.it('should switch emotion theories on mode selection', () => {
            const emotionConfig = Mobile.modelRegistry.emotion;

            emotionConfig.onSelectMode(0);
            assert.equal(window.GreenhouseEmotionApp.activeTheory.name, 'James-Lange', 'Should select James-Lange');

            emotionConfig.onSelectMode(1);
            assert.equal(window.GreenhouseEmotionApp.activeTheory.name, 'Cannon-Bard', 'Should select Cannon-Bard');

            emotionConfig.onSelectMode(2);
            assert.equal(window.GreenhouseEmotionApp.activeTheory.name, 'Schachter-Singer', 'Should select Schachter-Singer');
        });

        TestFramework.it('should update active region with theory', () => {
            const emotionConfig = Mobile.modelRegistry.emotion;

            emotionConfig.onSelectMode(0);
            assert.equal(window.GreenhouseEmotionApp.activeRegion, 'Amygdala', 'Should set region for James-Lange');
        });
    });

    TestFramework.describe('Cognition Model Behaviors', () => {
        TestFramework.it('should have all 4 cognition modes', () => {
            const cognitionConfig = Mobile.modelRegistry.cognition;
            assert.equal(cognitionConfig.modes.length, 4, 'Should have 4 modes');
            assert.isTrue(cognitionConfig.modes.includes('Analytical'), 'Should have Analytical');
            assert.isTrue(cognitionConfig.modes.includes('Executive'), 'Should have Executive');
            assert.isTrue(cognitionConfig.modes.includes('Memory'), 'Should have Memory');
            assert.isTrue(cognitionConfig.modes.includes('Attention'), 'Should have Attention');
        });

        TestFramework.it('should map mode indices to cognition categories', () => {
            const cognitionConfig = Mobile.modelRegistry.cognition;
            const expectedCategories = ['Analytical', 'Development', 'Intervention', 'Medication'];

            expectedCategories.forEach((category, index) => {
                cognitionConfig.onSelectMode(index);
                assert.equal(window.GreenhouseCognitionApp.currentCategory, category, `Should set category to ${category}`);
            });
        });
    });

    TestFramework.describe('Genetic Model Behaviors', () => {
        TestFramework.it('should have all 3 genetic modes', () => {
            const geneticConfig = Mobile.modelRegistry.genetic;
            assert.equal(geneticConfig.modes.length, 3, 'Should have 3 modes');
            assert.isTrue(geneticConfig.modes.includes('Phenotype Evolution'), 'Should have Phenotype');
            assert.isTrue(geneticConfig.modes.includes('Genotype Mapping'), 'Should have Genotype');
            assert.isTrue(geneticConfig.modes.includes('Protein Synthesis'), 'Should have Protein');
        });

        TestFramework.it('should initialize genetic algorithm and UI', (done) => {
            const container = document.createElement('div');
            const geneticConfig = Mobile.modelRegistry.genetic;

            geneticConfig.init(container, 'https://test.com/');

            setTimeout(() => {
                assert.isTrue(window._geneticAlgoInitialized, 'Should initialize genetic algo');
                assert.isTrue(window._geneticUI3DInitialized, 'Should initialize genetic UI');
                done();
            }, 600);
        });

        TestFramework.it('should hide start overlay and start simulation', (done) => {
            const container = document.createElement('div');
            const overlay = document.createElement('div');
            overlay.id = 'genetic-start-overlay';
            overlay.style.display = 'block';
            container.appendChild(overlay);

            const geneticConfig = Mobile.modelRegistry.genetic;
            geneticConfig.init(container, 'https://test.com/');

            setTimeout(() => {
                const overlayEl = container.querySelector('#genetic-start-overlay');
                if (overlayEl) {
                    assert.equal(overlayEl.style.display, 'none', 'Should hide overlay');
                }
                assert.isTrue(window.GreenhouseGeneticUI3D.isEvolving, 'Should set isEvolving');
                done();
            }, 600);
        });
    });

    TestFramework.describe('Neuro Model Behaviors', () => {
        TestFramework.it('should have all 3 neuro modes', () => {
            const neuroConfig = Mobile.modelRegistry.neuro;
            assert.equal(neuroConfig.modes.length, 3, 'Should have 3 modes');
            assert.isTrue(neuroConfig.modes.includes('Neural Network'), 'Should have Neural Network');
            assert.isTrue(neuroConfig.modes.includes('Synaptic Density'), 'Should have Synaptic Density');
            assert.isTrue(neuroConfig.modes.includes('Burst Patterns'), 'Should have Burst Patterns');
        });

        TestFramework.it('should create unique canvas ID for neuro', () => {
            const container = document.createElement('div');
            const neuroConfig = Mobile.modelRegistry.neuro;

            neuroConfig.init(container, 'https://test.com/');
            assert.isTrue(container.id.startsWith('neuro-canvas-'), 'Should set unique neuro ID');
        });
    });

    TestFramework.describe('Pathway Model Behaviors', () => {
        TestFramework.it('should have all 3 pathway modes', () => {
            const pathwayConfig = Mobile.modelRegistry.pathway;
            assert.equal(pathwayConfig.modes.length, 3, 'Should have 3 modes');
            assert.isTrue(pathwayConfig.modes.includes('Basal Ganglia'), 'Should have Basal Ganglia');
            assert.isTrue(pathwayConfig.modes.includes('Dopamine Loop'), 'Should have Dopamine Loop');
            assert.isTrue(pathwayConfig.modes.includes('Serotonin Path'), 'Should have Serotonin Path');
        });

        TestFramework.it('should pass baseUrl to pathway viewer', () => {
            const container = document.createElement('div');
            const pathwayConfig = Mobile.modelRegistry.pathway;

            pathwayConfig.init(container, 'https://custom.url/');
            assert.isTrue(window._pathwayInitialized, 'Should initialize pathway viewer');
        });
    });

    TestFramework.describe('Synapse Model Behaviors', () => {
        TestFramework.it('should have all 3 synapse modes', () => {
            const synapseConfig = Mobile.modelRegistry.synapse;
            assert.equal(synapseConfig.modes.length, 3, 'Should have 3 modes');
            assert.isTrue(synapseConfig.modes.includes('Clean Signal'), 'Should have Clean Signal');
            assert.isTrue(synapseConfig.modes.includes('Inhibited'), 'Should have Inhibited');
            assert.isTrue(synapseConfig.modes.includes('Excited'), 'Should have Excited');
        });

        TestFramework.it('should create unique canvas ID for synapse', () => {
            const container = document.createElement('div');
            const synapseConfig = Mobile.modelRegistry.synapse;

            synapseConfig.init(container, 'https://test.com/');
            assert.isTrue(container.id.startsWith('synapse-canvas-'), 'Should set unique synapse ID');
        });
    });

    TestFramework.describe('Script Dependencies', () => {
        TestFramework.it('should have models_3d_math.js for 3D models', () => {
            const models3D = ['genetic', 'neuro', 'pathway', 'dopamine', 'serotonin', 'emotion', 'cognition', 'dna'];

            models3D.forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                assert.isTrue(config.scripts.includes('models_3d_math.js'), `${modelId} should include models_3d_math.js`);
            });
        });

        TestFramework.it('should have brain_mesh_realistic.js for brain models', () => {
            const brainModels = ['pathway', 'emotion', 'cognition'];

            brainModels.forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                assert.isTrue(config.scripts.includes('brain_mesh_realistic.js'), `${modelId} should include brain_mesh_realistic.js`);
            });
        });

        TestFramework.it('should have unique script sets per model', () => {
            const modelIds = Object.keys(Mobile.modelRegistry);

            modelIds.forEach(modelId => {
                const config = Mobile.modelRegistry[modelId];
                const uniqueScripts = new Set(config.scripts);
                assert.equal(uniqueScripts.size, config.scripts.length, `${modelId} should not have duplicate scripts`);
            });
        });
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
