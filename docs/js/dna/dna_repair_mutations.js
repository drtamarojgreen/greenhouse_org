// docs/js/dna_repair_mutations.js
// DNA Repair Simulation Module - Mutations and Radiation
// Handles biologically diverse damage induction

(function () {
    'use strict';

    window.GreenhouseDNARepair = window.GreenhouseDNARepair || {};
    const G = window.GreenhouseDNARepair;

    /**
     * Induces various types of DNA damage based on radiation level and environmental factors.
     */
    G.induceSpontaneousDamage = function() {
        const st = this.state;
        const rad = st.radiationLevel || 0;

        if (rad <= 0) return;

        // Base probability scaled by radiation level
        const prob = rad / 10000;

        st.basePairs.forEach(pair => {
            if (pair.isDamaged || pair.isBroken) return;

            const rand = Math.random();
            if (rand < prob) {
                const damageRoll = Math.random();

                if (damageRoll < 0.4) {
                    // UV Damage (Pyrimidine dimers)
                    this.applyUVDamage(pair, rad);
                } else if (damageRoll < 0.7) {
                    // ROS (Reactive Oxygen Species) - Oxidative damage
                    this.applyROSDamage(pair);
                } else if (damageRoll < 0.9) {
                    // Alkylation damage
                    this.applyAlkylationDamage(pair);
                } else {
                    // Cytosine Deamination (C -> U)
                    this.applyDeamination(pair);
                }
            }
        });
    };

    G.applyUVDamage = function(pair, rad) {
        pair.isDamaged = true;
        pair.damageType = 'UV';
        // UVA (320-400nm) - Indirect, ROS mediated
        // UVB (280-320nm) - Direct, Cyclobutane pyrimidine dimers (CPD)
        // UVC (100-280nm) - Most energetic, filtered by atmosphere but simulated here
        if (rad > 80) pair.spectrum = 'UVC';
        else if (rad > 40) pair.spectrum = 'UVB';
        else pair.spectrum = 'UVA';
    };

    G.applyROSDamage = function(pair) {
        pair.isDamaged = true;
        pair.damageType = 'ROS'; // e.g., 8-oxoguanine
    };

    G.applyAlkylationDamage = function(pair) {
        pair.isDamaged = true;
        pair.damageType = 'Alkylation'; // e.g., O6-methylguanine
    };

    G.applyDeamination = function(pair) {
        if (pair.base1 === 'C') {
            pair.isDamaged = true;
            pair.damageType = 'Deamination';
            pair.originalBase = 'C';
            pair.base1 = 'U'; // Cytosine deaminates to Uracil
        } else if (pair.base2 === 'C') {
            pair.isDamaged = true;
            pair.damageType = 'Deamination';
            pair.originalBase = 'C';
            pair.base2 = 'U';
        }
    };

})();
