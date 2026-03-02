/**
 * @file test_synapse_logic.js
 * @description Unit tests for Synapse Chemistry and Logic.
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/synapse_chemistry.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('Synapse Chemistry Logic (Unit)', () => {

    let env;
    let Chem;

    TestFramework.beforeEach(() => {
        env = createEnv();
        Chem = env.window.GreenhouseSynapseApp.Chemistry;
    });

    TestFramework.it('should define core neurotransmitters with correct types', () => {
        assert.isDefined(Chem.neurotransmitters);
        assert.equal(Chem.neurotransmitters.glutamate.type, 'excitatory');
        assert.equal(Chem.neurotransmitters.gaba.type, 'inhibitory');
        assert.equal(Chem.neurotransmitters.dopamine.type, 'modulatory');
    });

    TestFramework.it('should define receptors and their binding profiles', () => {
        const ionotropic = Chem.receptors.ionotropic_receptor;
        assert.includes(ionotropic.binds, 'glutamate');
        assert.includes(ionotropic.binds, 'gaba');
    });

    TestFramework.describe('Scenario Modifiers', () => {
        TestFramework.it('Schizophrenia should have increased receptor density', () => {
            const sc = Chem.scenarios.schizophrenia;
            assert.greaterThan(sc.modifiers.receptorDensity, 1.0);
            assert.greaterThan(sc.modifiers.releaseProb, 0.5);
        });

        TestFramework.it('MDD should have reduced release probability', () => {
            const sc = Chem.scenarios.depression;
            assert.lessThan(sc.modifiers.releaseProb, 0.5);
            assert.equal(sc.modifiers.reuptakeRate, 0.1);
        });
    });

    TestFramework.describe('Enzymatic Logic', () => {
        TestFramework.it('MAO should target monoamines', () => {
            const mao = Chem.enzymes.MAO;
            assert.includes(mao.targets, 'serotonin');
            assert.includes(mao.targets, 'dopamine');
        });
    });

    TestFramework.describe('Pharmacology', () => {
        TestFramework.it('SSRI should target SERT', () => {
            const ssri = Chem.drugs.ssri;
            assert.equal(ssri.targetTransporter, 'SERT');
            assert.equal(ssri.effect, 'block_reuptake');
        });
    });

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
