/**
 * @file genetic_neuro_mock.js
 * @description Provides specific mocks for Genetic and Neuro simulation systems.
 */

const dummy = () => {};

function setupGeneticNeuroMocks() {
    const win = global.window || global;

    const universalGet = function(path) {
        if (typeof path !== 'string') return undefined;
        const keys = path.split('.');
        let val = this;
        for (const k of keys) {
            if (val && typeof val === 'object' && val !== null && k in val) {
                val = val[k];
            } else {
                return undefined;
            }
        }
        return val;
    };

    const configMockFactory = (baseData = {}) => {
        const mock = {
            ...baseData,
            get: universalGet,
            set: function(path, value) {
                const keys = path.split('.');
                let target = this;
                for (let i = 0; i < keys.length - 1; i++) {
                    const k = keys[i];
                    if (!target[k] || typeof target[k] !== 'object') target[k] = {};
                    target = target[k];
                }
                target[keys[keys.length - 1]] = value;
            },
            import: function(json) {
                try {
                    const data = JSON.parse(json);
                    Object.assign(this, data);
                } catch (e) {}
            }
        };
        return mock;
    };

    const createStickyMock = (name, baseMock) => {
        // If already defined as a sticky mock, don't re-define (keeps state)
        if (global['__sticky_' + name]) return;

        let internalData = baseMock;
        global['__sticky_' + name] = true;

        Object.defineProperty(global, name, {
            get: () => internalData,
            set: (v) => {
                if (v && typeof v === 'object' && v !== internalData) {
                    // Merge properties from the new object into our persistent mock
                    Object.keys(v).forEach(key => {
                        if (typeof v[key] !== 'function' || key === 'get' || key === 'set' || key === 'import') {
                            internalData[key] = v[key];
                        }
                    });
                    // Ensure methods are still there and bound correctly
                    if (typeof internalData.get !== 'function') internalData.get = universalGet.bind(internalData);
                    if (typeof internalData.set !== 'function') internalData.set = dummy;
                    if (name === 'GreenhouseGeneticConfig' && typeof internalData.import !== 'function') internalData.import = dummy;
                }
            },
            configurable: false // Make it really sticky
        });

        if (win !== global) {
            try {
                Object.defineProperty(win, name, {
                    get: () => global[name],
                    set: (v) => { global[name] = v; },
                    configurable: false
                });
            } catch (e) {}
        }
    };

    // --- GreenhouseGeneticConfig ---
    createStickyMock('GreenhouseGeneticConfig', configMockFactory({
        camera: {
            initial: { x: 0, y: 0, z: -300 },
            controls: {
                inertia: true,
                autoRotate: true,
                enablePan: true,
                enableRotate: true,
                enableZoom: true,
                zoomSpeed: 0.1,
                rotateSpeed: 0.005,
                panSpeed: 0.002,
                minZoom: -50,
                maxZoom: -3000,
                inertiaDamping: 0.95,
                autoRotateSpeed: 0.0002
            }
        },
        materials: { dna: { baseColors: [], strand1Color: '#fff', strand2Color: '#fff' } },
        ui: { background: {} },
        effects: {},
        projection: { width: 800, height: 600, near: 10, far: 2000 }
    }));

    // --- GreenhouseNeuroConfig ---
    createStickyMock('GreenhouseNeuroConfig', configMockFactory({
        camera: { initial: { x: 0, y: 0, z: -300 } },
        pip: { enabled: true },
        ui: { background: {} },
        effects: {}
    }));

    // --- Other Genetic/Neuro Specific objects ---
    if (!global.NeuroGA) {
        global.NeuroGA = class { constructor() { this.init = dummy; this.step = dummy; this.evaluateFitness = dummy; this.createRandomGenome = () => ({}); } };
        if (win !== global) win.NeuroGA = global.NeuroGA;
    }
}

module.exports = {
    setupGeneticNeuroMocks
};
