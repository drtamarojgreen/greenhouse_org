/**
 * @file inflammation_config.js
 * @description Configuration for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationConfig = {
        factors: [
            { id: 'viewMode', label: 'label_view_mode', defaultValue: 0, min: 0, max: 2, step: 1 },
            { id: 'immuneTrigger', label: 'label_immune_trigger', defaultValue: 0.2 },
            { id: 'sleepQuality', label: 'label_sleep_quality', defaultValue: 0.8 },
            { id: 'dietSupport', label: 'label_diet_support', defaultValue: 0.5 },
            { id: 'stressLoad', label: 'label_stress_coload', defaultValue: 0.3 }
        ],
        metrics: [
            { id: 'inflammatoryTone', label: 'metric_inflam_tone', unit: '%' },
            { id: 'signalingEfficiency', label: 'metric_signaling_eff', unit: '%' },
            { id: 'recoveryMomentum', label: 'metric_recovery_mom', unit: '%' }
        ],
        regions: {
            glialField: {
                name: 'Glial Field',
                description: 'A conceptual representation of glial cell activity and cytokine density.'
            }
        }
    };

    window.GreenhouseInflammationConfig = GreenhouseInflammationConfig;
})();
