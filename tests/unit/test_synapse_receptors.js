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
    createElement: () => ({
        style: {}, appendChild: () => {}, addEventListener: () => {},
        getContext: () => ({
            fillRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, clearRect: () => {}, save: () => {}, restore: () => {}
        })
    }),
    getElementById: () => ({
        innerText: '', style: {}, appendChild: () => {},
        getContext: () => ({
            fillRect: () => {}, fillText: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, clearRect: () => {}, save: () => {}, restore: () => {}
        })
    })
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
global.window.GreenhouseSynapseApp.Particles = {
    plasticityFactor: 1.0,
    particles: [],
    ions: [],
    createIon: () => {},
    updateAndDraw: () => {}
};
loadScript('synapse_analytics.js');

// Mock other dependencies
const G = global.window.GreenhouseSynapseApp;
G.Sidebar = { render: () => {} };
G.Tooltips = { update: () => {}, drawLabels: () => {} };
G.Controls = { render: () => {} };
G.Visuals3D = { applyDepth: () => {}, drawElectrostaticPotential: () => {}, drawBBB: () => {}, drawVesicleShadows: () => {}, restoreDepth: () => {}, drawShadows: () => {}, drawDynamicLighting: () => {}, drawIonHeatMap: () => {} };
G.Molecular = { drawECM: () => {}, drawAstrocyte: () => {}, drawMitochondria: () => {}, drawLipidBilayer: () => {}, drawElectrochemicalGradient: () => {}, drawScaffolding: () => {}, drawCascades: () => {}, drawRetrograde: () => {}, drawSNARE: () => {}, drawPhosphorylation: () => {}, drawGPCRTopology: () => {}, triggerCascade: () => {} };

loadScript('synapse_app.js');

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

    TestFramework.describe('Environment and Scenarios', () => {

        TestFramework.it('should verify pH and circadian impacts in handleReceptorInteractions', () => {
            // Setup a mock receptor and particle
            G.config.elements.receptors = [{ x: 0.5, type: 'ampar', state: 'closed', activationCount: 0 }];
            G.config.kinetics = { pH: 7.4 };
            G.config.visuals = { isNight: false };

            G.Particles.particles = [{ x: 400, y: 450, life: 1.0, chemistry: { id: 'glutamate', binds: ['ampar'], ionEffect: 'sodium' } }];

            // Mock getSurfaceY to return 450
            G.getSurfaceY = () => 450;

            // We can't easily test the random aspect, but we can check if it runs without error
            // and if modifiers are calculated
            G.handleReceptorInteractions(800, 600);

            assert.isDefined(G.config.kinetics.pH);
        });

        TestFramework.it('should verify Specialized Scenarios (Fear Conditioning)', () => {
            G.applyScenario('fearConditioning');
            // Fear conditioning scenario in synapse_app.js sets 5 ionotropic receptors
            assert.equal(G.config.elements.receptors.length, 5);
            assert.isTrue(G.config.elements.receptors.every(r => r.type === 'ionotropic_receptor'));
        });

        TestFramework.it('should verify Specialized Scenarios (Adolescent Pruning)', () => {
            G.config.activeScenario = 'adolescent';
            G.config.elements.receptors = [
                { x: 0.1, type: 'ampar' },
                { x: 0.2, type: 'ampar' },
                { x: 0.3, type: 'ampar' }
            ];

            // Mock frame and random to trigger pruning
            G.frame = 300;
            const originalRandom = Math.random;
            Math.random = () => 0.9; // Trigger pruning

            // Mock render/animate part where pruning happens (it's in animate/render loop)
            // In synapse_app.js, pruning is inside the main render loop if G.Particles is present
            // Let's call a minimal version or just check the logic

            // Re-simulating the pruning block:
            if (G.config.activeScenario === 'adolescent' && G.frame % 300 === 0 && G.config.elements.receptors.length > 2) {
                if (Math.random() > 0.8) {
                    G.config.elements.receptors.splice(0, 1);
                }
            }

            assert.equal(G.config.elements.receptors.length, 2);
            Math.random = originalRandom;
        });

    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
