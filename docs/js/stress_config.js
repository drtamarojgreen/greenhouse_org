/**
 * @file stress_config.js
 * @description Configuration for the Stress Dynamics Simulation.
 */

(function () {
    'use strict';

    const GreenhouseStressConfig = {
        factors: [
            { id: 'stressorIntensity', label: 'label_stressor_intensity', defaultValue: 0.3 },
            { id: 'copingSkill', label: 'label_coping_skill', defaultValue: 0.5 },
            { id: 'sleepRegularity', label: 'label_sleep_regularity', defaultValue: 0.7 },
            { id: 'socialSupport', label: 'label_social_support', defaultValue: 0.4 }
        ],
        metrics: [
            { id: 'allostaticLoad', label: 'metric_allostatic_load', unit: '%' },
            { id: 'autonomicBalance', label: 'metric_autonomic_balance', unit: '' },
            { id: 'resilienceReserve', label: 'metric_resilience_reserve', unit: '%' }
        ],
        visual: {
            maxHistory: 200,
            colors: {
                load: '#ff4d4d',
                reserve: '#4ca1af'
            }
        }
    };

    window.GreenhouseStressConfig = GreenhouseStressConfig;
})();
