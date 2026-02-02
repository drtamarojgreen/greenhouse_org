/**
 * @file test_dopamine_molecular_unit.js
 * @description Unit tests for Dopamine Molecular signaling logic.
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
        timer: 100,
        receptors: [{ type: 'D1', x: 0, y: 0, z: 0 }],
        scenarios: {
            heteromer: false
        }
    }
};

loadScript('dopamine_molecular.js');

TestFramework.describe('Dopamine Molecular Logic (Unit)', () => {

    const G = global.window.GreenhouseDopamine;

    TestFramework.beforeEach(() => {
        // Reset molecular state
        G.molecularState.gProteins = [];
        G.molecularState.campMicrodomains = [];
        G.molecularState.darpp32.thr34 = 0;
        G.state.signalingActive = true;
    });

    TestFramework.describe('G-Protein Cycle', () => {
        TestFramework.it('should generate G-Proteins when signaling is active', () => {
            G.updateMolecular();
            assert.greaterThan(G.molecularState.gProteins.length, 0);
            const alpha = G.molecularState.gProteins.find(p => p.subunit === 'alpha');
            assert.isDefined(alpha);
            assert.isBoolean(alpha.gtpBound);
        });

        TestFramework.it('should handle GTP/GDP exchange', () => {
            // Force a G-protein with no GTP
            G.molecularState.gProteins.push({
                subunit: 'alpha', gtpBound: false, exchangeTimer: 0, life: 100, type: 'Gs'
            });

            // GDP release is 0.1 per update
            for (let i = 0; i < 11; i++) G.updateMolecular();

            const gp = G.molecularState.gProteins.find(p => p.subunit === 'alpha');
            assert.isTrue(gp.gtpBound, 'GTP should be bound after 1.0 timer units');
        });
    });

    TestFramework.describe('cAMP & DARPP-32', () => {
        TestFramework.it('should increase AC5 activity with Gs alpha subunits', () => {
            G.molecularState.gProteins.push({ subunit: 'alpha', type: 'Gs', life: 100 });
            G.updateMolecular();
            assert.greaterThan(G.molecularState.ac5.activity, 0);
        });

        TestFramework.it('should phosphorylate DARPP-32 Thr34 via PKA (cat subunits)', () => {
            G.molecularState.pka.cat = 5;
            G.updateMolecular();
            assert.greaterThan(G.molecularState.darpp32.thr34, 0);
        });

        TestFramework.it('should handle feed-forward PP1 inhibition', () => {
            G.molecularState.pka.cat = 0; // stop phosphorylation
            G.molecularState.darpp32.thr34 = 0.6; // High enough to inhibit PP1
            G.molecularState.darpp32.pp1Inhibited = true;
            G.updateMolecular();
            // Decay should be very slow (0.0005)
            assert.greaterThan(G.molecularState.darpp32.thr34, 0.599);
        });
    });

    TestFramework.describe('Drug Library', () => {
        TestFramework.it('should contain key clinical ligands', () => {
            const lib = G.molecularState.drugLibrary;
            assert.isDefined(lib.d1Agonists.find(d => d.name === 'SKF-38393'));
            assert.isDefined(lib.d2Antagonists.find(d => d.name === 'Clozapine'));
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
