// docs/js/dna_repair_mutations.js
// DNA Repair Simulation Module - Mutations and Radiation
// Handles spontaneous damage induction

(function () {
    'use strict';

    window.GreenhouseDNARepair = window.GreenhouseDNARepair || {};
    const G = window.GreenhouseDNARepair;

    G.induceSpontaneousDamage = function() {
        const st = this.state;
        if (st.radiationLevel > 0 && Math.random() < (st.radiationLevel / 5000)) {
            const idx = Math.floor(Math.random() * st.basePairs.length);
            const pair = st.basePairs[idx];
            if (pair && !pair.isDamaged && !pair.isBroken) {
                pair.isDamaged = true;
            }
        }
    };
})();
