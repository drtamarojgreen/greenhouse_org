/**
 * @file stress_config.js
 * @description Enhanced Configuration for the Stress Dynamics Simulation.
 * Reconfigured with binary factors (Checkboxes) for specific stressors and genetic traits.
 */

(function () {
    'use strict';

    const GreenhouseStressConfig = {
        factors: [
            {
                id: 'viewMode', label: 'label_view_mode', defaultValue: 0, options: [
                    { value: 0, label: 'REGULATORY (MACRO)' },
                    { value: 1, label: 'PATHWAY (HPA)' },
                    { value: 2, label: 'SYSTEMIC (ADAPTIVE)' }
                ], type: 'button'
            },
            {
                id: 'activePathway', label: 'Select Specialized Pathway', defaultValue: 'hpa', options: [
                    { value: 'hpa', label: 'HPA Axis' },
                    { value: 'tryptophan', label: 'Tryptophan-Kynurenine' },
                    { value: 'dopaminergic', label: 'Dopaminergic System' },
                    { value: 'serotonergeric', label: 'Serotonergic System' }
                ], type: 'select'
            },

            // --- ENVIRONMENTAL STRESSORS (Binary) ---
            { id: 'sleepDeprivation', label: 'Sleep Deprivation', type: 'checkbox', defaultValue: 0, impact: 0.25 },
            { id: 'noisePollution', label: 'Chronic Noise Pollution', type: 'checkbox', defaultValue: 0, impact: 0.15 },
            { id: 'financialStrain', label: 'Financial Instability', type: 'checkbox', defaultValue: 0, impact: 0.3 },
            { id: 'socialIsolation', label: 'Social Isolation', type: 'checkbox', defaultValue: 0, impact: 0.2 },
            { id: 'workOverload', label: 'Cognitive/Work Overload', type: 'checkbox', defaultValue: 0, impact: 0.25 },
            { id: 'nutrientDeficit', label: 'Nutrient Deficiency', type: 'checkbox', defaultValue: 0, impact: 0.15 },

            // --- GENETIC FACTORS (Binary) ---
            { id: 'comtValMet', label: 'COMT Val158Met (Warrior/Worrier)', type: 'checkbox', defaultValue: 0, description: 'Affects dopamine clearance speed in the PFC.' },
            { id: 'serotoninTransporter', label: '5-HTTLPR (Short Allele)', type: 'checkbox', defaultValue: 1, description: 'Increases amygdala reactivity to environmental cues.' },
            { id: 'fkbp5Variant', label: 'FKBP5 polymorphism', type: 'checkbox', defaultValue: 0, description: 'Alters glucocorticoid receptor sensitivity and HPA feedback.' },

            // --- PROTECTIVE / MODULATORY ---
            { id: 'cognitiveReframing', label: 'Cognitive Appraisal', type: 'checkbox', defaultValue: 0, impact: -0.2 },
            { id: 'socialSupport', label: 'Oxytocin Support', type: 'checkbox', defaultValue: 0, impact: -0.15 },
            { id: 'gabaMod', label: 'GABAergic Modulation', type: 'checkbox', defaultValue: 0, impact: -0.3, isPharma: true },
            { id: 'gutHealth', label: 'Gut-Brain Integrity', type: 'checkbox', defaultValue: 1, impact: -0.15, description: 'Microbiome health impacting neurotransmitter precursors.' }
        ],
        metrics: [
            { id: 'allostaticLoad', label: 'metric_allostatic_load', unit: '%' },
            { id: 'autonomicBalance', label: 'metric_autonomic_balance', unit: '' },
            { id: 'resilienceReserve', label: 'metric_resilience_reserve', unit: '%' },
            { id: 'hpaSensitivity', label: 'HPA Sensitivity', unit: '' },
            { id: 'hrv', label: 'Heart Rate Variability', unit: 'ms' },
            { id: 'vagalTone', label: 'Vagal Tone (Parasym.)', unit: '%' },
            { id: 'serotoninLevels', label: 'Serotonin Level', unit: '%' },
            { id: 'dopamineLevels', label: 'Dopamine Level', unit: '%' },
            { id: 'cortisolLevels', label: 'Cortisol Concentration', unit: 'ug/dL' }
        ],
        visual: {
            maxHistory: 200,
            colors: {
                biologic: '#ff4d4d',
                pharma: '#64d2ff',
                psych: '#ffcc00',
                philo: '#a18cd1',
                reserve: '#4ca1af'
            }
        }
    };

    window.GreenhouseStressConfig = GreenhouseStressConfig;
})();
