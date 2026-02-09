/**
 * @file inflammation_config.js
 * @description Configuration for the Neuroinflammation Simulation.
 * Reconfigured with binary factors (Checkboxes) for triggers and interventions.
 */

(function () {
    'use strict';

    const GreenhouseInflammationConfig = {
        factors: [
            { id: 'viewMode', label: 'label_view_mode', defaultValue: 0, min: 0, max: 2, step: 1, type: 'button' },

            // --- TRIGGERS ---
            { id: 'pathogenActive', label: 'Pathogen Presence', type: 'checkbox', defaultValue: 0, impact: 0.4 },
            { id: 'chronicStress', label: 'Chronic Cortisol Exposure', type: 'checkbox', defaultValue: 1, impact: 0.25 },
            { id: 'poorSleep', label: 'Sleep Deprivation', type: 'checkbox', defaultValue: 0, impact: 0.2 },
            { id: 'leakyGut', label: 'Intestinal Permeability', type: 'checkbox', defaultValue: 0, impact: 0.15 },

            // --- PROTECTIVE ---
            { id: 'cleanDiet', label: 'Polyphenol-Rich Diet', type: 'checkbox', defaultValue: 1, impact: -0.15 },
            { id: 'exerciseRegular', label: 'Regular Aerobic Exercise', type: 'checkbox', defaultValue: 0, impact: -0.2 },

            // --- PHARMA ---
            { id: 'nsaidsApp', label: 'COX Inhibition (NSAIDs)', type: 'checkbox', defaultValue: 0, impact: -0.25 },
            { id: 'steroidsApp', label: 'Glucocorticoids', type: 'checkbox', defaultValue: 0, impact: -0.5 },
            { id: 'tnfInhibitors', label: 'Anti-TNF Biologics', type: 'checkbox', defaultValue: 0, impact: -0.4 }
        ],
        metrics: [
            { id: 'tnfAlpha', label: 'TNF-α (Pro-inflammatory)', unit: 'pg/mL' },
            { id: 'il10', label: 'IL-10 (Anti-inflammatory)', unit: 'pg/mL' },
            { id: 'microgliaActivation', label: 'Microglia Reactive State', unit: '%' },
            { id: 'bbbIntegrity', label: 'BBB Integrity', unit: '%' },
            { id: 'neuroprotection', label: 'Neuroprotective Index', unit: '%' }
        ]
    };

    window.GreenhouseInflammationConfig = GreenhouseInflammationConfig;
})();
