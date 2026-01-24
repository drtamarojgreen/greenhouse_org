/**
 * @file test_dopamine_electro_unit.js
 * @description Unit tests for Dopamine Electrophysiology logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;

// --- Load Script ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Pre-define G
global.window.GreenhouseDopamine = {
    state: {
        mode: 'D1 Only',
        signalingActive: true,
        camera: { x: 0, y: 0, z: 0 }
    },
    synapseState: {
        cleftDA: { length: 20 },
        glutamate: { length: 2 }
    },
    molecularState: {
        campMicrodomains: [],
        camkii: { calmodulin: 0 },
        plcPathway: { ip3: 0 }
    }
};

loadScript('dopamine_electrophysiology.js');

TestFramework.describe('Dopamine Electrophysiology (Unit)', () => {

    const G = global.window.GreenhouseDopamine;
    const E = G.electroState;

    TestFramework.beforeEach(() => {
        E.membranePotential = -80;
        G.state.mode = 'D1 Only';
    });

    TestFramework.describe('Channel Kinetics', () => {
        TestFramework.it('D2 mode should activate GIRK channels', () => {
            G.state.mode = 'D2 Only';
            G.updateElectrophysiology();
            assert.greaterThan(E.channels.girk, 0);
        });

        TestFramework.it('cAMP should modulate HCN channels', () => {
            G.molecularState.campMicrodomains = new Array(10).fill({});
            G.updateElectrophysiology();
            assert.greaterThan(E.channels.hcn, 0.1);
        });
    });

    TestFramework.describe('Membrane Potential & Spiking', () => {
        TestFramework.it('Glutamate should depolarize the membrane', () => {
            G.synapseState.glutamate = new Array(30).fill({});
            G.updateElectrophysiology();
            // Default down-state is around -85, with 30 glu it should be higher
            assert.greaterThan(E.membranePotential, -85);
        });

        TestFramework.it('should trigger spikes when threshold exceeded', () => {
            E.membranePotential = -40; // Above -50 threshold
            const initialSpikes = E.spikeCount;

            // Mock random to force spike
            const originRand = Math.random;
            Math.random = () => 0;
            G.updateElectrophysiology();
            Math.random = originRand;

            assert.greaterThan(E.spikeCount, initialSpikes);
            assert.equal(E.membranePotential, 35); // Peak
        });
    });

    TestFramework.describe('Gap Junctions', () => {
        TestFramework.it('High DA should uncouple gap junctions', () => {
            G.synapseState.cleftDA = new Array(200).fill({});
            const initialCoupling = E.gapJunctions[0].coupling;
            G.updateElectrophysiology();
            assert.lessThan(E.gapJunctions[0].coupling, initialCoupling);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
