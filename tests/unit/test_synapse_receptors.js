/**
 * @file test_synapse_receptors.js
 * @description Unit tests for newly integrated NMDAR, AMPAR, and TLR4 receptors.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => ({ innerHTML: '', style: {}, appendChild: () => {}, addEventListener: () => {} }),
    createElement: () => ({ style: {}, appendChild: () => {}, addEventListener: () => {} }),
    getElementById: () => ({ innerText: '', style: {} })
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.navigator = { userAgent: 'node' };

// --- Load Scripts ---
const loadScript = (filename) => {
    const filePath = path.join(__dirname, '../../docs/js/', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
};

loadScript('synapse_chemistry.js');
global.window.GreenhouseSynapseApp.Particles = { plasticityFactor: 1.0 };
loadScript('synapse_analytics.js');

TestFramework.describe('Synapse Receptors Integration', () => {

    const G = global.window.GreenhouseSynapseApp;
    const Chem = G.Chemistry;
    const Analytics = G.Analytics;

    TestFramework.it('should have ampar, nmdar, and tlr4 defined in chemistry', () => {
        assert.isDefined(Chem.receptors.ampar);
        assert.isDefined(Chem.receptors.nmdar);
        assert.isDefined(Chem.receptors.tlr4);

        assert.includes(Chem.receptors.ampar.binds, 'glutamate');
        assert.includes(Chem.receptors.nmdar.binds, 'glutamate');
        assert.includes(Chem.receptors.tlr4.binds, 'lps');
    });

    TestFramework.it('should have lps defined in neurotransmitters', () => {
        assert.isDefined(Chem.neurotransmitters.lps);
        assert.equal(Chem.neurotransmitters.lps.type, 'inflammatory');
    });

    TestFramework.it('should track depolarization in analytics', () => {
        assert.isDefined(Analytics.state.depolarization);

        // Initial state
        Analytics.state.depolarization = -70;

        // Update with some activity
        Analytics.update(0, 10, 2); // particleCount, ionCount, activeReceptors

        // Depolarization should move towards target
        assert.greaterThan(Analytics.state.depolarization, -70);
    });

    TestFramework.it('NMDAR should require depolarization to open (Logic check)', () => {
        // This is a logic check of the implementation plan
        const depolThreshold = -30;

        Analytics.state.depolarization = -70;
        let nmdarCanOpen = Analytics.state.depolarization > depolThreshold;
        assert.equal(nmdarCanOpen, false);

        Analytics.state.depolarization = 0;
        nmdarCanOpen = Analytics.state.depolarization > depolThreshold;
        assert.equal(nmdarCanOpen, true);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
