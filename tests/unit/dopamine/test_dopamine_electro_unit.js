(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Dopamine Electrophysiology (Unit)', () => {

        const G = window.GreenhouseDopamine;
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
                const originalGlu = G.synapseState.glutamate;
                G.synapseState.glutamate = new Array(30).fill({});
                G.updateElectrophysiology();
                assert.greaterThan(E.membranePotential, -85);
                G.synapseState.glutamate = originalGlu;
            });
        });

    });
})();
