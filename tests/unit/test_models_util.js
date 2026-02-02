/**
 * @file test_models_util.js
 * @description Unit tests for GreenhouseModelsUtil (i18n and shared components).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.performance = { now: () => Date.now() };
global.Image = class {
    constructor() {
        setTimeout(() => { if (this.onload) this.onload(); }, 1);
    }
};
global.document = {
    createElement: (tag) => ({
        tag,
        className: '',
        setAttribute: function(k, v) { this[k] = v; },
        appendChild: function(c) {
            if (!this.children) this.children = [];
            this.children.push(c);
        }
    }),
    createTextNode: (text) => text,
    dispatchEvent: () => {}
};
global.CustomEvent = class {
    constructor(name, detail) {
        this.name = name;
        this.detail = detail;
    }
};

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/models_util.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseModelsUtil (i18n)', () => {

    const Util = global.window.GreenhouseModelsUtil;

    TestFramework.beforeEach(() => {
        Util.currentLanguage = 'en';
    });

    TestFramework.it('should return English translation by default', () => {
        const text = Util.t('consent_title');
        assert.equal(text, "Exploring Neural Plasticity: A CBT & DBT Model");
    });

    TestFramework.it('should return Spanish translation when language is set to es', () => {
        Util.setLanguage('es');
        const text = Util.t('consent_title');
        assert.equal(text, "Explorando la Plasticidad Neuronal: Un Modelo de TCC y DBT");
    });

    TestFramework.it('should fallback to English if translation is missing in Spanish', () => {
        Util.setLanguage('es');
        // 'non_existent_key' is not in translations
        const text = Util.t('non_existent_key');
        assert.equal(text, 'non_existent_key');
    });

    TestFramework.it('should toggle language between en and es', () => {
        assert.equal(Util.currentLanguage, 'en');
        Util.toggleLanguage();
        assert.equal(Util.currentLanguage, 'es');
        Util.toggleLanguage();
        assert.equal(Util.currentLanguage, 'en');
    });

    TestFramework.it('should return key itself if not found in any language', () => {
        const text = Util.t('completely_random_key');
        assert.equal(text, 'completely_random_key');
    });

    TestFramework.it('should provide region descriptions via getRegionDescription', () => {
        const pfcEn = Util.getRegionDescription('pfc');
        assert.contains(pfcEn, "Prefrontal Cortex");

        Util.setLanguage('es');
        const pfcEs = Util.getRegionDescription('pfc');
        assert.contains(pfcEs, "Corteza Prefrontal");
    });

    TestFramework.describe('GreenhouseComponent', () => {
        TestFramework.it('should initialize with name and layer', () => {
            const comp = new Util.GreenhouseComponent('TestComp', 5);
            assert.equal(comp.name, 'TestComp');
            assert.equal(comp.layer, 5);
            assert.isTrue(comp.active);
            assert.isFalse(comp.initialized);
        });

        TestFramework.it('init() should set system and initialized flag', () => {
            const comp = new Util.GreenhouseComponent('TestComp');
            const mockSystem = { id: 'system' };
            comp.init(mockSystem);
            assert.equal(comp.system, mockSystem);
            assert.isTrue(comp.initialized);
        });
    });

    TestFramework.describe('GreenhouseSystem', () => {
        let mockCanvas;
        let system;

        TestFramework.beforeEach(() => {
            mockCanvas = {
                getContext: () => ({
                    clearRect: () => {},
                    save: () => {},
                    restore: () => {}
                }),
                width: 800,
                height: 600
            };
            system = new Util.GreenhouseSystem(mockCanvas);
        });

        TestFramework.it('should add and sort components by layer', () => {
            const c1 = new Util.GreenhouseComponent('C1', 20);
            const c2 = new Util.GreenhouseComponent('C2', 10);
            system.addComponent(c1);
            system.addComponent(c2);

            assert.equal(system.components[0].name, 'C2');
            assert.equal(system.components[1].name, 'C1');
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
