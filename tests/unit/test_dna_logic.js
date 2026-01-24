/**
 * @file test_dna_logic.js
 * @description Unit tests for DNA Mutation and Mechanism logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;

// --- Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

loadScript('dna_repair_mutations.js');

TestFramework.describe('DNA Mutation Logic (Unit)', () => {

    const G = global.window.GreenhouseDNARepair;

    TestFramework.beforeEach(() => {
        // Reset state for each test
        G.state = {
            radiationLevel: 50,
            basePairs: [
                { id: 0, base1: 'A', base2: 'T', isDamaged: false },
                { id: 1, base1: 'C', base2: 'G', isDamaged: false },
                { id: 2, base1: 'T', base2: 'A', isDamaged: false },
                { id: 3, base1: 'G', base2: 'C', isDamaged: false }
            ]
        };
    });

    TestFramework.describe('Damage Induction', () => {
        TestFramework.it('should apply UV damage with correct spectrum based on radiation', () => {
            const pair = { isDamaged: false };
            G.applyUVDamage(pair, 90);
            assert.isTrue(pair.isDamaged);
            assert.equal(pair.spectrum, 'UVC');

            G.applyUVDamage(pair, 50);
            assert.equal(pair.spectrum, 'UVB');

            G.applyUVDamage(pair, 20);
            assert.equal(pair.spectrum, 'UVA');
        });

        TestFramework.it('should deaminate Cytosine to Uracil', () => {
            const pair = { base1: 'C', base2: 'G', isDamaged: false };
            G.applyDeamination(pair);
            assert.isTrue(pair.isDamaged);
            assert.equal(pair.base1, 'U');
            assert.equal(pair.originalBase, 'C');
        });

        TestFramework.it('should NOT deaminate Adenine', () => {
            const pair = { base1: 'A', base2: 'T', isDamaged: false };
            G.applyDeamination(pair);
            assert.isFalse(pair.isDamaged);
            assert.equal(pair.base1, 'A');
        });

        TestFramework.it('should induce spontaneous damage scaled by radiation', () => {
            G.state.radiationLevel = 10000; // 100% prob per tick (rad/10000)
            G.induceSpontaneousDamage();
            // Since prob is 1.0, all pairs should be damaged unless already damaged
            G.state.basePairs.forEach(p => {
                assert.isTrue(p.isDamaged, `Pair ${p.id} should be damaged`);
            });
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
