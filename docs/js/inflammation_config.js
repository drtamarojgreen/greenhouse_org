/**
 * @file inflammation_config.js
 * @description Configuration for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationConfig = {
        factors: [
            { id: 'viewMode', label: 'label_view_mode', description: 'desc_view_mode', defaultValue: 0, min: 0, max: 2, step: 1 },
            { id: 'pathogenLoad', label: 'label_immune_trigger', description: 'desc_immune_trigger', defaultValue: 0.1 },
            { id: 'stressCortisol', label: 'label_stress_coload', description: 'desc_stress_coload', defaultValue: 0.2 },
            { id: 'sleepRestoration', label: 'label_sleep_quality', description: 'desc_sleep_quality', defaultValue: 0.8 },
            { id: 'nutrientDensity', label: 'label_diet_support', description: 'desc_diet_support', defaultValue: 0.5 },
            { id: 'physicalActivity', label: 'label_exercise', description: 'desc_exercise', defaultValue: 0.4 },
            { id: 'nsaids', label: 'NSAIDs', description: 'desc_nsaids', defaultValue: 0 },
            { id: 'corticosteroids', label: 'Steroids', description: 'desc_steroids', defaultValue: 0 },
            { id: 'biologics', label: 'Biologics (anti-TNF)', description: 'desc_biologics', defaultValue: 0 }
        ],
        metrics: [
            { id: 'tnfAlpha', label: 'TNF-α (Pro-inflammatory)', unit: 'pg/mL' },
            { id: 'il10', label: 'IL-10 (Anti-inflammatory)', unit: 'pg/mL' },
            { id: 'microgliaActivation', label: 'Microglia Reactive State', unit: '%' },
            { id: 'bbbIntegrity', label: 'BBB Integrity', unit: '%' },
            { id: 'neuroprotection', label: 'Neuroprotective Index', unit: '%' }
        ],
        pathways: {
            proInflammatory: ['TNF-α', 'IL-6', 'IL-1β', 'IFN-γ'],
            antiInflammatory: ['IL-10', 'TGF-β', 'IL-4'],
            glialStates: ['M0 (Homeostatic)', 'M1 (Pro-inflammatory)', 'M2 (Pro-resolution)']
        },
        regions: {
            glialField: {
                name: 'Parenchymal Space',
                description: 'The interstitial space of the CNS where glial cells monitor homeostasis.'
            }
        }
    };

    window.GreenhouseInflammationConfig = GreenhouseInflammationConfig;
})();
