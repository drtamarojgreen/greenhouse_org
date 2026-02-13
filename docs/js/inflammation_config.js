/**
 * @file inflammation_config.js
 * @description Configuration for the Neuroinflammation Simulation.
 * Reconfigured with binary factors (Checkboxes) for triggers and interventions.
 */

(function () {
    'use strict';

    const GreenhouseInflammationConfig = {
        factors: [
            {
                id: 'viewMode', label: 'label_view_mode', defaultValue: 0, options: [
                    { value: 0, label: 'REGULATORY (MACRO)' },
                    { value: 1, label: 'CELLULAR (MICRO)' },
                    { value: 2, label: 'MOLECULAR' },
                    { value: 3, label: 'PATHWAY (KEGG)' }
                ], type: 'button'
            },
            {
                id: 'activePathway', label: 'Select Specialized Pathway', defaultValue: 'tryptophan', options: [
                    { value: 'tryptophan', label: 'Tryptophan-Kynurenine' },
                    { value: 'protein_kinase', label: 'Signal Cascade (MAPK)' }
                ], type: 'select'
            },

            // --- ENVIRONMENTAL (TRIGGERS) ---
            { id: 'pathogenActive', label: 'Pathogen Presence', type: 'checkbox', defaultValue: 0, impact: 0.4, category: 'env' },
            { id: 'chronicStress', label: 'Chronic Cortisol Exposure', type: 'checkbox', defaultValue: 1, impact: 0.25, category: 'env' },
            { id: 'poorSleep', label: 'Sleep Deprivation', type: 'checkbox', defaultValue: 0, impact: 0.2, category: 'env' },
            { id: 'pollutionExposure', label: 'Environmental Pollutants', type: 'checkbox', defaultValue: 0, impact: 0.2, category: 'env' },

            // --- PSYCHOLOGICAL / LIFESTYLE (PROTECTIVE) ---
            { id: 'cleanDiet', label: 'Polyphenol-Rich Diet', type: 'checkbox', defaultValue: 1, impact: -0.15, category: 'psych' },
            { id: 'exerciseRegular', label: 'Regular Aerobic Exercise', type: 'checkbox', defaultValue: 0, impact: -0.2, category: 'psych' },
            { id: 'meditationPractice', label: 'Vagus Nerve Stimulation', type: 'checkbox', defaultValue: 0, impact: -0.15, category: 'psych' },

            // --- PHILOSOPHICAL / COGNITIVE ---
            { id: 'cognitiveResilience', label: 'Cognitive Reframing', type: 'checkbox', defaultValue: 0, impact: -0.1, category: 'philo' },
            { id: 'socialSupport', label: 'Social Connectivity', type: 'checkbox', defaultValue: 1, impact: -0.15, category: 'philo' },

            // --- RESEARCH / PHARMA ---
            { id: 'leakyGut', label: 'Intestinal Permeability', type: 'checkbox', defaultValue: 0, impact: 0.15, category: 'research' },
            { id: 'antioxidants', label: 'N-Acetylcysteine (NAC)', type: 'checkbox', defaultValue: 0, impact: -0.15, category: 'research' },
            { id: 'nsaidsApp', label: 'COX Inhibition (NSAIDs)', type: 'checkbox', defaultValue: 0, impact: -0.25, category: 'research' },
            { id: 'steroidsApp', label: 'Glucocorticoids', type: 'checkbox', defaultValue: 0, impact: -0.5, category: 'research' },
            { id: 'tnfInhibitors', label: 'Anti-TNF Biologics', type: 'checkbox', defaultValue: 0, impact: -0.4, category: 'research' }
        ],
        metrics: [
            { id: 'tnfAlpha', label: 'Pro-Inflammatory Tone (TNF-α)', unit: '%' },
            { id: 'il10', label: 'Anti-Inflammatory Reserve (IL-10)', unit: '%' },
            { id: 'neuroprotection', label: 'Neuroprotection Index', unit: '%' },
            { id: 'stressBurden', label: 'Allostatic Load (Stress)', unit: '%' }
        ]
    };

    window.GreenhouseInflammationConfig = GreenhouseInflammationConfig;
})();
